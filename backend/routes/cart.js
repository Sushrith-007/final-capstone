const express = require('express');
const { body, validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const addToCartValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('variant')
    .optional()
    .isObject()
    .withMessage('Variant must be an object')
];

const updateQuantityValidation = [
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer')
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

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOrCreateForUser(req.user._id);
    
    // Populate product details for each item
    await cart.populate('items.product', 'name price images category inventory status');

    res.json({ cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      message: 'Failed to get cart',
      error: 'GET_CART_ERROR'
    });
  }
});

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', addToCartValidation, handleValidationErrors, authenticateToken, async (req, res) => {
  try {
    const { productId, quantity, variant } = req.body;

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    if (product.status !== 'active') {
      return res.status(400).json({
        message: 'Product is not available',
        error: 'PRODUCT_UNAVAILABLE'
      });
    }

    // Check inventory
    if (product.inventory.quantity < quantity) {
      return res.status(400).json({
        message: 'Insufficient inventory',
        error: 'INSUFFICIENT_INVENTORY',
        available: product.inventory.quantity
      });
    }

    // Get or create cart
    const cart = await Cart.findOrCreateForUser(req.user._id);

    // Add item to cart
    await cart.addItem(productId, quantity, product.price, variant);

    // Populate product details
    await cart.populate('items.product', 'name price images category inventory status');

    res.json({
      message: 'Item added to cart successfully',
      cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      message: 'Failed to add item to cart',
      error: 'ADD_TO_CART_ERROR'
    });
  }
});

// @route   PUT /api/cart/:productId
// @desc    Update item quantity in cart
// @access  Private
router.put('/:productId', updateQuantityValidation, handleValidationErrors, authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, variant } = req.body;

    // Get cart
    const cart = await Cart.findOrCreateForUser(req.user._id);

    // Check if product exists in cart
    const cartItem = cart.items.find(item => 
      item.product.toString() === productId &&
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (!cartItem) {
      return res.status(404).json({
        message: 'Item not found in cart',
        error: 'ITEM_NOT_FOUND'
      });
    }

    // Check inventory if increasing quantity
    if (quantity > cartItem.quantity) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          message: 'Product not found',
          error: 'PRODUCT_NOT_FOUND'
        });
      }

      const additionalQuantity = quantity - cartItem.quantity;
      if (product.inventory.quantity < additionalQuantity) {
        return res.status(400).json({
          message: 'Insufficient inventory',
          error: 'INSUFFICIENT_INVENTORY',
          available: product.inventory.quantity
        });
      }
    }

    // Update quantity
    await cart.updateItemQuantity(productId, quantity, variant);

    // Populate product details
    await cart.populate('items.product', 'name price images category inventory status');

    res.json({
      message: 'Cart updated successfully',
      cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      message: 'Failed to update cart',
      error: 'UPDATE_CART_ERROR'
    });
  }
});

// @route   DELETE /api/cart/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { variant } = req.query;

    // Get cart
    const cart = await Cart.findOrCreateForUser(req.user._id);

    // Remove item
    await cart.removeItem(productId, variant ? JSON.parse(variant) : null);

    // Populate product details
    await cart.populate('items.product', 'name price images category inventory status');

    res.json({
      message: 'Item removed from cart successfully',
      cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      message: 'Failed to remove item from cart',
      error: 'REMOVE_FROM_CART_ERROR'
    });
  }
});

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOrCreateForUser(req.user._id);
    await cart.clearCart();

    res.json({
      message: 'Cart cleared successfully',
      cart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      message: 'Failed to clear cart',
      error: 'CLEAR_CART_ERROR'
    });
  }
});

// @route   POST /api/cart/apply-discount
// @desc    Apply discount code to cart
// @access  Private
router.post('/apply-discount', [
  body('code')
    .notEmpty()
    .withMessage('Discount code is required'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('type')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be percentage or fixed')
], handleValidationErrors, authenticateToken, async (req, res) => {
  try {
    const { code, amount, type = 'fixed' } = req.body;

    // Get cart
    const cart = await Cart.findOrCreateForUser(req.user._id);

    // Apply discount
    await cart.applyDiscount(code, amount, type);

    // Populate product details
    await cart.populate('items.product', 'name price images category inventory status');

    res.json({
      message: 'Discount applied successfully',
      cart
    });
  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(500).json({
      message: 'Failed to apply discount',
      error: 'APPLY_DISCOUNT_ERROR'
    });
  }
});

// @route   DELETE /api/cart/remove-discount
// @desc    Remove discount from cart
// @access  Private
router.delete('/remove-discount', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOrCreateForUser(req.user._id);
    await cart.removeDiscount();

    // Populate product details
    await cart.populate('items.product', 'name price images category inventory status');

    res.json({
      message: 'Discount removed successfully',
      cart
    });
  } catch (error) {
    console.error('Remove discount error:', error);
    res.status(500).json({
      message: 'Failed to remove discount',
      error: 'REMOVE_DISCOUNT_ERROR'
    });
  }
});

// @route   GET /api/cart/count
// @desc    Get cart item count
// @access  Private
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOrCreateForUser(req.user._id);
    
    res.json({
      count: cart.totalItems
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      message: 'Failed to get cart count',
      error: 'GET_CART_COUNT_ERROR'
    });
  }
});

module.exports = router; 