const router = express.Router();
const express = require('express');


// Inventory routes
router.get('/inventory', (req, res) => {
    res.send('Inventory page');
});

router.get('/inventory/:id', (req, res) => {
    res.send(`Inventory item ${req.params.id}`);
});

module.exports = router;