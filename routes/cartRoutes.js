const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { cartItemValidation, validate } = require('../middleware/validation');

// All cart routes are protected
router.get('/', protect, getCart);
router.post('/add', protect, cartItemValidation, validate, addToCart);
router.put('/update/:itemId', protect, updateCartItem);
router.delete('/remove/:itemId', protect, removeFromCart);
router.delete('/clear', protect, clearCart);

module.exports = router;
