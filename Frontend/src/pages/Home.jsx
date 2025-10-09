import React from 'react'
import { Link } from 'react-router-dom'
import { Calculator, Upload, MessageCircle, BarChart3, Shield, Zap, Globe, CheckCircle } from 'lucide-react'
import { translations } from '../data/translations'

const Home = ({ language }) => {
  const t = translations[language]
  
  const features = [
    {
      icon: Calculator,
      title: t.calculator,
      description: 'Calculate tax for both old and new regimes with detailed breakdown',
      link: '/calculator',
      color: 'bg-blue-500'
    },
    {
      icon: Upload,
      title: t.upload,
      description: 'Upload Form 16 and get automatic data extraction',
      link: '/upload',
      color: 'bg-green-500'
    },
    {
      icon: MessageCircle,
      title: t.assistant,
      description: 'Get AI-powered guidance for your tax queries',
      link: '/assistant',
      color: 'bg-purple-500'
    },
    {
      icon: BarChart3,
      title: t.comparison,
      description: 'Compare old vs new tax regime and find the best option',
      link: '/comparison',
      color: 'bg-orange-500'
    }
  ]
  
  const benefits = [
    {
      icon: Shield,
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
      icon: CheckCircle,
      title: 'Accurate & Updated',
      description: 'Always up-to-date with latest tax slabs and regulations'
    }
  ]
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            {t.welcomeTitle}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            {t.welcomeSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/calculator"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors duration-200 shadow-lg"
            >
              {t.calculateTax}
            </Link>
            <Link
              to="/upload"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              {t.uploadForm16}
            </Link>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Everything You Need for Tax Filing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools to make your income tax filing simple, accurate, and stress-free
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200"
                >
                  <div className={`${feature.color} p-3 rounded-lg inline-block mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Benefits Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Why Choose TaxAssist AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with privacy, accuracy, and user experience in mind
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="text-center">
                  <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Simplify Your Tax Filing?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands who trust TaxAssist AI for their income tax calculations
          </p>
          <Link
            to="/calculator"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors duration-200 shadow-lg inline-block"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home