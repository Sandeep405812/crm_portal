const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  productSchema,
  updateProductSchema,
} = require('../controllers/productController');
const { authenticate, authorizeRoles } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validator');

router.use(authenticate);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post(
  '/',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validate(productSchema),
  createProduct
);
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validate(updateProductSchema),
  updateProduct
);

module.exports = router;
