import React, { useState, useEffect } from 'react'
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle, Calculator, DollarSign } from 'lucide-react'

const DeductionRecommender = ({ income, currentDeductions = {}, language = 'en' }) => {
  const [recommendations, setRecommendations] = useState([])
  const [potentialSavings, setPotentialSavings] = useState(0)

  useEffect(() => {
    generateRecommendations()
  }, [income, currentDeductions])

  const generateRecommendations = () => {
    const recs = []
    let totalSavings = 0

    // Section 80C
    const section80CUsed = parseInt(currentDeductions.section80C) || 0
    const section80CLimit = 150000
    if (section80CUsed < section80CLimit) {
      const gap = section80CLimit - section80CUsed
      const estimatedSaving = gap * 0.30 // Assuming 30% tax bracket
      recs.push({
        section: '80C',
        title: 'Maximize Section 80C Investments',
        priority: 'high',
        currentAmount: section80CUsed,
        maxLimit: section80CLimit,
        gap: gap,
        estimatedSaving: estimatedSaving,
        description: 'You can save more taxes by maximizing your Section 80C investments',
        suggestions: [
          `PPF (Public Provident Fund) - Safe, government-backed, 7-8% returns`,
          `ELSS (Equity Linked Savings Scheme) - Market-linked, potential for higher returns`,
          `Life Insurance Premium - Protection + Tax benefit`,
          `Home Loan Principal - If you have a home loan`,
          `NSC (National Savings Certificate) - Fixed returns, government-backed`
        ],
        actionSteps: [
          'Open a PPF account online through your bank',
          'Start SIP in ELSS mutual funds',
          'Pay life insurance premium before March 31st',
          'Keep investment proofs ready for ITR filing'
        ]
      })
      totalSavings += estimatedSaving
    }

    // Section 80D
    const section80DUsed = parseInt(currentDeductions.section80D) || 0
    const section80DLimit = 25000
    const section80DParentsLimit = 50000 // For senior citizen parents
    if (section80DUsed < section80DLimit) {
      const gap = section80DLimit - section80DUsed
      const estimatedSaving = gap * 0.30
      recs.push({
        section: '80D',
        title: 'Health Insurance Premium Deduction',
        priority: 'high',
        currentAmount: section80DUsed,
        maxLimit: section80DLimit,
        gap: gap,
        estimatedSaving: estimatedSaving,
        description: 'Get tax benefits while securing your family\'s health',
        suggestions: [
          `Health insurance for self & family - Up to ₹25,000`,
          `Parents' health insurance (if senior citizens) - Additional ₹50,000`,
          `Preventive health check-up - Up to ₹5,000 included`
        ],
        actionSteps: [
          'Buy comprehensive health insurance policy',
          'Include preventive health check-ups',
          'Consider separate policy for parents',
          'Keep premium payment receipts'
        ]
      })
      totalSavings += estimatedSaving
    }

    // Section 80CCD(1B)
    const section80CCD1BUsed = parseInt(currentDeductions.section80CCD1B) || 0
    const section80CCD1BLimit = 50000
    if (section80CCD1BUsed < section80CCD1BLimit) {
      const gap = section80CCD1BLimit - section80CCD1BUsed
      const estimatedSaving = gap * 0.30
      recs.push({
        section: '80CCD(1B)',
        title: 'Additional NPS Contribution',
        priority: 'medium',
        currentAmount: section80CCD1BUsed,
        maxLimit: section80CCD1BLimit,
        gap: gap,
        estimatedSaving: estimatedSaving,
        description: 'Additional deduction over and above Section 80C',
        suggestions: [
          `National Pension System (NPS) - Long-term retirement planning`,
          `Market-linked returns with tax benefits`,
          `Separate from 80C limit - Extra ₹50,000 deduction`
        ],
        actionSteps: [
          'Open NPS account online',
          'Invest before March 31st',
          'Choose auto/active choice wisely',
          'Download contribution statement'
        ]
      })
      totalSavings += estimatedSaving
    }

    // Home Loan Interest (Section 24b)
    const homeLoanInterestUsed = parseInt(currentDeductions.homeLoanInterest) || 0
    const homeLoanInterestLimit = 200000
    if (homeLoanInterestUsed === 0) {
      recs.push({
        section: '24(b)',
        title: 'Home Loan Interest Deduction',
        priority: 'medium',
        currentAmount: homeLoanInterestUsed,
        maxLimit: homeLoanInterestLimit,
        gap: homeLoanInterestLimit,
        estimatedSaving: homeLoanInterestLimit * 0.30,
        description: 'If you have a home loan, claim interest deduction',
        suggestions: [
          `Interest paid on home loan - Up to ₹2,00,000`,
          `Available only in Old Tax Regime`,
          `Self-occupied property benefit`
        ],
        actionSteps: [
          'Get interest certificate from bank',
          'Ensure property is self-occupied',
          'Keep loan account statement ready'
        ]
      })
    }

    // Section 80E (Education Loan)
    const section80EUsed = parseInt(currentDeductions.section80E) || 0
    if (section80EUsed === 0) {
      recs.push({
        section: '80E',
        title: 'Education Loan Interest Deduction',
        priority: 'low',
        currentAmount: section80EUsed,
        maxLimit: 'No limit',
        gap: 'Variable',
        estimatedSaving: 'Depends on interest paid',
        description: 'If you have an education loan, the entire interest is deductible',
        suggestions: [
          `No upper limit on deduction amount`,
          `Available for 8 years from first EMI`,
          `For higher education (self, spouse, children)`
        ],
        actionSteps: [
          'Get interest certificate from bank',
          'Claim for full assessment year',
          'Keep loan sanction letter'
        ]
      })
    }

    // Section 80G (Donations)
    const section80GUsed = parseInt(currentDeductions.section80G) || 0
    if (section80GUsed === 0 && income > 500000) {
      recs.push({
        section: '80G',
        title: 'Donation to Charity',
        priority: 'low',
        currentAmount: section80GUsed,
        maxLimit: 'Varies',
        gap: 'Variable',
        estimatedSaving: 'Up to 50-100% of donation',
        description: 'Donate to eligible charitable institutions and get tax benefits',
        suggestions: [
          `PM CARES Fund - 100% deduction`,
          `Recognized charitable trusts - 50% deduction`,
          `Government-approved NGOs`
        ],
        actionSteps: [
          'Donate to eligible institutions only',
          'Get 80G certificate',
          'Keep donation receipts',
          'Verify organization eligibility'
        ]
      })
    }

    // Income-based recommendations
    if (income > 1000000) {
      recs.push({
        section: 'HRA',
        title: 'House Rent Allowance Optimization',
        priority: 'high',
        description: 'Maximize HRA exemption if living in rented accommodation',
        suggestions: [
          `HRA exemption = Min of (Actual HRA, Rent - 10% of salary, 50% of salary for metro/40% for non-metro)`,
          `Keep rent receipts and rental agreement`,
          `Landlord's PAN required if rent > ₹1 lakh/year`,
          `Available only in Old Tax Regime`
        ],
        actionSteps: [
          'Maintain rent receipts',
          'Get rental agreement',
          'Collect landlord PAN',
          'Calculate optimal rent amount'
        ]
      })
    }

    // Missed opportunities alert
    if (income > 800000 && totalSavings > 30000) {
      recs.unshift({
        section: 'ALERT',
        title: '⚠️ High Tax Savings Opportunity Detected!',
        priority: 'critical',
        estimatedSaving: totalSavings,
        description: `You could save up to ₹${totalSavings.toLocaleString('en-IN')} in taxes by optimizing your investments`,
        suggestions: [
          'Act before March 31st deadline',
          'Prioritize high-impact deductions first',
          'Consider consulting a tax advisor',
          'Plan investments for next year now'
        ],
        actionSteps: [
          'Start with Section 80C investments immediately',
          'Buy health insurance if not already covered',
          'Open NPS account for additional deduction',
          'Review and optimize all available deductions'
        ]
      })
    }

    setRecommendations(recs)
    setPotentialSavings(totalSavings)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="h-6 w-6" />
      case 'high':
        return <TrendingUp className="h-6 w-6" />
      case 'medium':
        return <Lightbulb className="h-6 w-6" />
      case 'low':
        return <CheckCircle className="h-6 w-6" />
      default:
        return <Lightbulb className="h-6 w-6" />
    }
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <h3 className="text-xl font-bold text-green-800">All Optimized! 🎉</h3>
        </div>
        <p className="text-green-700">
          You're making the most of available tax deductions. Keep it up!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Savings Summary */}
      {potentialSavings > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Potential Tax Savings</p>
              <p className="text-4xl font-bold">₹{potentialSavings.toLocaleString('en-IN')}</p>
              <p className="text-sm opacity-90 mt-2">
                By maximizing your deductions, you could save this much!
              </p>
            </div>
            <DollarSign className="h-16 w-16 opacity-50" />
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Lightbulb className="h-7 w-7 text-yellow-500" />
          Personalized Recommendations
        </h3>

        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`border-2 rounded-xl p-6 ${getPriorityColor(rec.priority)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getPriorityIcon(rec.priority)}
                <div>
                  <h4 className="text-xl font-bold">{rec.title}</h4>
                  {rec.section !== 'ALERT' && rec.section !== 'HRA' && (
                    <p className="text-sm opacity-75">Section {rec.section}</p>
                  )}
                </div>
              </div>
              {rec.estimatedSaving && typeof rec.estimatedSaving === 'number' && (
                <div className="text-right">
                  <p className="text-sm opacity-75">Potential Saving</p>
                  <p className="text-2xl font-bold">
                    ₹{rec.estimatedSaving.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>

            <p className="mb-4">{rec.description}</p>

            {rec.currentAmount !== undefined && rec.maxLimit && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Current: ₹{rec.currentAmount.toLocaleString('en-IN')}</span>
                  <span>
                    Max: {typeof rec.maxLimit === 'number' 
                      ? `₹${rec.maxLimit.toLocaleString('en-IN')}`
                      : rec.maxLimit
                    }
                  </span>
                </div>
                {typeof rec.maxLimit === 'number' && (
                  <div className="w-full bg-white/50 rounded-full h-2">
                    <div
                      className="bg-current rounded-full h-2 transition-all duration-300"
                      style={{ width: `${(rec.currentAmount / rec.maxLimit) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <p className="font-semibold mb-2">💡 Suggestions:</p>
                <ul className="space-y-1 text-sm">
                  {rec.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {rec.actionSteps && (
                <div>
                  <p className="font-semibold mb-2">✅ Action Steps:</p>
                  <ol className="space-y-1 text-sm">
                    {rec.actionSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-bold">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* General Tips */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          General Tax Saving Tips
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Plan your tax-saving investments early in the financial year</li>
          <li>• Don't wait until March to make investments</li>
          <li>• Keep all investment proofs and receipts organized</li>
          <li>• Review and update your deductions annually</li>
          <li>• Consider both old and new tax regimes before choosing</li>
          <li>• Consult a tax professional for complex situations</li>
        </ul>
      </div>
    </div>
  )
}

export default DeductionRecommender
