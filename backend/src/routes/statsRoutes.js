const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/statsController');
const authMiddleware = require('../middleware/authJWT');

// protected route
router.get('/', authMiddleware, getStats);

module.exports = router;
