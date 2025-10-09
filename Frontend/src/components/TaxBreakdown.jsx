import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Calculator, TrendingDown } from 'lucide-react';

const TaxBreakdown = ({ data, regime = 'new' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!data) return null;
  
  const regimeData = regime === 'new' ? data.newRegime : data.oldRegime;
  const formatCurrency = (amount) => `₹${amount?.toLocaleString('en-IN') || 0}`;
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <Calculator className="h-6 w-6 text-blue-600 mr-2" />
          Tax Calculation Breakdown ({regime === 'new' ? 'New Regime' : 'Old Regime'})
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          {isExpanded ? (
            <>
              Hide Details <ChevronUp className="ml-1 h-5 w-5" />
            </>
          ) : (
            <>
              View Details <ChevronDown className="ml-1 h-5 w-5" />
            </>
          )}
        </button>
      </div>
      
      {/* Quick Summary - Always Visible */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Taxable Income</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(regimeData.taxableIncome)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Final Tax Payable</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(regimeData.finalTaxPayable)}</p>
        </div>
      </div>
      
      {/* Detailed Breakdown - Expandable */}
      {isExpanded && (
        <div className="space-y-6 mt-6 border-t pt-6">
          {/* Step 1: Income */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
              Gross Income
            </h4>
            <div className="ml-8 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Income</span>
                <span className="font-semibold">{formatCurrency(data.inputs?.grossSalary)}</span>
              </div>
            </div>
          </div>
          
          {/* Step 2: Deductions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
              Deductions Applied
            </h4>
            <div className="ml-8 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Deductions</span>
                <span className="font-semibold text-green-600">-{formatCurrency(regimeData.deductionsUsed)}</span>
              </div>
              {regime === 'old' && data.inputs?.chapter6ADeductions > 0 && (
                <div className="flex justify-between text-xs text-gray-500 ml-4">
                  <span>• Section 80C/80D</span>
                  <span>{formatCurrency(data.inputs.chapter6ADeductions)}</span>
                </div>
              )}
              {data.inputs?.standardDeduction > 0 && (
                <div className="flex justify-between text-xs text-gray-500 ml-4">
                  <span>• Standard Deduction</span>
                  <span>{formatCurrency(data.inputs.standardDeduction)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Step 3: Taxable Income */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">3</span>
              Taxable Income Calculation
            </h4>
            <div className="ml-8 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Gross Income - Deductions</span>
                <span className="font-bold text-blue-600">{formatCurrency(regimeData.taxableIncome)}</span>
              </div>
              <p className="text-xs text-gray-500 italic mt-2">
                Formula: {formatCurrency(data.inputs?.grossSalary)} - {formatCurrency(regimeData.deductionsUsed)} = {formatCurrency(regimeData.taxableIncome)}
              </p>
            </div>
          </div>
          
          {/* Step 4: Tax Slabs */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">4</span>
              Tax Slab Calculation
            </h4>
            <div className="ml-8 space-y-2">
              {regimeData.slabBreakdown?.map((slab, idx) => (
                <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded">
                  <span className="text-gray-600">
                    {slab.range} @ {slab.rate}
                  </span>
                  <span className="font-semibold">{formatCurrency(slab.tax)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-700 font-medium">Total Slab Tax</span>
                <span className="font-bold">{formatCurrency(regimeData.slabTax)}</span>
              </div>
            </div>
          </div>
          
          {/* Step 5: Cess */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">5</span>
              Health & Education Cess (4%)
            </h4>
            <div className="ml-8 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">4% of Tax Amount</span>
                <span className="font-semibold">{formatCurrency(regimeData.cess)}</span>
              </div>
              <p className="text-xs text-gray-500 italic">
                {formatCurrency(regimeData.tax)} × 4% = {formatCurrency(regimeData.cess)}
              </p>
            </div>
          </div>
          
          {/* Step 6: Rebate (if applicable) */}
          {regimeData.qualifiesForRebate && (
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">6</span>
                Section 87A Rebate Applied! 🎉
              </h4>
              <div className="ml-8 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax Before Rebate</span>
                  <span className="font-semibold">{formatCurrency(regimeData.totalTaxBeforeRebate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Section 87A Rebate</span>
                  <span className="font-semibold text-green-600">-{formatCurrency(regimeData.rebate87A)}</span>
                </div>
                <p className="text-xs text-gray-600 bg-white p-2 rounded mt-2">
                  <Info className="inline h-4 w-4 mr-1" />
                  You qualify for full rebate because your taxable income is ≤ ₹7,00,000
                </p>
              </div>
            </div>
          )}
          
          {/* Final Result */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Final Tax Payable</p>
                <p className="text-3xl font-bold">{formatCurrency(regimeData.finalTaxPayable)}</p>
              </div>
              <TrendingDown className="h-12 w-12 opacity-50" />
            </div>
            {regimeData.finalTaxPayable === 0 && (
              <p className="text-sm mt-3 bg-white/20 p-2 rounded">
                🎊 Congratulations! You have ZERO tax liability after rebate.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxBreakdown;
