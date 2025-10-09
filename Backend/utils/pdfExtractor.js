// Enhanced PDF text extraction and Form-16 parser
import fs from 'fs';
import pdf from 'pdf-parse';

/**
 * Extract text from PDF file
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    // Keep original text with line breaks for better pattern matching
    const originalText = data.text;
    
    // Also create a normalized version
    let normalizedText = data.text;
    normalizedText = normalizedText.replace(/\r\n/g, '\n'); // Normalize line breaks
    
    // Return both versions
    return {
      original: originalText,
      normalized: normalizedText
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Enhanced Form-16 data extraction with better pattern matching
 */
export const parseForm16 = (textInput) => {
  // Handle both string and object input (for backwards compatibility)
  const text = typeof textInput === 'string' ? textInput : textInput.original;
  const normalizedText = typeof textInput === 'string' ? textInput : textInput.normalized;
  
  const data = {
    // Personal Information
    employeeName: '',
    employerName: '',
    employerTAN: '',
    pan: '',
    assessmentYear: '',
    financialYear: '',
    
    // Salary Information
    grossSalary: 0,
    exemptAllowances: 0,
    netSalary: 0,
    standardDeduction: 50000,
    professionalTax: 0,
    entertainmentAllowance: 0,
    
    // Income Details
    salaryIncome: 0,
    housePropertyIncome: 0,
    otherIncome: 0,
    grossTotalIncome: 0,
    
    // Deductions
    section80C: 0,
    section80CCC: 0,
    section80CCD1: 0,
    section80CCD1B: 0,
    section80D: 0,
    section80DD: 0,
    section80DDB: 0,
    section80E: 0,
    section80G: 0,
    section80GG: 0,
    section80TTA: 0,
    section80U: 0,
    section24b: 0,
    totalDeductions: 0,
    
    // Tax Computation
    taxableIncome: 0,
    taxOnIncome: 0,
    reliefUnder89: 0,
    surcharge: 0,
    healthEducationCess: 0,
    totalTaxPayable: 0,
    
    // TDS Information
    tdsDeducted: 0,
    tdsDeposited: 0,
    
    // Additional Info
    extractionConfidence: 0,
    extractedFields: []
  };

  let fieldsExtracted = 0;
  const totalFields = 40;

  // Helper function to extract amount
  const extractAmount = (regex, fieldName) => {
    const match = text.match(regex);
    if (match) {
      const value = parseInt(match[1].replace(/,/g, '').replace(/\s/g, ''));
      if (!isNaN(value)) {
        fieldsExtracted++;
        data.extractedFields.push(fieldName);
        return value;
      }
    }
    return 0;
  };

  // Helper function to extract text
  const extractText = (regex, fieldName) => {
    const match = text.match(regex);
    if (match) {
      const value = match[1].trim();
      // Clean up extra spaces and newlines
      const cleaned = value.replace(/\s+/g, ' ').trim();
      if (cleaned && cleaned.length > 0) {
        fieldsExtracted++;
        data.extractedFields.push(fieldName);
        return cleaned;
      }
    }
    return '';
  };

  // Extract Personal Information with improved patterns
  
  // Try multiple patterns for employee name
  // Pattern 1: Standard format with "Name and address of the Employee"
  data.employeeName = extractText(
    /Name\s*(?:and\s*address\s*)?of\s*(?:the\s*)?Employee[\/\s]*Specified\s*senior\s*citizen\s*[\n\r]+([A-Z][A-Z\s\.]+?)[\n\r]/im,
    'employeeName'
  );
  
  // Pattern 2: Simpler pattern
  if (!data.employeeName || data.employeeName.length < 3) {
    data.employeeName = extractText(
      /Employee[\/\s]*Specified\s*senior\s*citizen\s*[\n\r]+([A-Z][A-Z\s\.]+?)[\n\r]/im,
      'employeeName'
    );
  }
  
  // Pattern 3: Even simpler - just look for "Employee" followed by name
  if (!data.employeeName || data.employeeName.length < 3) {
    const match = text.match(/Employee[\/\s]*Specified.*?[\n\r]+([A-Z][A-Z\s\.]{5,50})[\n\r]/im);
    if (match) {
      data.employeeName = match[1].trim();
      fieldsExtracted++;
      data.extractedFields.push('employeeName');
    }
  }
  
  // Pattern 4: Last resort - look for capitalized name before PAN
  if (!data.employeeName || data.employeeName.length < 3) {
    const match = text.match(/\n([A-Z][A-Z\s]{5,50})\s*[\n\r]+.*?PAN\s*of\s*Employee/im);
    if (match) {
      data.employeeName = match[1].trim();
      fieldsExtracted++;
      data.extractedFields.push('employeeName');
    }
  }

  // Employer name extraction
  data.employerName = extractText(
    /Name\s*(?:and\s*address\s*)?of\s*(?:the\s*)?Employer[\/\s]*Specified\s*Bank\s*[\n\r]+([A-Z][A-Z\s\.\,\-&]+?)[\n\r]/im,
    'employerName'
  );
  
  if (!data.employerName || data.employerName.length < 3) {
    const match = text.match(/Employer[\/\s]*Specified\s*Bank\s*[\n\r]+([A-Z][A-Z\s\.\,\-&]{5,60})[\n\r]/im);
    if (match) {
      data.employerName = match[1].trim();
      fieldsExtracted++;
      data.extractedFields.push('employerName');
    }
  }

  // Extract Employee PAN (not Deductor PAN!)
  data.pan = extractText(
    /PAN\s*of\s*(?:the\s*)?Employee[\/\s]*Specified\s*senior\s*citizen\s*[\n\r]*([A-Z]{5}[0-9]{4}[A-Z]{1})/im,
    'pan'
  );
  
  // Fallback for PAN
  if (!data.pan) {
    const match = text.match(/Employee.*?[\n\r]+.*?([A-Z]{5}[0-9]{4}[A-Z]{1})/im);
    if (match) {
      data.pan = match[1];
      fieldsExtracted++;
      data.extractedFields.push('pan');
    }
  }

  // TAN extraction - look for "TAN of the Deductor"
  data.employerTAN = extractText(
    /TAN\s*of\s*(?:the\s*)?Deductor\s*[\n\r]*([A-Z]{3}[0-9]{5}[A-Z]{1})/im,
    'employerTAN'
  );
  
  // Fallback TAN pattern
  if (!data.employerTAN) {
    const tanMatch = text.match(/\bDTY[0-9]{5}[A-Z]\b|\b[A-Z]{3}[0-9]{5}[A-Z]\b/);
    if (tanMatch && !tanMatch[0].match(/^[A-Z]{5}/)) { // Not a PAN
      data.employerTAN = tanMatch[0];
      fieldsExtracted++;
      data.extractedFields.push('employerTAN');
    }
  }

  data.assessmentYear = extractText(
    /Assessment\s*Year\s*[\n\r]*(\d{4}-\d{2,4})/im,
    'assessmentYear'
  );

  data.financialYear = extractText(
    /Financial\s*Year\s*[\n\r]*(\d{4}-\d{2,4})/im,
    'financialYear'
  );

  // Extract Period of Employment
  const periodFromMatch = text.match(/From[\n\r]+(\d{2}-[A-Za-z]{3}-\d{4})/im);
  if (periodFromMatch) {
    data.periodFrom = periodFromMatch[1];
    fieldsExtracted++;
    data.extractedFields.push('periodFrom');
  }
  
  const periodToMatch = text.match(/To[\n\r]+(\d{2}-[A-Za-z]{3}-\d{4})/im);
  if (periodToMatch) {
    data.periodTo = periodToMatch[1];
    fieldsExtracted++;
    data.extractedFields.push('periodTo');
  }
  
  // Certificate Number
  const certMatch = text.match(/Certificate\s*(?:No|Number)[:\s]*([A-Z0-9]+)/im);
  if (certMatch) {
    data.certificateNumber = certMatch[1];
    fieldsExtracted++;
    data.extractedFields.push('certificateNumber');
  }

  // Extract Salary Information (Part B)
  // Pattern 1: Standard format with number prefix - section 17(1)(a)
  data.grossSalary = extractAmount(
    /(?:1\.?)\s*Gross\s*Salary[\s\S]*?(?:section\s*17\(1\)\(a\)|17\(1\)\(a\))[\s\S]*?([0-9]{3,}\.?[0-9]{0,2})/im,
    'grossSalary'
  );
  
  // Pattern 2: Direct match after "Gross Salary"
  if (!data.grossSalary || data.grossSalary === 0) {
    data.grossSalary = extractAmount(
      /Gross\s*Salary[\s\S]{0,200}?([0-9]{3,}(?:\.[0-9]{2})?)/im,
      'grossSalary'
    );
  }
  
  // Extract Total (d) from section 1
  const totalSalaryMatch = text.match(/\(d\)\s*Total[\s\S]*?([0-9]{3,}\.?[0-9]{0,2})/im);
  if (totalSalaryMatch) {
    const totalSalary = parseInt(totalSalaryMatch[1].replace(/\./g, ''));
    if (!isNaN(totalSalary) && totalSalary > 0) {
      fieldsExtracted++;
      data.extractedFields.push('totalSalary');
    }
  }

  // Extract Allowances (Section 2)
  data.exemptAllowances = extractAmount(
    /2\.\s*Less:\s*Allowances[\s\S]*?Total\s*amount\s*of\s*exemption[\s\S]*?\(i\)[\s\S]*?([0-9]+\.?[0-9]{0,2})/im,
    'exemptAllowances'
  );

  // Extract Section 3 - Total amount of salary received from current employer  
  // Look for the line "3." then find the next 6-digit number
  const section3Match = text.match(/3\.[\s\S]{0,150}?([0-9]{6})\.00/);
  if (section3Match) {
    const val = parseInt(section3Match[1]);
    if (!isNaN(val) && val > 100000) {
      data.salaryReceived = val;
      fieldsExtracted++;
      data.extractedFields.push('salaryReceived');
    }
  }

  // Extract Section 4b - Standard deduction (usually 75000 or 50000)
  const stdDeductionMatch = text.match(/\(b\)[\s\n\r]+(75000|50000)\.00/);
  if (stdDeductionMatch) {
    data.standardDeduction = parseInt(stdDeductionMatch[1]);
    fieldsExtracted++;
    data.extractedFields.push('standardDeduction');
  }
  
  // Extract Section 4a - Entertainment allowance
  const entertainmentMatch = text.match(/\(a\)[\s\n\r]*([0-9]+)\.00/);
  if (entertainmentMatch) {
    data.entertainmentAllowance = parseInt(entertainmentMatch[1]);
    fieldsExtracted++;
    data.extractedFields.push('entertainmentAllowance');
  }
  
  // Extract Section 4c - Professional Tax
  const profTaxMatch = text.match(/\(c\)[\s\S]{0,80}?Tax\s*on\s*employment[\s\S]{0,30}?([0-9]+)\.00/im);
  if (profTaxMatch) {
    const val = parseInt(profTaxMatch[1]);
    if (!isNaN(val)) {
      data.professionalTax = val;
      fieldsExtracted++;
      data.extractedFields.push('professionalTax');
    }
  }
  
  // Section 5 - Total amount of deductions under section 16
  const totalDed16Match = text.match(/5\.[\s\S]{0,100}?(75000|50000)\.00/);
  if (totalDed16Match) {
    fieldsExtracted++;
    data.extractedFields.push('totalDeduction16');
  }

  // Section 6 - Income chargeable under the head "Salaries"
  // The number appears BEFORE "6." in this PDF format
  const section6Match = text.match(/([0-9]{6})\.00[\s\n\r]*6\./);
  if (section6Match) {
    const val = parseInt(section6Match[1]);
    if (!isNaN(val) && val > 100000) {
      data.salaryIncome = val;
      fieldsExtracted++;
      data.extractedFields.push('salaryIncome');
    }
  }

  // Section 7 - Other income (usually 0.00)
  const section7aMatch = text.match(/7\.[\s\S]{0,80}?\(a\)[\s\n\r]*([0-9]+)\.00/);
  if (section7aMatch) {
    const val = parseInt(section7aMatch[1]);
    data.otherIncome = val;
    fieldsExtracted++;
    data.extractedFields.push('otherIncome');
  }
  
  const section7bMatch = text.match(/\(b\)[\s\S]{0,100}?house\s*property[\s\S]{0,50}?([0-9]+)\.00/im);
  if (section7bMatch) {
    const val = parseInt(section7bMatch[1]);
    data.housePropertyIncome = val;
    fieldsExtracted++;
    data.extractedFields.push('housePropertyIncome');
  }
  
  // Section 8 - Total other income
  const section8Match = text.match(/8\.[\s\S]{0,100}?([0-9]+)\.00/);
  if (section8Match) {
    fieldsExtracted++;
    data.extractedFields.push('totalOtherIncome');
  }

  // Section 9 - Gross total income
  // The number appears BEFORE "Gross total income"
  const section9Match = text.match(/([0-9]{6})\.00[\s\n\r]*Gross\s*total\s*income/im);
  if (section9Match) {
    const val = parseInt(section9Match[1]);
    if (!isNaN(val) && val > 100000) {
      data.grossTotalIncome = val;
      fieldsExtracted++;
      data.extractedFields.push('grossTotalIncome');
    }
  }

  // Extract Deductions (Chapter VI-A) - Section 10
  data.section80C = extractAmount(
    /10\(a\)[\s\S]*?section\s*80C[\s\S]*?([0-9]+\.?[0-9]{0,2})/im,
    'section80C'
  );

  data.section80CCC = extractAmount(
    /10\(b\)[\s\S]*?section\s*80CCC[\s\S]*?([0-9]+\.?[0-9]{0,2})/im,
    'section80CCC'
  );

  data.section80CCD1 = extractAmount(
    /10\(d\)[\s\S]*?section\s*80CCD\s*\(1\)[\s\S]*?([0-9]+\.?[0-9]{0,2})/im,
    'section80CCD1'
  );

  data.section80CCD1B = extractAmount(
    /10\(e\)[\s\S]*?section\s*80CCD\s*\(1B\)[\s\S]*?([0-9]+\.?[0-9]{0,2})/im,
    'section80CCD1B'
  );
  
  // Section 80CCD(2) - Employer contribution
  data.section80CCD2 = extractAmount(
    /10\(f\)[\s\S]*?section\s*80CCD\s*\(2\)[\s\S]*?([0-9]+\.?[0-9]{0,2})/im,
    'section80CCD2'
  );

  data.section80D = extractAmount(
    /10\(g\)[\s\S]*?section\s*80D[\s\S]*?([0-9]+\.?[0-9]{0,2})/im,
    'section80D'
  );

  data.section80DD = extractAmount(
    /(?:Section\s*)?80DD\s*:?\s*Rs?\.?\s*([0-9,\s]+)/im,
    'section80DD'
  );

  data.section80DDB = extractAmount(
    /(?:Section\s*)?80DDB\s*:?\s*Rs?\.?\s*([0-9,\s]+)/im,
    'section80DDB'
  );

  data.section80E = extractAmount(
    /(?:Section\s*)?80E\s*:?\s*Rs?\.?\s*([0-9,\s]+)/im,
    'section80E'
  );

  data.section80G = extractAmount(
    /(?:Section\s*)?80G\s*:?\s*Rs?\.?\s*([0-9,\s]+)/im,
    'section80G'
  );

  data.section80GG = extractAmount(
    /(?:Section\s*)?80GG\s*:?\s*Rs?\.?\s*([0-9,\s]+)/im,
    'section80GG'
  );

  data.section80TTA = extractAmount(
    /(?:Section\s*)?80TTA\s*:?\s*Rs?\.?\s*([0-9,\s]+)/im,
    'section80TTA'
  );

  data.section80U = extractAmount(
    /(?:Section\s*)?80U\s*:?\s*Rs?\.?\s*([0-9,\s]+)/im,
    'section80U'
  );

  data.section24b = extractAmount(
    /(?:Section\s*)?24\(?b\)?\s*:?\s*Rs?\.?\s*([0-9,\s]+)/im,
    'section24b'
  );

  data.totalDeductions = extractAmount(
    /(?:9\.?|Total)\s*(?:Deductions|deductions).*?(?:Chapter\s*VI-A|VIA)\s*.*?Rs?\.?\s*([0-9,\s]+)/im,
    'totalDeductions'
  ) || (data.section80C + data.section80CCC + data.section80CCD1 + data.section80CCD1B + 
       data.section80D + data.section80DD + data.section80DDB + data.section80E + 
       data.section80G + data.section80GG + data.section80TTA + data.section80U + data.section24b);
  
  // Better extraction for Section 11
  if (!data.totalDeductions || data.totalDeductions === 0) {
    const totalDeductionsMatch = text.match(/11\.\s*[\s\S]{0,100}?([0-9]+)\.00/im);
    if (totalDeductionsMatch) {
      const val = parseInt(totalDeductionsMatch[1]);
      if (!isNaN(val)) {
        data.totalDeductions = val;
        fieldsExtracted++;
        data.extractedFields.push('totalDeductions');
      }
    }
  }

  // Tax Computation
  data.taxableIncome = extractAmount(
    /(?:10\.?|Total)\s*(?:[Ii]ncome|INCOME)\s*.*?Rs?\.?\s*([0-9,\s]+)/im,
    'taxableIncome'
  );
  
  // Better extraction for Section 12
  if (!data.taxableIncome || data.taxableIncome === 0) {
    const taxableIncomeMatch = text.match(/12\.\s*[\s\S]{0,50}?([0-9]{3,})\.00[\s\n\r]*Total\s*taxable\s*income/im);
    if (taxableIncomeMatch) {
      const val = parseInt(taxableIncomeMatch[1]);
      if (!isNaN(val) && val > 0) {
        data.taxableIncome = val;
        fieldsExtracted++;
        data.extractedFields.push('taxableIncome');
      }
    }
  }

  data.taxOnIncome = extractAmount(
    /(?:11\.?)\s*(?:Tax\s*on\s*total\s*income)\s*.*?Rs?\.?\s*([0-9,\s]+)/im,
    'taxOnIncome'
  );
  
  // Better extraction for Section 13
  if (!data.taxOnIncome || data.taxOnIncome === 0) {
    const taxOnIncomeMatch = text.match(/13\.\s*[\s\S]{0,50}?([0-9]+)\.00/im);
    if (taxOnIncomeMatch) {
      const val = parseInt(taxOnIncomeMatch[1]);
      if (!isNaN(val)) {
        data.taxOnIncome = val;
        data.incomeTax = val;
        fieldsExtracted++;
        data.extractedFields.push('taxOnIncome');
      }
    }
  }

  data.reliefUnder89 = extractAmount(
    /(?:12\.?)\s*(?:Relief\s*under\s*section\s*89)\s*.*?Rs?\.?\s*([0-9,\s]+)/im,
    'reliefUnder89'
  );

  data.healthEducationCess = extractAmount(
    /(?:Health\s*(?:and\s*)?Education\s*Cess|Cess)\s*.*?Rs?\.?\s*([0-9,\s]+)/im,
    'healthEducationCess'
  );

  data.totalTaxPayable = extractAmount(
    /(?:13\.?|Net\s*tax\s*payable)\s*.*?Rs?\.?\s*([0-9,\s]+)/im,
    'totalTaxPayable'
  );

  // TDS Information
  data.tdsDeducted = extractAmount(
    /(?:14\.?|Tax\s*deducted\s*at\s*source)\s*.*?Rs?\.?\s*([0-9,\s]+)/im,
    'tdsDeducted'
  );
  
  // Extract remaining tax fields from Sections 12-21
  const taxableIncomeS12 = extractAmount(/12\.\s*Total\s*taxable\s*income[\s\S]*?([0-9]{3,}\.?[0-9]{0,2})/im, 'taxableIncomeS12');
  if (taxableIncomeS12 > 0) {
    data.taxableIncome = taxableIncomeS12;
  }
  
  const taxOnIncomeS13 = extractAmount(/13\.\s*Tax\s*on\s*total\s*income[\s\S]*?([0-9]+\.?[0-9]{0,2})/im, 'taxOnIncomeS13');
  if (taxOnIncomeS13 > 0) {
    data.taxOnIncome = taxOnIncomeS13;
  }
  
  const rebate87AS14 = extractAmount(/14\.\s*Rebate\s*under\s*section\s*87A[\s\S]*?([0-9]+\.?[0-9]{0,2})/im, 'rebate87AS14');
  if (rebate87AS14 >= 0) {
    fieldsExtracted++;
    data.extractedFields.push('rebate87A');
  }
  
  const surchargeS15 = extractAmount(/15\.\s*Surcharge[\s\S]*?([0-9]+\.?[0-9]{0,2})/im, 'surchargeS15');
  if (surchargeS15 >= 0) {
    data.surcharge = surchargeS15;
  }
  
  const cessS16 = extractAmount(/16\.\s*Health\s*and\s*education\s*cess[\s\S]*?([0-9]+\.?[0-9]{0,2})/im, 'cessS16');
  if (cessS16 >= 0) {
    data.healthEducationCess = cessS16;
  }
  
  const taxPayableS17 = extractAmount(/17\.\s*Tax\s*payable[\s\S]*?([0-9]+\.?[0-9]{0,2})/im, 'taxPayableS17');
  if (taxPayableS17 >= 0) {
    data.totalTaxPayable = taxPayableS17;
  }
  
  const relief89S18 = extractAmount(/18\.\s*Less:\s*Relief\s*under\s*section\s*89[\s\S]*?([0-9]+\.?[0-9]{0,2})/im, 'relief89S18');
  if (relief89S18 >= 0) {
    fieldsExtracted++;
    data.extractedFields.push('relief89');
  }
  
  const tcsS19 = extractAmount(/19\.\s*Less:\s*Tax\s*collected[\s\S]*?([0-9]+\.?[0-9]{0,2})/im, 'tcsS19');
  if (tcsS19 >= 0) {
    fieldsExtracted++;
    data.extractedFields.push('tcs12BAA');
  }
  
  const tdsS20 = extractAmount(/20\.\s*Less:\s*Tax\s*deducted[\s\S]*?([0-9]+\.?[0-9]{0,2})/im, 'tdsS20');
  if (tdsS20 >= 0) {
    fieldsExtracted++;
    data.extractedFields.push('tds12BAA');
  }
  
  const netTaxS21 = extractAmount(/21\.\s*Net\s*tax\s*payable[\s\S]*?([0-9]+\.?[0-9]{0,2})/im, 'netTaxS21');
  if (netTaxS21 >= 0) {
    fieldsExtracted++;
    data.extractedFields.push('netTaxPayable');
  }
  
  // Extract verification details
  const verifierNameMatch = text.match(/I,\s*([A-Z\s]+),\s*son\/daughter/im);
  if (verifierNameMatch) {
    data.verifierName = verifierNameMatch[1].trim();
    fieldsExtracted++;
    data.extractedFields.push('verifierName');
  }
  
  const designationMatch = text.match(/capacity\s*of\s*([A-Z\s]+)[\n\r]/im);
  if (designationMatch) {
    data.verifierDesignation = designationMatch[1].trim();
    fieldsExtracted++;
    data.extractedFields.push('verifierDesignation');
  }
  
  const verificationDateMatch = text.match(/Date[\s\n\r]+(\d{2}-[A-Za-z]{3}-\d{4})/im);
  if (verificationDateMatch) {
    data.verificationDate = verificationDateMatch[1];
    fieldsExtracted++;
    data.extractedFields.push('verificationDate');
  }
  
  const verificationPlaceMatch = text.match(/Place[\s\n\r]+([A-Z\s]+)[\n\r]/im);
  if (verificationPlaceMatch) {
    data.verificationPlace = verificationPlaceMatch[1].trim();
    fieldsExtracted++;
    data.extractedFields.push('verificationPlace');
  }
  
  // Extract whether opting for new tax regime
  const taxRegimeMatch = text.match(/Whether\s*opting\s*out[\s\S]*?115BAC[\s\S]*?(Yes|No)/im);
  if (taxRegimeMatch) {
    data.optingOutNewRegime = taxRegimeMatch[1];
    fieldsExtracted++;
    data.extractedFields.push('taxRegime');
  }

  // Calculate confidence score
  const confidenceScore = fieldsExtracted / totalFields;
  data.extractionConfidence = Math.round(confidenceScore * 100);
  
  // Set metadata
  data.metadata = {
    fieldsExtracted: fieldsExtracted,
    totalFields: totalFields,
    confidenceScore: confidenceScore,
    extractedFields: data.extractedFields,
    isComplete: fieldsExtracted >= totalFields * 0.5 // Consider complete if 50%+ fields extracted
  };

  // Ensure netSalary is calculated if not directly extracted
  if (!data.netSalary && data.grossSalary > 0) {
    data.netSalary = data.grossSalary - data.exemptAllowances;
  }

  return data;
};

/**
 * Validate extracted Form-16 data
 */
export const validateForm16Data = (data) => {
  const errors = [];
  const warnings = [];

  // Required fields validation
  if (!data.pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan)) {
    errors.push('Invalid or missing PAN number');
  }

  if (!data.employeeName || data.employeeName.length < 3) {
    warnings.push('Employee name not extracted or too short');
  }

  if (!data.grossSalary || data.grossSalary === 0) {
    errors.push('Gross salary not found or is zero');
  }

  if (data.extractionConfidence < 50) {
    warnings.push('Low extraction confidence. Please verify the data manually.');
  }

  // Logical validations
  if (data.taxableIncome > data.grossTotalIncome) {
    warnings.push('Taxable income is greater than gross total income - please verify');
  }

  if (data.totalDeductions > data.grossTotalIncome) {
    warnings.push('Total deductions exceed gross income - please verify');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export default {
  extractTextFromPDF,
  parseForm16,
  validateForm16Data
};
