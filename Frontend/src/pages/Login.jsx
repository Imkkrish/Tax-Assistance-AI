import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../utils/api'
import { translations } from '../data/translations'

const Login = ({ language = 'en' }) => {
  const t = translations[language]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await apiClient.login({ email, password })

      if (response.success && response.token) {
        apiClient.setAuthToken(response.token)
        toast.success(t.loginSuccess)

        // Store user data if needed
        if (response.data && response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }

        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      } else {
        throw new Error(response.message || t.loginError)
      }
    } catch (err) {
      console.error('Login error:', err)
      toast.error(err.message || t.loginError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <div className="p-2 bg-primary-50 rounded-xl mr-3">
            <LogIn className="h-6 w-6 text-primary-600" />
          </div>
          {t.login}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-70 transition-all shadow-lg shadow-primary-600/20 active:scale-[0.98]"
          >
            {loading ? `${t.login}...` : t.login}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            {t.dontHaveAccount}{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
              {t.signUpHere}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login


