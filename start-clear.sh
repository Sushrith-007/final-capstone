#!/bin/bash

echo "🚀 Starting E-Commerce PWA with clear port assignments..."
echo ""

# Kill any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "mongod" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
pkill -f "node.*server" 2>/dev/null
sleep 2

# Start MongoDB on port 27018
echo "🗄️  Starting MongoDB on port 27018..."
mongod --port 27018 --dbpath /tmp/mongodb-27018 > /tmp/mongodb.log 2>&1 &
MONGO_PID=$!
echo "   MongoDB PID: $MONGO_PID"
sleep 3

# Start Backend on port 8000
echo "🔧 Starting Backend API on port 8000..."
cd backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
cd ..

# Start Frontend on port 4000
echo "🎨 Starting Frontend on port 4000..."
cd frontend
PORT=4000 npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
cd ..

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Access Points:"
echo "   📱 Frontend: http://localhost:4000"
echo "   🔧 Backend API: http://localhost:8000"
echo "   🗄️  MongoDB: localhost:27018"
echo ""
echo "📊 Process IDs:"
echo "   MongoDB: $MONGO_PID"
echo "   Backend: $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   MongoDB: tail -f /tmp/mongodb.log"
echo "   Backend: tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 To stop all services: pkill -f 'mongod|react-scripts|node.*server'"
echo "" 