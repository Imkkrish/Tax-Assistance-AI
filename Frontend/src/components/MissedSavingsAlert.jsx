import React, { useState } from 'react';
import { AlertTriangle, X, TrendingUp, ArrowRight, Lightbulb } from 'lucide-react';

/**
 * MissedSavingsAlert - Eye-catching banner showing potential tax savings
 * Displays at top of tax calculator when user is missing deductions
 */
const MissedSavingsAlert = ({ 
  totalSaving = 0, 
  suggestions = [], 
  urgency = 'high',
  onDismiss,
  onViewDetails 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || totalSaving <= 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const urgencyStyles = {
    critical: {
      bg: 'bg-gradient-to-r from-red-600 to-red-700',
      border: 'border-red-500',
      icon: '🚨',
      pulse: true
    },
    high: {
      bg: 'bg-gradient-to-r from-orange-600 to-orange-700',
      border: 'border-orange-500',
      icon: '⚠️',
      pulse: false
    },
    medium: {
      bg: 'bg-gradient-to-r from-yellow-600 to-yellow-700',
      border: 'border-yellow-500',
      icon: '💡',
      pulse: false
    }
  };

  const style = urgencyStyles[urgency] || urgencyStyles.high;

  const topSuggestions = suggestions.slice(0, 3);

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border-2 ${style.border} ${style.bg} 
        text-white shadow-2xl mb-6 transition-all duration-300
        ${style.pulse ? 'animate-pulse' : ''}
      `}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Icon & Message */}
          <div className="flex items-start gap-4 flex-1">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl">
                {style.icon}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-xl font-bold">
                  {urgency === 'critical' ? 'Critical: Tax Savings Missed!' : 'Unlock More Tax Savings!'}
                </h3>
              </div>
              
              <p className="text-2xl font-extrabold mb-2 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                You could save ₹{totalSaving.toLocaleString()} more!
              </p>
              
              <p className="text-white/90 text-sm">
                {urgency === 'critical' 
                  ? 'You\'re missing out on significant tax deductions. Take action now!'
                  : 'We found opportunities to maximize your tax benefits and reduce your liability.'}
              </p>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Lightbulb className="w-4 h-4" />
                  {isExpanded ? 'Hide Details' : 'View Opportunities'}
                </button>
                
                {onViewDetails && (
                  <button
                    onClick={onViewDetails}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
                  >
                    See All Suggestions
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && topSuggestions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/20">
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top {topSuggestions.length} Opportunities:
            </h4>
            
            <div className="grid gap-3">
              {topSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id || index}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{suggestion.icon}</span>
                        <span className="font-semibold">{suggestion.section}</span>
                        {suggestion.priority === 'critical' && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                            URGENT
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/90 mb-2">{suggestion.title}</p>
                      <p className="text-xs text-white/70">{suggestion.description}</p>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-green-200">
                        ₹{suggestion.potentialSaving?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-white/70">potential saving</div>
                    </div>
                  </div>

                  {suggestion.actionRequired && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowRight className="w-4 h-4 text-green-300" />
                        <span className="text-white/90">
                          <strong>Action:</strong> {suggestion.actionRequired}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {suggestions.length > 3 && (
              <div className="mt-4 text-center">
                <button
                  onClick={onViewDetails}
                  className="text-white/90 hover:text-white font-semibold underline"
                >
                  View {suggestions.length - 3} more suggestions →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </div>
  );
};

export default MissedSavingsAlert;
