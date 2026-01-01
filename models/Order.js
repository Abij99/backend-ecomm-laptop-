const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  selectedColor: {
    name: String,
    hex: String
  },
  thumbnail: String
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'USA'
  },
  phone: {
    type: String,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    type: shippingAddressSchema,
    required: true
  },
  shippingMethod: {
    type: String,
    enum: ['Standard', 'Express', 'Overnight'],
    default: 'Standard'
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cod', 'stripe', 'paypal', 'credit_card'],
    default: 'card'
  },
  paymentId: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  trackingNumber: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  estimatedDelivery: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique order number
orderSchema.pre('validate', async function() {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ATW-${timestamp.slice(-8)}-${random}`;
  }
});

// Update updatedAt timestamp
orderSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Calculate estimated delivery date based on shipping method
orderSchema.methods.calculateEstimatedDelivery = function() {
  const now = new Date();
  let daysToAdd = 5; // Standard shipping
  
  if (this.shippingMethod === 'Express') {
    daysToAdd = 2;
  } else if (this.shippingMethod === 'Overnight') {
    daysToAdd = 1;
  }
  
  const estimatedDate = new Date(now.setDate(now.getDate() + daysToAdd));
  this.estimatedDelivery = estimatedDate;
  return estimatedDate;
};

module.exports = mongoose.model('Order', orderSchema);
