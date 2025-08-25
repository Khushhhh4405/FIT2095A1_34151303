// server.js  (ES module, no external libs)
// Focus: Class design, encapsulation, validation, in-memory initialisation

/* ========================== Utilities & Validators ========================== */

const ISO_DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isIsoDate(v) {
  return isNonEmptyString(v) && ISO_DATE_RX.test(v);
}

function isNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function nextId(prefix, coll, key) {
  const nums = coll
    .map(x => Number(String(x[key] || "").split("-")[1]))
    .filter(n => Number.isFinite(n));
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(n).padStart(5, "0")}`;
}

/** Accepts either "400g spaghetti" or {item:"spaghetti", qty:"400 g"} */
function normalizeIngredient(token) {
  if (token && typeof token === "object" && isNonEmptyString(token.item)) {
    return { item: token.item.trim(), qty: String(token.qty || "").trim() };
  }
  const s = String(token || "").trim();
  // Try to split "400g spaghetti" -> qty="400g", item="spaghetti"
  const m = s.match(/^(\d+(?:\.\d+)?\s*[a-zA-Z]*)\s+(.+)$/);
  if (m) return { item: m[2].trim(), qty: m[1].trim() };
  return { item: s, qty: "" };
}

/* =============================== Recipe Class ============================== */

export class Recipe {
  #recipeId; #title; #chef; #ingredients; #instructions;
  #mealType; #cuisineType; #prepTime; #difficulty; #servings; #createdDate;

  static REQUIRED = [
    "title","chef","ingredients","instructions",
    "mealType","cuisineType","prepTime","difficulty","servings"
  ];

  static validate(obj, { partial = false } = {}) {
    assert(obj && typeof obj === "object", "Recipe payload must be an object");

    if (!partial) {
      for (const k of Recipe.REQUIRED) {
        assert(Object.prototype.hasOwnProperty.call(obj, k), `Missing field: ${k}`);
      }
    }

    if (obj.title !== undefined)       assert(isNonEmptyString(obj.title), "title must be a non-empty string");
    if (obj.chef !== undefined)        assert(isNonEmptyString(obj.chef), "chef must be a non-empty string");
    if (obj.ingredients !== undefined) {
      assert(Array.isArray(obj.ingredients), "ingredients must be an array");
      obj.ingredients.forEach((t,i) => {
        const n = normalizeIngredient(t);
        assert(isNonEmptyString(n.item), `ingredients[${i}].item must be non-empty`);
      });
    }
    if (obj.instructions !== undefined) {
      assert(Array.isArray(obj.instructions), "instructions must be an array of strings");
      obj.instructions.forEach((s,i)=>assert(isNonEmptyString(s), `instructions[${i}] must be non-empty string`));
    }
    if (obj.mealType !== undefined)    assert(isNonEmptyString(obj.mealType), "mealType must be a non-empty string");
    if (obj.cuisineType !== undefined) assert(isNonEmptyString(obj.cuisineType), "cuisineType must be a non-empty string");
    if (obj.prepTime !== undefined)    assert(isNumber(obj.prepTime) && obj.prepTime >= 0, "prepTime must be a non-negative number");
    if (obj.difficulty !== undefined)  assert(isNonEmptyString(obj.difficulty), "difficulty must be a non-empty string");
    if (obj.servings !== undefined)    assert(isNumber(obj.servings) && obj.servings > 0, "servings must be a positive number");
    if (obj.createdDate !== undefined) assert(isIsoDate(obj.createdDate), "createdDate must be ISO yyyy-mm-dd");
  }

  constructor(obj) {
    Recipe.validate(obj);
    this.#recipeId    = obj.recipeId || "R-00001";
    this.#title       = obj.title.trim();
    this.#chef        = obj.chef.trim();
    this.#ingredients = obj.ingredients.map(normalizeIngredient);
    this.#instructions= obj.instructions.map(s=>s.trim());
    this.#mealType    = obj.mealType.trim();
    this.#cuisineType = obj.cuisineType.trim();
    this.#prepTime    = Number(obj.prepTime);
    this.#difficulty  = obj.difficulty.trim();
    this.#servings    = Number(obj.servings);
    this.#createdDate = obj.createdDate || new Date().toISOString().slice(0,10);
  }

  // ----- getters (encapsulation) -----
  get recipeId()    { return this.#recipeId; }
  get title()       { return this.#title; }
  get chef()        { return this.#chef; }
  get ingredients() { return clone(this.#ingredients); }
  get instructions(){ return clone(this.#instructions); }
  get mealType()    { return this.#mealType; }
  get cuisineType() { return this.#cuisineType; }
  get prepTime()    { return this.#prepTime; }
  get difficulty()  { return this.#difficulty; }
  get servings()    { return this.#servings; }
  get createdDate() { return this.#createdDate; }

  // ----- behaviour -----
  update(patch) {
    Recipe.validate(patch, { partial: true });
    if (patch.title !== undefined)        this.#title = patch.title.trim();
    if (patch.chef !== undefined)         this.#chef = patch.chef.trim();
    if (patch.ingredients !== undefined)  this.#ingredients = patch.ingredients.map(normalizeIngredient);
    if (patch.instructions !== undefined) this.#instructions = patch.instructions.map(s=>s.trim());
    if (patch.mealType !== undefined)     this.#mealType = patch.mealType.trim();
    if (patch.cuisineType !== undefined)  this.#cuisineType = patch.cuisineType.trim();
    if (patch.prepTime !== undefined)     this.#prepTime = Number(patch.prepTime);
    if (patch.difficulty !== undefined)   this.#difficulty = patch.difficulty.trim();
    if (patch.servings !== undefined)     this.#servings = Number(patch.servings);
    if (patch.createdDate !== undefined)  this.#createdDate = patch.createdDate;
    return this;
  }

  matchesQuery(q = "") {
    const needle = String(q).toLowerCase();
    const hay = [
      this.#title, this.#chef, this.#mealType, this.#cuisineType,
      this.#ingredients.map(x=>x.item).join(" ")
    ].join(" ").toLowerCase();
    return needle ? hay.includes(needle) : true;
  }

  toJSON() {
    return {
      recipeId: this.#recipeId,
      title: this.#title,
      chef: this.#chef,
      ingredients: clone(this.#ingredients),
      instructions: clone(this.#instructions),
      mealType: this.#mealType,
      cuisineType: this.#cuisineType,
      prepTime: this.#prepTime,
      difficulty: this.#difficulty,
      servings: this.#servings,
      createdDate: this.#createdDate
    };
  }
}

/* ============================ InventoryItem Class =========================== */

export class InventoryItem {
  #inventoryId; #userId; #ingredientName; #quantity; #unit; #category;
  #purchaseDate; #expirationDate; #location; #cost; #createdDate;

  static REQUIRED = ["userId","ingredientName","quantity","unit"];

  static validate(obj, { partial = false } = {}) {
    assert(obj && typeof obj === "object", "InventoryItem payload must be an object");
    if (!partial) {
      for (const k of InventoryItem.REQUIRED) {
        assert(Object.prototype.hasOwnProperty.call(obj, k), `Missing field: ${k}`);
      }
    }
    if (obj.userId !== undefined)         assert(isNonEmptyString(obj.userId), "userId must be a non-empty string");
    if (obj.ingredientName !== undefined) assert(isNonEmptyString(obj.ingredientName), "ingredientName must be a non-empty string");
    if (obj.quantity !== undefined)       assert(isNumber(obj.quantity) && obj.quantity >= 0, "quantity must be a non-negative number");
    if (obj.unit !== undefined)           assert(isNonEmptyString(obj.unit), "unit must be a non-empty string");
    if (obj.category !== undefined)       assert(isNonEmptyString(obj.category) || obj.category === "", "category must be string");
    if (obj.purchaseDate !== undefined)   assert(!obj.purchaseDate || isIsoDate(obj.purchaseDate), "purchaseDate must be ISO or empty");
    if (obj.expirationDate !== undefined) assert(!obj.expirationDate || isIsoDate(obj.expirationDate), "expirationDate must be ISO or empty");
    if (obj.location !== undefined)       assert(isNonEmptyString(obj.location) || obj.location === "", "location must be string");
    if (obj.cost !== undefined)           assert(isNumber(obj.cost) && obj.cost >= 0, "cost must be a non-negative number");
    if (obj.createdDate !== undefined)    assert(isIsoDate(obj.createdDate), "createdDate must be ISO yyyy-mm-dd");
  }

  constructor(obj) {
    InventoryItem.validate(obj);
    this.#inventoryId   = obj.inventoryId || "I-00001";
    this.#userId        = obj.userId.trim();
    this.#ingredientName= obj.ingredientName.trim();
    this.#quantity      = Number(obj.quantity);
    this.#unit          = obj.unit.trim();
    this.#category      = (obj.category || "").trim();
    this.#purchaseDate  = obj.purchaseDate || "";
    this.#expirationDate= obj.expirationDate || "";
    this.#location      = (obj.location || "").trim();
    this.#cost          = Number(obj.cost || 0);
    this.#createdDate   = obj.createdDate || new Date().toISOString().slice(0,10);
  }

  // getters
  get inventoryId(){ return this.#inventoryId; }
  get userId(){ return this.#userId; }
  get ingredientName(){ return this.#ingredientName; }
  get quantity(){ return this.#quantity; }
  get unit(){ return this.#unit; }
  get category(){ return this.#category; }
  get purchaseDate(){ return this.#purchaseDate; }
  get expirationDate(){ return this.#expirationDate; }
  get location(){ return this.#location; }
  get cost(){ return this.#cost; }
  get createdDate(){ return this.#createdDate; }

  // behaviour
  update(patch) {
    InventoryItem.validate(patch, { partial: true });
    if (patch.userId !== undefined)          this.#userId = patch.userId.trim();
    if (patch.ingredientName !== undefined)  this.#ingredientName = patch.ingredientName.trim();
    if (patch.quantity !== undefined)        this.#quantity = Number(patch.quantity);
    if (patch.unit !== undefined)            this.#unit = patch.unit.trim();
    if (patch.category !== undefined)        this.#category = (patch.category || "").trim();
    if (patch.purchaseDate !== undefined)    this.#purchaseDate = patch.purchaseDate || "";
    if (patch.expirationDate !== undefined)  this.#expirationDate = patch.expirationDate || "";
    if (patch.location !== undefined)        this.#location = (patch.location || "").trim();
    if (patch.cost !== undefined)            this.#cost = Number(patch.cost);
    if (patch.createdDate !== undefined)     this.#createdDate = patch.createdDate;
    return this;
  }

  toJSON() {
    return {
      inventoryId: this.#inventoryId,
      userId: this.#userId,
      ingredientName: this.#ingredientName,
      quantity: this.#quantity,
      unit: this.#unit,
      category: this.#category,
      purchaseDate: this.#purchaseDate,
      expirationDate: this.#expirationDate,
      location: this.#location,
      cost: this.#cost,
      createdDate: this.#createdDate
    };
  }
}

/* ============================= In-Memory Stores ============================ */

// Include your personal name + student ID in sample data
const STUDENT_ID = "34151303";
const YOU = `KhushBandaria-${STUDENT_ID}`;

// Seed arrays
export const RECIPES = [
  new Recipe({
    recipeId: "R-00001",
    title: "Classic Spaghetti Carbonara",
    chef: YOU, // <-- includes your name + student ID
    ingredients: ["400g spaghetti", "200g pancetta", "4 large eggs", "100g Pecorino Romano", "Black pepper"],
    instructions: [
      "Boil salted water for pasta",
      "Cook pancetta until crispy",
      "Whisk eggs with cheese",
      "Combine hot pasta with pancetta",
      "Add egg mixture off heat"
    ],
    mealType: "Dinner",
    cuisineType: "Italian",
    prepTime: 25,
    difficulty: "Medium",
    servings: 4,
    createdDate: "2025-07-20"
  }),
  new Recipe({
    recipeId: "R-00002",
    title: "Avocado Toast Supreme",
    chef: YOU, // you entered this recipe
    ingredients: ["2 slices sourdough bread", "1 ripe avocado", "1 tomato", "Feta cheese", "Olive oil", "Lemon juice"],
    instructions: [
      "Toast bread until golden",
      "Mash avocado with lemon",
      "Slice tomato",
      "Spread avocado on toast",
      "Top with tomato and feta"
    ],
    mealType: "Breakfast",
    cuisineType: "Mediterranean",
    prepTime: 10,
    difficulty: "Easy",
    servings: 2,
    createdDate: "2025-07-21"
  })
];

export const INVENTORY = [
  new InventoryItem({
    inventoryId: "I-00001",
    userId: YOU, // <-- includes your name + student ID
    ingredientName: "Fresh Tomatoes",
    quantity: 8,
    unit: "pieces",
    category: "Vegetables",
    purchaseDate: "2025-07-18",
    expirationDate: "2025-07-25",
    location: "Fridge",
    cost: 6.40,
    createdDate: "2025-07-18"
  }),
  new InventoryItem({
    inventoryId: "I-00002",
    userId: YOU,
    ingredientName: "Spaghetti Pasta",
    quantity: 2,
    unit: "kg",
    category: "Grains",
    purchaseDate: "2025-07-15",
    expirationDate: "2025-12-15",
    location: "Pantry",
    cost: 8.90,
    createdDate: "2025-07-22"
  })
];

/* =============================== Repo helpers ============================== */

// Simple in-memory repositories (no DB), useful for later tasks.
export const RecipeRepo = {
  list({ q, mealType, cuisineType } = {}) {
    return RECIPES.filter(r =>
      r.matchesQuery(q) &&
      (!mealType || r.mealType.toLowerCase() === String(mealType).toLowerCase()) &&
      (!cuisineType || r.cuisineType.toLowerCase() === String(cuisineType).toLowerCase())
    ).map(r => r.toJSON());
  },
  getById(id) {
    const r = RECIPES.find(r => r.recipeId === id);
    return r ? r.toJSON() : null;
  },
  add(payload) {
    const json = clone(payload);
    json.recipeId = nextId("R", RECIPES.map(r => r.toJSON()), "recipeId");
    const r = new Recipe(json);
    RECIPES.push(r);
    return r.toJSON();
  },
  update(id, patch) {
    const r = RECIPES.find(r => r.recipeId === id);
    if (!r) return null;
    r.update(patch);
    return r.toJSON();
  }
};

export const InventoryRepo = {
  list({ userId } = {}) {
    return INVENTORY
      .filter(i => !userId || i.userId === userId)
      .map(i => i.toJSON());
  },
  getById(id) {
    const it = INVENTORY.find(i => i.inventoryId === id);
    return it ? it.toJSON() : null;
  },
  add(payload) {
    const json = clone(payload);
    json.inventoryId = nextId("I", INVENTORY.map(i => i.toJSON()), "inventoryId");
    const it = new InventoryItem(json);
    INVENTORY.push(it);
    return it.toJSON();
  },
  update(id, patch) {
    const it = INVENTORY.find(i => i.inventoryId === id);
    if (!it) return null;
    it.update(patch);
    return it.toJSON();
  }
};
