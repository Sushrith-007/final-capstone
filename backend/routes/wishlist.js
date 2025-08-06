const express = require('express');
const { body, validationResult } = require('express-validator');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const addToWishlistValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
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

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.getUserWishlist(req.user._id);
    
    if (!wishlist) {
      // Create empty wishlist if it doesn't exist
      const newWishlist = await Wishlist.create({ user: req.user._id });
      return res.json({ wishlist: newWishlist });
    }

    res.json({ wishlist });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      message: 'Failed to get wishlist',
      error: 'GET_WISHLIST_ERROR'
    });
  }
});

// @route   POST /api/wishlist
// @desc    Add item to wishlist
// @access  Private
router.post('/', addToWishlistValidation, handleValidationErrors, authenticateToken, async (req, res) => {
  try {
    const { productId, notes } = req.body;

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

    // Get or create wishlist
    const wishlist = await Wishlist.findOrCreateForUser(req.user._id);

    // Check if item already exists in wishlist
    if (wishlist.hasItem(productId)) {
      return res.status(400).json({
        message: 'Item already exists in wishlist',
        error: 'ITEM_ALREADY_EXISTS'
      });
    }

    // Add item to wishlist
    await wishlist.addItem(productId, notes);

    // Populate product details
    await wishlist.populate('items.product', 'name price images category rating featured');

    res.json({
      message: 'Item added to wishlist successfully',
      wishlist
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      message: 'Failed to add item to wishlist',
      error: 'ADD_TO_WISHLIST_ERROR'
    });
  }
});

// @route   DELETE /api/wishlist/:productId
// @desc    Remove item from wishlist
// @access  Private
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    // Get wishlist
    const wishlist = await Wishlist.findOrCreateForUser(req.user._id);

    // Check if item exists in wishlist
    if (!wishlist.hasItem(productId)) {
      return res.status(404).json({
        message: 'Item not found in wishlist',
        error: 'ITEM_NOT_FOUND'
      });
    }

    // Remove item
    await wishlist.removeItem(productId);

    // Populate product details
    await wishlist.populate('items.product', 'name price images category rating featured');

    res.json({
      message: 'Item removed from wishlist successfully',
      wishlist
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      message: 'Failed to remove item from wishlist',
      error: 'REMOVE_FROM_WISHLIST_ERROR'
    });
  }
});

// @route   DELETE /api/wishlist
// @desc    Clear wishlist
// @access  Private
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOrCreateForUser(req.user._id);
    await wishlist.clearWishlist();

    res.json({
      message: 'Wishlist cleared successfully',
      wishlist
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      message: 'Failed to clear wishlist',
      error: 'CLEAR_WISHLIST_ERROR'
    });
  }
});

// @route   PUT /api/wishlist/:productId/notes
// @desc    Update item notes in wishlist
// @access  Private
router.put('/:productId/notes', [
  body('notes')
    .isString()
    .withMessage('Notes must be a string')
], handleValidationErrors, authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { notes } = req.body;

    // Get wishlist
    const wishlist = await Wishlist.findOrCreateForUser(req.user._id);

    // Check if item exists in wishlist
    if (!wishlist.hasItem(productId)) {
      return res.status(404).json({
        message: 'Item not found in wishlist',
        error: 'ITEM_NOT_FOUND'
      });
    }

    // Update notes
    await wishlist.updateItemNotes(productId, notes);

    // Populate product details
    await wishlist.populate('items.product', 'name price images category rating featured');

    res.json({
      message: 'Notes updated successfully',
      wishlist
    });
  } catch (error) {
    console.error('Update wishlist notes error:', error);
    res.status(500).json({
      message: 'Failed to update notes',
      error: 'UPDATE_WISHLIST_NOTES_ERROR'
    });
  }
});

// @route   GET /api/wishlist/count
// @desc    Get wishlist item count
// @access  Private
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOrCreateForUser(req.user._id);
    
    res.json({
      count: wishlist.totalItems
    });
  } catch (error) {
    console.error('Get wishlist count error:', error);
    res.status(500).json({
      message: 'Failed to get wishlist count',
      error: 'GET_WISHLIST_COUNT_ERROR'
    });
  }
});

// @route   GET /api/wishlist/check/:productId
// @desc    Check if product is in wishlist
// @access  Private
router.get('/check/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOrCreateForUser(req.user._id);
    const isInWishlist = wishlist.hasItem(productId);

    res.json({
      isInWishlist
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      message: 'Failed to check wishlist',
      error: 'CHECK_WISHLIST_ERROR'
    });
  }
});

// @route   POST /api/wishlist/:productId/move-to-cart
// @desc    Move item from wishlist to cart
// @access  Private
router.post('/:productId/move-to-cart', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    // Get wishlist
    const wishlist = await Wishlist.findOrCreateForUser(req.user._id);

    // Check if item exists in wishlist
    if (!wishlist.hasItem(productId)) {
      return res.status(404).json({
        message: 'Item not found in wishlist',
        error: 'ITEM_NOT_FOUND'
      });
    }

    // Check if product exists and is available
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

    // Import Cart model here to avoid circular dependency
    const Cart = require('../models/Cart');

    // Add to cart
    const cart = await Cart.findOrCreateForUser(req.user._id);
    await cart.addItem(productId, quantity, product.price);

    // Remove from wishlist
    await wishlist.removeItem(productId);

    // Populate both cart and wishlist
    await cart.populate('items.product', 'name price images category inventory status');
    await wishlist.populate('items.product', 'name price images category rating featured');

    res.json({
      message: 'Item moved to cart successfully',
      cart,
      wishlist
    });
  } catch (error) {
    console.error('Move to cart error:', error);
    res.status(500).json({
      message: 'Failed to move item to cart',
      error: 'MOVE_TO_CART_ERROR'
    });
  }
});

module.exports = router; 