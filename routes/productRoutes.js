const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  searchProducts,
  addReview,
  getFeaturedProducts,
  getProductsByCategory
} = require('../controllers/productController');
const { protect, optionalAuth } = require('../middleware/auth');
const { productFilterValidation, reviewValidation, validate } = require('../middleware/validation');

// Public routes
router.get('/', productFilterValidation, validate, getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);

// Protected routes
router.post('/:id/reviews', protect, reviewValidation, validate, addReview);

module.exports = router;
