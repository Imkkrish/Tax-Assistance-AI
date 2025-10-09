import mongoose from 'mongoose';

const taxDocumentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    enum: {
      values: [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ],
      message: 'Unsupported file type'
    }
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    max: [10 * 1024 * 1024, 'File size cannot exceed 10MB'] // 10MB limit
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  documentType: {
    type: String,
    required: [true, 'Document type is required'],
    enum: {
      values: [
        'form16',
        'form26as',
        'salary_slip',
        'bank_statement',
        'investment_proof',
        'rent_receipt',
        'medical_bill',
        'donation_receipt',
        'insurance_premium',
        'education_fee',
        'other'
      ],
      message: 'Invalid document type'
    }
  },
  financialYear: {
    type: String,
    required: [true, 'Financial year is required'],
    validate: {
      validator: function(fy) {
        return /^FY\d{4}-\d{2}$/.test(fy); // Format: FY2023-24
      },
      message: 'Financial year must be in format FY2023-24'
    }
  },
  extractedData: {
    income: {
      salary: Number,
      houseProperty: Number,
      business: Number,
      capitalGains: Number,
      otherSources: Number,
      total: Number
    },
    deductions: {
      section80c: Number,
      section80d: Number,
      section24b: Number,
      other: Number,
      total: Number
    },
    taxPaid: {
      tds: Number,
      advanceTax: Number,
      selfAssessment: Number,
      total: Number
    }
  },
  processingStatus: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  },
  processingError: String,
  aiAnalysis: {
    summary: String,
    recommendations: [String],
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    processedAt: Date
  },
  metadata: {
    uploadSource: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    },
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taxDocumentSchema.index({ user: 1, financialYear: 1 });
taxDocumentSchema.index({ documentType: 1 });
taxDocumentSchema.index({ processingStatus: 1 });
taxDocumentSchema.index({ createdAt: -1 });

// Virtual for file URL
taxDocumentSchema.virtual('fileUrl').get(function() {
  return `/api/documents/${this._id}/download`;
});

// Pre-save middleware to calculate totals
taxDocumentSchema.pre('save', function(next) {
  if (this.extractedData) {
    // Calculate income total
    if (this.extractedData.income) {
      const income = this.extractedData.income;
      income.total = (income.salary || 0) + (income.houseProperty || 0) +
                    (income.business || 0) + (income.capitalGains || 0) +
                    (income.otherSources || 0);
    }

    // Calculate deductions total
    if (this.extractedData.deductions) {
      const deductions = this.extractedData.deductions;
      deductions.total = (deductions.section80c || 0) + (deductions.section80d || 0) +
                        (deductions.section24b || 0) + (deductions.other || 0);
    }

    // Calculate tax paid total
    if (this.extractedData.taxPaid) {
      const taxPaid = this.extractedData.taxPaid;
      taxPaid.total = (taxPaid.tds || 0) + (taxPaid.advanceTax || 0) +
                     (taxPaid.selfAssessment || 0);
    }
  }
  next();
});

// Static method to get user's documents by financial year
taxDocumentSchema.statics.getUserDocuments = function(userId, financialYear) {
  return this.find({ user: userId, financialYear })
    .sort({ createdAt: -1 });
};

// Instance method to mark as processed
taxDocumentSchema.methods.markAsProcessed = function(extractedData, aiAnalysis) {
  this.processingStatus = 'completed';
  this.extractedData = extractedData;
  this.aiAnalysis = {
    ...aiAnalysis,
    processedAt: new Date()
  };
  return this.save();
};

// Instance method to mark as failed
taxDocumentSchema.methods.markAsFailed = function(error) {
  this.processingStatus = 'failed';
  this.processingError = error;
  return this.save();
};

const TaxDocument = mongoose.model('TaxDocument', taxDocumentSchema);

export default TaxDocument;