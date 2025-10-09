import React, { useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Tooltip component with Section 87A rebate explanation
 */
const RebateExplainerTooltip = ({ regime, taxableIncome, taxBeforeRebate, rebate, threshold }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const isOldRegime = regime === 'old';
  const rebateCap = isOldRegime ? 12500 : 25000;
  const thresholdFormatted = (threshold / 100000).toFixed(1);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
        aria-label="Section 87A rebate explanation"
      >
        <Info className="h-4 w-4" />
      </button>
      
      {showTooltip && (
        <div className="absolute z-50 w-80 p-4 bg-white border-2 border-blue-300 rounded-lg shadow-xl -top-2 left-6 transform transition-all">
          <div className="absolute -left-2 top-3 w-4 h-4 bg-white border-l-2 border-b-2 border-blue-300 transform rotate-45"></div>
          
          <h4 className="font-bold text-gray-800 mb-2 flex items-center">
            <span className="text-blue-600 mr-2">ℹ️</span>
            Section 87A Rebate Explained
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="bg-blue-50 p-2 rounded">
              <p className="font-semibold text-blue-800">Your Taxable Income:</p>
              <p className="text-blue-700">₹{(taxableIncome / 100000).toFixed(2)} Lakhs</p>
            </div>
            
            <div className="bg-green-50 p-2 rounded">
              <p className="font-semibold text-green-800">Eligibility Rule:</p>
              <p className="text-green-700">
                {isOldRegime ? 'Old Regime' : 'New Regime'}: Taxable ≤ ₹{thresholdFormatted}L
              </p>
              <p className="text-xs text-green-600 mt-1">
                ✅ You qualify! Income is below threshold.
              </p>
            </div>
            
            <div className="bg-yellow-50 p-2 rounded">
              <p className="font-semibold text-yellow-800">Rebate Calculation:</p>
              <p className="text-yellow-700 text-xs">
                Tax Before Rebate: ₹{taxBeforeRebate.toLocaleString()}
              </p>
              <p className="text-yellow-700 text-xs">
                {isOldRegime 
                  ? `Rebate = min(₹${rebateCap.toLocaleString()}, ₹${taxBeforeRebate.toLocaleString()})` 
                  : `Rebate = ₹${taxBeforeRebate.toLocaleString()} (no cap)`
                }
              </p>
              <p className="text-yellow-700 text-xs font-bold mt-1">
                = ₹{rebate.toLocaleString()}
              </p>
            </div>
            
            <div className="bg-green-50 p-2 rounded border-2 border-green-300">
              <p className="font-bold text-green-800">Final Result:</p>
              <p className="text-green-700 text-xs">
                Final Tax = ₹{taxBeforeRebate.toLocaleString()} − ₹{rebate.toLocaleString()} = ₹0
              </p>
              <p className="text-xs text-green-600 mt-1">
                🎉 Section 87A rebate fully cancels your tax liability!
              </p>
            </div>
            
            <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 italic">
              <p>📚 As per Income Tax Act, 1961 - Section 87A</p>
              <p className="mt-1">FY 2024-25 provisions</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RebateExplainerTooltip;
