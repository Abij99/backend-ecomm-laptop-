const mongoose = require('mongoose');
const Order = require('../models/Order');

/**
 * Migrate existing orders to add orderNumber if missing
 * Run this once to backfill orderNumbers for orders created before the field was added
 */
const migrateOrders = async () => {
  try {
    console.log('Starting order migration...');
    
    // Find all orders without an orderNumber
    const ordersWithoutNumber = await Order.find({ 
      $or: [
        { orderNumber: null },
        { orderNumber: undefined },
        { orderNumber: '' }
      ]
    });

    console.log(`Found ${ordersWithoutNumber.length} orders without orderNumber`);

    if (ordersWithoutNumber.length === 0) {
      console.log('All orders already have orderNumbers');
      return;
    }

    // Generate orderNumbers for each order
    for (const order of ordersWithoutNumber) {
      const timestamp = order.createdAt.getTime().toString();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      order.orderNumber = `ATW-${timestamp.slice(-8)}-${random}`;
      await order.save();
      console.log(`✓ Updated order ${order._id} with orderNumber: ${order.orderNumber}`);
    }

    console.log(`✓ Migration complete! Updated ${ordersWithoutNumber.length} orders`);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

module.exports = migrateOrders;
