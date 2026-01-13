import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calculator, Upload, BarChart3, BookOpen, Menu, X, ShieldCheck, ChevronRight, LogOut, User } from 'lucide-react'
import { translations } from '../data/translations'
import apiClient from '../utils/api'
import { Link as RouterLink } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'
import { motion, AnimatePresence } from 'framer-motion'

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/90 backdrop-blur-md border-slate-200 shadow-sm py-3' : 'bg-transparent py-5 border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-3 group z-50 relative">
            <div className={`p-2.5 rounded-xl transition-all duration-300 shadow-sm ${scrolled ? 'bg-primary-600 text-white shadow-primary-600/20' : 'bg-white text-primary-600 shadow-lg'}`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-bold tracking-tight leading-none ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>TaxAssist</span>
              <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mt-0.5">AI Powered</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-white/50 backdrop-blur-sm px-2 py-1.5 rounded-full border border-slate-200/50 shadow-sm">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 text-sm font-semibold transition-all duration-200 rounded-full ${isActive
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right Action Area (Desktop) */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher language={language} setLanguage={setLanguage} />

            {apiClient.token ? (
              <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Account</span>
                </div>
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
                  title={t.logout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <RouterLink
                  to="/login"
                  className="text-sm font-bold text-slate-600 hover:text-primary-700 transition-colors px-3 py-2"
                >
                  {t.login}
                </RouterLink>
                <RouterLink
                  to="/register"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {t.register}
                </RouterLink>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3 z-50">
            <LanguageSwitcher language={language} setLanguage={setLanguage} />
            <button
              onClick={() => setIsOpen(true)}
              className="p-2.5 rounded-xl text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 focus:outline-none active:scale-95 transition-all"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl z-50 lg:hidden flex flex-col border-l border-slate-100"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-lg font-bold text-slate-900">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group ${isActive
                        ? 'bg-primary-50 text-primary-700 border border-primary-100'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        {Icon && <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-primary-500'}`} />}
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      <ChevronRight className={`h-4 w-4 ${isActive ? 'text-primary-400' : 'text-slate-300'}`} />
                    </Link>
                  )
                })}
              </div>

              {/* Drawer Footer (Auth) */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/30">
                {!apiClient.token ? (
                  <div className="grid grid-cols-2 gap-3">
                    <RouterLink
                      to="/login"
                      className="flex items-center justify-center px-4 py-3 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      {t.login}
                    </RouterLink>
                    <RouterLink
                      to="/register"
                      className="flex items-center justify-center px-4 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all active:scale-95"
                    >
                      {t.register}
                    </RouterLink>
                  </div>
                ) : (
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all"
                  >
                    <LogOut size={18} />
                    {t.logout}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar