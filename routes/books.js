const express = require('express');
const Book = require('../models/Book');
const Review = require('../models/Review');
const { authenticate } = require('../middleware/auth');
const { validateBookCreation, validatePagination, validateSearch, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/books
// @desc    Add a new book
// @access  Private
router.post('/', authenticate, validateBookCreation, async (req, res, next) => {
  try {
    const bookData = {
      ...req.body,
      addedBy: req.user._id
    };

    const book = new Book(bookData);
    await book.save();

    // Populate the addedBy field
    await book.populate('addedBy', 'username firstName lastName');

    res.status(201).json({
      status: 'success',
      message: 'Book added successfully',
      data: {
        book
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/books
// @desc    Get all books with pagination and filters
// @access  Public
router.get('/', validatePagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };
    
    if (req.query.author) {
      filter.author = { $regex: req.query.author, $options: 'i' };
    }
    
    if (req.query.genre) {
      filter.genre = { $regex: req.query.genre, $options: 'i' };
    }

    // Build sort object
    let sort = { createdAt: -1 }; // Default sort by newest first
    
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      
      if (['title', 'author', 'genre', 'publishYear', 'averageRating', 'createdAt'].includes(sortField)) {
        sort = { [sortField]: sortOrder };
      }
    }

    // Execute query
    const books = await Book.find(filter)
      .populate('addedBy', 'username firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Book.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: 'success',
      data: {
        books,
        pagination: {
          currentPage: page,
          totalPages,
          totalBooks: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/books/search
// @desc    Search books by title or author
// @access  Public
router.get('/search', validateSearch, validatePagination, async (req, res, next) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }

    // Use text search if available, otherwise use regex
    const searchFilter = {
      isActive: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };

    const books = await Book.find(searchFilter)
      .populate('addedBy', 'username firstName lastName')
      .sort({ averageRating: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Book.countDocuments(searchFilter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: 'success',
      data: {
        books,
        searchQuery: q,
        pagination: {
          currentPage: page,
          totalPages,
          totalBooks: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/books/:id
// @desc    Get book details by ID with reviews
// @access  Public
router.get('/:id', validateObjectId('id'), validatePagination, async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isActive: true })
      .populate('addedBy', 'username firstName lastName');

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Get reviews with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ book: book._id, isActive: true })
      .populate('user', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments({ book: book._id, isActive: true });
    const totalReviewPages = Math.ceil(totalReviews / limit);

    res.status(200).json({
      status: 'success',
      data: {
        book,
        reviews,
        reviewsPagination: {
          currentPage: page,
          totalPages: totalReviewPages,
          totalReviews,
          hasNextPage: page < totalReviewPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/books/:id
// @desc    Update book details (only by the user who added it)
// @access  Private
router.put('/:id', authenticate, validateObjectId('id'), validateBookCreation, async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isActive: true });

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Check if user is the owner of the book
    if (book.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update books that you added'
      });
    }

    // Update book
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('addedBy', 'username firstName lastName');

    res.status(200).json({
      status: 'success',
      message: 'Book updated successfully',
      data: {
        book: updatedBook
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/books/:id
// @desc    Delete book (soft delete - only by the user who added it)
// @access  Private
router.delete('/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isActive: true });

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Check if user is the owner of the book
    if (book.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete books that you added'
      });
    }

    // Soft delete
    book.isActive = false;
    await book.save();

    res.status(200).json({
      status: 'success',
      message: 'Book deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;