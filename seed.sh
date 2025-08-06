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
