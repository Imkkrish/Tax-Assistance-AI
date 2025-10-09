import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'

const TutorialOverlay = ({ steps, onComplete, tutorialKey }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has completed this tutorial
    const completed = localStorage.getItem(`tutorial_${tutorialKey}`)
    if (!completed) {
      setIsVisible(true)
    }
  }, [tutorialKey])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(`tutorial_${tutorialKey}`, 'true')
    setIsVisible(false)
    if (onComplete) onComplete()
  }

  const handleSkip = () => {
    localStorage.setItem(`tutorial_${tutorialKey}`, 'true')
    setIsVisible(false)
  }

  if (!isVisible || steps.length === 0) return null

  const step = steps[currentStep]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />

      {/* Tutorial Card */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 mx-1 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          {step.icon && (
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 rounded-full p-4">
                {React.createElement(step.icon, {
                  className: 'h-8 w-8 text-blue-600',
                })}
              </div>
            </div>
          )}

          {/* Content */}
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
            {step.title}
          </h2>
          <p className="text-gray-600 text-center mb-6">{step.description}</p>

          {/* Additional Content */}
          {step.content && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              {step.content}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Skip Tutorial
            </button>

            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Got it!
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TutorialOverlay
