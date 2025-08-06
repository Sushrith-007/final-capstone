#!/bin/bash

echo "📊 E-Commerce PWA - Live Monitoring"
echo "===================================="
echo ""

# Function to show logs with color coding
show_logs() {
    echo "🔍 Live Logs (Press Ctrl+C to stop monitoring)"
    echo ""
    echo "📱 Frontend Logs (Port 4000):"
    echo "=============================="
    tail -f /tmp/frontend.log | sed 's/^/📱 /' &
    FRONTEND_TAIL=$!
    
    echo ""
    echo "🔧 Backend Logs (Port 8000):"
    echo "============================="
    tail -f /tmp/backend.log | sed 's/^/🔧 /' &
    BACKEND_TAIL=$!
    
    echo ""
    echo "🗄️  MongoDB Logs (Port 27017):"
    echo "=============================="
    tail -f /tmp/mongodb.log | sed 's/^/🗄️  /' &
    MONGO_TAIL=$!
    
    # Wait for user to stop
    echo ""
    echo "⏳ Monitoring all services... (Press Ctrl+C to stop)"
    echo ""
    
    # Trap to kill background processes when script is stopped
    trap 'kill $FRONTEND_TAIL $BACKEND_TAIL $MONGO_TAIL 2>/dev/null; echo ""; echo "🛑 Monitoring stopped"; exit 0' INT
    
    # Keep script running
    while true; do
        sleep 1
    done
}

# Check if services are running
echo "🔍 Checking service status..."
echo ""

# Check MongoDB
MONGO_PID=$(ps aux | grep "mongod.*--dbpath" | grep -v grep | awk '{print $2}')
if [ -n "$MONGO_PID" ]; then
    echo "✅ MongoDB: Running (PID: $MONGO_PID)"
else
    echo "❌ MongoDB: Not running"
fi

# Check Backend
BACKEND_PID=$(ps aux | grep "node.*server" | grep -v grep | awk '{print $2}')
if [ -n "$BACKEND_PID" ]; then
    echo "✅ Backend: Running (PID: $BACKEND_PID)"
else
    echo "❌ Backend: Not running"
fi

# Check Frontend
FRONTEND_PID=$(ps aux | grep "react-scripts" | grep -v grep | awk '{print $2}')
if [ -n "$FRONTEND_PID" ]; then
    echo "✅ Frontend: Running (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend: Not running"
fi

echo ""
echo "🌐 Service URLs:"
echo "   📱 Frontend: http://localhost:4000"
echo "   🔧 Backend: http://localhost:8000"
echo "   🗄️  MongoDB: localhost:27017"
echo ""

# Ask user if they want to see logs
read -p "📊 Do you want to see live logs? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    show_logs
else
    echo "💡 To see logs later, run: ./monitor.sh"
    echo "🛑 To stop all services: pkill -f 'mongod|react-scripts|node.*server'"
fi 