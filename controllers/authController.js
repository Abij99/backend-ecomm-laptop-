const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { sendWelcomeEmail } = require('../utils/email');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    return res.status(400).json({
      success: false,
      message: userExists.email === email ? 'Email already registered' : 'Username already taken'
    });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password
  });

  if (user) {
    // Send welcome email (don't fail registration if email fails)
    try {
      await sendWelcomeEmail(user.email, user.username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id)
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid user data'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id)
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');

  res.json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const { username, phone, preferences } = req.body;

  const user = await User.findById(req.user._id);

  if (username) user.username = username;
  if (phone) user.phone = phone;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

// @desc    Add address
// @route   POST /api/auth/addresses
// @access  Private
exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // If this is set as default, unset all others
  if (req.body.isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  user.addresses.push(req.body);
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: user.addresses
  });
});

// @desc    Get all addresses
// @route   GET /api/auth/addresses
// @access  Private
exports.getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: user.addresses
  });
});

// @desc    Update address
// @route   PUT /api/auth/addresses/:addressId
// @access  Private
exports.updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    return res.status(404).json({
      success: false,
      message: 'Address not found'
    });
  }

  // If setting as default, unset all others
  if (req.body.isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  Object.assign(address, req.body);
  await user.save();

  res.json({
    success: true,
    message: 'Address updated successfully',
    data: user.addresses
  });
});

// @desc    Delete address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  user.addresses = user.addresses.filter(
    addr => addr._id.toString() !== req.params.addressId
  );
  
  await user.save();

  res.json({
    success: true,
    message: 'Address deleted successfully',
    data: user.addresses
  });
});
