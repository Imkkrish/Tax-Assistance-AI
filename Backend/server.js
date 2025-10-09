import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import routes from './routes/index.js';
import { errorHandler, handleUncaughtExceptions, handleUnhandledRejections } from './middleware/errorHandler.js';

// Handle uncaught exceptions
handleUncaughtExceptions();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const defaultOrigins = ['http://localhost:3000', 'http://localhost:5174'];
const allowedOrigins = [process.env.FRONTEND_URL, ...defaultOrigins].filter(Boolean);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting (relaxed for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per windowMs (very high for development)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development' // Skip in development
});
app.use('/api/', limiter);

// Stricter rate limiting for auth routes (relaxed for development)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 auth requests per windowMs (very high for development)
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  skip: () => process.env.NODE_ENV === 'development' // Skip in development
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle unhandled promise rejections
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5174'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.NODE_ENV === 'production' ? 'Production DB' : 'Development DB'}`);
});

handleUnhandledRejections(server);

export default app;