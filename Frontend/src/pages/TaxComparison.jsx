import React, { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Calculator } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { translations } from '../data/translations'
import { compareTaxRegimes, formatCurrency } from '../utils/taxCalculations'

const TaxComparison = ({ language }) => {
  const t = translations[language]
  const [salary, setSalary] = useState(800000)
  const [deductions, setDeductions] = useState({
    section80C: 50000,
    section80D: 10000,
    homeLoanInterest: 0,
    otherDeductions: 0
  })
  
  const comparison = compareTaxRegimes(salary, deductions)
  
  const chartData = [
    {
      regime: 'Old Regime',
      'Income Tax': comparison.oldRegime.tax,
      'Cess': comparison.oldRegime.cess,
      'Total': comparison.oldRegime.totalTax
    },
    {
      regime: 'New Regime',
      'Income Tax': comparison.newRegime.tax,
      'Cess': comparison.newRegime.cess,
      'Total': comparison.newRegime.totalTax
    }
  ]
  
  const pieData = [
    { name: 'Tax Payable', value: comparison.oldRegime.totalTax, fill: '#3B82F6' },
    { name: 'Take Home', value: salary - comparison.oldRegime.totalTax, fill: '#10B981' }
  ]
  
  const newRegimePieData = [
    { name: 'Tax Payable', value: comparison.newRegime.totalTax, fill: '#8B5CF6' },
    { name: 'Take Home', value: salary - comparison.newRegime.totalTax, fill: '#10B981' }
  ]
  
  const salaryRanges = [
    { label: '₹3 Lakh', value: 300000 },
    { label: '₹5 Lakh', value: 500000 },
    { label: '₹8 Lakh', value: 800000 },
    { label: '₹12 Lakh', value: 1200000 },
    { label: '₹15 Lakh', value: 1500000 },
    { label: '₹20 Lakh', value: 2000000 },
  ]
  
  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <BarChart3 className="h-10 w-10 text-blue-600 mr-3" />
          {t.comparison}
        </h1>
        <p className="text-xl text-gray-600">
          Compare old vs new tax regime and find the best option for you
        </p>
      </div>
      
      {/* Input Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Salary & Deductions
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Salary (₹)
              </label>
              <div className="flex gap-2 mb-2">
                {salaryRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setSalary(range.value)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      salary === range.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section 80C (₹)
              </label>
              <input
                type="number"
                value={deductions.section80C}
                onChange={(e) => setDeductions(prev => ({ ...prev, section80C: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                max={150000}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section 80D (₹)
              </label>
              <input
                type="number"
                value={deductions.section80D}
                onChange={(e) => setDeductions(prev => ({ ...prev, section80D: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                max={25000}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Home Loan Interest (₹)
              </label>
              <input
                type="number"
                value={deductions.homeLoanInterest}
                onChange={(e) => setDeductions(prev => ({ ...prev, homeLoanInterest: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                max={200000}
              />
            </div>
          </div>
        </div>
        
        {/* Quick Recommendation */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recommendation
          </h2>
          
          <div className={`p-6 rounded-lg border-2 ${
            comparison.recommended === 'new' 
              ? 'border-green-500 bg-green-50' 
              : 'border-blue-500 bg-blue-50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">
                {comparison.recommended === 'new' ? 'New Regime' : 'Old Regime'}
              </h3>
              {comparison.recommended === 'new' ? (
                <TrendingDown className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingUp className="h-8 w-8 text-blue-600" />
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">You save:</span>
                <span className="font-semibold text-xl text-green-600">
                  {formatCurrency(comparison.savings)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Savings percentage:</span>
                <span className="font-semibold text-lg">
                  {comparison.savingsPercentage}%
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-4">
                {comparison.recommended === 'new' 
                  ? 'The new regime offers lower tax rates with limited deductions.'
                  : 'The old regime is better with your current deductions.'
                }
              </div>
            </div>
          </div>
          
          {/* Tax Breakdown */}
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Old Regime</h4>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(comparison.oldRegime.totalTax)}
              </div>
              <div className="text-sm text-gray-600">
                Taxable: {formatCurrency(comparison.oldRegime.taxableIncome)}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">New Regime</h4>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(comparison.newRegime.totalTax)}
              </div>
              <div className="text-sm text-gray-600">
                Taxable: {formatCurrency(comparison.newRegime.taxableIncome)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Tax Comparison Chart
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="regime" />
                <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), '']}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="Income Tax" fill="#3B82F6" />
                <Bar dataKey="Cess" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Pie Charts */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Take Home vs Tax
          </h3>
          <div className="grid grid-cols-1 gap-4 h-80">
            <div>
              <h4 className="text-center font-medium text-gray-700 mb-2">Old Regime</h4>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h4 className="text-center font-medium text-gray-700 mb-2">New Regime</h4>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={newRegimePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                  >
                    {newRegimePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Detailed Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Detailed Tax Breakdown
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Old Regime Breakdown */}
          <div>
            <h4 className="text-lg font-semibold text-blue-600 mb-4 flex items-center">
              <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
              Old Tax Regime
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Gross Salary:</span>
                <span className="font-semibold">{formatCurrency(salary)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Standard Deduction:</span>
                <span className="font-semibold text-green-600">-₹50,000</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Other Deductions:</span>
                <span className="font-semibold text-green-600">
                  -{formatCurrency(comparison.oldRegime.deductionsUsed)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b font-semibold">
                <span>Taxable Income:</span>
                <span>{formatCurrency(comparison.oldRegime.taxableIncome)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Income Tax:</span>
                <span className="font-semibold">{formatCurrency(comparison.oldRegime.tax)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Health & Education Cess (4%):</span>
                <span className="font-semibold">{formatCurrency(comparison.oldRegime.cess)}</span>
              </div>
              <div className="flex justify-between py-3 bg-blue-50 px-4 rounded-lg font-bold text-lg">
                <span>Total Tax:</span>
                <span className="text-blue-600">{formatCurrency(comparison.oldRegime.totalTax)}</span>
              </div>
            </div>
          </div>
          
          {/* New Regime Breakdown */}
          <div>
            <h4 className="text-lg font-semibold text-purple-600 mb-4 flex items-center">
              <div className="w-4 h-4 bg-purple-600 rounded mr-2"></div>
              New Tax Regime
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Gross Salary:</span>
                <span className="font-semibold">{formatCurrency(salary)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Standard Deduction:</span>
                <span className="font-semibold text-green-600">-₹50,000</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Other Deductions:</span>
                <span className="font-semibold text-gray-400">Not Allowed</span>
              </div>
              <div className="flex justify-between py-2 border-b font-semibold">
                <span>Taxable Income:</span>
                <span>{formatCurrency(comparison.newRegime.taxableIncome)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Income Tax:</span>
                <span className="font-semibold">{formatCurrency(comparison.newRegime.tax)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Health & Education Cess (4%):</span>
                <span className="font-semibold">{formatCurrency(comparison.newRegime.cess)}</span>
              </div>
              <div className="flex justify-between py-3 bg-purple-50 px-4 rounded-lg font-bold text-lg">
                <span>Total Tax:</span>
                <span className="text-purple-600">{formatCurrency(comparison.newRegime.totalTax)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaxComparison