const express = require('express');
const router = express.Router();

router.get('/recipes', (req, res) => {
    res.send('Recipes page');
});

module.exports = router;