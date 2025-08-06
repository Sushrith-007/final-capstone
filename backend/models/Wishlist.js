const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
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
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items count
wishlistSchema.virtual('totalItems').get(function() {
  return this.items.length;
});

// Virtual for is empty
wishlistSchema.virtual('isEmpty').get(function() {
  return this.items.length === 0;
});

// Index for user queries
wishlistSchema.index({ user: 1 });

// Method to add item to wishlist
wishlistSchema.methods.addItem = function(productId, notes = '') {
  const existingItem = this.items.find(item => 
    item.product.toString() === productId.toString()
  );

  if (!existingItem) {
    this.items.push({
      product: productId,
      notes: notes,
      addedAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove item from wishlist
wishlistSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => 
    item.product.toString() !== productId.toString()
  );
  return this.save();
};

// Method to clear wishlist
wishlistSchema.methods.clearWishlist = function() {
  this.items = [];
  return this.save();
};

// Method to update item notes
wishlistSchema.methods.updateItemNotes = function(productId, notes) {
  const item = this.items.find(item => 
    item.product.toString() === productId.toString()
  );

  if (item) {
    item.notes = notes;
    return this.save();
  }
  return Promise.reject(new Error('Item not found in wishlist'));
};

// Method to check if item exists in wishlist
wishlistSchema.methods.hasItem = function(productId) {
  return this.items.some(item => 
    item.product.toString() === productId.toString()
  );
};

// Static method to find or create wishlist for user
wishlistSchema.statics.findOrCreateForUser = function(userId) {
  return this.findOne({ user: userId })
    .populate('items.product')
    .then(wishlist => {
      if (wishlist) {
        return wishlist;
      }
      return this.create({ user: userId });
    });
};

// Static method to get wishlist with populated products
wishlistSchema.statics.getUserWishlist = function(userId) {
  return this.findOne({ user: userId })
    .populate({
      path: 'items.product',
      select: 'name price images category status inventory'
    });
};

module.exports = mongoose.model('Wishlist', wishlistSchema); 