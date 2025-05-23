const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book reference is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    minlength: [10, 'Review comment must be at least 10 characters long'],
    maxlength: [1000, 'Review comment cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per user per book
reviewSchema.index({ book: 1, user: 1 }, { unique: true });

// Index for common queries
reviewSchema.index({ book: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });

// Post-save middleware to update book's average rating
reviewSchema.post('save', async function() {
  const Book = mongoose.model('Book');
  const book = await Book.findById(this.book);
  if (book) {
    await book.calculateAverageRating();
  }
});

// Post-remove middleware to update book's average rating
reviewSchema.post('remove', async function() {
  const Book = mongoose.model('Book');
  const book = await Book.findById(this.book);
  if (book) {
    await book.calculateAverageRating();
  }
});

// Post-findOneAndDelete middleware to update book's average rating
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Book = mongoose.model('Book');
    const book = await Book.findById(doc.book);
    if (book) {
      await book.calculateAverageRating();
    }
  }
});

module.exports = mongoose.model('Review', reviewSchema);