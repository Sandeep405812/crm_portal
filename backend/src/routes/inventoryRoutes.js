const express = require('express');
const router = express.Router();
const {
  adjustStock,
  getStockLogs,
  stockAdjustmentSchema,
} = require('../controllers/inventoryController');
const { authenticate, authorizeRoles } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validator');

router.use(authenticate);

router.get('/logs', getStockLogs);
router.post(
  '/adjust',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validate(stockAdjustmentSchema),
  adjustStock
);

module.exports = router;
