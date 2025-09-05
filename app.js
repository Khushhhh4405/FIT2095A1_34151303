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

/* ------------------------------- home -------------------------------- */
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* -------------------------------- routes ------------------------------ */
// Instead of requiring separate route files, defining routes directly here

// Recipe routes
app.get('/recipes', (req, res) => {
  res.send('Recipes page - Working!');
});

app.get('/recipes/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

app.get('/recipes/:id', (req, res) => {
  res.send(`Recipe with ID: ${req.params.id}`);
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
  res.send('New inventory item form');
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