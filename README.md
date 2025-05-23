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

📊 Database Schema
User Schema
javascript{
  username: String ,
  email: String ,
  password: String ,
  firstName: String ,
  lastName: String ,
  timestamps: true
}
Book Schema
javascript{
  title: String ,
  author: String ,
  genre: String ,
  description: String ,
  publishedYear: Number ,
  pages: Number ,
  language: String ,
  addedBy: ObjectId ,
  averageRating: Number ,
  totalReviews: Number ,
  timestamps: true
}
Review Schema
javascript{
  book: ObjectId ,
  user: ObjectId ,
  rating: Number ,
  comment: String ,
  timestamps: true
}


Example API Requests:

Base URL
http://localhost:3000/api
1. Authentication Endpoints
Register a New User
POST /auth/signup

Postman:
Method: POST
URL: http://localhost:3000/api/auth/signup
Headers: Content-Type: application/json
Body (raw JSON):
json{
  "username": "johnsmith",
  "email": "john@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Smith"
}

Login User
POST /auth/login

Postman:
Method: POST
URL: http://localhost:3000/api/auth/login
Headers: Content-Type: application/json
Body (raw JSON):
json{
  "email": "john@example.com",
  "password": "Password123"
}

Get Current User Profile
GET /auth/me

Postman:
Method: GET
URL: http://localhost:3000/api/auth/me
Headers: Authorization: Bearer YOUR_JWT_TOKEN


2. Book Endpoints
Add a New Book (Authenticated)
POST /books

Postman:
Method: POST
URL: http://localhost:3000/api/books
Headers:
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN


Body (raw JSON):
json{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "genre": "Classic Literature",
  "description": "A classic American novel set in the Jazz Age, exploring themes of wealth, love, idealism, and moral decay in the American Dream.",
  "publishYear": 1925,
  "isbn": "978-0-7432-7356-5",
  "pages": 180,
  "language": "English"
}

Get All Books (with pagination)
GET /books

Postman:
Method: GET
URL: http://localhost:3000/api/books?page=1&limit=10
No authentication required


Get All Books with Filters
GET /books (with filters)

Postman:
Method: GET
URL: http://localhost:3000/api/books?author=Fitzgerald&genre=Classic&page=1&limit=5&sortBy=averageRating&sortOrder=desc


Get Book Details by ID
GET /books/:id

Postman:
Method: GET
URL: http://localhost:3000/api/books/BOOK_ID_HERE?reviewPage=1&reviewLimit=5


Search Books
GET /search

Postman:
Method: GET
URL: http://localhost:3000/api/search?q=gatsby&page=1&limit=10


3. Review Endpoints
Submit a Review (Authenticated)
POST /books/:id/reviews

Postman:
Method: POST
URL: http://localhost:3000/api/books/BOOK_ID_HERE/reviews
Headers:

Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

Body (raw JSON):
json{
  "rating": 5,
  "comment": "This is an absolutely brilliant novel that captures the essence of the American Dream and its contradictions. Fitzgerald's prose is beautiful and the characters are unforgettable."
}

Update Your Review (Authenticated)
PUT /reviews/:id

Postman:
Method: PUT
URL: http://localhost:3000/api/reviews/REVIEW_ID_HERE
Headers:
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

Body (raw JSON):
json{
  "rating": 4,
  "comment": "Upon re-reading, I still think this is a great novel, though I noticed some pacing issues in the middle chapters. Still highly recommended for its beautiful prose and themes."
}

Delete Your Review (Authenticated)
DELETE /reviews/:id

Postman:
Method: DELETE
URL: http://localhost:3000/api/reviews/REVIEW_ID_HERE
Headers: Authorization: Bearer YOUR_JWT_TOKEN



Note:
Replace YOUR_JWT_TOKEN with the actual token received from login/signup
Replace BOOK_ID_HERE and REVIEW_ID_HERE with actual MongoDB ObjectIds