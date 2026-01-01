const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/error');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const totals = cart.calculateTotals();

  res.json({
    success: true,
    data: {
      items: cart.items,
      ...totals
    }
  });
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, selectedColor } = req.body;

  // Validate product exists
  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  if (!product.inStock || product.quantity < quantity) {
    return res.status(400).json({
      success: false,
      message: 'Product not available in requested quantity'
    });
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.product.toString() === productId &&
            (!selectedColor || item.selectedColor?.name === selectedColor?.name)
  );

  if (existingItemIndex > -1) {
    // Update quantity
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      quantity,
      selectedColor,
      price: product.salePrice || product.price
    });
  }

  await cart.save();
  await cart.populate('items.product');

  const totals = cart.calculateTotals();

  res.json({
    success: true,
    message: 'Item added to cart',
    data: {
      items: cart.items,
      ...totals
    }
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/update/:itemId
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  const item = cart.items.id(req.params.itemId);

  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Item not found in cart'
    });
  }

  // Verify product availability
  const product = await Product.findById(item.product);

  if (!product || !product.inStock || product.quantity < quantity) {
    return res.status(400).json({
      success: false,
      message: 'Product not available in requested quantity'
    });
  }

  item.quantity = quantity;
  await cart.save();
  await cart.populate('items.product');

  const totals = cart.calculateTotals();

  res.json({
    success: true,
    message: 'Cart updated',
    data: {
      items: cart.items,
      ...totals
    }
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  cart.items = cart.items.filter(
    item => item._id.toString() !== req.params.itemId
  );

  await cart.save();
  await cart.populate('items.product');

  const totals = cart.calculateTotals();

  res.json({
    success: true,
    message: 'Item removed from cart',
    data: {
      items: cart.items,
      ...totals
    }
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  cart.items = [];
  await cart.save();

  res.json({
    success: true,
    message: 'Cart cleared',
    data: {
      items: [],
      subtotal: '0.00',
      itemCount: 0
    }
  });
});
