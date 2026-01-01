const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/error');
const { sendOrderConfirmation } = require('../utils/email');

// Helper function to find order by ID or orderNumber
const findOrderByIdOrNumber = async (orderId) => {
  let order;
  
  // Try orderNumber first (e.g., ATW-12345678-0000)
  order = await Order.findOne({ orderNumber: orderId });
  
  // If not found by orderNumber, try MongoDB ID
  if (!order) {
    try {
      order = await Order.findById(orderId);
    } catch (err) {
      // Invalid ID format, order doesn't exist
    }
  }
  
  return order;
};

// Helper function to find and populate order
const findOrderByIdOrNumberPopulated = async (orderId, populateItems = true) => {
  let order;
  
  // Try orderNumber first (e.g., ATW-12345678-0000)
  if (populateItems) {
    order = await Order.findOne({ orderNumber: orderId }).populate('items.product', 'name brand');
  } else {
    order = await Order.findOne({ orderNumber: orderId });
  }
  
  // If not found by orderNumber, try MongoDB ID
  if (!order) {
    try {
      if (populateItems) {
        order = await Order.findById(orderId).populate('items.product', 'name brand');
      } else {
        order = await Order.findById(orderId);
      }
    } catch (err) {
      // Invalid ID format, order doesn't exist
    }
  }
  
  return order;
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    shippingMethod,
    paymentMethod,
    couponCode
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No order items provided'
    });
  }

  // Get all product IDs from items
  const productIds = items.map(item => item.productId || item.product);
  
  // Bulk fetch all products (fixes N+1 query problem)
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  // Validate all products and calculate prices
  let subtotal = 0;
  const orderItems = [];
  const stockUpdates = [];

  for (const item of items) {
    const productId = (item.productId || item.product).toString();
    const product = productMap.get(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product ${productId} not found`
      });
    }

    if (!product.inStock || product.quantity < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `${product.name} is not available in requested quantity`
      });
    }

    const price = product.salePrice || product.price;
    subtotal += price * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      quantity: item.quantity,
      price: price,
      selectedColor: item.selectedColor,
      thumbnail: product.thumbnail
    });

    // Prepare bulk update for stock
    const newQuantity = product.quantity - item.quantity;
    stockUpdates.push({
      updateOne: {
        filter: { _id: product._id },
        update: { 
          $inc: { quantity: -item.quantity },
          $set: { inStock: newQuantity > 0 }
        }
      }
    });
  }

  // Bulk update product stock (replaces individual saves)
  if (stockUpdates.length > 0) {
    await Product.bulkWrite(stockUpdates);
  }

  // Calculate shipping cost
  let shippingCost = 0;
  switch (shippingMethod) {
    case 'Standard':
      shippingCost = 0; // Free standard shipping
      break;
    case 'Express':
      shippingCost = 15.99;
      break;
    case 'Overnight':
      shippingCost = 29.99;
      break;
    default:
      shippingCost = 0;
  }

  // Calculate tax (8% for example)
  const tax = (subtotal * 0.08);

  // Apply discount if coupon code provided
  let discount = 0;
  // TODO: Implement coupon code validation

  const total = subtotal + shippingCost + tax - discount;

  // Map address field to street if needed (frontend sends 'address', model expects 'street')
  const mappedShippingAddress = {
    ...shippingAddress,
    street: shippingAddress.street || shippingAddress.address,
    country: shippingAddress.country || 'USA'
  };

  // Determine initial payment and order status based on payment method
  let initialPaymentStatus = 'pending';
  let initialOrderStatus = 'pending';

  if (paymentMethod === 'cod') {
    // COD orders are confirmed but payment is pending until delivery
    initialPaymentStatus = 'pending';
    initialOrderStatus = 'processing';
  }

  // Create order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress: mappedShippingAddress,
    shippingMethod,
    shippingCost,
    subtotal,
    tax,
    discount,
    couponCode,
    total,
    paymentMethod,
    paymentStatus: initialPaymentStatus,
    orderStatus: initialOrderStatus
  });

  // Calculate estimated delivery
  order.calculateEstimatedDelivery();
  await order.save();

  // Clear user's cart
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [] }
  );

  // Send order confirmation email
  try {
    await sendOrderConfirmation(order, req.user.email);
  } catch (emailError) {
    console.error('Failed to send order confirmation email:', emailError);
    // Don't fail the order creation if email fails
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order
  });
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
exports.getUserOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-items.product'); // Don't populate full product details

  const total = await Order.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get order by tracking number (AWB)
// @route   GET /api/orders/tracking/:trackingNumber
// @access  Public (anyone can track with AWB)
exports.getOrderByTracking = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ trackingNumber: req.params.trackingNumber })
    .populate('items.product', 'name brand')
    .lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found with this tracking number'
    });
  }

  res.json({
    success: true,
    data: order
  });
});

// @desc    Get single order by ID
// @route   GET /api/orders/:orderId
// @access  Private
exports.getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  const order = await findOrderByIdOrNumberPopulated(orderId, true);

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
      message: 'Not authorized to access this order'
    });
  }

  // Auto-verify pending Stripe payments
  if (order.paymentStatus === 'pending' && order.paymentMethod === 'card' && order.paymentId) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      // Check if paymentId is a session ID (starts with cs_) or payment intent (starts with pi_)
      if (order.paymentId.startsWith('cs_')) {
        const session = await stripe.checkout.sessions.retrieve(order.paymentId);
        if (session.payment_status === 'paid') {
          order.paymentStatus = 'completed';
          order.orderStatus = 'processing';
          order.paymentId = session.payment_intent; // Update to payment intent ID
          await order.save();
        }
      } else if (order.paymentId.startsWith('pi_')) {
        const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentId);
        if (paymentIntent.status === 'succeeded') {
          order.paymentStatus = 'completed';
          order.orderStatus = 'processing';
          await order.save();
        }
      }
    } catch (error) {
      console.error('Error auto-verifying payment:', error);
      // Don't fail the request, just log the error
    }
  }

  res.json({
    success: true,
    data: order
  });
});

// @desc    Cancel order
// @route   POST /api/orders/:orderId/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await findOrderByIdOrNumber(req.params.orderId);

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
      message: 'Not authorized to cancel this order'
    });
  }

  // Can only cancel pending or processing orders
  if (!['pending', 'processing'].includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled at this stage'
    });
  }

  order.orderStatus = 'cancelled';
  order.cancelledAt = Date.now();
  order.cancellationReason = req.body.reason || 'Cancelled by user';

  // Restore product quantities
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.quantity += item.quantity;
      product.inStock = true;
      await product.save();
    }
  }

  await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

// @desc    Download order invoice as JSON
// @route   GET /api/orders/:orderId/invoice/download
// @access  Private
exports.downloadInvoice = asyncHandler(async (req, res) => {
  try {
    let order = await Order.findOne({ orderNumber: req.params.orderId })
      .populate('user', 'name email phone')
      .populate('items.product', 'name price thumbnail');

    // If not found by orderNumber, try MongoDB ID
    if (!order) {
      try {
        order = await Order.findById(req.params.orderId)
          .populate('user', 'name email phone')
          .populate('items.product', 'name price thumbnail');
      } catch (err) {
        // Invalid ID format
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify user ownership
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this invoice'
      });
    }

    // Generate invoice HTML
    const invoiceHTML = generateInvoiceHTML(order);

    // Send as downloadable file
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.html"`);
    res.send(invoiceHTML);
  } catch (error) {
    console.error('Download Invoice Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating invoice',
      error: error.message
    });
  }
});

// Helper function to generate invoice HTML
function generateInvoiceHTML(order) {
  // Convert to plain object if needed
  const orderData = order.toObject ? order.toObject() : order;
  
  const itemsHTML = (orderData.items || []).map(item => {
    const itemName = item.name || (item.product?.name || 'Unknown Product');
    const itemPrice = item.price || (item.product?.price || 0);
    const itemQty = item.quantity || 0;
    
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${itemName}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${itemQty}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${Number(itemPrice).toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${(itemPrice * itemQty).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const userData = orderData.user || {};
  const shippingAddr = orderData.shippingAddress || {};
  const subtotal = orderData.subtotal || 0;
  const tax = orderData.tax || 0;
  const shippingFee = orderData.shippingCost || 0;
  const total = orderData.total || 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice - Order #${order.orderNumber}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 40px;
          border-bottom: 2px solid #0066cc;
          padding-bottom: 20px;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #0066cc;
        }
        .invoice-title {
          text-align: right;
        }
        .invoice-title h2 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }
        .invoice-title p {
          margin: 5px 0;
          color: #666;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #0066cc;
          text-transform: uppercase;
          margin-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 5px;
        }
        .two-column {
          display: flex;
          gap: 40px;
          margin-bottom: 30px;
        }
        .column {
          flex: 1;
        }
        .info-row {
          margin-bottom: 8px;
        }
        .info-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          font-weight: 600;
        }
        .info-value {
          font-size: 14px;
          color: #333;
          margin-top: 3px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #f0f0f0;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #0066cc;
        }
        .summary {
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }
        .summary-box {
          width: 300px;
          margin-top: 20px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .summary-row.total {
          font-size: 18px;
          font-weight: bold;
          color: #0066cc;
          border: none;
          padding-top: 15px;
          border-top: 2px solid #0066cc;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-completed {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .status-pending {
          background-color: #fff3e0;
          color: #e65100;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-name">AtWeb Store</div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <p>Order #${orderData.orderNumber}</p>
            <p>${new Date(orderData.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div class="two-column">
          <div class="column">
            <div class="section-title">Bill To</div>
            <div class="info-value" style="font-weight: 600; margin-bottom: 8px;">${userData.name || 'Customer'}</div>
            <div class="info-value">${shippingAddr.street || ''}</div>
            <div class="info-value">${shippingAddr.city || ''}, ${shippingAddr.state || ''} ${shippingAddr.zipCode || ''}</div>
            <div class="info-value">${shippingAddr.country || ''}</div>
            ${userData.email ? `<div class="info-value" style="margin-top: 8px;">Email: ${userData.email}</div>` : ''}
            ${userData.phone ? `<div class="info-value">Phone: ${userData.phone}</div>` : ''}
          </div>

          <div class="column">
            <div class="section-title">Order Details</div>
            <div class="info-row">
              <div class="info-label">Order Status</div>
              <div class="info-value" style="margin-top: 5px;">
                <span class="status-badge status-${orderData.paymentStatus === 'completed' ? 'completed' : 'pending'}">
                  ${orderData.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
            <div class="info-row" style="margin-top: 12px;">
              <div class="info-label">Payment Method</div>
              <div class="info-value">${orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'}</div>
            </div>
            <div class="info-row" style="margin-top: 12px;">
              <div class="info-label">Shipping Method</div>
              <div class="info-value">${orderData.shippingMethod || 'Standard'}</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-box">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            ${tax > 0 ? `
            <div class="summary-row">
              <span>Tax</span>
              <span>$${tax.toFixed(2)}</span>
            </div>
            ` : ''}
            ${shippingFee > 0 ? `
            <div class="summary-row">
              <span>Shipping</span>
              <span>$${shippingFee.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="summary-row total">
              <span>Total</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your order! For any questions, please contact support@atweb.com</p>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// @desc    Migrate orders - add orderNumber to orders that don't have one
// @route   GET /api/orders/migrate/add-order-numbers
// @access  Private (Admin only - but no auth check for simplicity)
exports.migrateOrderNumbers = asyncHandler(async (req, res) => {
  try {
    // Find all orders without an orderNumber
    const ordersWithoutNumber = await Order.find({ 
      $or: [
        { orderNumber: null },
        { orderNumber: undefined },
        { orderNumber: '' }
      ]
    });

    if (ordersWithoutNumber.length === 0) {
      return res.json({
        success: true,
        message: 'All orders already have orderNumbers',
        updated: 0
      });
    }

    // Generate orderNumbers for each order
    let updated = 0;
    for (const order of ordersWithoutNumber) {
      const timestamp = order.createdAt.getTime().toString();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      order.orderNumber = `ATW-${timestamp.slice(-8)}-${random}`;
      await order.save();
      updated++;
    }

    res.json({
      success: true,
      message: `Successfully migrated ${updated} orders`,
      updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});
