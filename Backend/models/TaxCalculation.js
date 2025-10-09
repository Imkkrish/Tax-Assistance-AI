import mongoose from 'mongoose';

const taxCalculationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  financialYear: {
    type: String,
    required: [true, 'Financial year is required'],
    validate: {
      validator: function(fy) {
        return /^FY\d{4}-\d{2}$/.test(fy);
      },
      message: 'Financial year must be in format FY2023-24'
    }
  },
  taxRegime: {
    type: String,
    required: [true, 'Tax regime is required'],
    enum: {
      values: ['old', 'new'],
      message: 'Tax regime must be either old or new'
    }
  },
  inputData: {
    income: {
      salary: {
        type: Number,
        default: 0,
        min: [0, 'Salary cannot be negative']
      },
      houseProperty: {
        type: Number,
        default: 0,
        min: [0, 'House property income cannot be negative']
      },
      business: {
        type: Number,
        default: 0,
        min: [0, 'Business income cannot be negative']
      },
      capitalGains: {
        type: Number,
        default: 0,
        min: [0, 'Capital gains cannot be negative']
      },
      otherSources: {
        type: Number,
        default: 0,
        min: [0, 'Other sources income cannot be negative']
      }
    },
    deductions: {
      section80c: {
        type: Number,
        default: 0,
        min: [0, 'Section 80C deduction cannot be negative'],
        max: [150000, 'Section 80C deduction cannot exceed ₹1,50,000']
      },
      section80d: {
        type: Number,
        default: 0,
        min: [0, 'Section 80D deduction cannot be negative'],
        max: [50000, 'Section 80D deduction cannot exceed ₹50,000']
      },
      section24b: {
        type: Number,
        default: 0,
        min: [0, 'Section 24B deduction cannot be negative']
      },
      hra: {
        type: Number,
        default: 0,
        min: [0, 'HRA exemption cannot be negative']
      },
      lta: {
        type: Number,
        default: 0,
        min: [0, 'LTA exemption cannot be negative']
      },
      standardDeduction: {
        type: Number,
        default: 0,
        min: [0, 'Standard deduction cannot be negative']
      },
      other: {
        type: Number,
        default: 0,
        min: [0, 'Other deductions cannot be negative']
      }
    },
    taxPaid: {
      tds: {
        type: Number,
        default: 0,
        min: [0, 'TDS cannot be negative']
      },
      advanceTax: {
        type: Number,
        default: 0,
        min: [0, 'Advance tax cannot be negative']
      },
      selfAssessment: {
        type: Number,
        default: 0,
        min: [0, 'Self assessment tax cannot be negative']
      }
    }
  },
  calculationResults: {
    grossIncome: {
      type: Number,
      default: 0
    },
    totalDeductions: {
      type: Number,
      default: 0
    },
    taxableIncome: {
      type: Number,
      default: 0
    },
    taxSlabs: [{
      min: Number,
      max: Number,
      rate: Number,
      taxAmount: Number
    }],
    totalTax: {
      type: Number,
      default: 0
    },
    surcharge: {
      type: Number,
      default: 0
    },
    cess: {
      type: Number,
      default: 0
    },
    totalTaxLiability: {
      type: Number,
      default: 0
    },
    taxPaid: {
      type: Number,
      default: 0
    },
    balanceTax: {
      type: Number,
      default: 0
    },
    refund: {
      type: Number,
      default: 0
    }
  },
  regimeComparison: {
    oldRegime: {
      taxableIncome: Number,
      totalTax: Number,
      effectiveRate: Number
    },
    newRegime: {
      taxableIncome: Number,
      totalTax: Number,
      effectiveRate: Number
    },
    savings: Number,
    recommendedRegime: String
  },
  aiInsights: {
    recommendations: [String],
    riskFactors: [String],
    optimizationTips: [String],
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  status: {
    type: String,
    enum: ['draft', 'calculated', 'saved', 'filed'],
    default: 'draft'
  },
  source: {
    type: String,
    enum: ['manual', 'document_upload', 'ai_assisted'],
    default: 'manual'
  },
  metadata: {
    calculationMethod: {
      type: String,
      enum: ['standard', 'presumptive', 'advance'],
      default: 'standard'
    },
    residencyStatus: {
      type: String,
      enum: ['resident', 'non_resident', 'not_ordinary_resident'],
      default: 'resident'
    },
    ageGroup: {
      type: String,
      enum: ['below_60', '60_to_80', 'above_80'],
      default: 'below_60'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taxCalculationSchema.index({ user: 1, financialYear: 1 });
taxCalculationSchema.index({ status: 1 });
taxCalculationSchema.index({ createdAt: -1 });

// Virtual for total income
taxCalculationSchema.virtual('totalIncome').get(function() {
  const income = this.inputData.income;
  return (income.salary || 0) + (income.houseProperty || 0) +
         (income.business || 0) + (income.capitalGains || 0) +
         (income.otherSources || 0);
});

// Virtual for total deductions
taxCalculationSchema.virtual('totalDeductions').get(function() {
  const deductions = this.inputData.deductions;
  return (deductions.section80c || 0) + (deductions.section80d || 0) +
         (deductions.section24b || 0) + (deductions.hra || 0) +
         (deductions.lta || 0) + (deductions.standardDeduction || 0) +
         (deductions.other || 0);
});

// Pre-save middleware to calculate results
taxCalculationSchema.pre('save', function(next) {
  if (this.isModified('inputData') || this.isNew) {
    this.calculateTax();
  }
  next();
});

// Method to calculate tax based on regime
taxCalculationSchema.methods.calculateTax = function() {
  const income = this.inputData.income;
  const deductions = this.inputData.deductions;
  const taxPaid = this.inputData.taxPaid;

  // Calculate gross income
  const grossIncome = (income.salary || 0) + (income.houseProperty || 0) +
                     (income.business || 0) + (income.capitalGains || 0) +
                     (income.otherSources || 0);

  // Calculate total deductions
  const totalDeductions = (deductions.section80c || 0) + (deductions.section80d || 0) +
                         (deductions.section24b || 0) + (deductions.hra || 0) +
                         (deductions.lta || 0) + (deductions.standardDeduction || 0) +
                         (deductions.other || 0);

  // Calculate taxable income
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  // Calculate tax based on regime
  const taxCalculation = this.calculateTaxAmount(taxableIncome, this.taxRegime);

  // Calculate total tax paid
  const totalTaxPaid = (taxPaid.tds || 0) + (taxPaid.advanceTax || 0) +
                      (taxPaid.selfAssessment || 0);

  // Calculate balance
  const balanceTax = Math.max(0, taxCalculation.totalTaxLiability - totalTaxPaid);
  const refund = Math.max(0, totalTaxPaid - taxCalculation.totalTaxLiability);

  // Update calculation results
  this.calculationResults = {
    grossIncome,
    totalDeductions,
    taxableIncome,
    taxSlabs: taxCalculation.slabs,
    totalTax: taxCalculation.totalTax,
    surcharge: taxCalculation.surcharge,
    cess: taxCalculation.cess,
    totalTaxLiability: taxCalculation.totalTaxLiability,
    taxPaid: totalTaxPaid,
    balanceTax,
    refund
  };

  // Generate regime comparison if not already present
  if (!this.regimeComparison) {
    this.generateRegimeComparison(grossIncome, totalDeductions);
  }
};

// Helper method to calculate tax amount based on slabs
taxCalculationSchema.methods.calculateTaxAmount = function(taxableIncome, regime) {
  const slabs = regime === 'old' ? this.getOldRegimeSlabs() : this.getNewRegimeSlabs();
  let totalTax = 0;
  const taxSlabs = [];

  for (const slab of slabs) {
    if (taxableIncome > slab.min) {
      const taxableInSlab = Math.min(taxableIncome - slab.min, slab.max - slab.min);
      const taxAmount = taxableInSlab * (slab.rate / 100);
      totalTax += taxAmount;

      taxSlabs.push({
        min: slab.min,
        max: slab.max,
        rate: slab.rate,
        taxAmount
      });
    }
  }

  // Calculate surcharge (for income > ₹50 lakhs)
  let surcharge = 0;
  if (taxableIncome > 5000000) {
    surcharge = totalTax * 0.10; // 10% surcharge
  }

  // Calculate cess (4% on total tax + surcharge)
  const cess = (totalTax + surcharge) * 0.04;

  // Calculate total tax before rebate
  const totalTaxBeforeRebate = totalTax + surcharge + cess;
  
  // Section 87A Rebate (only for new regime)
  let rebate87A = 0;
  let qualifiesForRebate = false;
  if (regime === 'new' && taxableIncome <= 700000 && totalTaxBeforeRebate > 0) {
    rebate87A = Math.min(totalTaxBeforeRebate, 25000); // Full rebate up to 25,000
    qualifiesForRebate = true;
  }

  // Final tax liability after rebate
  const finalTaxLiability = Math.max(0, totalTaxBeforeRebate - rebate87A);

  return {
    slabs: taxSlabs,
    totalTax,
    surcharge,
    cess,
    totalTaxBeforeRebate,
    rebate87A,
    qualifiesForRebate,
    totalTaxLiability: finalTaxLiability
  };
};

// Get old regime tax slabs
taxCalculationSchema.methods.getOldRegimeSlabs = function() {
  return [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 5 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 }
  ];
};

// Get new regime tax slabs
taxCalculationSchema.methods.getNewRegimeSlabs = function() {
  return [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 600000, rate: 5 },
    { min: 600000, max: 900000, rate: 10 },
    { min: 900000, max: 1200000, rate: 15 },
    { min: 1200000, max: 1500000, rate: 20 },
    { min: 1500000, max: Infinity, rate: 30 }
  ];
};

// Generate regime comparison
taxCalculationSchema.methods.generateRegimeComparison = function(grossIncome, totalDeductions) {
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  const oldRegimeTax = this.calculateTaxAmount(taxableIncome, 'old');
  const newRegimeTax = this.calculateTaxAmount(taxableIncome, 'new');

  const oldEffectiveRate = taxableIncome > 0 ? (oldRegimeTax.totalTaxLiability / taxableIncome) * 100 : 0;
  const newEffectiveRate = taxableIncome > 0 ? (newRegimeTax.totalTaxLiability / taxableIncome) * 100 : 0;

  const savings = oldRegimeTax.totalTaxLiability - newRegimeTax.totalTaxLiability;
  const recommendedRegime = savings > 0 ? 'new' : 'old';

  this.regimeComparison = {
    oldRegime: {
      taxableIncome,
      totalTax: oldRegimeTax.totalTaxLiability,
      effectiveRate: oldEffectiveRate
    },
    newRegime: {
      taxableIncome,
      totalTax: newRegimeTax.totalTaxLiability,
      effectiveRate: newEffectiveRate
    },
    savings,
    recommendedRegime
  };
};

// Static method to get user's calculations
taxCalculationSchema.statics.getUserCalculations = function(userId, financialYear) {
  return this.find({ user: userId, financialYear })
    .sort({ createdAt: -1 });
};

const TaxCalculation = mongoose.model('TaxCalculation', taxCalculationSchema);

export default TaxCalculation;