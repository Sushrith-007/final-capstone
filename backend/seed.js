const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation and long battery life.',
    shortDescription: 'Premium wireless headphones with noise cancellation',
    price: 99.99,
    compareAtPrice: 129.99,
    category: 'Electronics',
    subcategory: 'Audio',
    tags: ['wireless', 'bluetooth', 'noise-cancellation'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        alt: 'Wireless Bluetooth Headphones',
        isPrimary: true
      }
    ],
    inventory: {
      quantity: 50,
      lowStockThreshold: 5
    },
    featured: true,
    rating: {
      average: 4.5,
      count: 128
    }
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking watch with heart rate monitor and GPS.',
    shortDescription: 'Advanced fitness tracking with heart rate monitor',
    price: 199.99,
    compareAtPrice: 249.99,
    category: 'Electronics',
    subcategory: 'Wearables',
    tags: ['fitness', 'smartwatch', 'gps'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        alt: 'Smart Fitness Watch',
        isPrimary: true
      }
    ],
    inventory: {
      quantity: 30,
      lowStockThreshold: 5
    },
    featured: true,
    rating: {
      average: 4.3,
      count: 89
    }
  },
  {
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable organic cotton t-shirt available in multiple colors.',
    shortDescription: 'Comfortable organic cotton t-shirt',
    price: 24.99,
    category: 'Clothing',
    subcategory: 'T-Shirts',
    tags: ['organic', 'cotton', 'comfortable'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        alt: 'Organic Cotton T-Shirt',
        isPrimary: true
      }
    ],
    inventory: {
      quantity: 100,
      lowStockThreshold: 10
    },
    featured: false,
    rating: {
      average: 4.7,
      count: 256
    }
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Eco-friendly stainless steel water bottle with insulation.',
    shortDescription: 'Eco-friendly insulated water bottle',
    price: 29.99,
    compareAtPrice: 39.99,
    category: 'Home & Garden',
    subcategory: 'Kitchen',
    tags: ['eco-friendly', 'insulated', 'stainless-steel'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
        alt: 'Stainless Steel Water Bottle',
        isPrimary: true
      }
    ],
    inventory: {
      quantity: 75,
      lowStockThreshold: 8
    },
    featured: true,
    rating: {
      average: 4.6,
      count: 167
    }
  },
  {
    name: 'Wireless Charging Pad',
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
    shortDescription: 'Fast wireless charging pad',
    price: 49.99,
    category: 'Electronics',
    subcategory: 'Charging',
    tags: ['wireless', 'charging', 'qi-enabled'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=500',
        alt: 'Wireless Charging Pad',
        isPrimary: true
      }
    ],
    inventory: {
      quantity: 40,
      lowStockThreshold: 5
    },
    featured: false,
    rating: {
      average: 4.4,
      count: 93
    }
  }
];

const sampleAdmin = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  password: 'Admin123!',
  role: 'admin',
  isActive: true
};

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-pwa');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User(sampleAdmin);
    await adminUser.save();
    console.log('Created admin user:', adminUser.email);

    // Create sample products individually to trigger pre-save hooks
    const products = [];
    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
      products.push(product);
    }
    console.log(`Created ${products.length} sample products`);

    console.log('✅ Database seeded successfully!');
    console.log('📧 Admin credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Admin123!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase();
