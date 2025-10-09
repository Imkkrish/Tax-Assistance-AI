// Personalized Deduction Suggestions Engine
// Analyzes user data and provides intelligent tax-saving recommendations

/**
 * Generate personalized deduction suggestions based on user's income and current deductions
 * @param {Object} userData - User's financial data
 * @returns {Object} Suggestions with potential savings
 */
export function generateDeductionSuggestions(userData) {
  const {
    grossSalary = 0,
    currentDeductions = {},
    age = 30,
    hasHealthInsurance = false,
    hasHomeLoan = false,
    isRenting = false,
    cityType = 'metro', // metro, non-metro, tier-2
    hasParents = false,
    parentsAge = 0
  } = userData;

  const suggestions = [];
  let totalPotentialSavings = 0;

  // Section 80C Analysis (Max: ₹1,50,000)
  const current80C = currentDeductions.section80c || 0;
  if (current80C < 150000) {
    const remaining80C = 150000 - current80C;
    const taxRate = grossSalary > 1500000 ? 0.30 : grossSalary > 1200000 ? 0.20 : grossSalary > 500000 ? 0.05 : 0;
    const potentialSaving = remaining80C * taxRate;
    
    suggestions.push({
      category: 'Section 80C',
      priority: 'high',
      currentAmount: current80C,
      maxLimit: 150000,
      remainingLimit: remaining80C,
      potentialSavings: Math.round(potentialSaving),
      recommendations: [
        {
          option: 'Public Provident Fund (PPF)',
          amount: Math.min(remaining80C, 150000),
          benefit: 'Safe investment with 7.1% returns (tax-free)',
          action: 'Open PPF account and invest before March 31st'
        },
        {
          option: 'Equity Linked Savings Scheme (ELSS)',
          amount: Math.min(remaining80C, 150000),
          benefit: 'Market-linked returns with only 3-year lock-in',
          action: 'Invest in ELSS mutual funds'
        },
        {
          option: 'Life Insurance Premium',
          amount: Math.min(remaining80C, 150000),
          benefit: 'Financial protection + tax benefit',
          action: 'Consider term insurance or whole life policy'
        },
        {
          option: 'National Pension System (NPS)',
          amount: Math.min(remaining80C, 50000),
          benefit: 'Additional ₹50,000 under 80CCD(1B)',
          action: 'Open NPS Tier-I account'
        }
      ]
    });
    
    totalPotentialSavings += potentialSaving;
  }

  // Section 80D - Health Insurance (Max: ₹25,000 or ₹50,000 for seniors)
  const current80D = currentDeductions.section80d || 0;
  const maxHealthInsurance = age >= 60 ? 50000 : 25000;
  const parentHealthInsurance = (hasParents && parentsAge >= 60) ? 50000 : 25000;
  const total80DLimit = maxHealthInsurance + parentHealthInsurance;
  
  if (current80D < total80DLimit) {
    const remaining80D = total80DLimit - current80D;
    const taxRate = grossSalary > 1500000 ? 0.30 : grossSalary > 1200000 ? 0.20 : grossSalary > 500000 ? 0.05 : 0;
    const potentialSaving = remaining80D * taxRate;
    
    suggestions.push({
      category: 'Section 80D - Health Insurance',
      priority: 'high',
      currentAmount: current80D,
      maxLimit: total80DLimit,
      remainingLimit: remaining80D,
      potentialSavings: Math.round(potentialSaving),
      recommendations: [
        {
          option: 'Family Health Insurance',
          amount: maxHealthInsurance,
          benefit: 'Medical coverage + tax benefit',
          action: 'Buy family floater policy covering you and dependents'
        },
        ...(hasParents ? [{
          option: 'Parents Health Insurance',
          amount: parentHealthInsurance,
          benefit: 'Additional ₹' + parentHealthInsurance.toLocaleString() + ' deduction',
          action: 'Buy separate health policy for parents'
        }] : []),
        {
          option: 'Preventive Health Checkup',
          amount: 5000,
          benefit: 'Included in Section 80D limit',
          action: 'Book annual health checkups for family'
        }
      ]
    });
    
    totalPotentialSavings += potentialSaving;
  }

  // Section 80CCD(1B) - Additional NPS (Max: ₹50,000)
  const currentNPS = currentDeductions.nps || 0;
  if (currentNPS < 50000) {
    const remainingNPS = 50000 - currentNPS;
    const taxRate = grossSalary > 1500000 ? 0.30 : grossSalary > 1200000 ? 0.20 : grossSalary > 500000 ? 0.05 : 0;
    const potentialSaving = remainingNPS * taxRate;
    
    suggestions.push({
      category: 'Section 80CCD(1B) - NPS',
      priority: 'medium',
      currentAmount: currentNPS,
      maxLimit: 50000,
      remainingLimit: remainingNPS,
      potentialSavings: Math.round(potentialSaving),
      recommendations: [
        {
          option: 'National Pension System (NPS)',
          amount: 50000,
          benefit: 'Extra ₹50,000 deduction beyond 80C limit',
          action: 'Invest in NPS Tier-I (separate from 80C limit)'
        }
      ]
    });
    
    totalPotentialSavings += potentialSaving;
  }

  // Section 24(b) - Home Loan Interest (Max: ₹2,00,000)
  const currentHomeLoan = currentDeductions.section24b || 0;
  if (hasHomeLoan && currentHomeLoan < 200000) {
    const remaining24b = 200000 - currentHomeLoan;
    const taxRate = grossSalary > 1500000 ? 0.30 : grossSalary > 1200000 ? 0.20 : grossSalary > 500000 ? 0.05 : 0;
    const potentialSaving = remaining24b * taxRate;
    
    suggestions.push({
      category: 'Section 24(b) - Home Loan Interest',
      priority: 'medium',
      currentAmount: currentHomeLoan,
      maxLimit: 200000,
      remainingLimit: remaining24b,
      potentialSavings: Math.round(potentialSaving),
      recommendations: [
        {
          option: 'Claim Home Loan Interest',
          amount: remaining24b,
          benefit: 'Deduct interest paid on home loan',
          action: 'Get interest certificate from bank and claim deduction'
        }
      ]
    });
    
    totalPotentialSavings += potentialSaving;
  }

  // HRA - House Rent Allowance
  if (isRenting && !hasHomeLoan) {
    const monthlySalary = grossSalary / 12;
    const monthlyRent = monthlySalary * 0.25; // Assume 25% of salary
    const annualRent = monthlyRent * 12;
    const hraExemption = Math.min(
      annualRent - (monthlySalary * 10) / 100,
      monthlySalary * 0.50 * 12 // 50% for metro, 40% for non-metro
    );
    const taxRate = grossSalary > 1500000 ? 0.30 : grossSalary > 1200000 ? 0.20 : grossSalary > 500000 ? 0.05 : 0;
    const potentialSaving = hraExemption * taxRate;
    
    suggestions.push({
      category: 'HRA - House Rent Allowance',
      priority: 'high',
      currentAmount: 0,
      maxLimit: Math.round(hraExemption),
      remainingLimit: Math.round(hraExemption),
      potentialSavings: Math.round(potentialSaving),
      recommendations: [
        {
          option: 'Claim HRA Exemption',
          amount: Math.round(hraExemption),
          benefit: 'Reduce taxable income by rent paid',
          action: 'Submit rent receipts and landlord PAN to employer'
        }
      ]
    });
    
    totalPotentialSavings += potentialSaving;
  }

  // Section 80E - Education Loan Interest
  suggestions.push({
    category: 'Section 80E - Education Loan',
    priority: 'low',
    currentAmount: 0,
    maxLimit: Infinity,
    remainingLimit: Infinity,
    potentialSavings: 'Variable',
    recommendations: [
      {
        option: 'Education Loan Interest',
        amount: 'No limit',
        benefit: 'Full interest amount deductible',
        action: 'Claim if you have education loan for higher studies'
      }
    ]
  });

  // Section 80TTA/80TTB - Interest on Savings
  const maxInterestDeduction = age >= 60 ? 50000 : 10000;
  suggestions.push({
    category: age >= 60 ? 'Section 80TTB' : 'Section 80TTA',
    priority: 'low',
    currentAmount: 0,
    maxLimit: maxInterestDeduction,
    remainingLimit: maxInterestDeduction,
    potentialSavings: Math.round(maxInterestDeduction * (grossSalary > 1500000 ? 0.30 : 0.20)),
    recommendations: [
      {
        option: 'Interest on Savings',
        amount: maxInterestDeduction,
        benefit: age >= 60 
          ? 'Deduct interest from savings, FD, post office' 
          : 'Deduct interest from savings account only',
        action: 'Automatically claimed on interest earned'
      }
    ]
  });

  // Sort suggestions by priority and potential savings
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  suggestions.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return (b.potentialSavings || 0) - (a.potentialSavings || 0);
  });

  return {
    totalPotentialSavings: Math.round(totalPotentialSavings),
    suggestions,
    summary: {
      totalSuggestionsCount: suggestions.length,
      highPriority: suggestions.filter(s => s.priority === 'high').length,
      mediumPriority: suggestions.filter(s => s.priority === 'medium').length,
      lowPriority: suggestions.filter(s => s.priority === 'low').length
    }
  };
}

/**
 * Generate investment deadline alerts
 * @returns {Array} Array of upcoming deadlines
 */
export function getInvestmentDeadlines() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const financialYearEnd = new Date(currentYear + (currentMonth >= 3 ? 1 : 0), 2, 31); // March 31
  
  const daysUntilDeadline = Math.ceil((financialYearEnd - today) / (1000 * 60 * 60 * 24));
  
  const deadlines = [
    {
      title: 'Tax Saving Investments Deadline',
      date: financialYearEnd.toDateString(),
      daysRemaining: daysUntilDeadline,
      urgency: daysUntilDeadline <= 30 ? 'high' : daysUntilDeadline <= 60 ? 'medium' : 'low',
      message: daysUntilDeadline <= 30 
        ? `⚠️ Only ${daysUntilDeadline} days left! Invest before March 31st to save tax.`
        : `You have ${daysUntilDeadline} days to maximize tax savings for this financial year.`,
      actions: [
        'Complete Section 80C investments (₹1,50,000)',
        'Buy health insurance (Section 80D)',
        'Invest in NPS (Section 80CCD - ₹50,000 extra)',
        'Pay home loan principal (Section 80C)',
        'Submit rent receipts for HRA'
      ]
    }
  ];
  
  return deadlines;
}
