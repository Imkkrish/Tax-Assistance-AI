import React from 'react'
import { X, Lightbulb, Calculator, TrendingUp, DollarSign } from 'lucide-react'

const CalculatorGuide = ({ onClose, language = 'en' }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Guide Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Calculator className="h-7 w-7 text-blue-600 mr-3" />
              How to Use Tax Calculator
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Enter Personal Information
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Full Name:</strong> Your complete name as per records</li>
                    <li>• <strong>PAN Number:</strong> 10-character format (e.g., ABCDE1234F)</li>
                    <li className="text-xs text-gray-600 ml-4">5 letters + 4 digits + 1 letter</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Enter Income Details
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Gross Salary:</strong> Your total annual salary <em>before</em> any deductions</li>
                    <li className="text-xs text-gray-600 ml-4">Example: If monthly salary is ₹50,000, enter ₹6,00,000</li>
                    <li className="text-xs text-gray-600 ml-4">Include: Basic + HRA + Allowances + Bonus</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Enter Deductions (Optional - Only for Old Regime)
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>
                      <strong>Section 80C</strong> (Max: ₹1,50,000)
                      <div className="text-xs text-gray-600 ml-4">
                        • PPF contributions<br/>
                        • ELSS mutual funds<br/>
                        • Life insurance premium<br/>
                        • Home loan principal<br/>
                        • Children's tuition fees
                      </div>
                    </li>
                    <li>
                      <strong>Section 80D</strong> (Max: ₹25,000)
                      <div className="text-xs text-gray-600 ml-4">
                        • Health insurance premium for self & family
                      </div>
                    </li>
                    <li>
                      <strong>Home Loan Interest</strong> (Max: ₹2,00,000)
                      <div className="text-xs text-gray-600 ml-4">
                        • Interest paid on home loan (Section 24b)
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Click "Calculate" Button
                  </h3>
                  <p className="text-sm text-gray-700">
                    The system will automatically calculate your tax liability under both regimes and recommend the best option for you.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Points */}
            <div className="border-l-4 border-blue-600 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                Important Points
              </h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span><strong>Standard Deduction (₹50,000)</strong> is automatically applied to both regimes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span><strong>New Regime</strong> has lower tax rates but doesn't allow most deductions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span><strong>Old Regime</strong> allows deductions but has higher tax rates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>4% Health & Education Cess is added to calculated tax</span>
                </li>
              </ul>
            </div>

            {/* Example */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                Quick Example
              </h3>
              <div className="bg-white rounded p-3 text-sm">
                <p className="font-medium mb-2">For Annual Salary: ₹8,00,000</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-blue-600">Old Regime</p>
                    <p>With ₹1,50,000 in 80C</p>
                    <p className="font-bold">Tax: ~₹36,400</p>
                  </div>
                  <div>
                    <p className="font-semibold text-green-600">New Regime</p>
                    <p>No deductions</p>
                    <p className="font-bold">Tax: ~₹49,400</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  💡 <strong>Recommendation:</strong> Old Regime saves ₹13,000
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Got It! Start Calculating
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CalculatorGuide
