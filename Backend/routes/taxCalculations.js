import express from 'express';
import { protect, ownerOrAdmin } from '../middleware/auth.js';
import { validateTaxCalculation, validateObjectId, validateFinancialYear } from '../middleware/validation.js';
import { catchAsync } from '../middleware/errorHandler.js';
import TaxCalculation from '../models/TaxCalculation.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get all tax calculations for user
// @route   GET /api/tax-calculations
// @access  Private
router.get('/', catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const total = await TaxCalculation.countDocuments({ user: req.user._id });

  const calculations = await TaxCalculation
    .find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalCalculations: total,
    hasNext: page * limit < total,
    hasPrev: page > 1
  };

  res.status(200).json({
    success: true,
    count: calculations.length,
    pagination,
    data: calculations
  });
}));

// @desc    Get single tax calculation
// @route   GET /api/tax-calculations/:id
// @access  Private
router.get('/:id', validateObjectId, ownerOrAdmin(TaxCalculation), catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: req.resource
  });
}));

// @desc    Create new tax calculation
// @route   POST /api/tax-calculations
// @access  Private
router.post('/', validateTaxCalculation, catchAsync(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user._id;

  const calculation = await TaxCalculation.create(req.body);

  res.status(201).json({
    success: true,
    data: calculation
  });
}));

// @desc    Update tax calculation
// @route   PUT /api/tax-calculations/:id
// @access  Private
router.put('/:id', validateObjectId, ownerOrAdmin(TaxCalculation), validateTaxCalculation, catchAsync(async (req, res, next) => {
  const calculation = await TaxCalculation.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: calculation
  });
}));

// @desc    Delete tax calculation
// @route   DELETE /api/tax-calculations/:id
// @access  Private
router.delete('/:id', validateObjectId, ownerOrAdmin(TaxCalculation), catchAsync(async (req, res, next) => {
  await TaxCalculation.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Tax calculation deleted successfully'
  });
}));

// @desc    Get calculations by financial year
// @route   GET /api/tax-calculations/year/:financialYear
// @access  Private
router.get('/year/:financialYear', validateFinancialYear, catchAsync(async (req, res, next) => {
  const calculations = await TaxCalculation.getUserCalculations(req.user._id, req.params.financialYear);

  res.status(200).json({
    success: true,
    count: calculations.length,
    data: calculations
  });
}));

// @desc    Compare tax regimes
// @route   POST /api/tax-calculations/compare
// @access  Private
router.post('/compare', catchAsync(async (req, res, next) => {
  const { income, deductions, taxPaid, financialYear } = req.body;

  // Create temporary calculations for both regimes
  const oldRegimeCalc = new TaxCalculation({
    user: req.user._id,
    financialYear: financialYear || 'FY2024-25',
    taxRegime: 'old',
    inputData: { income, deductions, taxPaid }
  });

  const newRegimeCalc = new TaxCalculation({
    user: req.user._id,
    financialYear: financialYear || 'FY2024-25',
    taxRegime: 'new',
    inputData: { income, deductions, taxPaid }
  });

  // Calculate for both regimes
  oldRegimeCalc.calculateTax();
  newRegimeCalc.calculateTax();

  // Generate comparison
  const comparison = {
    oldRegime: {
      taxableIncome: oldRegimeCalc.calculationResults.taxableIncome,
      totalTax: oldRegimeCalc.calculationResults.totalTaxLiability,
      effectiveRate: oldRegimeCalc.calculationResults.taxableIncome > 0
        ? (oldRegimeCalc.calculationResults.totalTaxLiability / oldRegimeCalc.calculationResults.taxableIncome) * 100
        : 0
    },
    newRegime: {
      taxableIncome: newRegimeCalc.calculationResults.taxableIncome,
      totalTax: newRegimeCalc.calculationResults.totalTaxLiability,
      effectiveRate: newRegimeCalc.calculationResults.taxableIncome > 0
        ? (newRegimeCalc.calculationResults.totalTaxLiability / newRegimeCalc.calculationResults.taxableIncome) * 100
        : 0
    },
    savings: oldRegimeCalc.calculationResults.totalTaxLiability - newRegimeCalc.calculationResults.totalTaxLiability,
    recommendedRegime: (oldRegimeCalc.calculationResults.totalTaxLiability - newRegimeCalc.calculationResults.totalTaxLiability) > 0 ? 'new' : 'old'
  };

  res.status(200).json({
    success: true,
    data: comparison
  });
}));

// @desc    Get tax calculation statistics
// @route   GET /api/tax-calculations/stats/summary
// @access  Private
router.get('/stats/summary', catchAsync(async (req, res, next) => {
  const stats = await TaxCalculation.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        totalCalculations: { $sum: 1 },
        avgTaxableIncome: { $avg: '$calculationResults.taxableIncome' },
        avgTaxLiability: { $avg: '$calculationResults.totalTaxLiability' },
        totalSavings: {
          $sum: {
            $cond: [
              { $eq: ['$regimeComparison.recommendedRegime', 'new'] },
              '$regimeComparison.savings',
              0
            ]
          }
        },
        regimePreference: {
          $addToSet: '$regimeComparison.recommendedRegime'
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalCalculations: 0,
    avgTaxableIncome: 0,
    avgTaxLiability: 0,
    totalSavings: 0,
    regimePreference: []
  };

  res.status(200).json({
    success: true,
    data: result
  });
}));

// @desc    Save calculation as draft
// @route   POST /api/tax-calculations/:id/draft
// @access  Private
router.post('/:id/draft', validateObjectId, ownerOrAdmin(TaxCalculation), catchAsync(async (req, res, next) => {
  const calculation = await TaxCalculation.findByIdAndUpdate(
    req.params.id,
    { status: 'draft' },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: calculation
  });
}));

// @desc    Mark calculation as filed
// @route   POST /api/tax-calculations/:id/file
// @access  Private
router.post('/:id/file', validateObjectId, ownerOrAdmin(TaxCalculation), catchAsync(async (req, res, next) => {
  const calculation = await TaxCalculation.findByIdAndUpdate(
    req.params.id,
    { status: 'filed' },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: calculation
  });
}));

export default router;