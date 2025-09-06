// app.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------- student label (single source of truth) --------------- */
const STUDENT = 'Khush - 34151303';

/* --------------- make `student` available to every view --------------- */
app.use((req, res, next) => {
  res.locals.student = STUDENT;
  next();
});

/* ------------------------- views & middleware ------------------------- */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ------------------------- RECIPE DATA STORAGE -------------------------- */
let recipeCounter = 1;
const nextId = () => `R-${String(recipeCounter++).padStart(5, '0')}`;

app.locals.recipes = [
  {
    recipeId: nextId(),
    title: "Classic Spaghetti Carbonara",
    chef: "Khush-34151303",
    ingredients: ["400g spaghetti","200g pancetta","4 eggs","100g Pecorino","Pepper"],
    instructions: ["Boil pasta","Crisp pancetta","Whisk eggs + cheese","Combine off heat"],
    mealType: "Dinner",
    cuisineType: "Italian",
    prepTime: 25,
    difficulty: "Medium",
    servings: 4,
    createdDate: "2025-09-05"
  },
  {
    recipeId: nextId(),
    title: "Avocado Toast Supreme",
    chef: "Khush-34151303",
    ingredients: ["Bread", "Avocado", "Eggs", "Cherry tomatoes", "Feta cheese"],
    instructions: ["Toast bread", "Mash avocado", "Poach eggs", "Assemble ingredients"],
    mealType: "Breakfast",
    cuisineType: "American",
    prepTime: 10,
    difficulty: "Easy",
    servings: 2,
    createdDate: "2025-09-05"
  }
];

/* ----------------------- INVENTORY DATA STORAGE ----------------------- */
let inventoryItems = [
  {
    id: 1,
    ingredientName: "All-Purpose Flour",
    category: "Baking",
    location: "Pantry",
    quantity: 5,
    unit: "kg",
    minStock: 2,
    maxStock: 10,
    cost: 12.99,
    supplier: "Local Grocery Store",
    purchaseDate: new Date(),
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
    notes: "Organic, unbleached",
    createdAt: new Date()
  },
  {
    id: 2,
    ingredientName: "Extra Virgin Olive Oil",
    category: "Pantry",
    location: "Cabinet",
    quantity: 2,
    unit: "L",
    minStock: 1,
    maxStock: 5,
    cost: 24.99,
    supplier: "Specialty Foods Market",
    purchaseDate: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    notes: "Cold-pressed, Italian import",
    createdAt: new Date()
  },
  {
    id: 3,
    ingredientName: "Fresh Milk",
    category: "Dairy",
    location: "Refrigerator",
    quantity: 1,
    unit: "L",
    minStock: 2,
    maxStock: 4,
    cost: 3.99,
    supplier: "Local Dairy Farm",
    purchaseDate: new Date(),
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    notes: "Organic, full cream",
    createdAt: new Date()
  },
  {
    id: 4,
    ingredientName: "Roma Tomatoes",
    category: "Produce",
    location: "Refrigerator",
    quantity: 0.5,
    unit: "kg",
    minStock: 1,
    maxStock: 3,
    cost: 4.50,
    supplier: "Farmer's Market",
    purchaseDate: new Date(),
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    notes: "Fresh, locally grown",
    createdAt: new Date()
  },
  {
    id: 5,
    ingredientName: "Ground Coffee",
    category: "Beverages",
    location: "Pantry",
    quantity: 0.25,
    unit: "kg",
    minStock: 0.5,
    maxStock: 2,
    cost: 18.99,
    supplier: "Coffee Roasters Co.",
    purchaseDate: new Date(),
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    notes: "Medium roast, arabica beans",
    createdAt: new Date()
  }
];
let nextInventoryId = 6;

/* ------------------------------- HOME ROUTE -------------------------------- */
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ------------------------------- RECIPE ROUTES ------------------------------ */
// View all recipes (Task 6)
app.get('/recipes', (req, res) => {
  res.render('recipes', {
    recipes: req.app.locals.recipes,
    student: STUDENT
  });
});

// Show form for new recipe
app.get('/recipes/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// Handle recipe creation
app.post('/add-recipe', (req, res) => {
  const b = req.body || {};
  const r = {
    recipeId: nextId(),
    title: b.title || 'Untitled',
    chef: b.chef || 'Khush-34151303',
    ingredients: Array.isArray(b.ingredients) 
      ? b.ingredients 
      : String(b.ingredients || '').split(/[\n,]/).map(s=>s.trim()).filter(Boolean),
    instructions: Array.isArray(b.instructions) 
      ? b.instructions 
      : String(b.instructions || '').split(/[\n.]/).map(s=>s.trim()).filter(Boolean),
    mealType: b.mealType || '',
    cuisineType: b.cuisine || b.cuisineType || '',
    prepTime: Number(b.prepTime || 0),
    difficulty: b.difficulty || 'Easy',
    servings: Number(b.servings || 1),
    createdDate: new Date().toISOString().slice(0,10)
  };
  req.app.locals.recipes.push(r);
  console.log('New recipe added:', r);
  res.redirect('/recipes');
});

// View single recipe
app.get('/recipes/:id', (req, res) => {
  const recipe = req.app.locals.recipes.find(r => r.recipeId === req.params.id);
  if (recipe) {
    res.json(recipe);
  } else {
    res.status(404).send('Recipe not found');
  }
});

// Delete recipe
app.post('/recipes/:id/delete', (req, res) => {
  const { id } = req.params;
  const list = req.app.locals.recipes || [];
  const i = list.findIndex(r => r.recipeId === id);
  if (i !== -1) {
    const deleted = list.splice(i, 1)[0];
    console.log('Recipe deleted:', deleted.title);
  }
  res.redirect('/recipes');
});

/* ----------------------------- INVENTORY ROUTES ----------------------------- */
// View all inventory items with dashboard (Task 9)
app.get('/inventory', (req, res) => {
  // Calculate statistics
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  
  // Count low stock items
  const lowStockCount = inventoryItems.filter(item => item.quantity <= item.minStock).length;
  
  // Count expiring items (within 30 days)
  const expiringCount = inventoryItems.filter(item => {
    if (!item.expiryDate) return false;
    const daysUntilExpiry = Math.floor((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  }).length;
  
  // Count unique categories and locations
  const categories = new Set(inventoryItems.map(item => item.category));
  const locations = new Set(inventoryItems.map(item => item.location));
  
  // Render the EJS template with all data
  res.render('inventory', {
    inventory: inventoryItems,
    student: STUDENT,
    totalValue: totalValue,
    lowStockCount: lowStockCount,
    expiringCount: expiringCount,
    categoryCount: categories.size,
    locationCount: locations.size
  });
});

// Show form for new inventory item (Task 8)
app.get('/inventory/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inventory-form.html'));
});

// Handle inventory item creation (Task 8)
app.post('/add-inventory', (req, res) => {
  const newItem = {
    id: nextInventoryId++,
    ingredientName: req.body.ingredientName,
    category: req.body.category,
    location: req.body.location,
    quantity: parseFloat(req.body.quantity) || 0,
    unit: req.body.unit,
    minStock: parseFloat(req.body.minStock) || 1,
    maxStock: parseFloat(req.body.maxStock) || 10,
    cost: parseFloat(req.body.cost) || 0,
    supplier: req.body.supplier || '',
    purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : new Date(),
    expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
    notes: req.body.notes || '',
    createdAt: new Date()
  };
  
  inventoryItems.push(newItem);
  console.log('New inventory item added:', newItem);
  
  // Redirect to inventory dashboard
  res.redirect('/inventory');
});

// View single inventory item
app.get('/inventory/:id', (req, res) => {
  const item = inventoryItems.find(i => i.id === parseInt(req.params.id));
  if (item) {
    res.json(item);
  } else {
    res.status(404).send('Inventory item not found');
  }
});

// Delete inventory item
// ===== ENHANCED INVENTORY DELETION (Task 10) =====

// DELETE inventory item with validation and error handling
app.post('/inventory/:id/delete', (req, res) => {
  const itemId = parseInt(req.params.id);
  
  // Validation: Check if ID is a valid number
  if (isNaN(itemId)) {
    console.error('Invalid inventory ID provided:', req.params.id);
    return res.redirect('/error?code=400&msg=' + encodeURIComponent('Invalid inventory ID format'));
  }
  
  // Find the item index
  const itemIndex = inventoryItems.findIndex(i => i.id === itemId);
  
  // Check if item exists
  if (itemIndex === -1) {
    console.error('Inventory item not found for deletion:', itemId);
    return res.redirect('/error?code=404&msg=' + encodeURIComponent('Inventory item not found'));
  }
  
  // Store item details before deletion for logging
  const deletedItem = inventoryItems[itemIndex];
  const itemName = deletedItem.ingredientName;
  const itemValue = deletedItem.quantity * deletedItem.cost;
  
  // Perform deletion
  inventoryItems.splice(itemIndex, 1);
  
  // Log the deletion
  console.log(`✅ Inventory item deleted successfully:
    - ID: ${itemId}
    - Name: ${itemName}
    - Value: $${itemValue.toFixed(2)}
    - Deleted at: ${new Date().toISOString()}
  `);
  
  // Success redirect with optional success message
  res.redirect('/inventory?deleted=' + encodeURIComponent(itemName));
});

// Alternative: DELETE using HTTP DELETE method (REST API style)
app.delete('/api/inventory/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  
  // Validation
  if (isNaN(itemId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid inventory ID format' 
    });
  }
  
  // Find item
  const itemIndex = inventoryItems.findIndex(i => i.id === itemId);
  
  if (itemIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      error: 'Inventory item not found' 
    });
  }
  
  // Delete item
  const deletedItem = inventoryItems.splice(itemIndex, 1)[0];
  
  // Return success response
  res.json({
    success: true,
    message: 'Item deleted successfully',
    deletedItem: {
      id: deletedItem.id,
      name: deletedItem.ingredientName,
      value: (deletedItem.quantity * deletedItem.cost).toFixed(2)
    }
  });
});

// Bulk delete functionality
app.post('/inventory/bulk-delete', (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.redirect('/error?code=400&msg=' + encodeURIComponent('No items selected for deletion'));
  }
  
  const deletedItems = [];
  const notFoundIds = [];
  
  ids.forEach(id => {
    const itemId = parseInt(id);
    if (!isNaN(itemId)) {
      const itemIndex = inventoryItems.findIndex(i => i.id === itemId);
      if (itemIndex !== -1) {
        deletedItems.push(inventoryItems.splice(itemIndex, 1)[0]);
      } else {
        notFoundIds.push(itemId);
      }
    }
  });
  
  console.log(`Bulk delete completed:
    - Items deleted: ${deletedItems.length}
    - Items not found: ${notFoundIds.length}
  `);
  
  res.redirect('/inventory');
});

// Soft delete with undo capability (stores deleted items temporarily)
let deletedInventoryItems = []; // Store deleted items for potential restoration

app.post('/inventory/:id/soft-delete', (req, res) => {
  const itemId = parseInt(req.params.id);
  
  if (isNaN(itemId)) {
    return res.redirect('/error?code=400&msg=' + encodeURIComponent('Invalid inventory ID'));
  }
  
  const itemIndex = inventoryItems.findIndex(i => i.id === itemId);
  
  if (itemIndex === -1) {
    return res.redirect('/error?code=404&msg=' + encodeURIComponent('Item not found'));
  }
  
  // Move to deleted items with timestamp
  const deletedItem = inventoryItems.splice(itemIndex, 1)[0];
  deletedItem.deletedAt = new Date();
  deletedInventoryItems.push(deletedItem);
  
  // Keep only last 10 deleted items
  if (deletedInventoryItems.length > 10) {
    deletedInventoryItems.shift();
  }
  
  res.redirect('/inventory?soft-deleted=' + encodeURIComponent(deletedItem.ingredientName));
});

// Restore deleted item
app.post('/inventory/:id/restore', (req, res) => {
  const itemId = parseInt(req.params.id);
  
  const deletedIndex = deletedInventoryItems.findIndex(i => i.id === itemId);
  
  if (deletedIndex === -1) {
    return res.redirect('/error?code=404&msg=' + encodeURIComponent('Deleted item not found or expired'));
  }
  
  // Restore the item
  const restoredItem = deletedInventoryItems.splice(deletedIndex, 1)[0];
  delete restoredItem.deletedAt;
  inventoryItems.push(restoredItem);
  
  console.log('Item restored:', restoredItem.ingredientName);
  res.redirect('/inventory?restored=' + encodeURIComponent(restoredItem.ingredientName));
});

/* --------------------------------- HD ROUTES --------------------------------- */
// ========== HD TASK IMPLEMENTATIONS ==========
// Add these to your existing app.js file
// ===== HD SECTION ROUTE =====
app.get('/hd', (req, res) => {
  res.render('hd-dashboard', {
    student: STUDENT
  });
});

// ===== HD TASK 1: ADVANCED FILTERING ROUTE =====
// API endpoint to get all recipes as JSON
app.get('/api/recipes', (req, res) => {
  res.json(req.app.locals.recipes);
});

// ===== HD TASK 2: ADVANCED RECIPE FEATURES =====

// Recipe search functionality
app.get('/api/recipes/search', (req, res) => {
  const { q, mealType, cuisineType, difficulty, maxPrepTime, minServings } = req.query;
  
  let results = req.app.locals.recipes;
  
  // Search by query string
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(recipe => 
      recipe.title.toLowerCase().includes(query) ||
      recipe.ingredients.some(ing => ing.toLowerCase().includes(query)) ||
      recipe.chef.toLowerCase().includes(query)
    );
  }
  
  // Filter by meal type
  if (mealType) {
    results = results.filter(r => r.mealType === mealType);
  }
  
  // Filter by cuisine type
  if (cuisineType) {
    results = results.filter(r => r.cuisineType === cuisineType);
  }
  
  // Filter by difficulty
  if (difficulty) {
    results = results.filter(r => r.difficulty === difficulty);
  }
  
  // Filter by max prep time
  if (maxPrepTime) {
    results = results.filter(r => r.prepTime <= parseInt(maxPrepTime));
  }
  
  // Filter by min servings
  if (minServings) {
    results = results.filter(r => r.servings >= parseInt(minServings));
  }
  
  res.json({
    count: results.length,
    recipes: results
  });
});

// Recipe scaling functionality
app.post('/api/recipes/:id/scale', (req, res) => {
  const { id } = req.params;
  const { newServings } = req.body;
  
  const recipe = req.app.locals.recipes.find(r => r.recipeId === id);
  
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  if (!newServings || newServings < 1) {
    return res.status(400).json({ error: 'Invalid serving size' });
  }
  
  const scaleFactor = newServings / recipe.servings;
  
  // Scale ingredients
  const scaledIngredients = recipe.ingredients.map(ingredient => {
    // Try to extract numbers and scale them
    return ingredient.replace(/(\d+(?:\.\d+)?)/g, (match) => {
      const scaled = parseFloat(match) * scaleFactor;
      return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(2);
    });
  });
  
  res.json({
    original: recipe,
    scaled: {
      ...recipe,
      servings: newServings,
      ingredients: scaledIngredients,
      prepTime: Math.ceil(recipe.prepTime * (scaleFactor > 1 ? 1.1 : 0.9)) // Slight time adjustment
    }
  });
});

// Recipe rating system
const recipeRatings = {}; // Store ratings by recipe ID

app.post('/api/recipes/:id/rate', (req, res) => {
  const { id } = req.params;
  const { rating, review } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  
  if (!recipeRatings[id]) {
    recipeRatings[id] = {
      ratings: [],
      reviews: [],
      average: 0
    };
  }
  
  recipeRatings[id].ratings.push(rating);
  if (review) {
    recipeRatings[id].reviews.push({
      rating,
      review,
      date: new Date().toISOString()
    });
  }
  
  // Calculate average
  const sum = recipeRatings[id].ratings.reduce((a, b) => a + b, 0);
  recipeRatings[id].average = (sum / recipeRatings[id].ratings.length).toFixed(1);
  
  res.json({
    success: true,
    recipeId: id,
    averageRating: recipeRatings[id].average,
    totalRatings: recipeRatings[id].ratings.length
  });
});

// Get recipe ratings
app.get('/api/recipes/:id/ratings', (req, res) => {
  const { id } = req.params;
  const ratings = recipeRatings[id] || { ratings: [], reviews: [], average: 0 };
  res.json(ratings);
});

// ===== HD TASK 3: SMART INVENTORY MANAGEMENT =====

// Low stock alerts endpoint
app.get('/api/inventory/alerts', (req, res) => {
  const alerts = [];
  
  // Check for low stock
  const lowStock = inventoryItems.filter(item => item.quantity <= item.minStock);
  lowStock.forEach(item => {
    alerts.push({
      type: 'low-stock',
      severity: item.quantity === 0 ? 'critical' : 'warning',
      item: item.ingredientName,
      message: `${item.ingredientName} is ${item.quantity === 0 ? 'out of stock' : 'running low'}`,
      currentQuantity: item.quantity,
      minStock: item.minStock,
      recommendedOrder: item.maxStock - item.quantity
    });
  });
  
  // Check for expiring items
  const now = new Date();
  inventoryItems.forEach(item => {
    if (item.expiryDate) {
      const daysUntilExpiry = Math.floor((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        alerts.push({
          type: 'expired',
          severity: 'critical',
          item: item.ingredientName,
          message: `${item.ingredientName} has EXPIRED`,
          expiredDaysAgo: Math.abs(daysUntilExpiry)
        });
      } else if (daysUntilExpiry <= 7) {
        alerts.push({
          type: 'expiring-soon',
          severity: daysUntilExpiry <= 3 ? 'warning' : 'info',
          item: item.ingredientName,
          message: `${item.ingredientName} expires in ${daysUntilExpiry} days`,
          expiryDate: item.expiryDate
        });
      }
    }
  });
  
  res.json({
    totalAlerts: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warnings: alerts.filter(a => a.severity === 'warning').length,
    alerts: alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
  });
});

// Inventory analytics
app.get('/api/inventory/analytics', (req, res) => {
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  
  // Category breakdown
  const categoryBreakdown = {};
  inventoryItems.forEach(item => {
    if (!categoryBreakdown[item.category]) {
      categoryBreakdown[item.category] = {
        count: 0,
        value: 0,
        items: []
      };
    }
    categoryBreakdown[item.category].count++;
    categoryBreakdown[item.category].value += item.quantity * item.cost;
    categoryBreakdown[item.category].items.push(item.ingredientName);
  });
  
  // Location breakdown
  const locationBreakdown = {};
  inventoryItems.forEach(item => {
    if (!locationBreakdown[item.location]) {
      locationBreakdown[item.location] = {
        count: 0,
        value: 0
      };
    }
    locationBreakdown[item.location].count++;
    locationBreakdown[item.location].value += item.quantity * item.cost;
  });
  
  res.json({
    overview: {
      totalItems: inventoryItems.length,
      totalValue: totalValue.toFixed(2),
      averageItemValue: (totalValue / inventoryItems.length).toFixed(2),
      lowStockItems: inventoryItems.filter(i => i.quantity <= i.minStock).length,
      expiringItems: inventoryItems.filter(i => {
        if (!i.expiryDate) return false;
        const days = Math.floor((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days <= 30 && days >= 0;
      }).length
    },
    categoryBreakdown,
    locationBreakdown,
    topValueItems: inventoryItems
      .map(i => ({ name: i.ingredientName, value: i.quantity * i.cost }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  });
});

// ===== HD TASK 4: VALIDATION MIDDLEWARE =====

// Recipe validation middleware
const validateRecipe = (req, res, next) => {
  const errors = [];
  const { title, chef, mealType, cuisineType, prepTime, difficulty, servings, ingredients, instructions } = req.body;
  
  // Required field validation
  if (!title || title.trim().length < 3) {
    errors.push('Recipe title must be at least 3 characters long');
  }
  
  if (!chef || chef.trim().length < 3) {
    errors.push('Chef name must be at least 3 characters long');
  }
  
  // Validate meal type
  const validMealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Appetizer'];
  if (!mealType || !validMealTypes.includes(mealType)) {
    errors.push(`Meal type must be one of: ${validMealTypes.join(', ')}`);
  }
  
  // Validate cuisine type
  const validCuisineTypes = ['Italian', 'American', 'Mexican', 'Asian', 'Mediterranean', 'Indian', 'French', 'Other'];
  if (!cuisineType || !validCuisineTypes.includes(cuisineType)) {
    errors.push(`Cuisine type must be one of: ${validCuisineTypes.join(', ')}`);
  }
  
  // Validate numeric fields
  const prepTimeNum = parseInt(prepTime);
  if (isNaN(prepTimeNum) || prepTimeNum < 1 || prepTimeNum > 1440) {
    errors.push('Prep time must be between 1 and 1440 minutes');
  }
  
  const servingsNum = parseInt(servings);
  if (isNaN(servingsNum) || servingsNum < 1 || servingsNum > 100) {
    errors.push('Servings must be between 1 and 100');
  }
  
  // Validate difficulty
  const validDifficulties = ['Easy', 'Medium', 'Hard'];
  if (!difficulty || !validDifficulties.includes(difficulty)) {
    errors.push(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
  }
  
  // Validate ingredients
  if (!ingredients || ingredients.length === 0) {
    errors.push('At least one ingredient is required');
  }
  
  // Validate instructions
  if (!instructions || instructions.length === 0) {
    errors.push('At least one instruction step is required');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: errors,
      message: 'Validation failed. Please correct the errors and try again.'
    });
  }
  
  next();
};

// Inventory validation middleware
const validateInventoryItem = (req, res, next) => {
  const errors = [];
  const { ingredientName, category, location, quantity, unit, cost } = req.body;
  
  // Required fields
  if (!ingredientName || ingredientName.trim().length < 2) {
    errors.push('Ingredient name must be at least 2 characters long');
  }
  
  if (!category) {
    errors.push('Category is required');
  }
  
  if (!location) {
    errors.push('Location is required');
  }
  
  // Validate quantity
  const quantityNum = parseFloat(quantity);
  if (isNaN(quantityNum) || quantityNum < 0) {
    errors.push('Quantity must be a positive number');
  }
  
  if (!unit) {
    errors.push('Unit is required');
  }
  
  // Validate cost
  const costNum = parseFloat(cost);
  if (isNaN(costNum) || costNum < 0) {
    errors.push('Cost must be a positive number');
  }
  
  // Validate dates if provided
  if (req.body.expiryDate && req.body.purchaseDate) {
    const expiry = new Date(req.body.expiryDate);
    const purchase = new Date(req.body.purchaseDate);
    
    if (expiry < purchase) {
      errors.push('Expiry date cannot be before purchase date');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: errors,
      message: 'Validation failed. Please correct the errors and try again.'
    });
  }
  
  next();
};

// Apply validation middleware to routes
// Update your existing routes to use validation:
// app.post('/add-recipe', validateRecipe, (req, res) => { ... });
// app.post('/add-inventory', validateInventoryItem, (req, res) => { ... });

// ===== HD TASK 5: RECIPE-INVENTORY INTEGRATION =====

// Check ingredient availability for a recipe
app.get('/api/recipes/:id/check-availability', (req, res) => {
  const { id } = req.params;
  const recipe = req.app.locals.recipes.find(r => r.recipeId === id);
  
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  const availability = {
    recipeId: id,
    recipeName: recipe.title,
    canMake: true,
    missingIngredients: [],
    availableIngredients: [],
    partialIngredients: []
  };
  
  // Check each ingredient
  recipe.ingredients.forEach(ingredient => {
    // Try to match ingredient with inventory
    const ingredientLower = ingredient.toLowerCase();
    const inventoryMatch = inventoryItems.find(item => 
      ingredientLower.includes(item.ingredientName.toLowerCase())
    );
    
    if (inventoryMatch) {
      // Try to extract quantity from recipe ingredient
      const quantityMatch = ingredient.match(/(\d+(?:\.\d+)?)/);
      const requiredQuantity = quantityMatch ? parseFloat(quantityMatch[1]) : 1;
      
      if (inventoryMatch.quantity >= requiredQuantity) {
        availability.availableIngredients.push({
          ingredient: ingredient,
          inStock: true,
          available: inventoryMatch.quantity,
          unit: inventoryMatch.unit
        });
      } else if (inventoryMatch.quantity > 0) {
        availability.partialIngredients.push({
          ingredient: ingredient,
          required: requiredQuantity,
          available: inventoryMatch.quantity,
          unit: inventoryMatch.unit,
          shortage: requiredQuantity - inventoryMatch.quantity
        });
        availability.canMake = false;
      } else {
        availability.missingIngredients.push(ingredient);
        availability.canMake = false;
      }
    } else {
      availability.missingIngredients.push(ingredient);
      availability.canMake = false;
    }
  });
  
  res.json(availability);
});

// Suggest recipes based on available inventory
app.get('/api/recipes/suggestions', (req, res) => {
  const suggestions = [];
  
  req.app.locals.recipes.forEach(recipe => {
    let matchCount = 0;
    let totalIngredients = recipe.ingredients.length;
    
    recipe.ingredients.forEach(ingredient => {
      const ingredientLower = ingredient.toLowerCase();
      const hasIngredient = inventoryItems.some(item => 
        ingredientLower.includes(item.ingredientName.toLowerCase()) && item.quantity > 0
      );
      
      if (hasIngredient) {
        matchCount++;
      }
    });
    
    const matchPercentage = (matchCount / totalIngredients) * 100;
    
    if (matchPercentage > 0) {
      suggestions.push({
        recipe: recipe,
        matchPercentage: matchPercentage.toFixed(1),
        availableIngredients: matchCount,
        totalIngredients: totalIngredients,
        canMake: matchPercentage === 100
      });
    }
  });
  
  // Sort by match percentage
  suggestions.sort((a, b) => b.matchPercentage - a.matchPercentage);
  
  res.json({
    totalSuggestions: suggestions.length,
    perfectMatches: suggestions.filter(s => s.canMake).length,
    suggestions: suggestions.slice(0, 10) // Top 10 suggestions
  });
});

// Track ingredient usage when recipe is prepared
app.post('/api/recipes/:id/prepare', (req, res) => {
  const { id } = req.params;
  const { servings = 1 } = req.body;
  
  const recipe = req.app.locals.recipes.find(r => r.recipeId === id);
  
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  const usageReport = {
    recipe: recipe.title,
    servingsPrepared: servings,
    ingredientsUsed: [],
    insufficientStock: []
  };
  
  const scaleFactor = servings / recipe.servings;
  
  // Deduct ingredients from inventory
  recipe.ingredients.forEach(ingredient => {
    const ingredientLower = ingredient.toLowerCase();
    const inventoryItem = inventoryItems.find(item => 
      ingredientLower.includes(item.ingredientName.toLowerCase())
    );
    
    if (inventoryItem) {
      // Extract quantity from recipe
      const quantityMatch = ingredient.match(/(\d+(?:\.\d+)?)/);
      const requiredQuantity = quantityMatch ? parseFloat(quantityMatch[1]) * scaleFactor : scaleFactor;
      
      if (inventoryItem.quantity >= requiredQuantity) {
        // Deduct from inventory
        inventoryItem.quantity -= requiredQuantity;
        
        usageReport.ingredientsUsed.push({
          name: inventoryItem.ingredientName,
          quantityUsed: requiredQuantity,
          unit: inventoryItem.unit,
          remainingStock: inventoryItem.quantity
        });
        
        // Check if now low on stock
        if (inventoryItem.quantity <= inventoryItem.minStock) {
          usageReport.ingredientsUsed[usageReport.ingredientsUsed.length - 1].warning = 'Low stock after usage';
        }
      } else {
        usageReport.insufficientStock.push({
          name: inventoryItem.ingredientName,
          required: requiredQuantity,
          available: inventoryItem.quantity
        });
      }
    }
  });
  
  res.json({
    success: usageReport.insufficientStock.length === 0,
    message: usageReport.insufficientStock.length === 0 
      ? 'Recipe prepared successfully' 
      : 'Some ingredients had insufficient stock',
    usageReport
  });
});

// Shopping list generator based on recipes and current inventory
app.post('/api/shopping-list', (req, res) => {
  const { recipeIds = [] } = req.body;
  
  if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
    return res.status(400).json({ error: 'Please provide recipe IDs' });
  }
  
  const shoppingList = {};
  
  // Collect all needed ingredients from selected recipes
  recipeIds.forEach(recipeId => {
    const recipe = req.app.locals.recipes.find(r => r.recipeId === recipeId);
    
    if (recipe) {
      recipe.ingredients.forEach(ingredient => {
        const ingredientLower = ingredient.toLowerCase();
        
        // Check inventory
        const inventoryItem = inventoryItems.find(item => 
          ingredientLower.includes(item.ingredientName.toLowerCase())
        );
        
        if (!inventoryItem || inventoryItem.quantity === 0) {
          // Need to buy
          if (!shoppingList[ingredient]) {
            shoppingList[ingredient] = {
              neededFor: [],
              estimatedCost: 0
            };
          }
          shoppingList[ingredient].neededFor.push(recipe.title);
        }
      });
    }
  });
  
  res.json({
    itemCount: Object.keys(shoppingList).length,
    shoppingList: shoppingList
  });
});


app.get('/hd/new', (req, res) => {
  res.send('New HD item form');
});

app.get('/hd/:id', (req, res) => {
  res.send(`HD item with ID: ${req.params.id}`);
});

app.post('/hd', (req, res) => {
  res.json({ message: 'HD item created', data: req.body });
});

/* --------------------------- CENTRAL ERROR PAGE ----------------------------- */
app.get('/error', (req, res) => {
  const code = Number(req.query.code) || 400;
  
  res.status(code).render('Error', {
    code,
    msg: req.query.msg || 'An unexpected error occurred.',
  }, (err, html) => {
    if (err) {
      res.status(code).send(`
        <h1>Error ${code}</h1>
        <p>${req.query.msg || 'An unexpected error occurred.'}</p>
        <p>Student: ${STUDENT}</p>
        <a href="/">Go Home</a>
      `);
    } else {
      res.send(html);
    }
  });
});

/* ------------------------------------ 404 ------------------------------------ */
app.use((_req, res) => {
  res.status(404).render('NotFound', {}, (err, html) => {
    if (err) {
      res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <p>Student: ${STUDENT}</p>
        <a href="/">Go Home</a>
      `);
    } else {
      res.send(html);
    }
  });
});

/* ---------------------------- FINAL ERROR HANDLER ---------------------------- */
app.use((err, _req, res, _next) => {
  const code = err?.status || 500;
  const msg  = err?.message || 'Unexpected server error';
  console.error('💥 Server error:', code, msg);
  try {
    res.redirect(`/error?code=${code}&msg=${encodeURIComponent(msg)}`);
  } catch {
    res.status(code).send(msg);
  }
});

/* ----------------------------------- START ----------------------------------- */
app.listen(PORT, () => {
  console.log(`✅ Recipe Hub running: http://localhost:${PORT}`);
  console.log(`📝 Student: ${STUDENT}`);
  console.log(`\n🔗 Available routes:`);
  console.log(`   http://localhost:${PORT}/          - Home page`);
  console.log(`   http://localhost:${PORT}/recipes   - Recipes page`);
  console.log(`   http://localhost:${PORT}/inventory - Inventory Dashboard`);
  console.log(`   http://localhost:${PORT}/hd        - HD page`);
});

module.exports = app;