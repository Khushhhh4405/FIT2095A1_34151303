const router = express.Router();
const express = require('express');


// HD routes
router.get('/hd', (req, res) => {
    res.send('HD page');
});

router.get('/hd/:id', (req, res) => {
    res.send(`HD item ${req.params.id}`);
});

module.exports = router;