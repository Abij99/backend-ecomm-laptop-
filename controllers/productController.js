const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/error');

// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // Build filter object
  const filter = {};

  // Category filter (can be multiple)
  if (req.query.category) {
    const categories = Array.isArray(req.query.category) ? req.query.category : [req.query.category];
    filter.category = { $in: categories };
  }

  // Brand filter (can be multiple)
  if (req.query.brand) {
    const brands = Array.isArray(req.query.brand) ? req.query.brand : [req.query.brand];
    filter.brand = { $in: brands };
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
  }

  // In stock filter
  if (req.query.inStock === 'true') {
    filter.inStock = true;
    filter.quantity = { $gt: 0 };
  }

  // Processor filter
  if (req.query.processor) {
    filter['specifications.processor'] = new RegExp(req.query.processor, 'i');
  }

  // RAM filter
  if (req.query.ram) {
    filter['specifications.ram'] = req.query.ram;
  }

  // Storage filter
  if (req.query.storage) {
    filter['specifications.storage'] = req.query.storage;
  }

  // Graphics type filter
  if (req.query.graphicsType) {
    filter['specifications.graphicsType'] = req.query.graphicsType;
  }

  // Search query
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  // Build sort object
  let sort = {};
  switch (req.query.sort) {
    case 'price-asc':
      sort = { price: 1 };
      break;
    case 'price-desc':
      sort = { price: -1 };
      break;
    case 'newest':
      sort = { createdAt: -1 };
      break;
    case 'rating':
      sort = { 'ratings.average': -1 };
      break;
    case 'popular':
      sort = { views: -1 };
      break;
    default:
      sort = { featured: -1, createdAt: -1 };
  }

  // Execute query
  const products = await Product.find(filter)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .select('-reviews');

  const total = await Product.countDocuments(filter);

  res.json({
    success: true,
    products: products,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('relatedProducts', 'name price salePrice thumbnail brand ratings');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Increment view count
  product.views += 1;
  await product.save();

  res.json({
    success: true,
    data: product
  });
});

// @desc    Search products with autocomplete
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json({
      success: true,
      data: []
    });
  }

  const products = await Product.find({
    $or: [
      { name: new RegExp(q, 'i') },
      { brand: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') }
    ]
  })
  .select('name brand price thumbnail category')
  .limit(10);

  res.json({
    success: true,
    data: products
  });
});

// @desc    Add review to product
// @route   POST /api/products/:id/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    review => review.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this product'
    });
  }

  const review = {
    user: req.user._id,
    username: req.user.username,
    rating: Number(rating),
    comment,
    verified: false // Could check if user purchased this product
  };

  product.reviews.push(review);
  product.updateRatings();

  await product.save();

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: product.reviews
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ featured: true })
    .select('-reviews')
    .limit(8)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: products
  });
});

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const products = await Product.find({ category: req.params.category })
    .select('-reviews')
    .limit(limit)
    .skip(skip)
    .sort({ featured: -1, createdAt: -1 });

  const total = await Product.countDocuments({ category: req.params.category });

  res.json({
    success: true,
    data: products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
