import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, User, Bot, FileText, Calculator, AlertCircle, CheckCircle, Info, HelpCircle, BookOpen, Settings, DollarSign, Briefcase, Home, Car, Heart, Loader2, Lightbulb, MessageCircle } from 'lucide-react';
import apiClient from '../utils/api';
import { translations } from '../data/translations'

const ChatAssistant = ({ language }) => {
  const t = translations[language]
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: '👋 Hello! I\'m your **Enhanced AI Tax Assistant** powered by the Income Tax Act knowledge base.\n\nI can help you with:\n💰 Tax calculations and deductions\n📊 Regime comparisons\n📄 Filing procedures\n📚 Specific sections of ITA\n\nWhat would you like to know?',
      timestamp: new Date(),
      confidence: 1.0
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [conversationStats, setConversationStats] = useState(null)
  const messagesEndRef = useRef(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  useEffect(() => {
    // Load initial suggestions
    loadSuggestions('')
  }, [])
  
  const exampleQuestions = [
    'What deductions can I claim under Section 80C?',
    'Which tax regime is better for my salary?',
    'How is my tax calculated step by step?',
    'What documents do I need for tax filing?',
    'Can I claim HRA exemption?',
    'What are the tax slabs for this year?'
  ]
  
  const loadSuggestions = async (lastQuery) => {
    try {
      const response = await apiClient.post('/api/ai/suggestions', { query: lastQuery })
      if (response.data && response.data.success) {
        setSuggestions(response.data.data || [])
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err)
      // Keep existing suggestions on error
    }
  }
  
  const loadConversationStats = async () => {
    try {
      const response = await apiClient.get('/api/ai/conversation/summary')
      if (response.data && response.data.success) {
        setConversationStats(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load conversation stats:', err)
    }
  }
  
  const generateBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase()
    
    if (message.includes('80c') || message.includes('deduction')) {
      return `Under Section 80C, you can claim deductions up to ₹1,50,000 for:
      
📌 **Investment Options:**
• Public Provident Fund (PPF)
• Equity Linked Savings Scheme (ELSS)
• National Savings Certificate (NSC)
• Life Insurance Premium
• Principal repayment of Home Loan
• Tuition fees for children
• Employee Provident Fund (EPF)

💡 **Pro Tip:** Diversify your 80C investments for better returns and risk management.`
    }
    
    if (message.includes('regime') || message.includes('better')) {
      return `**Tax Regime Comparison:**

🔵 **Old Regime:**
• Higher tax slabs but allows deductions
• Good if you have many investments/deductions
• Standard deduction: ₹50,000

🟢 **New Regime:**
• Lower tax rates but limited deductions
• Better for those with fewer investments
• Higher standard deduction in some slabs

💡 **Recommendation:** Use our tax calculator to compare both regimes with your actual income and deductions.`
    }
    
    if (message.includes('calculate') || message.includes('step')) {
      return `**Tax Calculation Steps:**

1️⃣ **Gross Salary** - Your total salary
2️⃣ **Less: Standard Deduction** (₹50,000)
3️⃣ **Less: Other Deductions** (80C, 80D, etc.)
4️⃣ **Taxable Income** = Gross - Deductions
5️⃣ **Apply Tax Slabs** as per chosen regime
6️⃣ **Add Health & Education Cess** (4%)
7️⃣ **Final Tax Payable**

🧮 Use our calculator for precise calculations!`
    }
    
    if (message.includes('document') || message.includes('filing')) {
      return `**Documents Required for Tax Filing:**

📄 **Essential Documents:**
• Form 16 from employer
• PAN Card
• Aadhaar Card
• Bank Account Details
• Investment Proofs (80C, 80D)
• TDS Certificates
• Previous Year's ITR (if applicable)

💡 **Digital Tip:** Keep digital copies organized for easy access during filing.`
    }
    
    if (message.includes('hra') || message.includes('house rent')) {
      return `**HRA Exemption Calculation:**

🏠 **HRA exemption is MINIMUM of:**
1. Actual HRA received
2. 50% of salary (metro) / 40% (non-metro)
3. Actual rent paid - 10% of salary

📋 **Required Documents:**
• Rent receipts
• Rental agreement
• Landlord's PAN (if rent > ₹1 lakh/year)

💡 **Note:** HRA is only available in Old Tax Regime.`
    }
    
    if (message.includes('slab') || message.includes('rate')) {
      return `**Tax Slabs FY 2024-25:**

🔵 **Old Regime:**
• 0 - ₹2.5L: 0%
• ₹2.5L - ₹5L: 5%
• ₹5L - ₹10L: 20%
• Above ₹10L: 30%

🟢 **New Regime:**
• 0 - ₹3L: 0%
• ₹3L - ₹6L: 5%
• ₹6L - ₹9L: 10%
• ₹9L - ₹12L: 15%
• ₹12L - ₹15L: 20%
• Above ₹15L: 30%

Plus 4% Health & Education Cess on both regimes.`
    }
    
    return `I understand you're asking about "${userMessage}". While I can help with most tax-related queries, I'd recommend:

💡 **For specific advice:**
• Use our Tax Calculator for precise calculations
• Upload your Form 16 for personalized analysis
• Compare tax regimes with your actual data

🤖 **I can help with:**
• Tax calculations and comparisons
• Deduction explanations
• Filing guidance
• Document requirements

Feel free to ask more specific questions about income tax!`
  }
  
  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)
    setShowSuggestions(false)
    
    try {
      // Call enhanced backend AI endpoint
      const sessionId = 'session_' + Date.now();
      const response = await apiClient.sendAIQuery({ 
        query: message, 
        queryType: 'general_tax_info', 
        sessionId,
        use_context: true  // Enable conversation context
      });
      
      const confidence = response?.data?.confidence || 0.8
      const sources = response?.data?.sources || []
      
      let botContent = response?.data?.response || generateBotResponse(message)
      
      // Add confidence indicator if available
      if (confidence < 0.7 && sources.length > 0) {
        botContent += '\n\n⚠️ *This answer has moderate confidence. Please verify with official sources.*'
      }
      
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: botContent,
        timestamp: new Date(),
        confidence: confidence,
        sources: sources
      }
      
      setMessages(prev => [...prev, botResponse])
      
      // Load new suggestions based on this query
      await loadSuggestions(message)
      await loadConversationStats()
      setShowSuggestions(true)
      
    } catch (err) {
      console.error('AI query error:', err)
      // Use local response as fallback
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: generateBotResponse(message) + '\n\n⚠️ *Using offline mode. For best results, ensure RAG server is running.*',
        timestamp: new Date(),
        confidence: 0.6
      }
      setMessages(prev => [...prev, botResponse])
    } finally {
      setIsTyping(false)
    }
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <MessageCircle className="h-10 w-10 text-blue-600 mr-3" />
          {t.assistant}
        </h1>
        <p className="text-xl text-gray-600">
          Get AI-powered answers to your income tax questions
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Chat Messages */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-3xl ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`p-2 rounded-full flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-blue-600' 
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md shadow-md'
                }`}>
                  <div className="whitespace-pre-wrap prose prose-sm max-w-none">{message.content}</div>
                  
                  {/* Confidence indicator for bot messages */}
                  {message.type === 'bot' && message.confidence && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-gray-600">Confidence:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className={`h-2 rounded-full ${
                              message.confidence >= 0.8 ? 'bg-green-500' :
                              message.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${message.confidence * 100}%` }}
                          />
                        </div>
                        <span className={`font-medium ${
                          message.confidence >= 0.8 ? 'text-green-600' :
                          message.confidence >= 0.6 ? 'text-yellow-600' : 'text-orange-600'
                        }`}>
                          {(message.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      {/* Sources indicator */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          📚 {message.sources.length} source{message.sources.length > 1 ? 's' : ''} from Income Tax Act
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-3xl">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="border-t p-4 bg-white">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.chatPlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Example Questions */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Lightbulb className="h-6 w-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">
              {showSuggestions && suggestions.length > 0 ? 'Smart Suggestions' : t.exampleQuestions}
            </h3>
          </div>
          {conversationStats && conversationStats.total_queries > 0 && (
            <div className="text-sm text-gray-500">
              💬 {conversationStats.total_queries} questions asked
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {(showSuggestions && suggestions.length > 0 ? suggestions : exampleQuestions).map((question, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(question)}
              disabled={isTyping}
              className="text-left p-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-all duration-200 text-sm text-gray-700 hover:text-blue-700 border border-blue-100 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start space-x-2">
                <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                <span>{question}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Conversation statistics */}
        {conversationStats && conversationStats.total_queries > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Avg. sources per answer: {conversationStats.avg_chunks_used?.toFixed(1) || 'N/A'}</span>
              <button
                onClick={async () => {
                  try {
                    await apiClient.post('/api/ai/conversation/clear')
                    setMessages([{
                      id: Date.now(),
                      type: 'bot',
                      content: '🔄 Conversation history cleared. How can I help you?',
                      timestamp: new Date()
                    }])
                    setConversationStats(null)
                    setSuggestions([])
                    setShowSuggestions(true)
                  } catch (err) {
                    console.error('Failed to clear conversation:', err)
                  }
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear History
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Tips section */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-start space-x-3">
          <Info className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">💡 Tips for Better Results:</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Be specific with section numbers (e.g., "Section 80C")</li>
              <li>• Ask about particular scenarios for detailed answers</li>
              <li>• Use follow-up questions to dig deeper into topics</li>
              <li>• Answers are based on the Income Tax Act 1961</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatAssistant