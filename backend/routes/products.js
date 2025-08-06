const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation rules
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Product category is required'),
  body('inventory.quantity')
    .isInt({ min: 0 })
    .withMessage('Inventory quantity must be a non-negative integer')
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

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      order = 'desc',
      featured,
      inStock
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    if (inStock === 'true') {
      filter['inventory.quantity'] = { $gt: 0 };
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
      .limit(parseInt(limit))
      .select('name price images category rating inventory featured status');

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      message: 'Failed to get products',
      error: 'GET_PRODUCTS_ERROR'
    });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.findFeatured()
      .limit(parseInt(limit))
      .select('name price images category rating featured');

    res.json({ products });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      message: 'Failed to get featured products',
      error: 'GET_FEATURED_PRODUCTS_ERROR'
    });
  }
});

// @route   GET /api/products/categories
// @desc    Get all product categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { status: 'active' });
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      message: 'Failed to get categories',
      error: 'GET_CATEGORIES_ERROR'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    if (product.status !== 'active' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      message: 'Failed to get product',
      error: 'GET_PRODUCT_ERROR'
    });
  }
});

// @route   POST /api/products
// @desc    Create a new product (admin only)
// @access  Private (Admin)
router.post('/', authenticateToken, requireAdmin, productValidation, handleValidationErrors, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      message: 'Failed to create product',
      error: 'CREATE_PRODUCT_ERROR'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product (admin only)
// @access  Private (Admin)
router.put('/:id', authenticateToken, requireAdmin, productValidation, handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      message: 'Failed to update product',
      error: 'UPDATE_PRODUCT_ERROR'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      message: 'Failed to delete product',
      error: 'DELETE_PRODUCT_ERROR'
    });
  }
});

// @route   POST /api/products/:id/images
// @desc    Upload product images (admin only)
// @access  Private (Admin)
router.post('/:id/images', authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'No images uploaded',
        error: 'NO_IMAGES'
      });
    }

    // Add new images to product
    const newImages = req.files.map((file, index) => ({
      url: `/uploads/products/${file.filename}`,
      alt: req.body.alt || `Product image ${index + 1}`,
      isPrimary: index === 0 && product.images.length === 0 // First image is primary if no existing images
    }));

    product.images.push(...newImages);
    await product.save();

    res.json({
      message: 'Images uploaded successfully',
      images: newImages
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      message: 'Failed to upload images',
      error: 'UPLOAD_IMAGES_ERROR'
    });
  }
});

// @route   DELETE /api/products/:id/images/:imageId
// @desc    Delete product image (admin only)
// @access  Private (Admin)
router.delete('/:id/images/:imageId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    const imageIndex = product.images.findIndex(img => img._id.toString() === req.params.imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({
        message: 'Image not found',
        error: 'IMAGE_NOT_FOUND'
      });
    }

    // Remove image from array
    product.images.splice(imageIndex, 1);

    // If we removed the primary image and there are other images, make the first one primary
    if (product.images.length > 0 && !product.images.some(img => img.isPrimary)) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    res.json({
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      message: 'Failed to delete image',
      error: 'DELETE_IMAGE_ERROR'
    });
  }
});

// @route   PUT /api/products/:id/images/:imageId/primary
// @desc    Set image as primary (admin only)
// @access  Private (Admin)
router.put('/:id/images/:imageId/primary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    // Reset all images to not primary
    product.images.forEach(img => {
      img.isPrimary = false;
    });

    // Set the specified image as primary
    const image = product.images.find(img => img._id.toString() === req.params.imageId);
    
    if (!image) {
      return res.status(404).json({
        message: 'Image not found',
        error: 'IMAGE_NOT_FOUND'
      });
    }

    image.isPrimary = true;
    await product.save();

    res.json({
      message: 'Primary image updated successfully'
    });
  } catch (error) {
    console.error('Set primary image error:', error);
    res.status(500).json({
      message: 'Failed to set primary image',
      error: 'SET_PRIMARY_IMAGE_ERROR'
    });
  }
});

module.exports = router; 