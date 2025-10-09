import React, { useState } from 'react';
import { 
  TrendingUp, 
  Heart, 
  Home, 
  GraduationCap, 
  Shield, 
  PiggyBank, 
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react';

/**
 * SmartSuggestions - Display AI-powered tax saving recommendations
 * Shows personalized deductions and investment opportunities
 */
const SmartSuggestions = ({ suggestions = [], totalPotentialSaving = 0, stats = {} }) => {
  const [expandedSuggestions, setExpandedSuggestions] = useState(new Set());

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
            Excellent! You're Maximizing Your Deductions
          </h3>
        </div>
        <p className="text-green-700 dark:text-green-300">
          You're making the most of available tax benefits. Keep up the good work!
        </p>
      </div>
    );
  }

  const toggleSuggestion = (id) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSuggestions(newExpanded);
  };

  const priorityColors = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    high: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    low: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    info: 'border-gray-300 bg-gray-50 dark:bg-gray-800/50'
  };

  const priorityIcons = {
    critical: AlertCircle,
    high: TrendingUp,
    medium: Lightbulb,
    low: Info,
    info: CheckCircle
  };

  const categoryIcons = {
    investment: PiggyBank,
    insurance: Shield,
    deduction: TrendingUp,
    regime: Info,
    info: CheckCircle
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <TrendingUp className="w-7 h-7" />
              Smart Tax Savings Suggestions
            </h2>
            <p className="text-blue-100">
              AI-powered recommendations to maximize your tax benefits
            </p>
          </div>
          
          {totalPotentialSaving > 0 && (
            <div className="text-right bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm text-blue-100 mb-1">Total Potential Savings</div>
              <div className="text-3xl font-bold">₹{totalPotentialSaving.toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        {stats && Object.keys(stats).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.totalSuggestions > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.totalSuggestions}</div>
                <div className="text-xs text-blue-100">Total Tips</div>
              </div>
            )}
            {stats.criticalCount > 0 && (
              <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.criticalCount}</div>
                <div className="text-xs text-blue-100">Critical</div>
              </div>
            )}
            {stats.highCount > 0 && (
              <div className="bg-orange-500/30 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.highCount}</div>
                <div className="text-xs text-blue-100">High Priority</div>
              </div>
            )}
            {stats.investmentSuggestions > 0 && (
              <div className="bg-green-500/30 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.investmentSuggestions}</div>
                <div className="text-xs text-blue-100">Investments</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => {
          const isExpanded = expandedSuggestions.has(suggestion.id);
          const PriorityIcon = priorityIcons[suggestion.priority] || Info;
          const CategoryIcon = categoryIcons[suggestion.category] || Lightbulb;
          
          return (
            <div
              key={suggestion.id || index}
              className={`
                rounded-xl border-2 ${priorityColors[suggestion.priority] || priorityColors.info}
                overflow-hidden transition-all duration-300 hover:shadow-lg
              `}
            >
              {/* Suggestion Header */}
              <div
                className="p-5 cursor-pointer"
                onClick={() => toggleSuggestion(suggestion.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-2xl shadow-md">
                        {suggestion.icon || <CategoryIcon className="w-6 h-6" />}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {suggestion.section}
                        </span>
                        
                        {/* Priority Badge */}
                        {suggestion.priority !== 'info' && (
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-bold uppercase flex items-center gap-1
                            ${suggestion.priority === 'critical' ? 'bg-red-600 text-white' : ''}
                            ${suggestion.priority === 'high' ? 'bg-orange-600 text-white' : ''}
                            ${suggestion.priority === 'medium' ? 'bg-yellow-600 text-white' : ''}
                            ${suggestion.priority === 'low' ? 'bg-blue-600 text-white' : ''}
                          `}>
                            <PriorityIcon className="w-3 h-3" />
                            {suggestion.priority}
                          </span>
                        )}

                        {/* Category Badge */}
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                          {suggestion.category}
                        </span>
                      </div>

                      <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                        {suggestion.title}
                      </h4>
                      
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {suggestion.description}
                      </p>

                      {suggestion.actionRequired && (
                        <div className="mt-3 flex items-start gap-2 text-sm">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">Action:</span>
                          <span className="text-gray-700 dark:text-gray-300">{suggestion.actionRequired}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Savings Amount */}
                  <div className="flex-shrink-0 text-right">
                    {suggestion.potentialSaving > 0 && (
                      <div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ₹{suggestion.potentialSaving.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          tax saving
                        </div>
                      </div>
                    )}
                    
                    {suggestion.investment > 0 && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Invest: ₹{suggestion.investment.toLocaleString()}
                      </div>
                    )}

                    <button className="mt-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-300 dark:border-gray-700 p-5 bg-white/50 dark:bg-gray-900/50">
                  {/* Investment Options */}
                  {suggestion.investmentOptions && suggestion.investmentOptions.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <PiggyBank className="w-5 h-5" />
                        Investment Options:
                      </h5>
                      <div className="grid gap-3">
                        {suggestion.investmentOptions.map((option, idx) => (
                          <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">{option.name}</span>
                              <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                                {option.return} returns
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Lock-in: {option.lockIn}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Benefits */}
                  {suggestion.benefits && suggestion.benefits.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Benefits:
                      </h5>
                      <ul className="space-y-2">
                        {suggestion.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Links */}
                  {suggestion.links && suggestion.links.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {suggestion.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {link.text}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartSuggestions;
