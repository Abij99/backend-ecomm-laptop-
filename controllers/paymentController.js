const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/error');
const logger = require('../utils/logger');

// @desc    Create Stripe checkout session
// @route   POST /api/payment/create-checkout-session
// @access  Private
exports.createCheckoutSession = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Make sure order belongs to user
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  // Create line items for Stripe
  const lineItems = order.items.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        images: [item.thumbnail]
      },
      unit_amount: Math.round(item.price * 100) // Convert to cents
    },
    quantity: item.quantity
  }));

  // Add shipping as line item
  if (order.shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Shipping - ${order.shippingMethod}`
        },
        unit_amount: Math.round(order.shippingCost * 100)
      },
      quantity: 1
    });
  }

  // Add tax as line item
  if (order.tax > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Tax'
        },
        unit_amount: Math.round(order.tax * 100)
      },
      quantity: 1
    });
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/order-confirmation/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/checkout?cancelled=true`,
    client_reference_id: orderId,
    customer_email: req.user.email,
    metadata: {
      orderId: orderId,
      userId: req.user._id.toString()
    }
  });

  // Store session ID in order for future verification
  order.paymentId = session.id;
  await order.save();

  res.json({
    success: true,
    data: {
      sessionId: session.id,
      url: session.url
    }
  });
});

// @desc    Handle Stripe webhook
// @route   POST /api/payment/webhook
// @access  Public (but verified by Stripe)
exports.stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Update order payment status
      const order = await Order.findById(session.metadata.orderId);
      if (order) {
        order.paymentStatus = 'completed';
        order.paymentId = session.payment_intent;
        order.orderStatus = 'processing';
        await order.save();
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      // Update order payment status
      const failedOrder = await Order.findOne({ paymentId: failedPayment.id });
      if (failedOrder) {
        failedOrder.paymentStatus = 'failed';
        await failedOrder.save();
      }
      break;

    default:
      logger.debug(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// @desc    Verify payment success
// @route   GET /api/payment/verify/:sessionId
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  const order = await Order.findById(session.metadata.orderId);

  if (order && session.payment_status === 'paid') {
    // Update order if payment is successful and not already updated
    if (order.paymentStatus !== 'completed') {
      order.paymentStatus = 'completed';
      order.paymentId = session.payment_intent;
      order.orderStatus = 'processing';
      await order.save();
    }
  }

  res.json({
    success: true,
    data: {
      paymentStatus: session.payment_status,
      order: order
    }
  });
});
