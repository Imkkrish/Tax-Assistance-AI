import React, { useState } from 'react'
import { Calculator, Info, TrendingUp, TrendingDown, HelpCircle, Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { translations } from '../data/translations'
import { compareTaxRegimes, formatCurrency, validatePAN } from '../utils/taxCalculations'
import apiClient from '../utils/api'
import CalculatorGuide from '../components/CalculatorGuide'
import TaxBreakdown from '../components/TaxBreakdown'
import RebateExplainerTooltip from '../components/RebateExplainerTooltip'
import MissedSavingsAlert from '../components/MissedSavingsAlert'
import SmartSuggestions from '../components/SmartSuggestions'

const taxFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  pan: z.string().refine(validatePAN, 'Invalid PAN format'),
  grossSalary: z.coerce.number().min(0, 'Salary must be positive'),
  section80C: z.coerce.number().min(0).max(150000, 'Max limit is ₹1,50,000'),
  section80D: z.coerce.number().min(0).max(25000, 'Max limit is ₹25,000'),
  homeLoanInterest: z.coerce.number().min(0).max(200000, 'Max limit is ₹2,00,000'),
  otherDeductions: z.coerce.number().min(0, 'Must be positive'),
})

const TaxCalculator = ({ language }) => {
  const t = translations[language]
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      name: '',
      pan: '',
      grossSalary: 0,
      section80C: 0,
      section80D: 0,
      homeLoanInterest: 0,
      otherDeductions: 0,
    }
  })
  
  // Load sample data
  const loadSampleData = () => {
    setValue('name', 'Sample User')
    setValue('pan', 'ABCDE1234F')
    setValue('grossSalary', 800000)
    setValue('section80C', 150000)
    setValue('section80D', 25000)
    setValue('homeLoanInterest', 0)
    setValue('otherDeductions', 0)
    toast.success('Sample data loaded! Click Calculate to see results')
  }
  

  
  const onSubmit = async (data) => {
    setLoading(true)
    
    try {
      const deductions = {
        section80C: data.section80C,
        section80D: data.section80D,
        homeLoanInterest: data.homeLoanInterest,
        otherDeductions: data.otherDeductions,
      }
      
      // Prepare payload for API calls
      const payload = {
        income: {
          salary: data.grossSalary,
          houseProperty: 0,
          business: 0,
          capitalGains: 0,
          otherSources: 0
        },
        deductions: {
          section80c: data.section80C,
          section80d: data.section80D,
          section24b: data.homeLoanInterest,
          hra: 0,
          lta: 0,
          standardDeduction: 50000,
          other: data.otherDeductions
        },
        taxPaid: {
          tds: 0,
          advanceTax: 0,
          selfAssessment: 0
        },
        financialYear: 'FY2024-25'
      }

      // Try enhanced API first
      try {
        const enhancedRes = await apiClient.compareEnhancedRegimes(payload)
        if (enhancedRes?.success && enhancedRes?.data) {
          const r = enhancedRes.data
          
          // Calculate safe savings percentage
          const maxTax = Math.max(r.oldRegime.finalTaxPayable || 0, r.newRegime.finalTaxPayable || 0)
          const savingsPercentage = maxTax > 0 ? ((r.savings / maxTax) * 100).toFixed(2) : 0
          
          setResults({
            // Input Summary
            grossIncome: r.grossIncome || data.grossSalary,
            totalDeductions: r.totalDeductions || (data.section80C + data.section80D + data.homeLoanInterest + data.otherDeductions),
            
            // Comparison Summary
            recommended: r.recommendedRegime,
            savings: r.savings,
            savingsPercentage: savingsPercentage,
            rebateMessage: r.rebateMessage,
            
            // Old Regime Details
            oldRegime: {
              taxableIncome: r.oldRegime.taxableIncome || 0,
              tax: r.oldRegime.tax || 0,
              cess: r.oldRegime.cess || 0,
              taxBeforeRebate: r.oldRegime.taxBeforeRebate || r.oldRegime.totalTaxBeforeRebate || r.oldRegime.totalTax || 0,
              totalTax: r.oldRegime.totalTax || r.oldRegime.taxBeforeRebate || 0,
              totalTaxBeforeRebate: r.oldRegime.totalTaxBeforeRebate || r.oldRegime.taxBeforeRebate || r.oldRegime.totalTax || 0,
              rebate87A: r.oldRegime.rebate87A || 0,
              qualifiesForRebate: r.oldRegime.qualifiesForRebate || false,
              rebateThreshold: r.oldRegime.rebateThreshold || 500000,
              rebateCap: r.oldRegime.rebateCap || 12500,
              finalTaxPayable: r.oldRegime.finalTaxPayable || 0
            },
            
            // New Regime Details
            newRegime: {
              taxableIncome: r.newRegime.taxableIncome || 0,
              tax: r.newRegime.tax || 0,
              cess: r.newRegime.cess || 0,
              taxBeforeRebate: r.newRegime.taxBeforeRebate || r.newRegime.totalTaxBeforeRebate || r.newRegime.totalTax || 0,
              totalTax: r.newRegime.totalTax || r.newRegime.taxBeforeRebate || 0,
              totalTaxBeforeRebate: r.newRegime.totalTaxBeforeRebate || r.newRegime.taxBeforeRebate || r.newRegime.totalTax || 0,
              rebate87A: r.newRegime.rebate87A || 0,
              qualifiesForRebate: r.newRegime.qualifiesForRebate || false,
              rebateThreshold: r.newRegime.rebateThreshold || 700000,
              rebateCap: r.newRegime.rebateCap || null,
              finalTaxPayable: r.newRegime.finalTaxPayable || 0
            }
          })
          
          // Fetch smart deduction suggestions
          try {
            const suggestionsPayload = {
              grossSalary: data.grossSalary,
              currentDeductions: {
                section80c: data.section80C,
                section80d: data.section80D,
                section24b: data.homeLoanInterest,
                nps: 0,
                other: data.otherDeductions
              },
              age: 30, // Default, can be added to form
              hasHealthInsurance: data.section80D > 0,
              hasHomeLoan: data.homeLoanInterest > 0,
              isRenting: false, // Can be added to form
              cityType: 'metro', // Can be added to form
              hasParents: false, // Can be added to form
              parentsAge: 0
            }
            
            const suggestionsRes = await apiClient.post('/api/enhanced-tax/suggestions', suggestionsPayload)
            if (suggestionsRes?.data?.success) {
              setSuggestions(suggestionsRes.data.data)
            }
          } catch (suggestionsError) {
            console.warn('Failed to fetch suggestions:', suggestionsError)
          }
          
          toast.success('Tax calculation completed with enhanced engine!')
          return
        }
      } catch (enhancedError) {
        console.warn('Enhanced API failed, trying fallback:', enhancedError)
      }

      // Fallback to existing API if authenticated
      if (apiClient.token) {
        try {
          const res = await apiClient.compareTaxRegimes(payload)
          const r = res?.data
          if (r) {
            setResults({
              recommended: r.recommendedRegime,
              savings: r.savings,
              savingsPercentage: r.oldRegime.taxableIncome > 0 ? ((r.oldRegime.totalTax - r.newRegime.totalTax) / (r.oldRegime.totalTax || 1) * 100).toFixed(2) : 0,
              oldRegime: {
                taxableIncome: r.oldRegime.taxableIncome,
                tax: r.oldRegime.totalTax - (r.oldRegime.totalTax * 0.04),
                cess: r.oldRegime.totalTax * 0.04,
                totalTax: r.oldRegime.totalTax
              },
              newRegime: {
                taxableIncome: r.newRegime.taxableIncome,
                tax: r.newRegime.totalTax - (r.newRegime.totalTax * 0.04),
                cess: r.newRegime.totalTax * 0.04,
                totalTax: r.newRegime.totalTax
              }
            })
            toast.success('Tax calculation completed!')
            return
          }
        } catch (apiError) {
          console.warn('API calculation failed, using local:', apiError)
        }
      }

      // Final fallback to local calculation
      const comparison = compareTaxRegimes(data.grossSalary, deductions)
      setResults(comparison)
      toast.success('Tax calculation completed locally!')
      
    } catch (error) {
      toast.error('Error calculating tax')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  const resetForm = () => {
    reset()
    setResults(null)
    toast.success('Form reset successfully')
  }
  
  const InfoTooltip = ({ text }) => (
    <div className="group relative inline-block ml-1">
      <Info className="h-4 w-4 text-gray-400 cursor-help" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
        {text}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  )
  
  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <Calculator className="h-10 w-10 text-blue-600 mr-3" />
          {t.calculator}
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Calculate your income tax for both old and new regimes
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setShowGuide(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <HelpCircle className="h-5 w-5 mr-2" />
            How to Use This Calculator
          </button>
          <button
            onClick={loadSampleData}
            className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Zap className="h-5 w-5 mr-2" />
            Try with Sample Data
          </button>
        </div>
      </div>
      
      {showGuide && <CalculatorGuide onClose={() => setShowGuide(false)} language={language} />}
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Enter Your Details
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                {t.personalInfo}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.name} *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.pan} *
                  <InfoTooltip text="Format: ABCDE1234F" />
                </label>
                <input
                  type="text"
                  {...register('pan')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
                {errors.pan && (
                  <p className="text-red-500 text-sm mt-1">{errors.pan.message}</p>
                )}
              </div>
            </div>
            
            {/* Income Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                {t.incomeDetails}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.grossSalary} (₹) *
                  <InfoTooltip text="Total salary before any deductions" />
                </label>
                <input
                  type="number"
                  {...register('grossSalary')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="600000"
                />
                {errors.grossSalary && (
                  <p className="text-red-500 text-sm mt-1">{errors.grossSalary.message}</p>
                )}
              </div>
            </div>
            
            {/* Deductions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                {t.deductionsSection}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.section80C} (₹)
                  <InfoTooltip text="PPF, ELSS, Life Insurance, etc. Max: ₹1,50,000" />
                </label>
                <input
                  type="number"
                  {...register('section80C')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  max={150000}
                />
                {errors.section80C && (
                  <p className="text-red-500 text-sm mt-1">{errors.section80C.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.section80D} (₹)
                  <InfoTooltip text="Health Insurance Premium. Max: ₹25,000" />
                </label>
                <input
                  type="number"
                  {...register('section80D')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  max={25000}
                />
                {errors.section80D && (
                  <p className="text-red-500 text-sm mt-1">{errors.section80D.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.homeLoanInterest} (₹)
                  <InfoTooltip text="Home Loan Interest under Section 24(b). Max: ₹2,00,000" />
                </label>
                <input
                  type="number"
                  {...register('homeLoanInterest')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  max={200000}
                />
                {errors.homeLoanInterest && (
                  <p className="text-red-500 text-sm mt-1">{errors.homeLoanInterest.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Deductions (₹)
                  <InfoTooltip text="Other applicable deductions" />
                </label>
                <input
                  type="number"
                  {...register('otherDeductions')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                {errors.otherDeductions && (
                  <p className="text-red-500 text-sm mt-1">{errors.otherDeductions.message}</p>
                )}
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Calculating...' : t.calculate}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200"
              >
                {t.reset}
              </button>
            </div>
          </form>
        </div>
        
        {/* Results */}
        <div className="space-y-6">
          {results ? (
            <>
              {/* Missed Savings Alert */}
              {suggestions && suggestions.totalPotentialSavings > 0 && (
                <MissedSavingsAlert
                  totalSaving={suggestions.totalPotentialSavings}
                  suggestions={suggestions.suggestions || []}
                  urgency={suggestions.totalPotentialSavings > 30000 ? 'critical' : 'high'}
                  onDismiss={() => setSuggestions(null)}
                  onViewDetails={() => setShowSmartSuggestions(true)}
                />
              )}

              {/* Recommendation Card */}
              <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                results.recommended === 'new' ? 'border-green-500' : 'border-blue-500'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {t.recommended}
                  </h3>
                  {results.recommended === 'new' ? (
                    <TrendingDown className="h-6 w-6 text-green-500" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                <p className="text-2xl font-bold mb-2">
                  {results.recommended === 'new' ? t.newRegime : t.oldRegime}
                </p>
                <p className="text-gray-600 mb-2">
                  You save {formatCurrency(results.savings)} ({results.savingsPercentage}%)
                </p>
                {/* Show rebate message if applicable */}
                {results.rebateMessage && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    {results.rebateMessage}
                  </div>
                )}
              </div>
              
              {/* Combined Zero Tax Banner - When Both Regimes Result in ₹0 Tax */}
              {results.bothRegimesZeroTax && results.combinedRebateMessage && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-300">
                  <div className="flex items-start space-x-3">
                    <span className="text-3xl">🎉</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-green-800 mb-2">
                        Excellent News! Zero Tax Liability
                      </h3>
                      <p className="text-green-700 mb-3">
                        {results.combinedRebateMessage}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white p-3 rounded-lg border border-green-200">
                          <p className="text-gray-600 text-xs mb-1">Old Regime Rebate</p>
                          <p className="text-green-700 font-bold">₹{results.oldRegime.rebate87A?.toLocaleString() || 0}</p>
                          <p className="text-xs text-gray-500 mt-1">{results.oldRegime.rebateReason || "Taxable ≤ ₹5L"}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-green-200">
                          <p className="text-gray-600 text-xs mb-1">New Regime Rebate</p>
                          <p className="text-green-700 font-bold">₹{results.newRegime.rebate87A?.toLocaleString() || 0}</p>
                          <p className="text-xs text-gray-500 mt-1">{results.newRegime.rebateReason || "Taxable ≤ ₹7L"}</p>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-800">
                          💡 <strong>Recommendation:</strong> Choose New Regime for simpler compliance and higher rebate ceiling.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Income & Deduction Summary Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                  Income & Deductions Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Gross Income:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(results.grossIncome || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Total Deductions:</span>
                    <span className="text-xl font-bold text-green-600">
                      -{formatCurrency(results.totalDeductions || 0)}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-semibold">Taxable Income (Old):</span>
                      <span className="text-xl font-bold text-gray-800">
                        {formatCurrency(results.oldRegime?.taxableIncome || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-800 font-semibold">Taxable Income (New):</span>
                      <span className="text-xl font-bold text-gray-800">
                        {formatCurrency(results.newRegime?.taxableIncome || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Comparison Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Old Regime */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                    {t.oldRegime}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxable Income:</span>
                      <span className="font-semibold">{formatCurrency(results.oldRegime.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income Tax:</span>
                      <span className="font-semibold">{formatCurrency(results.oldRegime.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cess (4%):</span>
                      <span className="font-semibold">{formatCurrency(results.oldRegime.cess)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-base">
                        <span className="font-semibold text-gray-700">Tax Before Rebate:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(results.oldRegime.taxBeforeRebate || results.oldRegime.totalTax)}</span>
                      </div>
                    </div>
                    {results.oldRegime.rebate87A > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold text-blue-800 flex items-center">
                            Section 87A Rebate:
                            <RebateExplainerTooltip 
                              regime="old"
                              taxableIncome={results.oldRegime.taxableIncome}
                              taxBeforeRebate={results.oldRegime.taxBeforeRebate || results.oldRegime.totalTax}
                              rebate={results.oldRegime.rebate87A}
                              threshold={500000}
                            />
                          </span>
                          <span className="text-base font-bold text-green-600">-{formatCurrency(results.oldRegime.rebate87A)}</span>
                        </div>
                        <p className="text-xs text-blue-700">
                          {results.oldRegime.rebateReason || "Taxable ≤ ₹5L (capped at ₹12,500)"}
                        </p>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-blue-800">Final Tax Payable:</span>
                        <span className={`font-bold ${results.oldRegime.finalTaxPayable === 0 ? "text-green-600" : "text-blue-600"}`}>
                          {formatCurrency(results.oldRegime.finalTaxPayable)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Show celebration only when final tax is zero */}
                    {results.oldRegime.finalTaxPayable === 0 && results.oldRegime.rebate87A > 0 && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">🎉</span>
                          <div>
                            <p className="text-sm font-semibold text-green-800">No Tax Payable!</p>
                            <p className="text-xs text-green-700">
                              {results.oldRegime.rebateMessage || `₹${results.oldRegime.rebate87A.toLocaleString()} rebate — tax fully covered`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* New Regime */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                    {t.newRegime}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxable Income:</span>
                      <span className="font-semibold">{formatCurrency(results.newRegime.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income Tax:</span>
                      <span className="font-semibold">{formatCurrency(results.newRegime.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cess (4%):</span>
                      <span className="font-semibold">{formatCurrency(results.newRegime.cess)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-base">
                        <span className="font-semibold text-gray-700">Tax Before Rebate:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(results.newRegime.taxBeforeRebate || results.newRegime.totalTax)}</span>
                      </div>
                    </div>
                    {results.newRegime.rebate87A > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold text-green-800 flex items-center">
                            Section 87A Rebate:
                            <RebateExplainerTooltip 
                              regime="new"
                              taxableIncome={results.newRegime.taxableIncome}
                              taxBeforeRebate={results.newRegime.taxBeforeRebate || results.newRegime.totalTax}
                              rebate={results.newRegime.rebate87A}
                              threshold={700000}
                            />
                          </span>
                          <span className="text-base font-bold text-green-600">-{formatCurrency(results.newRegime.rebate87A)}</span>
                        </div>
                        <p className="text-xs text-green-700">
                          {results.newRegime.rebateReason || "Taxable ≤ ₹7L (full rebate, no cap)"}
                        </p>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-green-800">Final Tax Payable:</span>
                        <span className={`font-bold ${results.newRegime.finalTaxPayable === 0 ? "text-green-600" : "text-green-700"}`}>
                          {formatCurrency(results.newRegime.finalTaxPayable)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Show celebration only when final tax is zero */}
                    {results.newRegime.finalTaxPayable === 0 && results.newRegime.rebate87A > 0 && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">🎉</span>
                          <div>
                            <p className="text-sm font-semibold text-green-800">No Tax Payable!</p>
                            <p className="text-xs text-green-700">
                              {results.newRegime.rebateMessage || `₹${results.newRegime.rebate87A.toLocaleString()} rebate — tax fully covered`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Detailed Tax Breakdown - NEW FEATURE */}
              <TaxBreakdown data={results} regime={results.recommendedRegime || results.recommended} />
              
              {/* Smart Deduction Suggestions - AI-POWERED */}
              {suggestions && (showSmartSuggestions || suggestions.totalPotentialSavings > 0) && (
                <SmartSuggestions
                  suggestions={suggestions.suggestions || []}
                  totalPotentialSaving={suggestions.totalPotentialSavings || 0}
                  stats={suggestions.summary || {}}
                />
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Ready to Calculate
              </h3>
              <p className="text-gray-600">
                Fill in your details to see your tax calculation and regime comparison
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaxCalculator