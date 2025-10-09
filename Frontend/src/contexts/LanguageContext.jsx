import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../data/translations'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  // Detect browser language or load saved preference
  const detectLanguage = () => {
    const saved = localStorage.getItem('preferredLanguage')
    if (saved) return saved

    // Try to detect from browser
    const browserLang = navigator.language || navigator.userLanguage
    const langCode = browserLang.split('-')[0] // Get language code without region
    
    // Check if we support this language
    if (translations[langCode]) {
      return langCode
    }
    
    // Default to English
    return 'en'
  }

  const [language, setLanguageState] = useState(detectLanguage)

  const setLanguage = (lang) => {
    setLanguageState(lang)
    localStorage.setItem('preferredLanguage', lang)
    document.documentElement.lang = lang
  }

  // Get translation helper
  const t = translations[language] || translations.en

  useEffect(() => {
    // Set initial document lang attribute
    document.documentElement.lang = language
  }, [language])

  const value = {
    language,
    setLanguage,
    t,
    availableLanguages: Object.keys(translations),
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
