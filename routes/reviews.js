const express = require('express');
const Review = require('../models/Review');
const Book = require('../models/Book');
const { authenticate } = require('../middleware/auth');
const { validateReviewCreation, validateReviewUpdate, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/books/:bookId/reviews
// @desc    Submit a review for a book
// @access  Private
router.post('/:bookId', authenticate, validateObjectId('bookId'), validateReviewCreation, async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { rating, comment } = req.body;

    // Check if book exists
    const book = await Book.findOne({ _id: bookId, isActive: true });
    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Check if user has already reviewed this book
    const existingReview = await Review.findOne({
      book: bookId,
      user: req.user._id,
      isActive: true
    });

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this book. Use PUT to update your review.'
      });
    }

    // Create new review
    const review = new Review({
      book: bookId,
      user: req.user._id,
      rating,
      comment
    });

    await review.save();

    // Populate user data
    await review.populate('user', 'username firstName lastName');

    res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully',
      data: {
        review
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Public
router.get('/:id', validateObjectId('id'), async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, isActive: true })
      .populate('user', 'username firstName lastName')
      .populate('book', 'title author');

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        review
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update your own review
// @access  Private
router.put('/:id', authenticate, validateObjectId('id'), validateReviewUpdate, async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, isActive: true });

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own reviews'
      });
    }

    // Update review
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'username firstName lastName')
     .populate('book', 'title author');

    res.status(200).json({
      status: 'success',
      message: 'Review updated successfully',
      data: {
        review: updatedReview
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete your own review
// @access  Private
router.delete('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, isActive: true });

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own reviews'
      });
    }

    // Soft delete
    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/reviews/user/me
// @desc    Get current user's reviews
// @access  Private
router.get('/user/me', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: req.user._id, isActive: true })
      .populate('book', 'title author genre averageRating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ user: req.user._id, isActive: true });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages,
          totalReviews: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/reviews/book/:bookId
// @desc    Get all reviews for a specific book
// @access  Public
router.get('/book/:bookId', validateObjectId('bookId'), async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if book exists
    const book = await Book.findOne({ _id: bookId, isActive: true });
    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Build sort object
    let sort = { createdAt: -1 }; // Default sort by newest first
    
    if (req.query.sortBy === 'rating') {
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sort = { rating: sortOrder, createdAt: -1 };
    }

    const reviews = await Review.find({ book: bookId, isActive: true })
      .populate('user', 'username firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ book: bookId, isActive: true });
    const totalPages = Math.ceil(total / limit);

    // Calculate rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { book: book._id, isActive: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        book: {
          _id: book._id,
          title: book.title,
          author: book.author,
          averageRating: book.averageRating,
          totalReviews: book.totalReviews
        },
        reviews,
        ratingDistribution: ratingStats,
        pagination: {
          currentPage: page,
          totalPages,
          totalReviews: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;