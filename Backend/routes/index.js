import express from 'express';
import auth from './auth.js';
import taxCalculations from './taxCalculations.js';
import documents from './documents.js';
import ai from './ai.js';
import enhancedTax from './enhancedTax.js';

const router = express.Router();

// Mount routes
router.use('/auth', auth);
router.use('/tax-calculations', taxCalculations);
router.use('/documents', documents);
router.use('/ai', ai);
router.use('/enhanced-tax', enhancedTax);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler for API routes
router.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

export default router;