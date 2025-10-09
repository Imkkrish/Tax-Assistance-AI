import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
export const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    // Removed strict password requirements for development
    // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    // .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('pan')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN number format'),

  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid phone number format'),

  handleValidationErrors
];

// User login validation
export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// Tax calculation validation
export const validateTaxCalculation = [
  body('financialYear')
    .matches(/^FY\d{4}-\d{2}$/)
    .withMessage('Financial year must be in format FY2023-24'),

  body('taxRegime')
    .isIn(['old', 'new'])
    .withMessage('Tax regime must be either old or new'),

  body('inputData.income.salary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number'),

  body('inputData.income.houseProperty')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('House property income must be a positive number'),

  body('inputData.income.business')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Business income must be a positive number'),

  body('inputData.income.capitalGains')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Capital gains must be a positive number'),

  body('inputData.deductions.section80c')
    .optional()
    .isFloat({ min: 0, max: 150000 })
    .withMessage('Section 80C deduction must be between 0 and 150,000'),

  body('inputData.deductions.section80d')
    .optional()
    .isFloat({ min: 0, max: 50000 })
    .withMessage('Section 80D deduction must be between 0 and 50,000'),

  handleValidationErrors
];

// Document upload validation
export const validateDocumentUpload = [
  body('documentType')
    .isIn([
      'form16', 'form26as', 'salary_slip', 'bank_statement',
      'investment_proof', 'rent_receipt', 'medical_bill',
      'donation_receipt', 'insurance_premium', 'education_fee', 'other'
    ])
    .withMessage('Invalid document type'),

  body('financialYear')
    .matches(/^FY\d{4}-\d{2}$/)
    .withMessage('Financial year must be in format FY2023-24'),

  handleValidationErrors
];

// AI query validation
export const validateAIQuery = [
  body('query')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Query must be between 1 and 1000 characters'),

  body('queryType')
    .isIn([
      'tax_calculation_help', 'deduction_guidance', 'document_analysis',
      'regime_comparison', 'filing_assistance', 'general_tax_info',
      'compliance_check', 'investment_advice'
    ])
    .withMessage('Invalid query type'),

  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required'),

  handleValidationErrors
];

// Parameter validation for ID
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),

  handleValidationErrors
];

// Query parameter validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors
];

// Financial year validation
export const validateFinancialYear = [
  param('financialYear')
    .matches(/^FY\d{4}-\d{2}$/)
    .withMessage('Financial year must be in format FY2023-24'),

  handleValidationErrors
];

// Password reset validation
export const validatePasswordReset = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    // Removed strict password requirements for development
    // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    // .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  handleValidationErrors
];

// Profile update validation
export const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid phone number format'),

  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),

  body('profile.occupation')
    .optional()
    .isIn(['salaried', 'business', 'professional', 'retired', 'student', 'other'])
    .withMessage('Invalid occupation'),

  handleValidationErrors
];