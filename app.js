// app.js — Express app (Tasks 2–5) — JSON-first API + static pages
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { RecipeRepo, InventoryRepo } from "./models.js";

const app = express();
const STUDENT_ID = "34151303";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ---------------- core middleware ---------------- */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // /index.html, /errors/*.html, /images, /css
app.use(
  "/assets-34151303/bootstrap",
  express.static(path.join(__dirname, "node_modules", "bootstrap", "dist"))
);
app.use((req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });

/* ---------------- helpers ---------------- */
function sendErrorPage(res, code, name) {
  const p = path.join(__dirname, "public", "errors", name);
  if (fs.existsSync(p)) return res.status(code).sendFile(p);
  return res.status(code).send(`${code} error page missing at ${p}`);
}
function wantsJSON(req) {
  // Prefer JSON if the client explicitly accepts it
  return req.accepts("json") && !req.accepts("html");
}
function showError(code, req, res, msg = "") {
  if (wantsJSON(req)) return res.status(code).json({ error: msg || (code === 400 ? "Bad request" : code === 404 ? "Not found" : "Server error") });
  if (code === 400) return sendErrorPage(res, 400, "400.html");
  if (code === 404) return sendErrorPage(res, 404, "404.html");
  console.error("500:", msg);
  return sendErrorPage(res, 500, "500.html");
}
function toInt(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : d;
}
function normStr(x) { return (typeof x === "string" ? x.trim() : ""); }
function normEnum(x) { return normStr(x).toLowerCase(); }

/* ---------------- simple pages/forms (optional) ---------------- */
app.get(["/recipes/new", "/recipes/add"], (_req, res) =>
  res.sendFile(path.join(__dirname, "public", "form.html"))
);

/* ---------------- API: RECIPES ---------------- */
// GET /api/recipes-<id>?q=&mealType=&cuisineType=&difficulty=&maxPrep=&limit=&offset=
app.get(`/api/recipes-${STUDENT_ID}`, (req, res, next) => {
  try {
    const q = normStr(req.query.q).toLowerCase();
    const mealType = normEnum(req.query.mealType);
    const cuisineType = normEnum(req.query.cuisineType);
    const difficulty = normEnum(req.query.difficulty);
    const maxPrep = req.query.maxPrep === undefined ? undefined : Number(req.query.maxPrep);
    if (maxPrep !== undefined && Number.isNaN(maxPrep)) {
      return showError(400, req, res, "maxPrep must be a number");
    }

    let list = RecipeRepo.list(); // pull everything, then filter
    // full-text
    if (q) {
      list = list.filter(r => {
        const hay = [
          r.title, r.chef, r.cuisineType, r.mealType,
          ...(Array.isArray(r.ingredients) ? r.ingredients.map(i => (i.item ?? i)) : [])
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    // enums (case-insensitive)
    if (mealType)   list = list.filter(r => String(r.mealType ?? "").toLowerCase()   === mealType);
    if (cuisineType)list = list.filter(r => String(r.cuisineType ?? "").toLowerCase()=== cuisineType);
    if (difficulty) list = list.filter(r => String(r.difficulty ?? "").toLowerCase() === difficulty);
    if (maxPrep !== undefined) list = list.filter(r => Number(r.prepTime) <= maxPrep);

    // pagination
    const limit  = toInt(req.query.limit, 0);
    const offset = toInt(req.query.offset, 0);
    const total = list.length;
    const page = limit ? list.slice(offset, offset + limit) : list;

    res.json({ total, offset, limit, items: page });
  } catch (e) { next(e); }
});

app.get(`/api/recipes-${STUDENT_ID}/:id`, (req, res) => {
  const r = RecipeRepo.getById(req.params.id);
  if (!r) return showError(404, req, res, "Recipe not found");
  res.json(r);
});

// Accepts normalized & mixed-case input; validates required fields
app.post(`/api/recipes-${STUDENT_ID}`, (req, res) => {
  const b = req.body || {};
  const required = ["title","chef","ingredients","instructions","mealType","cuisineType","prepTime","difficulty","servings"];
  for (const f of required) {
    if (b[f] === undefined || b[f] === null || b[f] === "") {
      return showError(400, req, res, `Missing field: ${f}`);
    }
  }
  if (!Array.isArray(b.ingredients))  return showError(400, req, res, "ingredients must be an array");
  if (!Array.isArray(b.instructions)) return showError(400, req, res, "instructions must be an array");
  if (Number.isNaN(Number(b.prepTime)))  return showError(400, req, res, "prepTime must be a number");
  if (Number.isNaN(Number(b.servings)))  return showError(400, req, res, "servings must be a number");

  // normalize case & trim
  const created = RecipeRepo.add({
    ...b,
    title: normStr(b.title),
    chef: normStr(b.chef),
    cuisineType: normEnum(b.cuisineType),
    mealType: normEnum(b.mealType),
    difficulty: normEnum(b.difficulty),
    createdDate: b.createdDate ? new Date(b.createdDate) : undefined
  });
  res.status(201).json(created);
});

// Bulk import — POST array of recipes (your JSON example)
app.post(`/api/recipes-${STUDENT_ID}/bulk`, (req, res) => {
  if (!Array.isArray(req.body)) return showError(400, req, res, "Expected an array of recipes");
  const results = [];
  for (const raw of req.body) {
    try {
      // map your sample fields; keep recipeId as metadata if provided
      const mapped = {
        title: raw.title,
        chef: raw.chef,
        ingredients: raw.ingredients,
        instructions: raw.instructions,
        mealType: raw.mealType,
        cuisineType: raw.cuisineType,
        prepTime: raw.prepTime,
        difficulty: raw.difficulty,
        servings: raw.servings,
        createdDate: raw.createdDate
      };
      const created = RecipeRepo.add({
        ...mapped,
        title: normStr(mapped.title),
        chef: normStr(mapped.chef),
        cuisineType: normEnum(mapped.cuisineType),
        mealType: normEnum(mapped.mealType),
        difficulty: normEnum(mapped.difficulty),
        _externalRecipeId: raw.recipeId ? String(raw.recipeId) : undefined
      });
      results.push({ ok: true, id: created.id });
    } catch (e) {
      results.push({ ok: false, error: e.message });
    }
  }
  res.status(201).json(results);
});

/* ---------------- API: INVENTORY ---------------- */
// GET /api/inventory-<id>?userId=&limit=&offset=
app.get(`/api/inventory-${STUDENT_ID}`, (req, res) => {
  const { userId } = req.query;
  let list = InventoryRepo.list({ userId });
  const limit  = toInt(req.query.limit, 0);
  const offset = toInt(req.query.offset, 0);
  const total = list.length;
  const page = limit ? list.slice(offset, offset + limit) : list;
  res.json({ total, offset, limit, items: page });
});

app.get(`/api/inventory-${STUDENT_ID}/:id`, (req, res) => {
  const it = InventoryRepo.getById(req.params.id);
  if (!it) return showError(404, req, res, "Inventory item not found");
  res.json(it);
});

app.post(`/api/inventory-${STUDENT_ID}`, (req, res) => {
  const b = req.body || {};
  const required = ["userId","ingredientName","quantity","unit"];
  for (const f of required) {
    if (b[f] === undefined || b[f] === null || b[f] === "") {
      return showError(400, req, res, `Missing field: ${f}`);
    }
  }
  if (Number.isNaN(Number(b.quantity)) || Number(b.quantity) < 0) {
    return showError(400, req, res, "quantity must be a non-negative number");
  }
  const created = InventoryRepo.add({
    ...b,
    userId: normStr(b.userId),
    ingredientName: normStr(b.ingredientName),
    unit: normStr(b.unit),
    category: b.category ? normStr(b.category) : null,
    location: b.location ? normStr(b.location) : null,
    purchaseDate: b.purchaseDate ? new Date(b.purchaseDate) : null,
    expirationDate: b.expirationDate ? new Date(b.expirationDate) : null,
    cost: b.cost === undefined || b.cost === null || b.cost === "" ? null : Number(b.cost)
  });
  res.status(201).json(created);
});

/* ---------------- 404 + 500 ---------------- */
app.use((req, res) => showError(404, req, res, "Not found"));
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  showError(500, req, res, "Internal Server Error");
});

/* ---------------- start ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Recipe Hub listening at http://localhost:${PORT}`));
export default app;
