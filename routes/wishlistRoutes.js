const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

// All wishlist routes are protected
router.get('/', protect, getWishlist);
router.post('/add', protect, addToWishlist);
router.delete('/remove/:productId', protect, removeFromWishlist);
router.delete('/clear', protect, clearWishlist);

module.exports = router;
