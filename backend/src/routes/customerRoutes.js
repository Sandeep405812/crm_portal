const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUp,
  customerSchema,
  followUpSchema,
} = require('../controllers/customerController');
const { authenticate, authorizeRoles } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validator');

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  validate(customerSchema),
  createCustomer
);
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'SALES'),
  validate(customerSchema),
  updateCustomer
);
router.post(
  '/:id/follow-up',
  authorizeRoles('ADMIN', 'SALES'),
  validate(followUpSchema),
  addFollowUp
);

module.exports = router;
