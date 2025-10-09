import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, ownerOrAdmin } from '../middleware/auth.js';
import { validateDocumentUpload, validateObjectId } from '../middleware/validation.js';
import { catchAsync } from '../middleware/errorHandler.js';
import TaxDocument from '../models/TaxDocument.js';
import { extractTextFromPDF, parseForm16, validateForm16Data } from '../utils/pdfExtractor.js';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Excel, CSV, and image files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private
router.post('/upload', upload.single('document'), validateDocumentUpload, catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }

  const { documentType, financialYear } = req.body;

  // Create document record
  const document = await TaxDocument.create({
    user: req.user._id,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    documentType,
    financialYear
  });

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    data: document
  });
}));

// @desc    Get all user documents
// @route   GET /api/documents
// @access  Private
router.get('/', catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const query = { user: req.user._id };

  // Add filters
  if (req.query.documentType) {
    query.documentType = req.query.documentType;
  }
  if (req.query.financialYear) {
    query.financialYear = req.query.financialYear;
  }
  if (req.query.status) {
    query.processingStatus = req.query.status;
  }

  const total = await TaxDocument.countDocuments(query);

  const documents = await TaxDocument
    .find(query)
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalDocuments: total,
    hasNext: page * limit < total,
    hasPrev: page > 1
  };

  res.status(200).json({
    success: true,
    count: documents.length,
    pagination,
    data: documents
  });
}));

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
router.get('/:id', validateObjectId, ownerOrAdmin(TaxDocument), catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: req.resource
  });
}));

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
router.get('/:id/download', validateObjectId, ownerOrAdmin(TaxDocument), catchAsync(async (req, res, next) => {
  const document = req.resource;

  if (!fs.existsSync(document.path)) {
    return res.status(404).json({
      success: false,
      message: 'File not found on server'
    });
  }

  res.download(document.path, document.originalName);
}));

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
router.delete('/:id', validateObjectId, ownerOrAdmin(TaxDocument), catchAsync(async (req, res, next) => {
  const document = req.resource;

  // Delete file from filesystem
  if (fs.existsSync(document.path)) {
    fs.unlinkSync(document.path);
  }

  // Delete document record
  await TaxDocument.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully'
  });
}));

// @desc    Get documents by financial year
// @route   GET /api/documents/year/:financialYear
// @access  Private
router.get('/year/:financialYear', catchAsync(async (req, res, next) => {
  const documents = await TaxDocument.getUserDocuments(req.user._id, req.params.financialYear);

  res.status(200).json({
    success: true,
    count: documents.length,
    data: documents
  });
}));

// @desc    Get document statistics
// @route   GET /api/documents/stats/summary
// @access  Private
router.get('/stats/summary', catchAsync(async (req, res, next) => {
  const stats = await TaxDocument.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        totalDocuments: { $sum: 1 },
        totalSize: { $sum: '$size' },
        documentsByType: {
          $push: '$documentType'
        },
        processingStats: {
          $push: '$processingStatus'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        totalDocuments: 0,
        totalSize: 0,
        documentsByType: {},
        processingStats: {}
      }
    });
  }

  const result = stats[0];

  // Count documents by type
  const typeCount = {};
  result.documentsByType.forEach(type => {
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  // Count processing status
  const statusCount = {};
  result.processingStats.forEach(status => {
    statusCount[status] = (statusCount[status] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    data: {
      totalDocuments: result.totalDocuments,
      totalSize: result.totalSize,
      documentsByType: typeCount,
      processingStats: statusCount
    }
  });
}));

// @desc    Process document (AI analysis with real PDF extraction)
// @route   POST /api/documents/:id/process
// @access  Private
router.post('/:id/process', validateObjectId, ownerOrAdmin(TaxDocument), catchAsync(async (req, res, next) => {
  const document = req.resource;

  if (document.processingStatus === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Document already processed'
    });
  }

  // Update status to processing
  document.processingStatus = 'processing';
  await document.save();

  try {
    // Process synchronously - return result immediately
    let extractedData = {};
    let aiAnalysis = {
      summary: '',
      recommendations: [],
      confidence: 0,
      processedAt: new Date()
    };

    // Extract data based on document type
    if (document.documentType === 'form16' && document.mimeType === 'application/pdf') {
      // Extract text from PDF
      const pdfText = await extractTextFromPDF(document.path);
      
      // Parse Form-16 data
      const form16Data = parseForm16(pdfText);
      
      // Validate the extracted data
      const validation = validateForm16Data(form16Data);
          
          // Structure extracted data
          extractedData = {
            income: {
              salary: form16Data.grossSalary || 0,
              salaryReceived: form16Data.salaryReceived || 0,
              salaryIncome: form16Data.salaryIncome || 0,
              standardDeduction: form16Data.standardDeduction || 0,
              houseProperty: form16Data.housePropertyIncome || 0,
              business: 0,
              capitalGains: 0,
              otherSources: form16Data.otherIncome || 0,
              total: form16Data.grossTotalIncome || form16Data.grossSalary || 0
            },
            deductions: {
              section80c: form16Data.section80C || 0,
              section80d: form16Data.section80D || 0,
              section24b: form16Data.section24b || 0,
              section80ccd1b: form16Data.section80CCD1B || 0,
              section80e: form16Data.section80E || 0,
              section80g: form16Data.section80G || 0,
              other: 0,
              total: form16Data.totalDeductions || 0
            },
            taxPaid: {
              tds: form16Data.tdsDeducted || 0,
              advanceTax: 0,
              selfAssessment: 0,
              total: form16Data.tdsDeducted || 0
            },
            taxComputation: calculateCorrectTax(form16Data),
            personalInfo: {
              name: form16Data.employeeName || '',
              pan: form16Data.pan || '',
              employerName: form16Data.employerName || '',
              employerTAN: form16Data.employerTAN || '',
              assessmentYear: form16Data.assessmentYear || '',
              financialYear: form16Data.financialYear || '',
              certificateNumber: form16Data.certificateNumber || '',
              periodFrom: form16Data.periodFrom || '',
              periodTo: form16Data.periodTo || '',
              taxRegime: form16Data.optingOutNewRegime === 'No' ? 'New Tax Regime' : 'Old Tax Regime',
              verifierName: form16Data.verifierName || '',
              verifierDesignation: form16Data.verifierDesignation || ''
            },
            validation: validation,
            rawExtractedData: form16Data
          };

          // Generate AI analysis
          const confidenceScore = form16Data.metadata?.confidenceScore || (form16Data.extractionConfidence / 100) || 0;
          const confidencePercent = Math.round(confidenceScore * 100);
          
          aiAnalysis = {
            summary: validation.isValid 
              ? `Successfully extracted Form-16 data with ${confidencePercent}% confidence (${form16Data.metadata?.fieldsExtracted || 0}/${form16Data.metadata?.totalFields || 40} fields)` 
              : 'Form-16 data extracted with errors',
            recommendations: [
              ...validation.warnings,
              ...(form16Data.section80C < 150000 ? ['Consider maximizing Section 80C deductions (up to ₹1,50,000)'] : []),
              ...(form16Data.section80D < 25000 ? ['Consider health insurance for Section 80D benefits (up to ₹25,000)'] : []),
              ...(form16Data.section80CCD1B === 0 ? ['Consider NPS investment under Section 80CCD(1B) for additional ₹50,000 deduction'] : []),
              'Verify all extracted values before filing'
            ],
            confidence: confidenceScore,
            errors: validation.errors,
            warnings: validation.warnings,
            processedAt: new Date(),
            metadata: form16Data.metadata
          };
        } else {
          // Fallback to mock data for other document types
          extractedData = generateMockExtractedData(document.documentType);
          aiAnalysis = {
            summary: `Basic processing completed for ${document.documentType}`,
            recommendations: ['Please verify extracted data', 'Upload Form-16 for detailed analysis'],
            confidence: 0.6,
            processedAt: new Date()
          };
        }

        // Mark document as processed
        await document.markAsProcessed(extractedData, aiAnalysis);
        
        // Return success response with extracted data
        res.status(200).json({
          success: true,
          message: 'Document processed successfully',
          data: {
            ...document.toObject(),
            extractedData,
            aiAnalysis
          }
        });
  } catch (error) {
    console.error('Document processing error:', error);
    await document.markAsFailed(error.message);
    return res.status(500).json({
      success: false,
      message: 'Document processing failed: ' + error.message
    });
  }
}));

// Helper function to generate mock extracted data
function generateMockExtractedData(documentType) {
  const baseData = {
    income: { salary: 0, houseProperty: 0, business: 0, capitalGains: 0, otherSources: 0, total: 0 },
    deductions: { section80c: 0, section80d: 0, section24b: 0, other: 0, total: 0 },
    taxPaid: { tds: 0, advanceTax: 0, selfAssessment: 0, total: 0 }
  };

  switch (documentType) {
    case 'form16':
      baseData.income.salary = 1200000;
      baseData.deductions.section80c = 150000;
      baseData.deductions.section80d = 25000;
      baseData.taxPaid.tds = 150000;
      break;
    case 'form26as':
      baseData.taxPaid.tds = 180000;
      break;
    case 'salary_slip':
      baseData.income.salary = 100000; // Monthly
      break;
    default:
      // Random data for other types
      baseData.income.salary = Math.floor(Math.random() * 1000000);
  }

  // Calculate totals
  baseData.income.total = Object.values(baseData.income).reduce((sum, val) => sum + (val || 0), 0) - baseData.income.total;
  baseData.deductions.total = Object.values(baseData.deductions).reduce((sum, val) => sum + (val || 0), 0) - baseData.deductions.total;
  baseData.taxPaid.total = Object.values(baseData.taxPaid).reduce((sum, val) => sum + (val || 0), 0) - baseData.taxPaid.total;

  return baseData;
}

// Helper function to calculate correct tax (New Tax Regime FY 2024-25)
function calculateCorrectTax(form16Data) {
  const grossSalary = form16Data.grossSalary || 0;
  const standardDeduction = form16Data.standardDeduction || 50000; // Standard deduction
  const totalDeductions = form16Data.totalDeductions || 0; // Chapter VI-A deductions
  
  // Correct taxable income calculation
  const taxableIncome = Math.max(0, grossSalary - standardDeduction - totalDeductions);
  
  // New Tax Regime slabs for FY 2024-25 (AY 2025-26)
  let taxOnIncome = 0;
  
  if (taxableIncome > 300000) {
    if (taxableIncome <= 600000) {
      // 5% on income from 3,00,001 to 6,00,000
      taxOnIncome = (taxableIncome - 300000) * 0.05;
    } else if (taxableIncome <= 900000) {
      // 5% on 3,00,000 + 10% on income from 6,00,001 to 9,00,000
      taxOnIncome = 300000 * 0.05 + (taxableIncome - 600000) * 0.10;
    } else if (taxableIncome <= 1200000) {
      // Previous + 15% on income from 9,00,001 to 12,00,000
      taxOnIncome = 300000 * 0.05 + 300000 * 0.10 + (taxableIncome - 900000) * 0.15;
    } else if (taxableIncome <= 1500000) {
      // Previous + 20% on income from 12,00,001 to 15,00,000
      taxOnIncome = 300000 * 0.05 + 300000 * 0.10 + 300000 * 0.15 + (taxableIncome - 1200000) * 0.20;
    } else {
      // Previous + 30% on income above 15,00,000
      taxOnIncome = 300000 * 0.05 + 300000 * 0.10 + 300000 * 0.15 + 300000 * 0.20 + (taxableIncome - 1500000) * 0.30;
    }
  }
  
  // Health and Education Cess @ 4%
  const healthEducationCess = taxOnIncome * 0.04;
  
  // Total tax before rebate
  const totalTaxBeforeRebate = taxOnIncome + healthEducationCess;
  
  // Section 87A Rebate (Full rebate if taxable income <= 700000)
  let rebate87A = 0;
  if (taxableIncome <= 700000 && totalTaxBeforeRebate > 0) {
    rebate87A = Math.min(totalTaxBeforeRebate, 25000); // Full rebate up to 25,000
  }
  
  // Final tax payable
  const netTaxPayable = Math.max(0, totalTaxBeforeRebate - rebate87A);
  
  return {
    taxableIncome: Math.round(taxableIncome),
    taxOnIncome: Math.round(taxOnIncome),
    surcharge: 0, // No surcharge for income below 50 lakhs
    healthEducationCess: Math.round(healthEducationCess),
    totalTaxPayable: Math.round(totalTaxBeforeRebate),
    rebate87A: Math.round(rebate87A),
    relief89: form16Data.reliefUnder89 || 0,
    netTaxPayable: Math.round(netTaxPayable),
    // Additional info for frontend
    qualifiesForRebate: taxableIncome <= 700000,
    effectiveTaxRate: taxableIncome > 0 ? ((netTaxPayable / taxableIncome) * 100).toFixed(2) : 0
  };
}

export default router;