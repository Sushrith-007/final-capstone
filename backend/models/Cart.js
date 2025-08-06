const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    variant: {
      name: String,
      value: String
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  subtotal: {
    type: Number,
    default: 0,
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  shipping: {
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative']
    },
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'free'],
      default: 'standard'
    }
  },
  discount: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative']
    },
    code: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    }
  },
  total: {
    type: Number,
    default: 0,
    min: [0, 'Total cannot be negative']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for is empty
cartSchema.virtual('isEmpty').get(function() {
  return this.items.length === 0;
});

// Index for user queries
cartSchema.index({ user: 1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.calculateTotals();
  this.lastUpdated = new Date();
  next();
});

// Method to calculate cart totals
cartSchema.methods.calculateTotals = function() {
  // Calculate subtotal
  this.subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Calculate tax (example: 8.5% tax rate)
  this.tax = this.subtotal * 0.085;

  // Calculate shipping (example: free shipping over $50)
  if (this.subtotal >= 50) {
    this.shipping.cost = 0;
    this.shipping.method = 'free';
  } else {
    this.shipping.cost = 5.99; // Standard shipping cost
    this.shipping.method = 'standard';
  }

  // Apply discount
  let discountAmount = 0;
  if (this.discount.amount > 0) {
    if (this.discount.type === 'percentage') {
      discountAmount = (this.subtotal * this.discount.amount) / 100;
    } else {
      discountAmount = this.discount.amount;
    }
  }

  // Calculate total
  this.total = this.subtotal + this.tax + this.shipping.cost - discountAmount;
  
  // Ensure total is not negative
  if (this.total < 0) {
    this.total = 0;
  }
};

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity = 1, price, variant = null) {
  const existingItem = this.items.find(item => 
    item.product.toString() === productId.toString() &&
    JSON.stringify(item.variant) === JSON.stringify(variant)
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.price = price; // Update price in case it changed
  } else {
    this.items.push({
      product: productId,
      quantity: quantity,
      price: price,
      variant: variant,
      addedAt: new Date()
    });
  }

  this.calculateTotals();
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity, variant = null) {
  const item = this.items.find(item => 
    item.product.toString() === productId.toString() &&
    JSON.stringify(item.variant) === JSON.stringify(variant)
  );

  if (item) {
    if (quantity <= 0) {
      this.items = this.items.filter(item => 
        !(item.product.toString() === productId.toString() &&
          JSON.stringify(item.variant) === JSON.stringify(variant))
      );
    } else {
      item.quantity = quantity;
    }
    this.calculateTotals();
    return this.save();
  }
  return Promise.reject(new Error('Item not found in cart'));
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId, variant = null) {
  this.items = this.items.filter(item => 
    !(item.product.toString() === productId.toString() &&
      JSON.stringify(item.variant) === JSON.stringify(variant))
  );
  this.calculateTotals();
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.calculateTotals();
  return this.save();
};

// Method to apply discount
cartSchema.methods.applyDiscount = function(code, amount, type = 'fixed') {
  this.discount.code = code;
  this.discount.amount = amount;
  this.discount.type = type;
  this.calculateTotals();
  return this.save();
};

// Method to remove discount
cartSchema.methods.removeDiscount = function() {
  this.discount.code = null;
  this.discount.amount = 0;
  this.calculateTotals();
  return this.save();
};

// Static method to find or create cart for user
cartSchema.statics.findOrCreateForUser = function(userId) {
  return this.findOne({ user: userId })
    .populate('items.product')
    .then(cart => {
      if (cart) {
        return cart;
      }
      return this.create({ user: userId });
    });
};

module.exports = mongoose.model('Cart', cartSchema); 