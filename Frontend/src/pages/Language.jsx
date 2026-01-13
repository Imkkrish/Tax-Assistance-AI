import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Check, Globe, Sparkles } from 'lucide-react'

const Language = ({ language, setLanguage }) => {
    const navigate = useNavigate()

    const languages = [
        {
            code: 'en',
            name: 'English',
            nativeName: 'English',
            flag: '🇬🇧',
            description: 'Default language'
        },
        {
            code: 'hi',
            name: 'Hindi',
            nativeName: 'हिंदी',
            flag: '🇮🇳',
            description: 'भारतीय भाषा (Indian Language)'
        },
        {
            code: 'mr',
            name: 'Marathi',
            nativeName: 'मराठी',
            flag: '🇮🇳',
            description: 'महाराष्ट्राची भाषा (Language of Maharashtra)'
        },
        {
            code: 'ta',
            name: 'Tamil',
            nativeName: 'தமிழ்',
            flag: '🇮🇳',
            description: 'தமிழ் மொழி (Tamil Language)'
        },
        {
            code: 'te',
            name: 'Telugu',
            nativeName: 'తెలుగు',
            flag: '🇮🇳',
            description: 'తెలుగు భాష (Telugu Language)'
        },
    ]

    const handleLanguageSelect = (code) => {
        setLanguage(code)
        navigate(-1) // Go back to previous page
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-semibold mb-4"
                >
                    <Globe size={16} />
                    <span>Select Your Language</span>
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                    Choose your preferred <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Language</span>
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Select a language to instantly translate the entire application. We support multiple Indian languages for your convenience.
                </p>
            </div>

            {/* Language Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {languages.map((lang, index) => {
                    const isSelected = language === lang.code
                    return (
                        <motion.button
                            key={lang.code}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className={`group relative text-left p-6 rounded-3xl border-2 transition-all duration-300 ${isSelected
                                    ? 'bg-primary-50 border-primary-500 shadow-lg shadow-primary-500/10'
                                    : 'bg-white border-slate-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-600/5'
                                }`}
                        >
                            {/* Checkmark for selected */}
                            {isSelected && (
                                <div className="absolute top-4 right-4 bg-primary-600 text-white p-1 rounded-full shadow-sm">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            )}

                            <div className="flex items-start gap-4 mb-4">
                                <span className="text-4xl filter drop-shadow-sm">{lang.flag}</span>
                                <div>
                                    <h3 className={`text-xl font-bold ${isSelected ? 'text-primary-900' : 'text-slate-900'}`}>
                                        {lang.nativeName}
                                    </h3>
                                    <p className={`text-sm font-medium ${isSelected ? 'text-primary-600' : 'text-slate-500'}`}>
                                        {lang.name}
                                    </p>
                                </div>
                            </div>

                            <div className={`h-px w-full my-4 ${isSelected ? 'bg-primary-200' : 'bg-slate-100 group-hover:bg-slate-200'}`} />

                            <p className={`text-sm ${isSelected ? 'text-primary-700' : 'text-slate-500'}`}>
                                {lang.description}
                            </p>

                            {/* Hover Effect Background */}
                            <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${isSelected ? 'bg-primary-500/0' : 'bg-gradient-to-tr from-primary-50/50 to-transparent'
                                }`} />
                        </motion.button>
                    )
                })}
            </div>

            <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium">
                    <Sparkles size={16} className="text-yellow-500" />
                    <span>More languages coming soon!</span>
                </div>
            </div>
        </div>
    )
}

export default Language
