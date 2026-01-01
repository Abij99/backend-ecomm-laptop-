require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');


const sampleProducts = [

  {
    name: 'MacBook Pro 16" M3 Max',
    description: 'The most powerful MacBook Pro ever. With the blazing-fast M3 Max chip, up to 128GB unified memory, and a stunning Liquid Retina XDR display with ProMotion. Perfect for professional creators and developers.',
    price: 3499,
    salePrice: null,
    brand: 'Apple',
    category: ['Laptops'],
    specifications: {
      specs: {
        'Processor': 'Apple M3 Max',
        'Processor Generation': 'M3',
        'RAM': '32GB',
        'Storage': '1TB',
        'Storage Type': 'NVMe SSD',
        'Display Size': '16.2"',
        'Display Resolution': '3456 x 2234 (Liquid Retina XDR)',
        'Refresh Rate': '120Hz ProMotion',
        'Graphics': 'Apple M3 Max (30-core GPU)',
        'Graphics Type': 'Integrated',
        'Battery Life': 'Up to 22 hours',
        'Weight': '4.7 lbs (2.14 kg)',
        'Operating System': 'macOS Sonoma',
        'Warranty': '1 year AppleCare'
      },
      features: ['3x Thunderbolt 4', 'HDMI', 'SD card slot', 'MagSafe 3']
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', alt: 'MacBook Pro front view' },
      { url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800', alt: 'MacBook Pro side view' }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    colors: [
      { name: 'Space Black', hex: '#1a1a1a', available: true },
      { name: 'Silver', hex: '#e1e1e1', available: true }
    ],
    inStock: true,
    quantity: 15,
    badges: ['Best Seller', 'New'],
    featured: true,
    reviews: [],
    ratings: { average: 4.9, count: 127 }
  },
  {
    name: 'Dell XPS 15 (2024)',
    description: 'Premium performance meets stunning design. Powered by Intel Core i9 13th Gen and NVIDIA RTX 4060, with a gorgeous 15.6" OLED display. Perfect for content creators and gaming enthusiasts.',
    price: 2299,
    salePrice: 2099,
    brand: 'Dell',
    category: ['Laptops'],
    specifications: {
      specs: {
        'Processor': 'Intel Core i9-13900H',
        'Processor Generation': '13th Gen',
        'RAM': '32GB',
        'Storage': '1TB',
        'Storage Type': 'NVMe SSD',
        'Display Size': '15.6"',
        'Display Resolution': '3456 x 2160 (OLED 3.5K)',
        'Refresh Rate': '60Hz',
        'Touchscreen': 'Yes',
        'Graphics': 'NVIDIA GeForce RTX 4060 (8GB)',
        'Graphics Type': 'Dedicated',
        'Battery Life': 'Up to 13 hours',
        'Weight': '4.23 lbs (1.92 kg)',
        'Operating System': 'Windows 11 Pro',
        'Warranty': '1 year Premium Support'
      },
      features: ['2x Thunderbolt 4', '1x USB-C 3.2', 'SD card reader']
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800', alt: 'Dell XPS 15' },
      { url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800', alt: 'Dell XPS keyboard' }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400',
    colors: [
      { name: 'Platinum Silver', hex: '#c0c0c0', available: true },
      { name: 'Graphite', hex: '#2f2f2f', available: true }
    ],
    inStock: true,
    quantity: 8,
    badges: ['Sale'],
    featured: true,
    reviews: [],
    ratings: { average: 4.7, count: 89 }
  },
  {
    name: 'ASUS ROG Zephyrus G14',
    description: 'Compact gaming powerhouse with AMD Ryzen 9 and NVIDIA RTX 4060. Features a stunning 14" QHD+ display with 165Hz refresh rate. The perfect balance of portability and performance.',
    price: 1799,
    salePrice: 1699,
    brand: 'ASUS',
    category: ['Laptops'],
    specifications: {
      specs: {
        'Processor': 'AMD Ryzen 9 7940HS',
        'Processor Generation': '7000 Series',
        'RAM': '16GB',
        'Storage': '1TB',
        'Storage Type': 'NVMe SSD',
        'Display Size': '14"',
        'Display Resolution': '2560 x 1600 (QHD+)',
        'Refresh Rate': '165Hz',
        'Graphics': 'NVIDIA GeForce RTX 4060 (8GB)',
        'Graphics Type': 'Dedicated',
        'Battery Life': 'Up to 10 hours',
        'Weight': '3.64 lbs (1.65 kg)',
        'Operating System': 'Windows 11 Home',
        'Warranty': '1 year International Warranty'
      },
      features: ['2x USB-C 4.0', '2x USB-A 3.2', 'HDMI 2.1', 'Audio jack']
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800', alt: 'ASUS ROG laptop' },
      { url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800', alt: 'Gaming laptop' }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
    colors: [
      { name: 'Eclipse Gray', hex: '#4a4a4a', available: true },
      { name: 'Moonlight White', hex: '#f5f5f5', available: false }
    ],
    inStock: true,
    quantity: 12,
    badges: ['Best Seller', 'Sale'],
    featured: true,
    reviews: [],
    ratings: { average: 4.8, count: 156 }
  },
  {
    name: 'HP Spectre x360 14"',
    description: 'Luxury 2-in-1 convertible laptop with gem-cut design. Intel Core i7, gorgeous OLED touchscreen, and all-day battery life. Perfect for professionals who demand style and substance.',
    price: 1499,
    salePrice: null,
    brand: 'HP',
    category: ['Laptops'],
    specifications: {
      specs: {
        'Processor': 'Intel Core i7-1355U',
        'Processor Generation': '13th Gen',
        'RAM': '16GB',
        'Storage': '1TB',
        'Storage Type': 'NVMe SSD',
        'Display Size': '13.5"',
        'Display Resolution': '3000 x 2000 (OLED 3K2K)',
        'Refresh Rate': '60Hz',
        'Touchscreen': 'Yes',
        'Graphics': 'Intel Iris Xe Graphics',
        'Graphics Type': 'Integrated',
        'Battery Life': 'Up to 16 hours',
        'Weight': '2.95 lbs (1.34 kg)',
        'Operating System': 'Windows 11 Home',
        'Warranty': '1 year Limited Warranty'
      },
      features: ['2x Thunderbolt 4', '1x USB-A 3.2', 'Audio jack']
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', alt: 'HP Spectre' },
      { url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800', alt: 'Convertible laptop' }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
    colors: [
      { name: 'Nightfall Black', hex: '#1a1a1a', available: true },
      { name: 'Natural Silver', hex: '#d4d4d4', available: true }
    ],
    inStock: true,
    quantity: 6,
    badges: ['New'],
    featured: true,
    reviews: [],
    ratings: { average: 4.6, count: 73 }
  },
  {
    name: 'Lenovo ThinkPad X1 Carbon Gen 11',
    description: 'The ultimate business laptop. Ultra-lightweight carbon fiber chassis, exceptional keyboard, and legendary durability. Built for professionals who mean business.',
    price: 1399,
    salePrice: null,
    brand: 'Lenovo',
    category: ['Laptops'],
    specifications: {
      specs: {
        'Processor': 'Intel Core i7-1365U',
        'Processor Generation': '13th Gen',
        'RAM': '16GB',
        'Storage': '512GB',
        'Storage Type': 'NVMe SSD',
        'Display Size': '14"',
        'Display Resolution': '1920 x 1200 (WUXGA)',
        'Refresh Rate': '60Hz',
        'Graphics': 'Intel Iris Xe Graphics',
        'Graphics Type': 'Integrated',
        'Battery Life': 'Up to 19 hours',
        'Weight': '2.48 lbs (1.12 kg)',
        'Operating System': 'Windows 11 Pro',
        'Warranty': '1 year Premier Support'
      },
      features: ['2x Thunderbolt 4', '2x USB-A 3.2', 'HDMI 2.0', 'Audio jack']
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800', alt: 'ThinkPad laptop' },
      { url: 'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=800', alt: 'Business laptop' }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
    colors: [
      { name: 'Black', hex: '#000000', available: true }
    ],
    inStock: true,
    quantity: 20,
    badges: [],
    featured: false,
    reviews: [],
    ratings: { average: 4.7, count: 201 }
  },
  {
    name: 'MSI Creator Z16P',
    description: 'Professional content creation laptop with stunning Mini LED display. Intel Core i9 and NVIDIA RTX 4070 power through any creative workflow. True creator laptop.',
    price: 2499,
    salePrice: 2299,
    brand: 'MSI',
    category: ['Laptops'],
    specifications: {
      specs: {
        'Processor': 'Intel Core i9-13900H',
        'Processor Generation': '13th Gen',
        'RAM': '32GB',
        'Storage': '2TB',
        'Storage Type': 'NVMe SSD',
        'Display Size': '16"',
        'Display Resolution': '2560 x 1600 (QHD+)',
        'Refresh Rate': '165Hz',
        'Touchscreen': 'Yes',
        'Graphics': 'NVIDIA GeForce RTX 4070 (8GB)',
        'Graphics Type': 'Dedicated',
        'Battery Life': 'Up to 8 hours',
        'Weight': '5.07 lbs (2.3 kg)',
        'Operating System': 'Windows 11 Pro',
        'Warranty': '2 year Limited Warranty'
      },
      features: ['2x Thunderbolt 4', '2x USB-A 3.2', 'HDMI 2.1', 'SD card reader']
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800', alt: 'MSI Creator laptop' },
      { url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800', alt: 'Gaming laptop' }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
    colors: [
      { name: 'Urban Silver', hex: '#b8b8b8', available: true }
    ],
    inStock: true,
    quantity: 5,
    badges: ['Sale'],
    featured: false,
    reviews: [],
    ratings: { average: 4.5, count: 34 }
  },
  
  // Accessories
  {
    name: 'USB-C 100W Fast Charger',
    description: 'Universal USB-C charger with 100W power delivery. Compatible with MacBook Pro, Dell XPS, and all USB-C laptops. Compact design with foldable plug.',
    price: 49.99,
    salePrice: 39.99,
    brand: 'Anker',
    category: ['Chargers', 'Accessories'],
    specifications: {
      specs: {
        'Power Output': '100W',
        'Connector Type': 'USB-C',
        'Input': 'AC 100-240V',
        'Features': 'Fast Charging, Foldable Plug'
      },
      features: ['Compatible with MacBook Pro', 'Compatible with Dell XPS', 'Compact design', 'Foldable plug']
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800', alt: 'USB-C charger' }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400',
    colors: [
      { name: 'White', hex: '#ffffff', available: true },
      { name: 'Black', hex: '#000000', available: true }
    ],
    inStock: true,
    quantity: 50,
    badges: ['Sale'],
    featured: false,
    reviews: [],
    ratings: { average: 4.8, count: 892 }
  },
  {
    name: 'Laptop Cooling Pad RGB',
    description: 'Professional laptop cooling pad with 6 ultra-quiet fans and customizable RGB lighting. Ergonomic design with adjustable height for comfort.',
    price: 59.99,
    salePrice: 49.99,
    brand: 'Generic',
    category: ['Cooling Pads', 'Accessories'],
    specifications: {
      specs: {
        'Number of Fans': '6 Ultra-quiet fans',
        'Lighting': 'Customizable RGB',
        'Noise Level': '< 25dB',
        'Adjustable Height': 'Yes'
      },
      features: ['Ultra-quiet operation', 'Customizable RGB lighting', 'Ergonomic design', 'Adjustable height angles']
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800', alt: 'Cooling pad' }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400',
    colors: [
      { name: 'Black', hex: '#000000', available: true }
    ],
    inStock: true,
    quantity: 35,
    badges: ['Sale'],
    featured: false,
    reviews: [],
    ratings: { average: 4.4, count: 156 }
  },
  {
    name: 'Premium Laptop Sleeve 15-16"',
    description: 'Luxury laptop sleeve with soft microfiber lining and water-resistant exterior. Perfect fit for 15-16 inch laptops with extra pocket for accessories.',
    price: 39.99,
    salePrice: null,
    brand: 'Generic',
    category: ['Cases', 'Accessories'],
    specifications: {
      specs: {
        'Size': 'Fits 15-16" laptops',
        'Material': 'Soft Microfiber Lining',
        'Water Resistance': 'Water-resistant exterior',
        'Pockets': 'Extra accessory pocket'
      },
      features: ['Soft microfiber lining', 'Water-resistant exterior', 'Perfect fit for 15-16 inch laptops', 'Extra pocket for accessories']
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', alt: 'Laptop sleeve' }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    colors: [
      { name: 'Charcoal', hex: '#36454f', available: true },
      { name: 'Navy Blue', hex: '#000080', available: true }
    ],
    inStock: true,
    quantity: 42,
    badges: [],
    featured: false,
    reviews: [],
    ratings: { average: 4.7, count: 234 }
  },
  {
    name: 'Aluminum Laptop Stand',
    description: 'Premium aluminum laptop stand with ergonomic design. Improves posture and airflow. Compatible with all laptops from 10" to 17".',
    price: 79.99,
    salePrice: 69.99,
    brand: 'Generic',
    category: ['Stands', 'Accessories'],
    specifications: {
      specs: {
        'Material': 'Premium Aluminum',
        'Compatibility': 'All laptops 10" to 17"',
        'Adjustable': 'Multiple angle positions',
        'Weight Capacity': 'Up to 20 lbs'
      },
      features: ['Premium aluminum construction', 'Supports 10" to 17" laptops', 'Ergonomic design improves posture', 'Enhances airflow', 'Sturdy & stable']
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800', alt: 'Laptop stand' }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    colors: [
      { name: 'Space Gray', hex: '#7d7d7d', available: true },
      { name: 'Silver', hex: '#c0c0c0', available: true }
    ],
    inStock: true,
    quantity: 28,
    badges: ['Sale'],
    featured: false,
    reviews: [],
    ratings: { average: 4.9, count: 567 }
  },
  {
    name: 'Wireless Mechanical Keyboard',
    description: 'Premium wireless mechanical keyboard with hot-swappable switches. RGB backlight, multi-device connection, and 80-hour battery life.',
    price: 149.99,
    salePrice: 129.99,
    brand: 'Generic',
    category: ['Peripherals', 'Accessories'],
    specifications: {
      specs: {
        'Type': 'Mechanical Keyboard',
        'Switch Type': 'Hot-swappable',
        'Backlighting': 'RGB',
        'Connectivity': 'Wireless',
        'Battery Life': 'Up to 80 hours'
      },
      features: ['Hot-swappable switches', 'RGB backlight', 'Multi-device connection', '80-hour battery life', 'Premium build quality']
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', alt: 'Mechanical keyboard' }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
    colors: [
      { name: 'Black', hex: '#000000', available: true },
      { name: 'White', hex: '#ffffff', available: true }
    ],
    inStock: true,
    quantity: 18,
    badges: ['Best Seller', 'Sale'],
    featured: false,
    reviews: [],
    ratings: { average: 4.8, count: 423 }
  }
];

// Seed function
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/atweb');
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${products.length} products`);

    // Set up product relationships (related products)
    const laptops = products.filter(p => p.category[0] === 'Laptops');

    for (const laptop of laptops) {
      // Add random related laptops
      const relatedLaptops = laptops
        .filter(l => l._id.toString() !== laptop._id.toString())
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(l => l._id);

      laptop.relatedProducts = relatedLaptops;
      await laptop.save();
    }

    console.log('✅ Set up product relationships');
    console.log('\n🎉 Database seeded successfully!');
    console.log(`\nProducts Summary:`);
    console.log(`- Total Products: ${products.length}`);
    console.log(`- Laptops: ${laptops.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
}

// Run seed
seedDatabase();
