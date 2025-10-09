// Tax calculation utilities for Indian Income Tax

// Tax slabs for Old Regime (FY 2024-25)
export const oldRegimeSlabs = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 }
]

// Tax slabs for New Regime (FY 2024-25)
export const newRegimeSlabs = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 600000, rate: 5 },
  { min: 600000, max: 900000, rate: 10 },
  { min: 900000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 }
]

// Standard deduction amount
export const STANDARD_DEDUCTION = 50000

// Calculate tax based on slabs
export const calculateTaxBySlabs = (taxableIncome, slabs) => {
  let tax = 0
  let breakdown = []
  
  for (const slab of slabs) {
    if (taxableIncome <= slab.min) break
    
    const taxableInThisSlab = Math.min(taxableIncome, slab.max) - slab.min
    const taxInThisSlab = (taxableInThisSlab * slab.rate) / 100
    
    if (taxableInThisSlab > 0) {
      tax += taxInThisSlab
      breakdown.push({
        range: `₹${slab.min.toLocaleString('en-IN')} - ${slab.max === Infinity ? 'Above' : '₹' + slab.max.toLocaleString('en-IN')}`,
        rate: slab.rate,
        taxableAmount: taxableInThisSlab,
        tax: taxInThisSlab
      })
    }
  }
  
  return { tax: Math.round(tax), breakdown }
}

// Calculate tax for old regime
export const calculateOldRegimeTax = (income, deductions) => {
  const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0)
  const taxableIncome = Math.max(0, income - STANDARD_DEDUCTION - totalDeductions)
  
  const result = calculateTaxBySlabs(taxableIncome, oldRegimeSlabs)
  
  // Add health and education cess (4%)
  const cess = Math.round(result.tax * 0.04)
  const totalTax = result.tax + cess
  
  return {
    taxableIncome,
    tax: result.tax,
    cess,
    totalTax,
    breakdown: result.breakdown,
    deductionsUsed: totalDeductions
  }
}

// Calculate tax for new regime (with Section 87A rebate)
export const calculateNewRegimeTax = (income, otherDeductions = 0) => {
  const taxableIncome = Math.max(0, income - STANDARD_DEDUCTION - otherDeductions)
  
  const result = calculateTaxBySlabs(taxableIncome, newRegimeSlabs)
  
  // Add health and education cess (4%)
  const cess = Math.round(result.tax * 0.04)
  const totalTaxBeforeRebate = result.tax + cess
  
  // Section 87A Rebate (Full rebate if taxable income <= 700000)
  let rebate87A = 0
  let qualifiesForRebate = false
  if (taxableIncome <= 700000 && totalTaxBeforeRebate > 0) {
    rebate87A = Math.min(totalTaxBeforeRebate, 25000) // Full rebate up to 25,000
    qualifiesForRebate = true
  }
  
  // Final tax after rebate
  const finalTax = Math.max(0, totalTaxBeforeRebate - rebate87A)
  
  return {
    taxableIncome,
    tax: result.tax,
    cess,
    totalTaxBeforeRebate,
    rebate87A,
    qualifiesForRebate,
    totalTax: finalTax,
    breakdown: result.breakdown,
    deductionsUsed: otherDeductions
  }
}

// Compare both regimes and return recommendation
export const compareTaxRegimes = (income, deductions) => {
  const oldRegime = calculateOldRegimeTax(income, deductions)
  const newRegime = calculateNewRegimeTax(income, 0) // New regime doesn't allow most deductions
  
  const savings = oldRegime.totalTax - newRegime.totalTax
  const recommended = savings > 0 ? 'new' : 'old'
  
  return {
    oldRegime,
    newRegime,
    savings: Math.abs(savings),
    recommended,
    savingsPercentage: oldRegime.totalTax > 0 ? Math.round((Math.abs(savings) / oldRegime.totalTax) * 100) : 0,
    rebateMessage: newRegime.qualifiesForRebate ? `🎉 New Regime: You qualify for Section 87A rebate! Tax reduced from ₹${newRegime.totalTaxBeforeRebate.toLocaleString()} to ₹${newRegime.totalTax.toLocaleString()}` : null
  }
}

// Validate PAN number format
export const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan)
}

// Format currency in Indian format
export const formatCurrency = (amount) => {
  return `₹${amount.toLocaleString('en-IN')}`
}

// Extract data from Form 16 text (basic implementation)
export const extractForm16Data = (text) => {
  const data = {
    employeeName: '',
    employerName: '',
    pan: '',
    assessmentYear: '',
    grossSalary: 0,
    standardDeduction: STANDARD_DEDUCTION,
    totalDeductions: 0,
    taxableIncome: 0,
    taxDeducted: 0
  }
  
  // Extract PAN
  const panMatch = text.match(/PAN\s*:?\s*([A-Z]{5}[0-9]{4}[A-Z]{1})/i)
  if (panMatch) data.pan = panMatch[1]
  
  // Extract employee name (basic pattern)
  const nameMatch = text.match(/Employee\s*Name\s*:?\s*([A-Z\s]+)/i)
  if (nameMatch) data.employeeName = nameMatch[1].trim()
  
  // Extract gross salary (basic pattern)
  const salaryMatch = text.match(/Gross\s*Salary\s*:?\s*Rs?\.?\s*([0-9,]+)/i)
  if (salaryMatch) {
    data.grossSalary = parseInt(salaryMatch[1].replace(/,/g, ''))
  }
  
  // Extract tax deducted
  const tdsMatch = text.match(/Tax\s*Deducted\s*:?\s*Rs?\.?\s*([0-9,]+)/i)
  if (tdsMatch) {
    data.taxDeducted = parseInt(tdsMatch[1].replace(/,/g, ''))
  }
  
  return data
}

// Common deduction suggestions
export const getDeductionSuggestions = (income, currentDeductions) => {
  const suggestions = []
  
  if (!currentDeductions.section80C || currentDeductions.section80C < 150000) {
    suggestions.push({
      section: '80C',
      title: 'Section 80C Deductions',
      description: 'PPF, ELSS, Life Insurance, Home Loan Principal',
      maxLimit: 150000,
      currentAmount: currentDeductions.section80C || 0,
      potentialSaving: Math.min(150000 - (currentDeductions.section80C || 0), income * 0.3)
    })
  }
  
  if (!currentDeductions.section80D || currentDeductions.section80D < 25000) {
    suggestions.push({
      section: '80D',
      title: 'Health Insurance Premium',
      description: 'Medical insurance for self and family',
      maxLimit: 25000,
      currentAmount: currentDeductions.section80D || 0,
      potentialSaving: Math.min(25000 - (currentDeductions.section80D || 0), income * 0.3)
    })
  }
  
  if (!currentDeductions.homeLoanInterest || currentDeductions.homeLoanInterest < 200000) {
    suggestions.push({
      section: '24(b)',
      title: 'Home Loan Interest',
      description: 'Interest paid on home loan',
      maxLimit: 200000,
      currentAmount: currentDeductions.homeLoanInterest || 0,
      potentialSaving: Math.min(200000 - (currentDeductions.homeLoanInterest || 0), income * 0.3)
    })
  }
  
  return suggestions
}