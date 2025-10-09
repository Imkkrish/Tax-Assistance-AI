// Enhanced Tax Calculator - Production Ready
// Computes Indian Income Tax for FY 2024-25 (AY 2025-26)
// Handles Old/New regime, Section 87A rebate, Capital Gains, ITR selection

/**
 * Round to 2 decimal places and ensure non-negative
 * @param {number} x - Number to round
 * @returns {number} - Rounded number (never negative)
 */
function round2(x) { 
  const rounded = Math.round((x || 0) * 100) / 100;
  return Math.max(0, rounded); 
}

/**
 * Safe percentage calculation to avoid NaN
 * @param {number} numerator - Top value
 * @param {number} denominator - Bottom value
 * @returns {number} - Percentage (0-100)
 */
function safePercentage(numerator, denominator) {
  if (!denominator || denominator <= 0) return 0;
  return Math.round((Math.abs(numerator) / denominator) * 100);
}

// Slab calculation helper
function slabTax(amount, slabs) {
  let remaining = amount;
  let prev = 0;
  let tax = 0;
  const breakdown = [];
  
  for (const s of slabs) {
    const cap = s.upTo === Infinity ? Infinity : s.upTo;
    const slabAmount = Math.max(0, Math.min(remaining, cap - prev));
    
    if (slabAmount > 0) {
      const slabTax = slabAmount * s.rate;
      tax += slabTax;
      remaining -= slabAmount;
      
      breakdown.push({
        range: `₹${prev.toLocaleString()} - ${cap === Infinity ? 'Above' : '₹' + cap.toLocaleString()}`,
        rate: `${(s.rate * 100)}%`,
        taxableAmount: slabAmount,
        tax: slabTax
      });
    }
    
    prev = cap;
    if (remaining <= 0) break;
  }
  
  return { tax, breakdown };
}

// Capital gains handler
function capitalGainsTax(capitalGains = []) {
  let tax = 0;
  let breakdown = [];
  
  for (const g of capitalGains) {
    if (g.type === 'stcg') {
      // Equity STCG (with STT) -> 15%
      const rate = (g.asset === 'equity') ? 0.15 : (g.rate || 0.15);
      const t = g.amount * rate;
      tax += t;
      breakdown.push({
        desc: `STCG ${g.asset}`,
        amount: g.amount,
        rate,
        tax: t
      });
    } else if (g.type === 'ltcg') {
      if (g.asset === 'equity') {
        breakdown.push({
          desc: `LTCG equity`,
          amount: g.amount,
          rateHint: '10% on amount >₹1,00,000'
        });
      } else {
        const rate = g.rate || 0.20;
        const t = g.amount * rate;
        tax += t;
        breakdown.push({
          desc: `LTCG ${g.asset}`,
          amount: g.amount,
          rate,
          tax: t
        });
      }
    }
  }
  
  return { tax, breakdown };
}

// Aggregate LTCG on equity (10% above ₹1,00,000)
function aggregateLTCGEquity(capitalGains) {
  const ltcgEquity = capitalGains
    .filter(g => g.type === 'ltcg' && g.asset === 'equity')
    .reduce((s, g) => s + g.amount, 0);
  
  const exempt = 100000;
  const taxable = Math.max(0, ltcgEquity - exempt);
  const tax = taxable * 0.10;
  
  return { ltcgEquity, taxable, tax };
}

// Main tax computation function
function computeTax(payload) {
  const {
    grossSalary = 0,
    standardDeduction = 50000,
    otherDeductions = 0,
    chapter6ADeductions = 0,
    employerNPS = 0,
    interestSavings = 0,
    interestFD = 0,
    isSenior = false,
    capitalGains = [],
    hasVDA = false
  } = payload;

  // Interest exemptions
  let savingsExempt = 0;
  if (isSenior) {
    // 80TTB: up to ₹50,000 for seniors on interest
    savingsExempt = Math.min(50000, interestSavings + interestFD);
  } else {
    // 80TTA: up to ₹10,000 for non-seniors on savings interest
    savingsExempt = Math.min(10000, interestSavings);
  }

  const taxableInterest = Math.max(0, (interestSavings + interestFD) - savingsExempt);

  // Capital gains processing
  const cgResult = capitalGainsTax(capitalGains);
  const ltcgEquityAgg = aggregateLTCGEquity(capitalGains);
  const capitalGainsTaxTotal = cgResult.tax + ltcgEquityAgg.tax;

  // OLD REGIME CALCULATION
  const oldDeductions = standardDeduction + chapter6ADeductions + otherDeductions + savingsExempt + employerNPS;
  const taxableOld = Math.max(0, grossSalary - oldDeductions) + taxableInterest;
  
  const oldSlabs = [
    { upTo: 250000, rate: 0 },
    { upTo: 500000, rate: 0.05 },
    { upTo: 1000000, rate: 0.20 },
    { upTo: Infinity, rate: 0.30 }
  ];
  
  const oldSlabResult = slabTax(taxableOld, oldSlabs);
  const taxOldBeforeCess = oldSlabResult.tax + capitalGainsTaxTotal;
  const cessOld = taxOldBeforeCess * 0.04;
  const taxOldBeforeRebate = taxOldBeforeCess + cessOld;
  
  // Section 87A rebate for old regime (₹5L threshold, ₹12.5K cap)
  let rebateOld = 0;
  let qualifiesForRebateOld = false;
  let rebateReasonOld = "";
  if (taxableOld <= 500000) {
    qualifiesForRebateOld = true;
    rebateOld = Math.min(12500, taxOldBeforeRebate);
    rebateReasonOld = "Taxable ≤ ₹5L — rebate applied (capped at ₹12,500)";
  } else {
    rebateReasonOld = "Not eligible — Taxable income exceeds ₹5L threshold";
  }
  const finalOld = Math.max(0, taxOldBeforeRebate - rebateOld);

  // NEW REGIME CALCULATION
  const newDeductions = standardDeduction + employerNPS + savingsExempt;
  const taxableNew = Math.max(0, grossSalary - newDeductions) + taxableInterest;
  
  const newSlabs = [
    { upTo: 300000, rate: 0 },
    { upTo: 700000, rate: 0.05 },
    { upTo: 1000000, rate: 0.10 },
    { upTo: 1200000, rate: 0.15 },
    { upTo: 1500000, rate: 0.20 },
    { upTo: Infinity, rate: 0.30 }
  ];
  
  const newSlabResult = slabTax(taxableNew, newSlabs);
  const taxNewBeforeCess = newSlabResult.tax + capitalGainsTaxTotal;
  const cessNew = taxNewBeforeCess * 0.04;
  const taxNewBeforeRebate = taxNewBeforeCess + cessNew;
  
  // Section 87A rebate for new regime (₹7L threshold, full tax rebate)
  let rebateNew = 0;
  let qualifiesForRebateNew = false;
  let rebateReasonNew = "";
  if (taxableNew <= 700000) {
    qualifiesForRebateNew = true;
    rebateNew = taxNewBeforeRebate; // Full rebate (no cap in new regime)
    rebateReasonNew = "Taxable ≤ ₹7L — full rebate applied (no cap)";
  } else {
    rebateReasonNew = "Not eligible — Taxable income exceeds ₹7L threshold";
  }
  const finalNew = Math.max(0, taxNewBeforeRebate - rebateNew);

  // ITR form recommendation
  const hasCapitalGains = (capitalGains && capitalGains.length > 0);
  const itrForm = (hasCapitalGains || hasVDA) ? 'ITR-2' : 'ITR-1';
  
  // Recommendation
  const savings = finalOld - finalNew;
  const recommended = savings > 0 ? 'new' : 'old';
  const savingsPercentage = safePercentage(savings, finalOld);

  // Generate regime-specific rebate messages
  let rebateMessageOld = null;
  let rebateMessageNew = null;
  let combinedRebateMessage = null;

  if (qualifiesForRebateOld && rebateOld > 0) {
    rebateMessageOld = finalOld === 0 
      ? `₹${round2(rebateOld).toLocaleString()} rebate applied — tax fully covered`
      : `₹${round2(rebateOld).toLocaleString()} rebate applied (capped at ₹12,500)`;
  }

  if (qualifiesForRebateNew && rebateNew > 0) {
    rebateMessageNew = finalNew === 0
      ? `₹${round2(rebateNew).toLocaleString()} rebate applied — tax fully covered`
      : `₹${round2(rebateNew).toLocaleString()} rebate applied`;
  }

  // Combined message when both regimes result in zero tax
  if (finalOld === 0 && finalNew === 0 && rebateOld > 0 && rebateNew > 0) {
    combinedRebateMessage = `✅ You pay ₹0 tax under both regimes — Section 87A rebate applied (Old: ₹${round2(rebateOld).toLocaleString()}, New: ₹${round2(rebateNew).toLocaleString()})`;
  }

  return {
    inputs: {
      grossSalary: round2(grossSalary),
      standardDeduction: round2(standardDeduction),
      chapter6ADeductions: round2(chapter6ADeductions),
      otherDeductions: round2(otherDeductions),
      employerNPS: round2(employerNPS),
      interestSavings: round2(interestSavings),
      interestFD: round2(interestFD),
      isSenior,
      capitalGains
    },
    taxable: {
      taxableOld: round2(taxableOld),
      taxableNew: round2(taxableNew)
    },
    capitalGains: {
      detail: cgResult.breakdown,
      equityLTCGAggregate: ltcgEquityAgg,
      totalTax: round2(capitalGainsTaxTotal)
    },
    oldRegime: {
      deductionsUsed: round2(oldDeductions),
      slabTax: round2(oldSlabResult.tax),
      slabBreakdown: oldSlabResult.breakdown,
      capitalGainsTax: round2(capitalGainsTaxTotal),
      taxBeforeCess: round2(taxOldBeforeCess),
      cess: round2(cessOld),
      taxBeforeRebate: round2(taxOldBeforeRebate),
      rebate: round2(rebateOld),
      qualifiesForRebate: qualifiesForRebateOld,
      rebateThreshold: 500000,
      rebateCap: 12500,
      rebateReason: rebateReasonOld,
      finalTaxPayable: round2(finalOld),
      rebateMessage: rebateMessageOld
    },
    newRegime: {
      deductionsUsed: round2(newDeductions),
      slabTax: round2(newSlabResult.tax),
      slabBreakdown: newSlabResult.breakdown,
      capitalGainsTax: round2(capitalGainsTaxTotal),
      taxBeforeCess: round2(taxNewBeforeCess),
      cess: round2(cessNew),
      taxBeforeRebate: round2(taxNewBeforeRebate),
      rebate: round2(rebateNew),
      qualifiesForRebate: qualifiesForRebateNew,
      rebateThreshold: 700000,
      rebateCap: null, // No cap in new regime
      rebateReason: rebateReasonNew,
      finalTaxPayable: round2(finalNew),
      rebateMessage: rebateMessageNew
    },
    comparison: {
      savings: round2(Math.abs(savings)),
      recommended,
      savingsPercentage,
      combinedRebateMessage,
      bothRegimesZeroTax: finalOld === 0 && finalNew === 0
    },
    itrForm,
    metadata: {
      financialYear: 'FY2024-25',
      assessmentYear: 'AY2025-26',
      calculatedAt: new Date().toISOString()
    }
  };
}

// Validation function
function validateTaxInput(payload) {
  const errors = [];
  
  if (typeof payload.grossSalary !== 'number' || payload.grossSalary < 0) {
    errors.push('Gross salary must be a non-negative number');
  }
  
  if (payload.chapter6ADeductions && payload.chapter6ADeductions > 150000) {
    errors.push('Chapter VI-A deductions cannot exceed ₹1,50,000');
  }
  
  if (payload.capitalGains && Array.isArray(payload.capitalGains)) {
    payload.capitalGains.forEach((cg, index) => {
      if (!['stcg', 'ltcg'].includes(cg.type)) {
        errors.push(`Capital gain ${index + 1}: type must be 'stcg' or 'ltcg'`);
      }
      if (typeof cg.amount !== 'number' || cg.amount < 0) {
        errors.push(`Capital gain ${index + 1}: amount must be non-negative`);
      }
    });
  }
  
  return errors;
}

// Export functions
export { computeTax, validateTaxInput, round2, safePercentage, slabTax };
