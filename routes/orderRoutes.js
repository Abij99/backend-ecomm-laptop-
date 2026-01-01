const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  getOrderByTracking,
  cancelOrder,
  downloadInvoice,
  migrateOrderNumbers
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { orderValidation, validate } = require('../middleware/validation');

// Public route - track order by AWB/tracking number
router.get('/tracking/:trackingNumber', getOrderByTracking);

// Admin/maintenance route - migrate orders to add orderNumbers
router.get('/migrate/add-order-numbers', migrateOrderNumbers);

// All protected order routes
router.post('/', protect, orderValidation, validate, createOrder);
router.get('/', protect, getUserOrders);
router.get('/:orderId/invoice/download', protect, downloadInvoice);
router.post('/:orderId/cancel', protect, cancelOrder);
router.get('/:orderId', protect, getOrderById);

module.exports = router;
