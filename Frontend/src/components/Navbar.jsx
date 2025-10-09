import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calculator, Upload, MessageCircle, BarChart3, BookOpen } from 'lucide-react'
import { translations } from '../data/translations'
import apiClient from '../utils/api'
import { Link as RouterLink } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'

const Navbar = ({ language, setLanguage }) => {
  const location = useLocation()
  const t = translations[language]

  const navItems = [
    { path: '/', icon: BookOpen, label: t.nav.home },
    { path: '/calculator', icon: Calculator, label: t.nav.calculator },
    { path: '/upload', icon: Upload, label: t.nav.upload },
    { path: '/assistant', icon: MessageCircle, label: t.nav.assistant },
    { path: '/comparison', icon: BarChart3, label: t.nav.comparison },
    { path: '/deductions', icon: BookOpen, label: t.nav.deductions },
  ]

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Calculator className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-800">{t.appName}</span>
          </Link>
          
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center space-x-4">
            {apiClient.token ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">Signed in</span>
                <button
                  onClick={async () => { 
                    try {
                      await apiClient.logout();
                    } catch (error) {
                      console.log('Logout failed, clearing token anyway:', error.message);
                    } finally {
                      apiClient.setAuthToken(null); 
                      window.location.href = '/';
                    }
                  }}
                  className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <div className="hidden md:flex space-x-2">
                <RouterLink to="/login" className="px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100">{t.login}</RouterLink>
                <RouterLink to="/register" className="px-3 py-2 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700">{t.register}</RouterLink>
              </div>
            )}
            <LanguageSwitcher language={language} setLanguage={setLanguage} />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar