// Advanced Error Detection and Validation Module
// Performs intelligent cross-field validation and consistency checks

/**
 * Validate PAN format
 * @param {string} pan - PAN number
 * @returns {Object} Validation result
 */
export function validatePAN(pan) {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const isValid = panRegex.test(pan);
  
  return {
    isValid,
    message: isValid ? 'Valid PAN format' : 'Invalid PAN format. Format: ABCDE1234F'
  };
}

/**
 * Perform cross-field validation
 * @param {Object} formData - User input data
 * @returns {Array} Array of validation errors
 */
export function crossFieldValidation(formData) {
  const errors = [];
  const warnings = [];

  const {
    grossSalary = 0,
    section80c = 0,
    section80d = 0,
    hra = 0,
    homeLoanInterest = 0,
    homeLoanPrincipal = 0,
    isRenting = false,
    hasHomeLoan = false,
    age = 30
  } = formData;

  // Critical Errors
  if (hra > 0 && homeLoanInterest > 0) {
    errors.push({
      type: 'critical',
      field: ['hra', 'homeLoanInterest'],
      message: '❌ HRA and Home Loan Interest cannot be claimed together',
      explanation: 'You cannot claim HRA exemption while also claiming home loan interest deduction on the same property.',
      solution: 'Choose either HRA (if renting) or Home Loan Interest (if you own)',
      code: 'HRA_HOMELOAN_CONFLICT'
    });
  }

  if (isRenting && hasHomeLoan) {
    errors.push({
      type: 'critical',
      field: ['isRenting', 'hasHomeLoan'],
      message: '❌ Cannot be renting and have home loan simultaneously',
      explanation: 'Home loan benefits apply only if you own and occupy the property.',
      solution: 'Update your housing status correctly',
      code: 'HOUSING_STATUS_CONFLICT'
    });
  }

  // Limit Validation
  if (section80c > 150000) {
    errors.push({
      type: 'error',
      field: 'section80c',
      message: '❌ Section 80C limit exceeded',
      explanation: `Maximum allowed: ₹1,50,000. You entered: ₹${section80c.toLocaleString()}`,
      solution: 'Reduce Section 80C to ₹1,50,000',
      code: '80C_LIMIT_EXCEEDED'
    });
  }

  if (section80d > (age >= 60 ? 50000 : 25000)) {
    const maxLimit = age >= 60 ? 50000 : 25000;
    errors.push({
      type: 'error',
      field: 'section80d',
      message: '❌ Section 80D limit exceeded',
      explanation: `Maximum allowed for your age: ₹${maxLimit.toLocaleString()}. You entered: ₹${section80d.toLocaleString()}`,
      solution: `Reduce Section 80D to ₹${maxLimit.toLocaleString()}`,
      code: '80D_LIMIT_EXCEEDED'
    });
  }

  if (homeLoanInterest > 200000) {
    errors.push({
      type: 'error',
      field: 'homeLoanInterest',
      message: '❌ Home Loan Interest limit exceeded',
      explanation: `Maximum allowed: ₹2,00,000. You entered: ₹${homeLoanInterest.toLocaleString()}`,
      solution: 'Reduce home loan interest to ₹2,00,000',
      code: 'HOMELOAN_LIMIT_EXCEEDED'
    });
  }

  // Warnings (not errors, but suspicious)
  if (section80c + homeLoanPrincipal > 150000) {
    warnings.push({
      type: 'warning',
      field: ['section80c', 'homeLoanPrincipal'],
      message: '⚠️ Combined 80C + Home Loan Principal exceeds ₹1,50,000',
      explanation: 'Home loan principal is part of Section 80C. Combined limit is ₹1,50,000.',
      solution: 'Ensure total doesn\'t exceed ₹1,50,000',
      code: '80C_PRINCIPAL_COMBINED'
    });
  }

  if (hra > grossSalary * 0.5) {
    warnings.push({
      type: 'warning',
      field: 'hra',
      message: '⚠️ HRA seems unusually high',
      explanation: 'HRA is more than 50% of your gross salary, which is uncommon.',
      solution: 'Verify your HRA amount is correct',
      code: 'HRA_HIGH'
    });
  }

  if (section80c < grossSalary * 0.05 && grossSalary > 500000) {
    warnings.push({
      type: 'info',
      field: 'section80c',
      message: '💡 Low Section 80C utilization',
      explanation: 'You\'re not utilizing much of the ₹1,50,000 Section 80C limit.',
      solution: 'Consider investing in PPF, ELSS, or other 80C instruments',
      code: '80C_LOW_UTILIZATION'
    });
  }

  return {
    isValid: errors.filter(e => e.type === 'critical' || e.type === 'error').length === 0,
    errors,
    warnings,
    summary: {
      criticalErrors: errors.filter(e => e.type === 'critical').length,
      errors: errors.filter(e => e.type === 'error').length,
      warnings: warnings.length
    }
  };
}

/**
 * Compare with previous year returns (if available)
 * @param {Object} currentYear - Current year data
 * @param {Object} previousYear - Previous year data
 * @returns {Object} Comparison and anomalies
 */
export function compareWithPreviousYear(currentYear, previousYear) {
  if (!previousYear) {
    return {
      available: false,
      message: 'No previous year data available for comparison'
    };
  }

  const anomalies = [];
  const insights = [];

  const {
    grossSalary: currentSalary = 0,
    section80c: current80c = 0,
    section80d: current80d = 0
  } = currentYear;

  const {
    grossSalary: prevSalary = 0,
    section80c: prev80c = 0,
    section80d: prev80d = 0
  } = previousYear;

  // Salary change analysis
  const salaryChange = ((currentSalary - prevSalary) / prevSalary) * 100;
  if (Math.abs(salaryChange) > 50) {
    anomalies.push({
      type: salaryChange > 0 ? 'increase' : 'decrease',
      field: 'grossSalary',
      message: `Salary ${salaryChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(salaryChange).toFixed(1)}%`,
      explanation: 'Significant salary change detected compared to last year.',
      previousValue: prevSalary,
      currentValue: currentSalary
    });
  }

  // Deduction pattern analysis
  if (current80c < prev80c * 0.5 && prev80c > 50000) {
    anomalies.push({
      type: 'decrease',
      field: 'section80c',
      message: '⚠️ Section 80C decreased significantly',
      explanation: 'Your Section 80C investments are much lower than last year.',
      previousValue: prev80c,
      currentValue: current80c,
      suggestion: 'Consider why investments decreased. Don\'t miss out on tax savings.'
    });
  }

  // Generate insights
  if (salaryChange > 10 && current80c <= prev80c) {
    insights.push({
      message: '💡 Salary increased but investments didn\'t',
      suggestion: 'With higher income, consider increasing tax-saving investments proportionally.'
    });
  }

  return {
    available: true,
    salaryChange: salaryChange.toFixed(1),
    anomalies,
    insights,
    summary: {
      previousYear: {
        salary: prevSalary,
        deductions: prev80c + prev80d
      },
      currentYear: {
        salary: currentSalary,
        deductions: current80c + current80d
      }
    }
  };
}

/**
 * Document consistency checks
 * @param {Object} form16Data - Data from Form-16
 * @param {Object} userInput - User's manual input
 * @returns {Object} Consistency check results
 */
export function checkDocumentConsistency(form16Data, userInput) {
  const mismatches = [];
  const tolerance = 1000; // Allow ₹1000 difference for rounding

  if (!form16Data) {
    return {
      available: false,
      message: 'No Form-16 data available for consistency check'
    };
  }

  // Check gross salary
  if (Math.abs(form16Data.grossSalary - userInput.grossSalary) > tolerance) {
    mismatches.push({
      field: 'grossSalary',
      form16Value: form16Data.grossSalary,
      userValue: userInput.grossSalary,
      difference: Math.abs(form16Data.grossSalary - userInput.grossSalary),
      message: '❌ Gross salary mismatch with Form-16',
      severity: 'critical'
    });
  }

  // Check TDS
  if (form16Data.tds && userInput.tds) {
    if (Math.abs(form16Data.tds - userInput.tds) > tolerance) {
      mismatches.push({
        field: 'tds',
        form16Value: form16Data.tds,
        userValue: userInput.tds,
        difference: Math.abs(form16Data.tds - userInput.tds),
        message: '⚠️ TDS amount mismatch',
        severity: 'warning'
      });
    }
  }

  return {
    available: true,
    isConsistent: mismatches.filter(m => m.severity === 'critical').length === 0,
    mismatches,
    summary: {
      criticalMismatches: mismatches.filter(m => m.severity === 'critical').length,
      warnings: mismatches.filter(m => m.severity === 'warning').length
    }
  };
}

/**
 * Real-time validation as user types
 * @param {string} fieldName - Field being validated
 * @param {any} value - Field value
 * @param {Object} allFields - All form fields for cross-validation
 * @returns {Object} Validation result
 */
export function realtimeFieldValidation(fieldName, value, allFields = {}) {
  const result = {
    isValid: true,
    error: null,
    warning: null,
    suggestion: null
  };

  switch (fieldName) {
    case 'pan':
      const panValidation = validatePAN(value);
      if (!panValidation.isValid) {
        result.isValid = false;
        result.error = panValidation.message;
      }
      break;

    case 'grossSalary':
      if (value < 0) {
        result.isValid = false;
        result.error = 'Salary cannot be negative';
      } else if (value > 100000000) {
        result.warning = 'Salary seems unusually high. Please verify.';
      }
      break;

    case 'section80c':
      if (value > 150000) {
        result.isValid = false;
        result.error = 'Section 80C limit is ₹1,50,000';
      } else if (value > 0 && value < 10000) {
        result.suggestion = '💡 You can invest up to ₹1,50,000 in Section 80C';
      }
      break;

    case 'hra':
      if (allFields.hasHomeLoan || allFields.homeLoanInterest > 0) {
        result.warning = '⚠️ HRA and home loan interest cannot be claimed together';
      }
      break;

    case 'homeLoanInterest':
      if (value > 200000) {
        result.isValid = false;
        result.error = 'Home loan interest limit is ₹2,00,000';
      }
      if (allFields.hra > 0) {
        result.warning = '⚠️ Cannot claim with HRA';
      }
      break;

    default:
      break;
  }

  return result;
}
