import React, { useState, useEffect } from 'react'
import config from './config';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import RequireAuth from './components/RequireAuth'
import Home from './pages/Home'
import TaxCalculator from './pages/TaxCalculator'
import DocumentUpload from './pages/DocumentUpload'

import TaxComparison from './pages/TaxComparison'
import DeductionGuide from './pages/DeductionGuide'
import NeedHelp from './pages/NeedHelp'
import FloatingHelpButton from './components/FloatingHelpButton'
import Chatbot from './components/Chatbot'

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

  // Wake up services on load
  useEffect(() => {
    const wakeUpServices = async () => {
      try {
        // Ping Backend
        fetch(`${config.backendUrl}/api/health`, { method: 'GET' }).catch(e => console.log('Backend wake-up', e));
        // Wake up AI Service via Backend (this ensures backend also wakes up if sleeping)
        fetch(`${config.backendUrl}/api/ai/wakeup`, { method: 'GET' }).catch(e => console.log('AI Service wake-up signal sent', e));
      } catch (error) {
        console.error("Wake up failed", error);
      }
    };
    wakeUpServices();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar language={language} setLanguage={setLanguage} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home language={language} />} />
            <Route path="/calculator" element={<TaxCalculator language={language} />} />
            <Route path="/upload" element={<RequireAuth><DocumentUpload language={language} /></RequireAuth>} />

            <Route path="/comparison" element={<TaxComparison language={language} />} />
            <Route path="/deductions" element={<DeductionGuide language={language} />} />
            <Route path="/need-help" element={<NeedHelp language={language} />} />
            <Route path="/login" element={<Login language={language} />} />
            <Route path="/register" element={<Register language={language} />} />
          </Routes>
        </main>
        {/* Removed FloatingHelpButton as it is now in Navbar */}
        <Chatbot />
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
