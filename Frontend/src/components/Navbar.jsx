import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calculator, Upload, MessageCircle, BarChart3, BookOpen, HelpCircle, Menu, X } from 'lucide-react'
import { translations } from '../data/translations'
import apiClient from '../utils/api'
import { Link as RouterLink } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'

const Navbar = ({ language, setLanguage }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const location = useLocation()
  const t = translations[language]

  const navItems = [
    { path: '/', icon: BookOpen, label: t.nav.home },
    { path: '/calculator', icon: Calculator, label: t.nav.calculator },
    { path: '/upload', icon: Upload, label: t.nav.upload },
    { path: '/assistant', icon: MessageCircle, label: t.nav.assistant },
    { path: '/comparison', icon: BarChart3, label: t.nav.comparison },
    { path: '/deductions', icon: BookOpen, label: t.nav.deductions },
    { path: '/need-help', icon: null, label: 'Need Help' }
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
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                    }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center space-x-4">
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
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <LanguageSwitcher language={language} setLanguage={setLanguage} />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                    }`}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {/* Mobile Auth Buttons */}
            {!apiClient.token ? (
              <div className="pt-4 flex flex-col space-y-2 px-3">
                <RouterLink
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100 border border-gray-200"
                >
                  {t.login}
                </RouterLink>
                <RouterLink
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  {t.register}
                </RouterLink>
              </div>
            ) : (
              <div className="pt-4 px-3">
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
                  className="w-full text-center px-3 py-2 bg-gray-100 rounded-md text-base font-medium hover:bg-gray-200"
                >
                  {t.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar