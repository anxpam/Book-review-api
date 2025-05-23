📚 Book Review API
A comprehensive RESTful API built with Node.js and Express for managing a book review system. Features include user authentication, book management, review system, and advanced search capabilities.

🚀 Features

JWT Authentication - Secure user registration and login
Book Management - Add, view, and search books
Review System - Rate and review books with one review per user per book
Advanced Search - Search books by title or author (partial, case-insensitive)
Pagination - Efficient data loading with pagination support
Input Validation - Comprehensive validation using Joi
Security - CORS, Helmet, and secure password hashing
Error Handling - Centralized error handling with meaningful messages

🛠️ Tech Stack

Backend: Node.js, Express.js
Database: MongoDB
Authentication: JWT (JSON Web Tokens)

🔧 Installation & Setup
1. Clone the repository
git clone <repository-url>
2. Install dependencies
npm install
3. Environment Configuration
Create a .env file in the root directory:
envPORT=3000
NODE_ENV=development
JWT_SECRET=secret-jwt-key
JWT_EXPIRE=7d
MONGODB_URI=mongodb://localhost:27017/book_reviews
4. Start MongoDB
Make sure MongoDB is running on your system.
5. Run the application
npm run dev

# Production mode
npm start
The API will be available at http://localhost:3000
