import React, { useState, useEffect } from 'react'
import config from './config';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
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
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
        <Navbar language={language} setLanguage={setLanguage} />

        {/* Main Content Container - Centered, Max-Width */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-grow w-full">
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50 min-h-[calc(100vh-180px)] p-6 md:p-8">
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
          </div>
          <Footer />
        </div>

        {/* Removed FloatingHelpButton as it is now in Navbar */}
        <Chatbot />
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'glass-card text-slate-800',
            style: {
              background: '#fff',
              color: '#333',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
