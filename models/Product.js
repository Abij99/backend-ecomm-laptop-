const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const specificationSchema = new mongoose.Schema({
  specs: {
    type: Map,
    of: String,
    default: {}
  },
  features: [String]
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0
  },
  brand: {
    type: String,
    required: true,
    enum: ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'MSI', 'Acer', 'Razer', 'Microsoft', 'Samsung', 'LG', 'Anker', 'Belkin', 'Generic']
  },
  category: [{
    type: String,
    enum: ['Laptops', 'Chargers', 'Cooling Pads', 'Cases', 'Stands', 'Peripherals', 'Accessories']
  }],
  specifications: specificationSchema,
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    alt: String
  }],
  thumbnail: {
    type: String,
    required: true
  },
  colors: [{
    name: String,
    hex: String,
    available: {
      type: Boolean,
      default: true
    }
  }],
  inStock: {
    type: Boolean,
    default: true
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  reviews: [reviewSchema],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  badges: [{
    type: String,
    enum: ['Best Seller', 'New', 'Sale', 'Limited Stock']
  }],
  featured: {
    type: Boolean,
    default: false
  },
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  views: {
    type: Number,
    default: 0
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

// Update ratings when review is added
productSchema.methods.updateRatings = function() {
  if (this.reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.ratings.average = (sum / this.reviews.length).toFixed(1);
    this.ratings.count = this.reviews.length;
  }
};

// Update updatedAt timestamp
productSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Create indexes for search and filtering
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, brand: 1, price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ featured: -1, createdAt: -1 });
productSchema.index({ inStock: 1, quantity: 1 });

module.exports = mongoose.model('Product', productSchema);
