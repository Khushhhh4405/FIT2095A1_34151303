// app.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------- student label (single source of truth) --------------- */
const STUDENT = 'Khush - 34151303';

/* ------------------------- in-memory recipes -------------------------- */
// If you already have a repo elsewhere, you can swap these calls to that.
// This keeps Task 6 self-contained and working now.
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
  }
];

// ===== INVENTORY DATA STORAGE =====
// In-memory storage for inventory items
let inventoryItems = [
  // Sample inventory items for testing
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
  }
];
let nextInventoryId = 3; // Track next ID for new inventory items

// ===== INVENTORY ROUTES =====

// View all inventory items
app.get('/inventory', (req, res) => {
  // For now, return a simple list. You can create an EJS template later
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Inventory - Recipe Hub</title>
      <style>
        body { font-family: Arial; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #28a745; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #28a745; color: white; }
        .btn { padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 5px; }
        .btn-primary { background: #28a745; color: white; }
        .btn-danger { background: #dc3545; color: white; border: none; cursor: pointer; }
        .btn-secondary { background: #6c757d; color: white; }
        .actions { margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📦 Inventory Management</h1>
        <div class="actions">
          <a href="/" class="btn btn-secondary">🏠 Home</a>
          <a href="/inventory/new" class="btn btn-primary">➕ Add New Item</a>
        </div>
        <p>Total items: ${inventoryItems.length}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Cost</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>`;
  
  inventoryItems.forEach(item => {
    html += `
      <tr>
        <td>#${item.id}</td>
        <td><strong>${item.ingredientName}</strong></td>
        <td>${item.category}</td>
        <td>${item.location}</td>
        <td>${item.quantity}</td>
        <td>${item.unit}</td>
        <td>$${item.cost.toFixed(2)}</td>
        <td>${item.supplier || '-'}</td>
        <td>
          <form method="POST" action="/inventory/${item.id}/delete" style="display:inline;">
            <button type="submit" class="btn btn-danger" onclick="return confirm('Delete this item?')">
              🗑️ Delete
            </button>
          </form>
        </td>
      </tr>`;
  });
  
  html += `
          </tbody>
        </table>
      </div>
    </body>
    </html>`;
  
  res.send(html);
});

// Show form for new inventory item
app.get('/inventory/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inventory-form.html'));
});

// Handle form submission - ADD new inventory item
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
  
  // Redirect to inventory page after successful submission
  res.redirect('/inventory');
});

// View single inventory item
app.get('/inventory/:id', (req, res) => {
  const item = inventoryItems.find(i => i.id === parseInt(req.params.id));
  if (item) {
    res.json(item); // For now, return JSON. You can create a view later
  } else {
    res.status(404).send('Inventory item not found');
  }
});

// DELETE inventory item
app.post('/inventory/:id/delete', (req, res) => {
  const itemId = parseInt(req.params.id);
  const itemIndex = inventoryItems.findIndex(i => i.id === itemId);
  
  if (itemIndex !== -1) {
    const deletedItem = inventoryItems.splice(itemIndex, 1)[0];
    console.log('Inventory item deleted:', deletedItem.ingredientName);
  }
  
  res.redirect('/inventory');
});


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

/* ------------------------------- home -------------------------------- */
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* -------------------------------- routes ------------------------------ */
// Instead of requiring separate route files, defining routes directly here

// Recipe routes
// Recipe routes (Task 6)
// View all recipes (renders EJS template)
app.get('/recipes', (req, res) => {
  res.render('recipes', {    // <-- Just 'recipes', not 'recipes/index'
    recipes: recipes,
    student: STUDENT
  });
});

app.get('/recipes/new', (req, res) => {
  // your existing form page
  res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// Handle creation from your form (kept your path: /add-recipe)
app.post('/add-recipe', (req, res) => {
  const b = req.body || {};
  // Expecting fields from your form; fallbacks are okay for now
  const r = {
    recipeId: nextId(),
    title: b.title || 'Untitled',
    chef: b.chef || 'Khush-34151303',
    ingredients: Array.isArray(b.ingredients) ? b.ingredients : String(b.ingredients || '').split(',').map(s=>s.trim()).filter(Boolean),
    instructions: Array.isArray(b.instructions) ? b.instructions : String(b.instructions || '').split('.').map(s=>s.trim()).filter(Boolean),
    mealType: b.mealType || '',
    cuisineType: b.cuisineType || '',
    prepTime: Number(b.prepTime || 0),
    difficulty: b.difficulty || 'Easy',
    servings: Number(b.servings || 1),
    createdDate: new Date().toISOString().slice(0,10)
  };
  req.app.locals.recipes.push(r);
  res.redirect('/recipes');
});

// Delete (per-row button posts here)
app.post('/recipes/:id/delete', (req, res) => {
  const { id } = req.params;
  const list = req.app.locals.recipes || [];
  const i = list.findIndex(r => r.recipeId === id);
  if (i !== -1) list.splice(i, 1);
  res.redirect('/recipes');
});


// Handle form submission
app.post('/add-recipe', (req, res) => {
  console.log('New recipe received:', req.body);
  res.redirect('/recipes');
});

app.put('/recipes/:id', (req, res) => {
  res.json({ message: `Recipe ${req.params.id} updated`, data: req.body });
});

app.delete('/recipes/:id', (req, res) => {
  res.json({ message: `Recipe ${req.params.id} deleted` });
});

// Inventory routes
app.get('/inventory', (req, res) => {
  res.send('Inventory page - Working!');
});

app.get('/inventory/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inventory-form.html'));
});

app.get('/inventory/:id', (req, res) => {
  res.send(`Inventory item with ID: ${req.params.id}`);
});

app.post('/inventory', (req, res) => {
  res.json({ message: 'Inventory item created', data: req.body });
});

app.put('/inventory/:id', (req, res) => {
  res.json({ message: `Inventory item ${req.params.id} updated`, data: req.body });
});

app.delete('/inventory/:id', (req, res) => {
  res.json({ message: `Inventory item ${req.params.id} deleted` });
});

// HD routes
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

app.put('/hd/:id', (req, res) => {
  res.json({ message: `HD item ${req.params.id} updated`, data: req.body });
});

app.delete('/hd/:id', (req, res) => {
  res.json({ message: `HD item ${req.params.id} deleted` });
});

/* --------------------------- central error page ----------------------- */
app.get('/error', (req, res) => {
  const code = Number(req.query.code) || 400;
  
  // Check if views/Error.ejs exists, otherwise send simple response
  res.status(code).render('Error', {
    code,
    msg: req.query.msg || 'An unexpected error occurred.',
  }, (err, html) => {
    if (err) {
      // If the view doesn't exist, send a simple response
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

/* -------------------------------- 404 -------------------------------- */
app.use((_req, res) => {
  // Check if views/NotFound.ejs exists, otherwise send simple 404
  res.status(404).render('NotFound', {}, (err, html) => {
    if (err) {
      // If the view doesn't exist, send a simple 404 page
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

/* ------------------------- final error handler ------------------------ */
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

/* -------------------------------- start ------------------------------- */
app.listen(PORT, () => {
  console.log(`✅ Recipe Hub running: http://localhost:${PORT}`);
  console.log(`📝 Student: ${STUDENT}`);
  console.log(`\n🔗 Available routes:`);
  console.log(`   http://localhost:${PORT}/          - Home page`);
  console.log(`   http://localhost:${PORT}/recipes   - Recipes page`);
  console.log(`   http://localhost:${PORT}/inventory - Inventory page`);
  console.log(`   http://localhost:${PORT}/hd        - HD page`);
});

module.exports = app;