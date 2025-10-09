import React, { useState } from 'react'
import { X, Search, HelpCircle, Calculator, Upload, MessageCircle, FileText, BookOpen } from 'lucide-react'
import { translations } from '../data/translations'

const HelpCenter = ({ isOpen, onClose, language = 'en' }) => {
  const t = translations[language]
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  const helpCategories = [
    {
      id: 'calculator',
      icon: Calculator,
      title: t.calculator || 'Tax Calculator',
      articles: [
        {
          title: t.howToCalculateTax || 'How to Calculate Tax',
          content: t.calculatorHelp1 || 'Enter your income details, select deductions, and click Calculate to see your tax liability under both old and new tax regimes.',
        },
        {
          title: t.understandingRegimes || 'Understanding Tax Regimes',
          content: t.calculatorHelp2 || 'Old regime allows deductions under various sections, while new regime offers lower tax rates with fewer deductions.',
        },
        {
          title: t.whatIsStandardDeduction || 'What is Standard Deduction?',
          content: t.calculatorHelp3 || 'Standard deduction is ₹50,000 for salaried individuals, automatically deducted from gross salary.',
        },
      ],
    },
    {
      id: 'upload',
      icon: Upload,
      title: t.upload || 'Document Upload',
      articles: [
        {
          title: t.uploadForm16Help || 'How to Upload Form 16',
          content: t.uploadHelp1 || 'Click the upload area or drag and drop your Form 16 PDF. The system will automatically extract your tax information.',
        },
        {
          title: t.supportedFormats || 'Supported File Formats',
          content: t.uploadHelp2 || 'We support PDF files up to 10MB. Ensure your Form 16 is clear and readable.',
        },
      ],
    },
    {
      id: 'assistant',
      icon: MessageCircle,
      title: t.assistant || 'AI Assistant',
      articles: [
        {
          title: t.howToUseAssistant || 'How to Use AI Assistant',
          content: t.assistantHelp1 || 'Ask any question about Indian Income Tax Act. The AI will provide accurate answers based on official tax documents.',
        },
        {
          title: t.exampleQuestions || 'Example Questions',
          content: t.assistantHelp2 || 'Try asking: "What deductions can I claim?", "How is HRA calculated?", or "Difference between old and new regime?"',
        },
      ],
    },
    {
      id: 'deductions',
      icon: FileText,
      title: t.deductions || 'Tax Deductions',
      articles: [
        {
          title: t.section80C || 'Section 80C Deductions',
          content: t.deductionHelp1 || 'Claim up to ₹1.5 lakh for investments in PPF, ELSS, life insurance, home loan principal, etc.',
        },
        {
          title: t.section80D || 'Section 80D - Medical Insurance',
          content: t.deductionHelp2 || 'Deduct premium paid for health insurance - ₹25,000 for self/family, additional ₹50,000 for parents.',
        },
        {
          title: t.hraDeduction || 'HRA Exemption',
          content: t.deductionHelp3 || 'House Rent Allowance is partially tax-free. Exemption is least of: actual HRA, rent paid minus 10% of salary, or 50%/40% of salary.',
        },
      ],
    },
    {
      id: 'general',
      icon: HelpCircle,
      title: t.generalHelp || 'General Information',
      articles: [
        {
          title: t.whatIsPAN || 'What is PAN Number?',
          content: t.generalHelp1 || 'Permanent Account Number (PAN) is a 10-digit unique identifier issued by Income Tax Department.',
        },
        {
          title: t.assessmentYear || 'Assessment Year vs Financial Year',
          content: t.generalHelp2 || 'Financial Year is when you earn income (Apr-Mar). Assessment Year is next year when you file tax return.',
        },
        {
          title: t.privacyAndSecurity || 'Privacy & Security',
          content: t.generalHelp3 || 'Your documents are processed locally and deleted immediately after calculation. No data is stored permanently.',
        },
      ],
    },
  ]

  const filteredCategories = helpCategories.filter((category) =>
    searchQuery === '' ||
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(
      (article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-white/10 bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Help Center Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
              {t.helpCenter || 'Help Center'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.searchHelp || 'Search for help...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {selectedCategory ? (
            // Show articles for selected category
            <div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-blue-600 hover:text-blue-700 mb-4 flex items-center text-sm"
              >
                ← {t.back || 'Back'}
              </button>
              <div className="space-y-4">
                {helpCategories
                  .find((c) => c.id === selectedCategory)
                  ?.articles.map((article, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-gray-800 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{article.content}</p>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            // Show categories
            <div className="space-y-3">
              {filteredCategories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-lg p-2 mr-3">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {category.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {category.articles.length} {t.articles || 'articles'}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Quick Tips */}
          {!selectedCategory && (
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                {t.quickTips || 'Quick Tips'}
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• {t.tip1 || 'Compare both tax regimes before choosing'}</li>
                <li>• {t.tip2 || 'Keep all investment proofs ready'}</li>
                <li>• {t.tip3 || 'File returns before the deadline'}</li>
                <li>• {t.tip4 || 'Use AI Assistant for instant clarifications'}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Import ChevronRight at the top
import { ChevronRight } from 'lucide-react'

export default HelpCenter
