import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import RequireAuth from './components/RequireAuth'
import Home from './pages/Home'
import TaxCalculator from './pages/TaxCalculator'
import DocumentUpload from './pages/DocumentUpload'
import ChatAssistant from './pages/ChatAssistant'
import TaxComparison from './pages/TaxComparison'
import DeductionGuide from './pages/DeductionGuide'
import FloatingHelpButton from './components/FloatingHelpButton'

function App() {
  // Load saved language preference or default to 'en'
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage')
    return savedLanguage || 'en'
  })

  // Save language preference whenever it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language)
    // Set document lang attribute for accessibility
    document.documentElement.lang = language
  }, [language])

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar language={language} setLanguage={setLanguage} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home language={language} />} />
            <Route path="/calculator" element={<TaxCalculator language={language} />} />
            <Route path="/upload" element={<RequireAuth><DocumentUpload language={language} /></RequireAuth>} />
            <Route path="/assistant" element={<RequireAuth><ChatAssistant language={language} /></RequireAuth>} />
            <Route path="/comparison" element={<TaxComparison language={language} />} />
            <Route path="/deductions" element={<DeductionGuide language={language} />} />
            <Route path="/login" element={<Login language={language} />} />
            <Route path="/register" element={<Register language={language} />} />
          </Routes>
        </main>
        <FloatingHelpButton language={language} />
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
