#!/bin/bash

# E-Commerce PWA Setup Script
echo "🚀 Setting up E-Commerce PWA Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB for local development."
    echo "   You can download it from: https://www.mongodb.com/try/download/community"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/uploads/products
mkdir -p frontend/public/icons
mkdir -p frontend/public/screenshots

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Create backend .env file
echo "🔧 Creating backend environment file..."
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce-pwa
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
STRIPE_SECRET_KEY=sk_test_51Rpp98DSvWV2YN1NczvLOUkRl8LJvi0R62qQuf2NiJdgb6GOAJ5YDJXPyGhRZMZCvTmyOGLaqWkF5YvauGxJbGmR00d6oyc2B6
NODE_ENV=development
EOF

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Create frontend .env file
echo "🔧 Creating frontend environment file..."
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51Rpp98DSvWV2YN1NcMM8zRRLxq9Ng2WlLaLBOPBBKCoMqzEhosuyHIqVp3RVAmOVUxFQuRYvTMARkpNaJQFISUWE00kKwn7Msn
REACT_APP_PWA_NAME=E-Commerce PWA
REACT_APP_PWA_SHORT_NAME=E-Commerce
REACT_APP_PWA_DESCRIPTION=A comprehensive e-commerce platform with PWA capabilities
REACT_APP_PWA_THEME_COLOR=#000000
REACT_APP_PWA_BACKGROUND_COLOR=#ffffff
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=info
EOF

cd ..

# Create sample data script
echo "📝 Creating sample data script..."
cat > backend/seed.js << 'EOF'
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

    // Create sample products
    const products = await Product.insertMany(sampleProducts);
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
EOF

# Create start script
echo "📝 Creating start script..."
cat > start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting E-Commerce PWA Platform..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   You can start it with: mongod"
    exit 1
fi

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "🎨 Starting frontend development server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ E-Commerce PWA is starting up!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📊 Admin Dashboard: http://localhost:3000/admin"
echo ""
echo "📧 Admin credentials:"
echo "   Email: admin@example.com"
echo "   Password: Admin123!"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

chmod +x start.sh

# Create seed script
echo "📝 Creating seed script..."
cat > seed.sh << 'EOF'
#!/bin/bash

echo "🌱 Seeding database with sample data..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   You can start it with: mongod"
    exit 1
fi

# Run seed script
cd backend
node seed.js

echo "✅ Database seeded successfully!"
EOF

chmod +x seed.sh

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start MongoDB: mongod"
echo "2. Seed the database: ./seed.sh"
echo "3. Start the application: ./start.sh"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Admin Dashboard: http://localhost:3000/admin"
echo ""
echo "📧 Admin credentials:"
echo "   Email: admin@example.com"
echo "   Password: Admin123!"
echo ""
echo "📚 Documentation: README.md"
echo ""
echo "Happy coding! 🚀" 