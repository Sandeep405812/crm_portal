const express = require('express');
const router = express.Router();
const {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  downloadPDF,
  createChallanSchema,
  updateStatusSchema,
} = require('../controllers/challanController');
const { authenticate, authorizeRoles } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validator');

router.use(authenticate);

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.get('/:id/pdf', downloadPDF);
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  validate(createChallanSchema),
  createChallan
);
router.patch(
  '/:id/status',
  authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'),
  validate(updateStatusSchema),
  updateChallanStatus
);

module.exports = router;
