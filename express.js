// app.js or routes file - Express.js implementation
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Set up EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Path to recipes JSON file
const RECIPES_FILE = path.join(__dirname, 'data', 'recipes.json');

// Helper function to read recipes from JSON file
function readRecipes() {
    try {
        if (fs.existsSync(RECIPES_FILE)) {
            const data = fs.readFileSync(RECIPES_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error reading recipes:', error);
        return [];
    }
}

// Helper function to write recipes to JSON file
function writeRecipes(recipes) {
    try {
        // Ensure data directory exists
        const dataDir = path.dirname(RECIPES_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing recipes:', error);
        return false;
    }
}

// Route to display all recipes (Task 6 main route)
app.get('/recipes', (req, res) => {
    try {
        const recipes = readRecipes();
        
        // Render the EJS template with recipe data
        res.render('recipes', { 
            recipes: recipes,
            title: 'All Recipes',
            message: req.query.message || null
        });
    } catch (error) {
        console.error('Error loading recipes page:', error);
        res.status(500).render('error', { 
            error: 'Failed to load recipes',
            title: 'Error'
        });
    }
});

// Route to delete a specific recipe
app.post('/recipes/delete/:id', (req, res) => {
    try {
        const recipeId = req.params.id;
        let recipes = readRecipes();
        
        // Find recipe index
        const recipeIndex = recipes.findIndex(recipe => recipe.id === recipeId);
        
        if (recipeIndex === -1) {
            return res.redirect('/recipes?message=Recipe not found');
        }
        
        // Remove recipe from array
        const deletedRecipe = recipes.splice(recipeIndex, 1)[0];
        
        // Save updated recipes
        const success = writeRecipes(recipes);
        
        if (success) {
            res.redirect('/recipes?message=Recipe "' + deletedRecipe.title + '" deleted successfully');
        } else {
            res.redirect('/recipes?message=Error deleting recipe');
        }
        
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.redirect('/recipes?message=Error deleting recipe');
    }
});

// Alternative DELETE route (if using method-override middleware)
app.delete('/recipes/:id', (req, res) => {
    try {
        const recipeId = req.params.id;
        let recipes = readRecipes();
        
        const recipeIndex = recipes.findIndex(recipe => recipe.id === recipeId);
        
        if (recipeIndex === -1) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        const deletedRecipe = recipes.splice(recipeIndex, 1)[0];
        writeRecipes(recipes);
        
        res.json({ 
            message: 'Recipe deleted successfully',
            deletedRecipe: deletedRecipe
        });
        
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ error: 'Failed to delete recipe' });
    }
});

// Root route - redirect to recipes
app.get('/', (req, res) => {
    res.redirect('/recipes');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Recipe Hub server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}/recipes to view all recipes`);
});