// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { RecipeRepo, InventoryRepo, Recipe, InventoryItem } from "./models.js";

const app = express();
const STUDENT_ID = "34151303";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ----------------------------- Core middleware ----------------------------- */
app.use(express.json()); // <-- parse JSON bodies for POST

// Serve your own static files (public/)
app.use(express.static(path.join(__dirname, "public")));

// Serve Bootstrap from node_modules (no CDN allowed)
app.use(`/assets-${STUDENT_ID}/bootstrap`,
  express.static(path.join(__dirname, "node_modules", "bootstrap", "dist"))
);

// Tiny request logger (Week 3 level)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

/* ------------------------------ Helper utils ------------------------------- */
function isNonEmptyString(v){ return typeof v === "string" && v.trim().length > 0; }
function sendOrRedirectError(status, req, res, msg = "") {
  // Redirect to dedicated pages; keep messages only for 400 (validation)
  const safeMsg = status === 400 && msg ? encodeURIComponent(msg) : "";
  return res.redirect(`/errors/${status}.html${safeMsg ? `?msg=${safeMsg}` : ""}`);
}

/* --------------------------------- Routes ---------------------------------- */
// RECIPES (GET)
app.get(`/api/recipes-${STUDENT_ID}`, (req, res, next) => {
  try {
    const { q, mealType, cuisineType, difficulty, maxPrep } = req.query;
    if (maxPrep !== undefined && Number.isNaN(Number(maxPrep))) {
      return sendOrRedirectError(400, req, res, "maxPrep must be a number");
    }
    const data = RecipeRepo.list({ q, mealType, cuisineType })
      .filter(r => difficulty ? r.difficulty.toLowerCase() === String(difficulty).toLowerCase() : true)
      .filter(r => maxPrep ? r.prepTime <= Number(maxPrep) : true);
    return res.status(200).json(data);
  } catch (err) { next(err); }
});

app.get(`/api/recipes-${STUDENT_ID}/:recipeId`, (req, res) => {
  const r = RecipeRepo.getById(req.params.recipeId);
  if (!r) return sendOrRedirectError(404, req, res);
  return res.status(200).json(r);
});

// RECIPES (POST)
app.post(`/api/recipes-${STUDENT_ID}`, (req, res) => {
  try {
    const required = ["title","chef","ingredients","instructions","mealType","cuisineType","prepTime","difficulty","servings"];
    for (const f of required) {
      if (req.body[f] === undefined || req.body[f] === null || req.body[f] === "") {
        return sendOrRedirectError(400, req, res, `Missing field: ${f}`);
      }
    }
    if (!Array.isArray(req.body.ingredients)) return sendOrRedirectError(400, req, res, "ingredients must be an array");
    if (!Array.isArray(req.body.instructions)) return sendOrRedirectError(400, req, res, "instructions must be an array");
    if (Number.isNaN(Number(req.body.prepTime))) return sendOrRedirectError(400, req, res, "prepTime must be a number");
    if (Number.isNaN(Number(req.body.servings))) return sendOrRedirectError(400, req, res, "servings must be a number");

    // Let the model run deeper validation too
    const created = RecipeRepo.add(req.body);
    return res.status(201).json(created);
  } catch (err) {
    // Model validation failures land here
    return sendOrRedirectError(400, req, res, err.message || "Invalid recipe data");
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
  if (!it) return sendOrRedirectError(404, req, res);
  return res.status(200).json(it);
});

// INVENTORY (POST)
app.post(`/api/inventory-${STUDENT_ID}`, (req, res) => {
  try {
    const required = ["userId","ingredientName","quantity","unit"];
    for (const f of required) {
      if (req.body[f] === undefined || req.body[f] === null || req.body[f] === "") {
        return sendOrRedirectError(400, req, res, `Missing field: ${f}`);
      }
    }
    if (Number.isNaN(Number(req.body.quantity)) || Number(req.body.quantity) < 0) {
      return sendOrRedirectError(400, req, res, "quantity must be a non-negative number");
    }
    const created = InventoryRepo.add(req.body);
    return res.status(201).json(created);
  } catch (err) {
    return sendOrRedirectError(400, req, res, err.message || "Invalid inventory data");
  }
});

/* --------------------------- Not-found & Errors ---------------------------- */
// 404 for any route not handled above (must be after routes)
app.use((req, res) => sendOrRedirectError(404, req, res));

// Centralized error handler (500)
app.use((err, req, res, next) => {
  console.error("Internal error:", err);
  return sendOrRedirectError(500, req, res);
});

/* --------------------------------- Start ----------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Recipe Hub running at http://localhost:${PORT}`));
