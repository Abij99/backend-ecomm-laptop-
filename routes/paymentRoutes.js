const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  stripeWebhook,
  verifyPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Stripe webhook (raw body required)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Protected routes
router.post('/create-checkout-session', protect, createCheckoutSession);
router.get('/verify/:sessionId', protect, verifyPayment);

module.exports = router;
