import React, { useState } from 'react'
import { ChevronRight, ChevronLeft, Check, User, DollarSign, FileText, Calculator, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const TaxFilingWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    name: '',
    pan: '',
    dob: '',
    email: '',
    phone: '',
    
    // Step 2: Income Details
    salary: '',
    houseProperty: '',
    businessIncome: '',
    capitalGains: '',
    otherIncome: '',
    
    // Step 3: Deductions
    section80C: '',
    section80D: '',
    homeLoanInterest: '',
    section80CCD1B: '',
    section80E: '',
    section80G: '',
    
    // Step 4: Tax Regime
    taxRegime: 'new',
    
    // Step 5: Review
    acceptTerms: false
  })

  const steps = [
    { id: 1, title: 'Personal Info', icon: User, description: 'Basic details' },
    { id: 2, title: 'Income', icon: DollarSign, description: 'All income sources' },
    { id: 3, title: 'Deductions', icon: FileText, description: 'Claim benefits' },
    { id: 4, title: 'Tax Regime', icon: Calculator, description: 'Choose best option' },
    { id: 5, title: 'Review & File', icon: Download, description: 'Final submission' }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.name || !formData.pan || !formData.email) {
          toast.error('Please fill all required fields')
          return false
        }
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
          toast.error('Invalid PAN format')
          return false
        }
        return true
      case 2:
        if (!formData.salary && !formData.businessIncome) {
          toast.error('Please enter at least one income source')
          return false
        }
        return true
      case 3:
        return true // Deductions are optional
      case 4:
        return true // Tax regime is pre-selected
      case 5:
        if (!formData.acceptTerms) {
          toast.error('Please accept terms and conditions')
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        handleSubmit()
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = () => {
    toast.success('Tax filing submitted successfully!')
    if (onComplete) {
      onComplete(formData)
    }
  }

  const calculateTotalIncome = () => {
    return (
      (parseInt(formData.salary) || 0) +
      (parseInt(formData.houseProperty) || 0) +
      (parseInt(formData.businessIncome) || 0) +
      (parseInt(formData.capitalGains) || 0) +
      (parseInt(formData.otherIncome) || 0)
    )
  }

  const calculateTotalDeductions = () => {
    return (
      (parseInt(formData.section80C) || 0) +
      (parseInt(formData.section80D) || 0) +
      (parseInt(formData.homeLoanInterest) || 0) +
      (parseInt(formData.section80CCD1B) || 0) +
      (parseInt(formData.section80E) || 0) +
      (parseInt(formData.section80G) || 0)
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Personal Information</h3>
            <p className="text-gray-600 mb-6">Please provide your basic details to get started</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Income Details</h3>
            <p className="text-gray-600 mb-6">Enter all your income sources for the financial year</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Income <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="₹0"
                />
                <p className="text-xs text-gray-500 mt-1">From Form-16 or salary slips</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  House Property Income
                </label>
                <input
                  type="number"
                  value={formData.houseProperty}
                  onChange={(e) => handleInputChange('houseProperty', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="₹0"
                />
                <p className="text-xs text-gray-500 mt-1">Rental income</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business/Professional Income
                </label>
                <input
                  type="number"
                  value={formData.businessIncome}
                  onChange={(e) => handleInputChange('businessIncome', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="₹0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capital Gains
                </label>
                <input
                  type="number"
                  value={formData.capitalGains}
                  onChange={(e) => handleInputChange('capitalGains', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="₹0"
                />
                <p className="text-xs text-gray-500 mt-1">From sale of stocks, property, etc.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Income
                </label>
                <input
                  type="number"
                  value={formData.otherIncome}
                  onChange={(e) => handleInputChange('otherIncome', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="₹0"
                />
                <p className="text-xs text-gray-500 mt-1">Interest, dividends, etc.</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">
                Total Income: ₹{calculateTotalIncome().toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Tax Deductions</h3>
            <p className="text-gray-600 mb-6">Claim deductions to reduce your taxable income</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section 80C (Max ₹1,50,000)
                </label>
                <input
                  type="number"
                  value={formData.section80C}
                  onChange={(e) => handleInputChange('section80C', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="₹0"
                  max={150000}
                />
                <p className="text-xs text-gray-500 mt-1">PPF, ELSS, Life Insurance, etc.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section 80D (Max ₹25,000)
                </label>
                <input
                  type="number"
                  value={formData.section80D}
                  onChange={(e) => handleInputChange('section80D', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="₹0"
                  max={25000}
                />
                <p className="text-xs text-gray-500 mt-1">Health insurance premium</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section 24(b) (Max ₹2,00,000)
                </label>
                <input
                  type="number"
                  value={formData.homeLoanInterest}
                  onChange={(e) => handleInputChange('homeLoanInterest', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="₹0"
                  max={200000}
                />
                <p className="text-xs text-gray-500 mt-1">Home loan interest</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section 80CCD(1B) (Max ₹50,000)
                </label>
                <input
                  type="number"
                  value={formData.section80CCD1B}
                  onChange={(e) => handleInputChange('section80CCD1B', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="₹0"
                  max={50000}
                />
                <p className="text-xs text-gray-500 mt-1">NPS contribution</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section 80E
                </label>
                <input
                  type="number"
                  value={formData.section80E}
                  onChange={(e) => handleInputChange('section80E', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="₹0"
                />
                <p className="text-xs text-gray-500 mt-1">Education loan interest</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section 80G
                </label>
                <input
                  type="number"
                  value={formData.section80G}
                  onChange={(e) => handleInputChange('section80G', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="₹0"
                />
                <p className="text-xs text-gray-500 mt-1">Donations to charity</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-semibold text-green-900">
                Total Deductions: ₹{calculateTotalDeductions().toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Choose Tax Regime</h3>
            <p className="text-gray-600 mb-6">Select the regime that works best for you</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div
                onClick={() => handleInputChange('taxRegime', 'old')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.taxRegime === 'old'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-gray-800">Old Regime</h4>
                  {formData.taxRegime === 'old' && (
                    <div className="bg-blue-500 rounded-full p-1">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ Allows all deductions</li>
                  <li>✓ Standard deduction ₹50,000</li>
                  <li>✓ Best if you have investments</li>
                  <li>✓ Higher tax slabs</li>
                </ul>
              </div>
              
              <div
                onClick={() => handleInputChange('taxRegime', 'new')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.taxRegime === 'new'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-gray-800">New Regime</h4>
                  {formData.taxRegime === 'new' && (
                    <div className="bg-green-500 rounded-full p-1">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ Lower tax rates</li>
                  <li>✓ Standard deduction ₹50,000</li>
                  <li>✓ Limited deductions</li>
                  <li>✓ Simpler calculation</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 5: {
        const totalIncome = calculateTotalIncome()
        const totalDeductions = calculateTotalDeductions()
        const taxableIncome = Math.max(0, totalIncome - 50000 - (formData.taxRegime === 'old' ? totalDeductions : 0))
        
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Review & Submit</h3>
            <p className="text-gray-600 mb-6">Please review your information before submitting</p>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Personal Information</h4>
                <p className="text-sm text-gray-700">Name: {formData.name}</p>
                <p className="text-sm text-gray-700">PAN: {formData.pan}</p>
                <p className="text-sm text-gray-700">Email: {formData.email}</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Income Summary</h4>
                <p className="text-sm text-blue-800">Total Income: ₹{totalIncome.toLocaleString('en-IN')}</p>
                <p className="text-sm text-blue-800">Standard Deduction: ₹50,000</p>
                {formData.taxRegime === 'old' && (
                  <p className="text-sm text-blue-800">Other Deductions: ₹{totalDeductions.toLocaleString('en-IN')}</p>
                )}
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Tax Details</h4>
                <p className="text-sm text-green-800">Selected Regime: {formData.taxRegime === 'old' ? 'Old Regime' : 'New Regime'}</p>
                <p className="text-sm text-green-800">Taxable Income: ₹{taxableIncome.toLocaleString('en-IN')}</p>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                  className="mt-1"
                />
                <label className="text-sm text-gray-700">
                  I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.
                </label>
              </div>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
          <div
            className="absolute top-5 left-0 h-1 bg-blue-600 -z-10 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map((step) => {
            const StepIcon = step.icon
            const isCompleted = currentStep > step.id
            const isCurrent = currentStep === step.id
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <StepIcon className="h-6 w-6" />
                  )}
                </div>
                <p className={`text-xs mt-2 text-center font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-600'}`}>
                  {step.title}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all ${
            currentStep === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Previous
        </button>
        
        <button
          onClick={nextStep}
          className="flex items-center px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
        >
          {currentStep === steps.length ? 'Submit' : 'Next'}
          {currentStep < steps.length && <ChevronRight className="h-5 w-5 ml-2" />}
        </button>
      </div>
    </div>
  )
}

export default TaxFilingWizard
