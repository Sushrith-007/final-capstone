#!/bin/bash

echo "🚀 Starting E-Commerce PWA - Complete Setup"
echo "=============================================="
echo ""

# Kill any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "mongod" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
pkill -f "node.*server" 2>/dev/null
sleep 2

# Create MongoDB data directory
echo "🗄️  Setting up MongoDB..."
mkdir -p ~/mongodb-data

# Start MongoDB in background with output
echo "📊 Starting MongoDB on port 27017..."
mongod --dbpath ~/mongodb-data > /tmp/mongodb.log 2>&1 &
MONGO_PID=$!
echo "   MongoDB PID: $MONGO_PID"
sleep 3

# Check if MongoDB started successfully
if ! ps -p $MONGO_PID > /dev/null; then
    echo "❌ MongoDB failed to start. Check /tmp/mongodb.log for details."
    exit 1
fi
echo "✅ MongoDB started successfully"

# Seed the database
echo ""
echo "🌱 Seeding database with sample data..."
cd backend
node seed.js
cd ..

# Start Backend in background with output
echo ""
echo "🔧 Starting Backend API on port 8000..."
cd backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
cd ..

# Wait for backend to start
sleep 5

# Start Frontend in background with output
echo ""
echo "🎨 Starting Frontend on port 4000..."
cd frontend
PORT=4000 npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
cd ..

# Wait for services to start
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 10

# Test all services
echo ""
echo "🔍 Testing all services..."
echo "=========================="

# Test MongoDB
echo "🗄️  MongoDB Status:"
if ps -p $MONGO_PID > /dev/null; then
    echo "   ✅ Running (PID: $MONGO_PID)"
else
    echo "   ❌ Not running"
fi

# Test Backend
echo "🔧 Backend API Status:"
BACKEND_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/health 2>/dev/null || echo "000")
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "   ✅ Running on http://localhost:8000 (HTTP $BACKEND_STATUS)"
else
    echo "   ❌ Not responding (HTTP $BACKEND_STATUS)"
fi

# Test Frontend
echo "📱 Frontend Status:"
FRONTEND_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4000 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "   ✅ Running on http://localhost:4000 (HTTP $FRONTEND_STATUS)"
else
    echo "   ❌ Not responding (HTTP $FRONTEND_STATUS)"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "🌐 Access Points:"
echo "   📱 Frontend: http://localhost:4000"
echo "   🔧 Backend API: http://localhost:8000"
echo "   🗄️  MongoDB: localhost:27017"
echo ""
echo "🔑 Admin Credentials:"
echo "   📧 Email: admin@example.com"
echo "   🔒 Password: Admin123!"
echo ""
echo "📊 Process IDs:"
echo "   MongoDB: $MONGO_PID"
echo "   Backend: $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📝 Live Logs:"
echo "   MongoDB: tail -f /tmp/mongodb.log"
echo "   Backend: tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🧪 Test Commands:"
echo "   # Test backend health"
echo "   curl http://localhost:8000/api/health"
echo ""
echo "   # Get products"
echo "   curl http://localhost:8000/api/products"
echo ""
echo "   # Admin login"
echo "   curl -X POST http://localhost:8000/api/auth/login \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"email\":\"admin@example.com\",\"password\":\"Admin123!\"}'"
echo ""
echo "🛑 To stop all services:"
echo "   pkill -f 'mongod|react-scripts|node.*server'"
echo ""
echo "🚀 Open http://localhost:4000 in your browser to test the site!"
echo "" 