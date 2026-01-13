import React from 'react'
import { Link } from 'react-router-dom'
import { Calculator, Upload, MessageCircle, BarChart3, ShieldCheck, Zap, Globe, CheckCircle2, ArrowRight } from 'lucide-react'
import { translations } from '../data/translations'

const Home = ({ language }) => {
  const t = translations[language]

  const features = [
    {
      icon: Calculator,
      title: t.calculator,
      description: 'Calculate tax for both old and new regimes with detailed breakdown',
      link: '/calculator',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      icon: Upload,
      title: t.upload,
      description: 'Upload Form 16 and get automatic data extraction',
      link: '/upload',
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      icon: MessageCircle,
      title: t.assistant,
      description: 'Get AI-powered guidance for your tax queries',
      link: '/need-help',
      color: 'text-indigo-600 bg-indigo-50'
    },
    {
      icon: BarChart3,
      title: t.comparison,
      description: 'Compare old vs new tax regime and find the best option',
      link: '/comparison',
      color: 'text-orange-600 bg-orange-50'
    }
  ]

  const benefits = [
    {
      icon: ShieldCheck,
      title: t.privacyTitle,
      description: t.privacyText
    },
    {
      icon: Zap,
      title: 'Instant Calculations',
      description: 'Get accurate tax calculations in seconds with detailed breakdowns'
    },
    {
      icon: Globe,
      title: 'Multilingual Support',
      description: 'Available in multiple Indian languages for better accessibility'
    },
    {
      icon: CheckCircle2,
      title: 'Accurate & Updated',
      description: 'Always up-to-date with latest tax slabs and regulations'
    }
  ]

  return (
    <div className="min-h-screen -mt-8"> {/* Negative margin to offset container padding for full bleed hero */}

      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 lg:py-28 px-4 rounded-3xl mb-12">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-slate-50 -z-10 rounded-3xl"></div>
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-50 -z-10"></div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">AI-Powered Tax Assistant</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            Tax Filing made <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">Smart & Simple</span>
          </h1>

          <p className="text-xl text-slate-700 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            {t.welcomeSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/calculator"
              className="group flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 custom-hover-lift"
            >
              {t.calculateTax}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/upload"
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
            >
              <Upload className="h-5 w-5 text-slate-500" />
              {t.uploadForm16}
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-slate-600">
            {/* Trust Signals / Logos */}
            <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-primary-600" /><span className="text-sm font-bold">Secure</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-primary-600" /><span className="text-sm font-bold">Accurate</span></div>
            <div className="flex items-center gap-2"><Zap size={18} className="text-primary-600" /><span className="text-sm font-bold">Fast</span></div>
          </div>
        </div>
      </div>

      {/* Features Section - Cards */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-700 max-w-2xl mx-auto font-medium">
              Comprehensive tools designed to simplify your financial life.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 relative overflow-hidden"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${feature.color} transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary-700 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-700 leading-relaxed text-sm font-medium">
                    {feature.description}
                  </p>
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight className="text-primary-600" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-slate-50/50 rounded-3xl my-12 border border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="flex flex-col items-start">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 mb-4">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20 px-4 text-center rounded-3xl overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20"></div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Simplify Your Tax Filing?
          </h2>
          <p className="text-lg text-slate-300 mb-10">
            Join thousands of users who trust TaxAssist AI for accurate and secure tax calculations.
          </p>
          <Link
            to="/calculator"
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary-50 transition-colors shadow-lg shadow-white/10"
          >
            Get Started Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home