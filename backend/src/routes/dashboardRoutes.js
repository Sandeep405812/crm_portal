const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/stats', getDashboardStats);

module.exports = router;
