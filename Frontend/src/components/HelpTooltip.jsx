import React, { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

const HelpTooltip = ({ content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {isVisible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} w-64 bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3`}
        >
          <div className="relative">
            <button
              onClick={() => setIsVisible(false)}
              className="absolute -top-1 -right-1 text-white hover:text-gray-300"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="pr-4">{content}</p>
          </div>
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
              position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
              position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
              'left-[-4px] top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  )
}

export default HelpTooltip
