const User = require('../models/User');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/error');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');

  res.json({
    success: true,
    data: user.wishlist || []
  });
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/add
// @access  Private
exports.addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  // Validate product exists
  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const user = await User.findById(req.user._id);

  // Check if already in wishlist
  if (user.wishlist.includes(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Product already in wishlist'
    });
  }

  user.wishlist.push(productId);
  await user.save();
  await user.populate('wishlist');

  res.json({
    success: true,
    message: 'Product added to wishlist',
    data: user.wishlist
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/remove/:productId
// @access  Private
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  user.wishlist = user.wishlist.filter(
    id => id.toString() !== req.params.productId
  );

  await user.save();
  await user.populate('wishlist');

  res.json({
    success: true,
    message: 'Product removed from wishlist',
    data: user.wishlist
  });
});

// @desc    Clear wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private
exports.clearWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  user.wishlist = [];
  await user.save();

  res.json({
    success: true,
    message: 'Wishlist cleared',
    data: []
  });
});
