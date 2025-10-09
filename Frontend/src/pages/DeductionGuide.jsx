import React, { useState } from 'react'
import { BookOpen, Search, Calculator, ChevronRight, Info, DollarSign } from 'lucide-react'
import { translations } from '../data/translations'
import { formatCurrency } from '../utils/taxCalculations'

const DeductionGuide = ({ language }) => {
  const t = translations[language]
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [income, setIncome] = useState(800000)
  
  const deductionCategories = [
    { id: 'all', name: 'All Deductions', icon: BookOpen },
    { id: 'investments', name: 'Investments', icon: DollarSign },
    { id: 'insurance', name: 'Insurance', icon: BookOpen },
    { id: 'loans', name: 'Loans', icon: Calculator },
    { id: 'donations', name: 'Donations', icon: BookOpen },
  ]
  
  const deductions = [
    {
      id: '80C',
      section: 'Section 80C',
      title: 'Investment Deductions',
      category: 'investments',
      maxLimit: 150000,
      description: 'Deductions for various investments and savings',
      items: [
        { name: 'Public Provident Fund (PPF)', limit: 'Up to ₹1.5L', return: '7-8%' },
        { name: 'Equity Linked Savings Scheme (ELSS)', limit: 'Up to ₹1.5L', return: '10-12%' },
        { name: 'National Savings Certificate (NSC)', limit: 'Up to ₹1.5L', return: '6.8%' },
        { name: 'Life Insurance Premium', limit: 'Up to ₹1.5L', return: 'Varies' },
        { name: 'Employee Provident Fund (EPF)', limit: 'Up to ₹1.5L', return: '8.25%' },
        { name: 'Home Loan Principal', limit: 'Up to ₹1.5L', return: 'N/A' },
        { name: 'Tuition Fees (Children)', limit: 'Up to ₹1.5L', return: 'N/A' }
      ],
      taxSaving: Math.min(150000, income * 0.3),
      eligibility: 'All taxpayers under Old Regime'
    },
    {
      id: '80D',
      section: 'Section 80D',
      title: 'Health Insurance Premium',
      category: 'insurance',
      maxLimit: 25000,
      description: 'Deductions for health insurance premiums',
      items: [
        { name: 'Self & Family Premium', limit: 'Up to ₹25,000', return: 'N/A' },
        { name: 'Parents Premium (Below 60)', limit: 'Additional ₹25,000', return: 'N/A' },
        { name: 'Parents Premium (Above 60)', limit: 'Additional ₹50,000', return: 'N/A' },
        { name: 'Preventive Health Check-up', limit: 'Up to ₹5,000', return: 'N/A' }
      ],
      taxSaving: Math.min(25000, income * 0.3),
      eligibility: 'All taxpayers under Old Regime'
    },
    {
      id: '24b',
      section: 'Section 24(b)',
      title: 'Home Loan Interest',
      category: 'loans',
      maxLimit: 200000,
      description: 'Deductions for home loan interest payments',
      items: [
        { name: 'Self-Occupied Property', limit: 'Up to ₹2,00,000', return: 'N/A' },
        { name: 'Let-out Property', limit: 'No limit', return: 'N/A' },
        { name: 'Pre-construction Interest', limit: '1/5th for 5 years', return: 'N/A' }
      ],
      taxSaving: Math.min(200000, income * 0.3),
      eligibility: 'Home loan borrowers under Old Regime'
    },
    {
      id: '80G',
      section: 'Section 80G',
      title: 'Donations to Charity',
      category: 'donations',
      maxLimit: 'Varies',
      description: 'Deductions for donations to approved charitable organizations',
      items: [
        { name: 'PM National Relief Fund', limit: '100% deduction', return: 'N/A' },
        { name: 'Approved NGOs', limit: '50% deduction', return: 'N/A' },
        { name: 'Government Funds', limit: '100% deduction', return: 'N/A' },
        { name: 'Educational Institutions', limit: '50% deduction', return: 'N/A' }
      ],
      taxSaving: 'Varies based on donation',
      eligibility: 'All taxpayers under Old Regime'
    },
    {
      id: '80E',
      section: 'Section 80E',
      title: 'Education Loan Interest',
      category: 'loans',
      maxLimit: 'No limit',
      description: 'Deductions for interest on education loans',
      items: [
        { name: 'Higher Education Loan Interest', limit: 'No limit', return: 'N/A' },
        { name: 'Loan for Self/Spouse/Children', limit: 'No limit', return: 'N/A' },
        { name: 'Vocational Course Loans', limit: 'No limit', return: 'N/A' }
      ],
      taxSaving: 'Based on interest paid',
      eligibility: 'Education loan borrowers under Old Regime'
    },
    {
      id: '80TTA',
      section: 'Section 80TTA',
      title: 'Savings Account Interest',
      category: 'investments',
      maxLimit: 10000,
      description: 'Deductions for interest earned on savings accounts',
      items: [
        { name: 'Bank Savings Account Interest', limit: 'Up to ₹10,000', return: '3-4%' },
        { name: 'Post Office Savings Interest', limit: 'Up to ₹10,000', return: '4%' },
        { name: 'Cooperative Bank Interest', limit: 'Up to ₹10,000', return: 'Varies' }
      ],
      taxSaving: Math.min(10000, income * 0.3),
      eligibility: 'All individual taxpayers under Old Regime'
    }
  ]
  
  const filteredDeductions = deductions.filter(deduction => {
    const matchesSearch = deduction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deduction.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deduction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || deduction.category === selectedCategory
    return matchesSearch && matchesCategory
  })
  
  const totalPotentialSaving = deductions.reduce((total, deduction) => {
    if (typeof deduction.taxSaving === 'number') {
      return total + deduction.taxSaving
    }
    return total
  }, 0)
  
  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <BookOpen className="h-10 w-10 text-blue-600 mr-3" />
          {t.deductions}
        </h1>
        <p className="text-xl text-gray-600">
          Complete guide to income tax deductions and savings
        </p>
      </div>
      
      {/* Income Input & Summary */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Your Annual Income
          </h3>
          <div className="space-y-2">
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your annual income"
            />
            <p className="text-sm text-gray-600">
              This helps calculate potential tax savings
            </p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">
            Potential Tax Savings
          </h3>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(totalPotentialSaving)}
          </div>
          <p className="text-blue-100 text-sm">
            Maximum possible under Old Regime
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">
            Available Deductions
          </h3>
          <div className="text-3xl font-bold mb-1">
            {deductions.length}
          </div>
          <p className="text-green-100 text-sm">
            Major tax-saving sections
          </p>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search deductions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            {deductionCategories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Deductions List */}
      <div className="space-y-6">
        {filteredDeductions.map((deduction) => (
          <div key={deduction.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                      {deduction.section}
                    </span>
                    <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                      Max: {typeof deduction.maxLimit === 'number' ? formatCurrency(deduction.maxLimit) : deduction.maxLimit}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {deduction.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {deduction.description}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {typeof deduction.taxSaving === 'number' 
                      ? formatCurrency(deduction.taxSaving)
                      : deduction.taxSaving
                    }
                  </div>
                  <p className="text-sm text-gray-600">Tax Saving</p>
                </div>
              </div>
              
              {/* Deduction Items */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {deduction.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.limit}</p>
                    </div>
                    {item.return && item.return !== 'N/A' && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">{item.return}</p>
                        <p className="text-xs text-gray-500">Expected Return</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Eligibility */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <Info className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Eligibility:</p>
                  <p className="text-sm text-blue-700">{deduction.eligibility}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredDeductions.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No deductions found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search terms or category filters
          </p>
        </div>
      )}
      
      {/* Planning Tips */}
      <div className="mt-8 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-4">💡 Tax Planning Tips</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Start Early</h4>
            <p className="text-purple-100 text-sm">
              Begin tax planning at the start of the financial year to maximize benefits and avoid last-minute rushes.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Diversify Investments</h4>
            <p className="text-purple-100 text-sm">
              Don't put all your 80C investments in one basket. Spread across PPF, ELSS, and other options.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Keep Records</h4>
            <p className="text-purple-100 text-sm">
              Maintain proper documentation for all investments and expenses to claim deductions smoothly.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Review Annually</h4>
            <p className="text-purple-100 text-sm">
              Tax laws change frequently. Review your strategy annually to ensure optimal tax savings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeductionGuide