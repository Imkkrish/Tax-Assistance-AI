import express from 'express';
import { protect } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';
import { computeTax, validateTaxInput } from '../utils/enhancedTaxCalculator.js';
import { generateDeductionSuggestions, getInvestmentDeadlines } from '../utils/deductionSuggestions.js';
import { crossFieldValidation, validatePAN, checkDocumentConsistency } from '../utils/advancedValidation.js';

const router = express.Router();

// Note: Routes are public for tax calculations, no authentication required
// This allows anonymous users to use the tax calculator

// @desc    Enhanced tax calculation and comparison
// @route   POST /api/enhanced-tax/calculate
// @access  Public
router.post('/calculate', catchAsync(async (req, res, next) => {
  // Validate input
  const validationErrors = validateTaxInput(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: validationErrors
    });
  }

  // Compute tax
  const result = computeTax(req.body);

  res.status(200).json({
    success: true,
    data: result
  });
}));

// @desc    Compare tax regimes (old vs new)
// @route   POST /api/enhanced-tax/compare-regimes
// @access  Public
router.post('/compare-regimes', catchAsync(async (req, res, next) => {
  const { income = {}, deductions = {}, grossSalary } = req.body;

  // Support both nested (income.salary) and flat (grossSalary) formats
  const totalSalary = grossSalary || income.salary || 0;
  const totalIncome = totalSalary + (income.houseProperty || 0) + (income.business || 0) + (income.otherSources || 0);

  // Handle capital gains separately
  const capitalGainsList = [];
  if (income.capitalGains > 0) {
    capitalGainsList.push({
      type: 'ltcg',
      asset: 'equity',
      amount: income.capitalGains
    });
  }

  // Extract common deductions with support for both naming conventions
  const payload = {
    grossSalary: totalIncome,
    standardDeduction: deductions.standardDeduction || 50000, // Standard for FY 2024-25
    chapter6ADeductions: (deductions.section80c || 0) + (deductions.section80d || 0) + (deductions.other || 0),
    otherDeductions: deductions.section24b || deductions.homeLoanInterest || 0,
    employerNPS: deductions.employerNPS || 0,
    interestSavings: deductions.interestSavings || 0,
    interestFD: deductions.interestFD || 0,
    isSenior: deductions.isSenior || false,
    capitalGains: capitalGainsList,
    hasVDA: deductions.hasVDA || false
  };

  const result = computeTax(payload);

  // Enhanced response with full transparency
  res.status(200).json({
    success: true,
    data: {
      // Summary
      recommendedRegime: result.comparison.recommended,
      savings: result.comparison.savings,
      savingsPercentage: result.comparison.savingsPercentage,
      rebateMessage: result.comparison.rebateMessage,
      itrForm: result.itrForm,
      
      // Income & Deduction Summary
      grossIncome: payload.grossSalary,
      totalDeductions: payload.chapter6ADeductions + payload.otherDeductions + payload.employerNPS,
      
      // Old Regime - Full Breakdown
      oldRegime: {
        taxableIncome: result.taxable.taxableOld,
        deductionsUsed: result.oldRegime.deductionsUsed,
        slabTax: result.oldRegime.slabTax,
        slabBreakdown: result.oldRegime.slabBreakdown,
        capitalGainsTax: result.oldRegime.capitalGainsTax,
        tax: result.oldRegime.taxBeforeCess,
        cess: result.oldRegime.cess,
        taxBeforeRebate: result.oldRegime.taxBeforeRebate,
        totalTax: result.oldRegime.taxBeforeRebate, // For backward compatibility
        rebate87A: result.oldRegime.rebate,
        qualifiesForRebate: result.oldRegime.qualifiesForRebate,
        rebateThreshold: result.oldRegime.rebateThreshold,
        rebateCap: result.oldRegime.rebateCap,
        totalTaxBeforeRebate: result.oldRegime.taxBeforeRebate,
        finalTaxPayable: result.oldRegime.finalTaxPayable
      },
      
      // New Regime - Full Breakdown
      newRegime: {
        taxableIncome: result.taxable.taxableNew,
        deductionsUsed: result.newRegime.deductionsUsed,
        slabTax: result.newRegime.slabTax,
        slabBreakdown: result.newRegime.slabBreakdown,
        capitalGainsTax: result.newRegime.capitalGainsTax,
        tax: result.newRegime.taxBeforeCess,
        cess: result.newRegime.cess,
        taxBeforeRebate: result.newRegime.taxBeforeRebate,
        totalTax: result.newRegime.taxBeforeRebate, // For backward compatibility
        rebate87A: result.newRegime.rebate,
        qualifiesForRebate: result.newRegime.qualifiesForRebate,
        rebateThreshold: result.newRegime.rebateThreshold,
        rebateCap: result.newRegime.rebateCap,
        totalTaxBeforeRebate: result.newRegime.taxBeforeRebate,
        finalTaxPayable: result.newRegime.finalTaxPayable
      },
      
      // Input Summary
      inputs: result.inputs,
      
      // Capital Gains Detail
      capitalGains: result.capitalGains
    }
  });
}));

// @desc    Calculate tax from Form-16 data
// @route   POST /api/enhanced-tax/from-form16
// @access  Public
router.post('/from-form16', catchAsync(async (req, res, next) => {
  const { extractedData } = req.body;

  if (!extractedData) {
    return res.status(400).json({
      success: false,
      message: 'Extracted data is required'
    });
  }

  // Map Form-16 data to tax calculator format
  const payload = {
    grossSalary: extractedData.income?.salary || 0,
    standardDeduction: extractedData.income?.standardDeduction || 50000,
    chapter6ADeductions: extractedData.deductions?.total || 0,
    otherDeductions: 0,
    employerNPS: 0,
    interestSavings: 0,
    interestFD: 0,
    isSenior: false,
    capitalGains: [],
    hasVDA: false
  };

  const result = computeTax(payload);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Tax calculated from Form-16 data'
  });
}));

// @desc    Get tax optimization suggestions
// @route   POST /api/enhanced-tax/suggestions
// @access  Public
router.post('/suggestions', catchAsync(async (req, res, next) => {
  const { 
    grossSalary, 
    currentDeductions = {},
    age,
    hasHealthInsurance,
    hasHomeLoan,
    isRenting,
    cityType,
    hasParents,
    parentsAge
  } = req.body;

  if (!grossSalary || grossSalary <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid gross salary is required'
    });
  }

  // Generate personalized suggestions
  const suggestions = generateDeductionSuggestions({
    grossSalary,
    currentDeductions,
    age,
    hasHealthInsurance,
    hasHomeLoan,
    isRenting,
    cityType,
    hasParents,
    parentsAge
  });

  // Get investment deadlines
  const deadlines = getInvestmentDeadlines();

  res.status(200).json({
    success: true,
    data: {
      ...suggestions,
      deadlines,
      generatedAt: new Date().toISOString()
    }
  });
}));

// @desc    Validate form data
// @route   POST /api/enhanced-tax/validate
// @access  Public
router.post('/validate', catchAsync(async (req, res, next) => {
  const { formData, form16Data, previousYearData } = req.body;

  if (!formData) {
    return res.status(400).json({
      success: false,
      message: 'Form data is required'
    });
  }

  // Perform cross-field validation
  const validationResult = crossFieldValidation(formData);

  // Check PAN if provided
  let panValidation = null;
  if (formData.pan) {
    panValidation = validatePAN(formData.pan);
  }

  // Check document consistency if Form-16 data provided
  let consistencyCheck = null;
  if (form16Data) {
    consistencyCheck = checkDocumentConsistency(form16Data, formData);
  }

  res.status(200).json({
    success: true,
    data: {
      validation: validationResult,
      panValidation,
      consistencyCheck,
      overallStatus: validationResult.isValid && (panValidation ? panValidation.isValid : true) ? 'valid' : 'invalid'
    }
  });
}));

export default router;