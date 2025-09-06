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
app.get('/hd', (req, res) => {
  res.send('HD page - Working!');
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