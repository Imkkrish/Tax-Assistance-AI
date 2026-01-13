import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calculator, Upload, BarChart3, BookOpen, Menu, X, ShieldCheck } from 'lucide-react'
import { translations } from '../data/translations'
import apiClient from '../utils/api'
import { Link as RouterLink } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'

const Navbar = ({ language, setLanguage }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const t = translations[language]

  // Detect scroll for glass effect intensity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { path: '/', icon: BookOpen, label: t.nav.home },
    { path: '/calculator', icon: Calculator, label: t.nav.calculator },
    { path: '/upload', icon: Upload, label: t.nav.upload },
    { path: '/comparison', icon: BarChart3, label: t.nav.comparison },
    { path: '/deductions', icon: BookOpen, label: t.nav.deductions },
    { path: '/need-help', icon: null, label: 'Need Help' }
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-white/10 ${scrolled ? 'glass shadow-sm py-2' : 'bg-transparent py-4 border-transparent'
        }`}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className={`p-2 rounded-xl transition-all duration-300 ${scrolled ? 'bg-primary-50 text-primary-600' : 'bg-white/10 text-primary-600 backdrop-blur-md'}`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight leading-none ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>TaxAssist</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">AI Powered</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full group ${isActive
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full mb-1.5" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher language={language} setLanguage={setLanguage} />

            <div className="h-6 w-px bg-slate-200 mx-2" />

            {apiClient.token ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Signed in</span>
                <button
                  onClick={async () => {
                    try {
                      await apiClient.logout();
                    } catch (error) {
                      console.log('Logout failed');
                    } finally {
                      apiClient.setAuthToken(null);
                      window.location.href = '/';
                    }
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <RouterLink
                  to="/login"
                  className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors"
                >
                  {t.login}
                </RouterLink>
                <RouterLink
                  to="/register"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {t.register}
                </RouterLink>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <LanguageSwitcher language={language} setLanguage={setLanguage} />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl p-4">
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}

            <div className="h-px bg-slate-100 my-4" />

            {/* Mobile Auth Buttons */}
            {!apiClient.token ? (
              <div className="flex flex-col gap-3">
                <RouterLink
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-3 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {t.login}
                </RouterLink>
                <RouterLink
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all"
                >
                  {t.register}
                </RouterLink>
              </div>
            ) : (
              <button
                onClick={async () => {
                  setIsOpen(false);
                  try {
                    await apiClient.logout();
                  } catch (error) {
                    console.log('Logout failed');
                  } finally {
                    apiClient.setAuthToken(null);
                    window.location.href = '/';
                  }
                }}
                className="w-full text-center px-4 py-3 rounded-xl bg-slate-100 font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {t.logout}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar