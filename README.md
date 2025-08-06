# E-Commerce PWA Platform

A comprehensive Progressive Web Application (PWA) e-commerce platform built with modern web technologies.

## 🚀 Features

### Frontend
- **Responsive Design**: Mobile-first approach with tablet and desktop compatibility
- **PWA Capabilities**: Offline support, app-like experience, service worker
- **Modern UI/UX**: Beautiful, intuitive interface with smooth animations
- **Real-time Updates**: Live cart and wishlist synchronization

### Backend
- **RESTful API**: Node.js/Express.js backend with comprehensive endpoints
- **Database**: MongoDB with local setup for data persistence
- **Authentication**: JWT-based secure authentication system
- **File Upload**: Multi-image product upload capability

### Admin Dashboard
- **Product Management**: Full CRUD operations for products
- **Order Management**: View, update, and delete orders
- **User Management**: Comprehensive user account administration
- **Analytics**: Sales statistics and user activity insights

### E-commerce Features
- **Product Catalog**: Search, filter, and sort functionality
- **Shopping Cart**: Persistent cart with quantity management
- **Wishlist**: Save and manage favorite products
- **Checkout**: Secure payment processing with Stripe integration
- **Order Management**: Complete order lifecycle management

## 🛠️ Technology Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Redux Toolkit for state management
- Stripe Elements for payment processing

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcrypt for password hashing
- Multer for file uploads
- Stripe API for payments

### PWA Features
- Service Worker for offline functionality
- Web App Manifest for app-like experience
- HTTPS for secure communication
- Push notifications (ready for implementation)

## 📁 Project Structure

```
e-commerce-pwa/
├── frontend/                 # React PWA frontend
│   ├── public/
│   │   ├── manifest.json    # PWA manifest
│   │   ├── service-worker.js # Service worker
│   │   └── icons/          # PWA icons
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
├── backend/                 # Node.js/Express backend
│   ├── controllers/        # Route controllers
│   ├── models/            # MongoDB models
│   ├── middleware/         # Custom middleware
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd e-commerce-pwa
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` files in both frontend and backend directories:
   
   **Backend (.env)**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ecommerce-pwa
   JWT_SECRET=your-super-secret-jwt-key
   STRIPE_SECRET_KEY=sk_test_51Rpp98DSvWV2YN1NczvLOUkRl8LJvi0R62qQuf2NiJdgb6GOAJ5YDJXPyGhRZMZCvTmyOGLaqWkF5YvauGxJbGmR00d6oyc2B6
   ```

   **Frontend (.env)**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51Rpp98DSvWV2YN1NcMM8zRRLxq9Ng2WlLaLBOPBBKCoMqzEhosuyHIqVp3RVAmOVUxFQuRYvTMARkpNaJQFISUWE00kKwn7Msn
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   ```

5. **Run the application**
   ```bash
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend directory)
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Admin Dashboard: http://localhost:3000/admin

## 🔧 Development

### Available Scripts

**Backend**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm test            # Run tests
```

**Frontend**
```bash
npm start           # Start development server
npm run build       # Build for production
npm test            # Run tests
npm run eject       # Eject from Create React App
```

### Database Setup

The application uses MongoDB with the following collections:
- `users` - User accounts and profiles
- `products` - Product catalog
- `orders` - Order information
- `carts` - Shopping cart data
- `wishlists` - User wishlists

### API Endpoints

**Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

**Products**
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

**Cart & Wishlist**
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove from cart
- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:id` - Remove from wishlist

**Orders**
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details

**Admin**
- `GET /api/admin/products` - Get all products (admin)
- `GET /api/admin/orders` - Get all orders (admin)
- `GET /api/admin/users` - Get all users (admin)
- `GET /api/admin/analytics` - Get analytics data (admin)

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy to Netlify:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `build`

3. Set environment variables in Netlify dashboard

### Backend Deployment (Render/Heroku)

1. Create a new service on Render/Heroku
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

### Environment Variables for Production

**Frontend**
```env
REACT_APP_API_URL=https://your-backend-url.com/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

**Backend**
```env
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-production-jwt-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
NODE_ENV=production
```

## 🔒 Security Features

- JWT-based authentication
- Password encryption with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Secure headers
- HTTPS enforcement

## 📱 PWA Features

- **Service Worker**: Offline functionality and caching
- **Web App Manifest**: App-like installation experience
- **Responsive Design**: Works on all device sizes
- **Fast Loading**: Optimized assets and lazy loading
- **Push Notifications**: Ready for implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation

## 🎯 Roadmap

- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Advanced search with Elasticsearch
- [ ] Mobile app versions
- [ ] Social media integration
- [ ] Advanced payment methods
- [ ] Inventory management
- [ ] Email notifications
- [ ] Advanced admin features 