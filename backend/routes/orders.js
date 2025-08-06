const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shippingAddress.firstName')
    .notEmpty()
    .withMessage('First name is required'),
  body('shippingAddress.lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  body('shippingAddress.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('shippingAddress.street')
    .notEmpty()
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .notEmpty()
    .withMessage('State is required'),
  body('shippingAddress.zipCode')
    .notEmpty()
    .withMessage('Zip code is required'),
  body('shippingAddress.country')
    .notEmpty()
    .withMessage('Country is required'),
  body('billingAddress')
    .isObject()
    .withMessage('Billing address is required'),
  body('paymentMethod')
    .isIn(['stripe', 'paypal', 'cash_on_delivery'])
    .withMessage('Valid payment method is required'),
  body('notes.customer')
    .optional()
    .isString()
    .withMessage('Customer notes must be a string')
];

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

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: req.user._id };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);
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
    console.error('Get orders error:', error);
    res.status(500).json({
      message: 'Failed to get orders',
      error: 'GET_ORDERS_ERROR'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('items.product', 'name images category');

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
        error: 'ORDER_NOT_FOUND'
      });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      message: 'Failed to get order',
      error: 'GET_ORDER_ERROR'
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', createOrderValidation, handleValidationErrors, authenticateToken, async (req, res) => {
  try {
    const {
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes
    } = req.body;

    // Get user's cart
    const cart = await Cart.findOrCreateForUser(req.user._id);
    
    if (cart.isEmpty) {
      return res.status(400).json({
        message: 'Cart is empty',
        error: 'EMPTY_CART'
      });
    }

    // Validate cart items and check inventory
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(400).json({
          message: `Product ${item.name} no longer exists`,
          error: 'PRODUCT_NOT_FOUND'
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          message: `Product ${item.name} is not available`,
          error: 'PRODUCT_UNAVAILABLE'
        });
      }

      if (product.inventory.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient inventory for ${item.name}`,
          error: 'INSUFFICIENT_INVENTORY',
          product: item.name,
          available: product.inventory.quantity
        });
      }

      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: item.product,
        name: item.name || product.name,
        sku: item.sku || product.sku,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal,
        variant: item.variant
      });
    }

    // Calculate totals
    const tax = subtotal * 0.085; // 8.5% tax
    const shippingCost = subtotal >= 50 ? 0 : 5.99;
    const discountAmount = cart.discount.amount || 0;
    const total = subtotal + tax + shippingCost - discountAmount;

    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      subtotal,
      tax,
      shipping: {
        cost: shippingCost,
        method: shippingCost === 0 ? 'free' : 'standard'
      },
      discount: cart.discount,
      total,
      payment: {
        method: paymentMethod,
        amount: total,
        currency: 'USD'
      },
      shippingAddress,
      billingAddress,
      notes
    });

    // Process payment based on method
    if (paymentMethod === 'stripe') {
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          orderId: order._id.toString(),
          userId: req.user._id.toString()
        }
      });

      order.payment.transactionId = paymentIntent.id;
      order.payment.status = 'pending';
    } else if (paymentMethod === 'cash_on_delivery') {
      order.payment.status = 'pending';
    } else {
      // For PayPal, you would integrate PayPal API here
      order.payment.status = 'pending';
    }

    await order.save();

    // Update inventory
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'inventory.quantity': -item.quantity }
      });
    }

    // Clear cart after successful order
    await cart.clearCart();

    // Populate order details
    await order.populate('items.product', 'name images category');

    res.status(201).json({
      message: 'Order created successfully',
      order,
      paymentIntent: paymentMethod === 'stripe' ? {
        clientSecret: paymentIntent.client_secret
      } : null
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      message: 'Failed to create order',
      error: 'CREATE_ORDER_ERROR'
    });
  }
});

// @route   POST /api/orders/:id/confirm-payment
// @desc    Confirm payment for order
// @access  Private
router.post('/:id/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
        error: 'ORDER_NOT_FOUND'
      });
    }

    if (order.payment.status === 'paid') {
      return res.status(400).json({
        message: 'Order is already paid',
        error: 'ORDER_ALREADY_PAID'
      });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      order.payment.status = 'paid';
      order.status = 'confirmed';
      await order.save();

      res.json({
        message: 'Payment confirmed successfully',
        order
      });
    } else {
      res.status(400).json({
        message: 'Payment not completed',
        error: 'PAYMENT_INCOMPLETE'
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      message: 'Failed to confirm payment',
      error: 'CONFIRM_PAYMENT_ERROR'
    });
  }
});

// @route   POST /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
        error: 'ORDER_NOT_FOUND'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        message: 'Order is already cancelled',
        error: 'ORDER_ALREADY_CANCELLED'
      });
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({
        message: 'Cannot cancel shipped or delivered order',
        error: 'ORDER_CANNOT_BE_CANCELLED'
      });
    }

    // Cancel payment if it was made
    if (order.payment.status === 'paid' && order.payment.transactionId) {
      try {
        await stripe.refunds.create({
          payment_intent: order.payment.transactionId
        });
        order.payment.status = 'refunded';
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
      }
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    await order.save();

    // Restore inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'inventory.quantity': item.quantity }
      });
    }

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      message: 'Failed to cancel order',
      error: 'CANCEL_ORDER_ERROR'
    });
  }
});

// @route   POST /api/orders/create-payment-intent
// @desc    Create Stripe payment intent
// @access  Private
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Valid amount is required',
        error: 'INVALID_AMOUNT'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd'
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      message: 'Failed to create payment intent',
      error: 'CREATE_PAYMENT_INTENT_ERROR'
    });
  }
});

module.exports = router; 