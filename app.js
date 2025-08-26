// app.js — Express app (Tasks 3 & 4) — NO REDIRECTS FOR ERRORS

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { RecipeRepo, InventoryRepo } from "./models.js";

const app = express();
const STUDENT_ID = "34151303";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ----------------------------- Core middleware ----------------------------- */
app.use(express.json()); // parse JSON

// Serve static site (homepage, images, error pages)
app.use(express.static(path.join(__dirname, "public")));

// Serve Bootstrap from node_modules (no CDN)
app.use(`/assets-${STUDENT_ID}/bootstrap`,
  express.static(path.join(__dirname, "node_modules", "bootstrap", "dist"))
);

// Simple logger
app.use((req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });

/* ------------------------------ Error helpers ------------------------------ */
function sendErrorPage(res, code, filename) {
  const full = path.join(__dirname, "public", "errors", filename);
  if (fs.existsSync(full)) {
    return res.status(code).sendFile(full);
  }
  // Fallback text if the file is missing (prevents loops)
  return res.status(code).send(`${code} error page is missing: ${full}`);
}

// Unified helper used everywhere now (NO redirects)
function showError(code, _req, res, msg = "") {
  if (code === 400) return sendErrorPage(res, 400, "400.html");
  if (code === 404) return sendErrorPage(res, 404, "404.html");
  // default 500
  console.error("500 error:", msg);
  return sendErrorPage(res, 500, "500.html");
}

/* --------------------------------- Routes ---------------------------------- */
// RECIPES (GET)
app.get(`/api/recipes-${STUDENT_ID}`, (req, res, next) => {
  try {
    const { q, mealType, cuisineType, difficulty, maxPrep } = req.query;
    if (maxPrep !== undefined && Number.isNaN(Number(maxPrep))) {
      return showError(400, req, res, "maxPrep must be a number");
    }
    const data = RecipeRepo.list({ q, mealType, cuisineType })
      .filter(r =>
        difficulty ? r.difficulty.toLowerCase() === String(difficulty).toLowerCase() : true
      )
      .filter(r => (maxPrep ? r.prepTime <= Number(maxPrep) : true));
    return res.status(200).json(data);
  } catch (err) { next(err); }
});

app.get(`/api/recipes-${STUDENT_ID}/:recipeId`, (req, res) => {
  const r = RecipeRepo.getById(req.params.recipeId);
  if (!r) return showError(404, req, res);
  return res.status(200).json(r);
});

// RECIPES (POST)
app.post(`/api/recipes-${STUDENT_ID}`, (req, res) => {
  try {
    const required = ["title","chef","ingredients","instructions","mealType","cuisineType","prepTime","difficulty","servings"];
    for (const f of required) {
      if (req.body[f] === undefined || req.body[f] === null || req.body[f] === "") {
        return showError(400, req, res, `Missing field: ${f}`);
      }
    }
    if (!Array.isArray(req.body.ingredients)) return showError(400, req, res, "ingredients must be an array");
    if (!Array.isArray(req.body.instructions)) return showError(400, req, res, "instructions must be an array");
    if (Number.isNaN(Number(req.body.prepTime))) return showError(400, req, res, "prepTime must be a number");
    if (Number.isNaN(Number(req.body.servings))) return showError(400, req, res, "servings must be a number");

    const created = RecipeRepo.add(req.body);
    return res.status(201).json(created);
  } catch (err) {
    return showError(400, req, res, err.message || "Invalid recipe data");
  }
});

// INVENTORY (GET)
app.get(`/api/inventory-${STUDENT_ID}`, (req, res) => {
  const { userId } = req.query;
  const data = InventoryRepo.list({ userId });
  return res.status(200).json(data);
});

app.get(`/api/inventory-${STUDENT_ID}/:inventoryId`, (req, res) => {
  const it = InventoryRepo.getById(req.params.inventoryId);
  if (!it) return showError(404, req, res);
  return res.status(200).json(it);
});

// INVENTORY (POST)
app.post(`/api/inventory-${STUDENT_ID}`, (req, res) => {
  try {
    const required = ["userId","ingredientName","quantity","unit"];
    for (const f of required) {
      if (req.body[f] === undefined || req.body[f] === null || req.body[f] === "") {
        return showError(400, req, res, `Missing field: ${f}`);
      }
    }
    if (Number.isNaN(Number(req.body.quantity)) || Number(req.body.quantity) < 0) {
      return showError(400, req, res, "quantity must be a non-negative number");
    }
    const created = InventoryRepo.add(req.body);
    return res.status(201).json(created);
  } catch (err) {
    return showError(400, req, res, err.message || "Invalid inventory data");
  }
});

/* --------------------------- Not-found & Errors ---------------------------- */
// If someone requests an /errors/*.html directly and it's missing, don't loop.
app.get("/errors/:code.html", (req, res) => {
  const code = Number(req.params.code);
  if (code === 400) return sendErrorPage(res, 400, "400.html");
  if (code === 404) return sendErrorPage(res, 404, "404.html");
  if (code === 500) return sendErrorPage(res, 500, "500.html");
  return res.status(404).send("Unknown error page.");
});

// Catch-all 404 (must be after all routes)
app.use((req, res) => showError(404, req, res));

// Central error handler (500)
app.use((err, req, res, _next) => {
  console.error("Internal error:", err);
  return showError(500, req, res);
});

/* --------------------------------- Start ----------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Recipe Hub running at http://localhost:${PORT}`);
});
