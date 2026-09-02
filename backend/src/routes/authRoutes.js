const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getUsers,
  registerSchema,
  loginSchema,
} = require('../controllers/authController');
const { authenticate, authorizeRoles } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validator');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, authorizeRoles('ADMIN'), getUsers);

module.exports = router;
