import React, { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import HelpCenter from './HelpCenter'

const FloatingHelpButton = ({ language }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsHelpOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-30 group"
        aria-label="Open Help Center"
      >
        <HelpCircle className="h-6 w-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Need Help?
        </span>
      </button>

      {/* Help Center Panel */}
      <HelpCenter
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        language={language}
      />
    </>
  )
}

export default FloatingHelpButton
