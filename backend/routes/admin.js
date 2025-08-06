const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateToken, requireAdmin);

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// ==================== PRODUCT MANAGEMENT ====================

// @route   GET /api/admin/products
// @desc    Get all products (admin)
// @access  Private (Admin)
router.get('/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      status,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({
      message: 'Failed to get products',
      error: 'GET_ADMIN_PRODUCTS_ERROR'
    });
  }
});

// @route   GET /api/admin/products/:id
// @desc    Get product by ID (admin)
// @access  Private (Admin)
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get admin product error:', error);
    res.status(500).json({
      message: 'Failed to get product',
      error: 'GET_ADMIN_PRODUCT_ERROR'
    });
  }
});

// @route   PUT /api/admin/products/:id/status
// @desc    Update product status (admin)
// @access  Private (Admin)
router.put('/products/:id/status', [
  body('status')
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Valid status is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { status } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    res.json({
      message: 'Product status updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({
      message: 'Failed to update product status',
      error: 'UPDATE_PRODUCT_STATUS_ERROR'
    });
  }
});

// @route   PUT /api/admin/products/:id/featured
// @desc    Toggle product featured status (admin)
// @access  Private (Admin)
router.put('/products/:id/featured', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    product.featured = !product.featured;
    await product.save();

    res.json({
      message: `Product ${product.featured ? 'featured' : 'unfeatured'} successfully`,
      product
    });
  } catch (error) {
    console.error('Toggle product featured error:', error);
    res.status(500).json({
      message: 'Failed to toggle product featured status',
      error: 'TOGGLE_PRODUCT_FEATURED_ERROR'
    });
  }
});

// ==================== ORDER MANAGEMENT ====================

// @route   GET /api/admin/orders
// @desc    Get all orders (admin)
// @access  Private (Admin)
router.get('/orders', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter['payment.status'] = paymentStatus;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name images')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Order.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({
      message: 'Failed to get orders',
      error: 'GET_ADMIN_ORDERS_ERROR'
    });
  }
});

// @route   GET /api/admin/orders/:id
// @desc    Get order by ID (admin)
// @access  Private (Admin)
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images category');

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
        error: 'ORDER_NOT_FOUND'
      });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get admin order error:', error);
    res.status(500).json({
      message: 'Failed to get order',
      error: 'GET_ADMIN_ORDER_ERROR'
    });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status (admin)
// @access  Private (Admin)
router.put('/orders/:id/status', [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Valid status is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
        error: 'ORDER_NOT_FOUND'
      });
    }

    // Update status
    order.status = status;

    // Set delivery date if status is delivered
    if (status === 'delivered') {
      order.actualDelivery = new Date();
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      message: 'Failed to update order status',
      error: 'UPDATE_ORDER_STATUS_ERROR'
    });
  }
});

// @route   PUT /api/admin/orders/:id/shipping
// @desc    Update order shipping info (admin)
// @access  Private (Admin)
router.put('/orders/:id/shipping', [
  body('trackingNumber')
    .optional()
    .isString()
    .withMessage('Tracking number must be a string'),
  body('carrier')
    .optional()
    .isString()
    .withMessage('Carrier must be a string')
], handleValidationErrors, async (req, res) => {
  try {
    const { trackingNumber, carrier } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
        error: 'ORDER_NOT_FOUND'
      });
    }

    if (trackingNumber) {
      order.shipping.trackingNumber = trackingNumber;
    }

    if (carrier) {
      order.shipping.carrier = carrier;
    }

    await order.save();

    res.json({
      message: 'Shipping information updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order shipping error:', error);
    res.status(500).json({
      message: 'Failed to update shipping information',
      error: 'UPDATE_ORDER_SHIPPING_ERROR'
    });
  }
});

// ==================== USER MANAGEMENT ====================

// @route   GET /api/admin/users
// @desc    Get all users (admin)
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(filter)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      message: 'Failed to get users',
      error: 'GET_ADMIN_USERS_ERROR'
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user by ID (admin)
// @access  Private (Admin)
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({
      message: 'Failed to get user',
      error: 'GET_ADMIN_USER_ERROR'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (admin)
// @access  Private (Admin)
router.put('/users/:id/status', [
  body('isActive')
    .isBoolean()
    .withMessage('Active status must be a boolean')
], handleValidationErrors, async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      message: 'Failed to update user status',
      error: 'UPDATE_USER_STATUS_ERROR'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (admin)
// @access  Private (Admin)
router.put('/users/:id/role', [
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Valid role is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      message: 'Failed to update user role',
      error: 'UPDATE_USER_ROLE_ERROR'
    });
  }
});

// ==================== ANALYTICS ====================

// @route   GET /api/admin/analytics
// @desc    Get analytics data (admin)
// @access  Private (Admin)
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get order statistics
    const orderStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ]);

    // Get revenue data
    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          'payment.status': 'paid'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get top selling products
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          name: '$product.name',
          totalSold: 1,
          totalRevenue: 1
        }
      }
    ]);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);

    // Get total counts
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          'payment.status': 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    res.json({
      orderStats,
      revenueData,
      topProducts,
      userStats: userStats[0] || { totalUsers: 0, activeUsers: 0 },
      totals: {
        orders: totalOrders,
        products: totalProducts,
        users: totalUsers,
        revenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      message: 'Failed to get analytics',
      error: 'GET_ANALYTICS_ERROR'
    });
  }
});

module.exports = router; 