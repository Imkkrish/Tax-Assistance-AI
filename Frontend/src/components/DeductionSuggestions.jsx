import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, AlertCircle, ChevronRight, Calendar, Target } from 'lucide-react';
import apiClient from '../utils/api';
import toast from 'react-hot-toast';

const DeductionSuggestions = ({ userData }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getTaxSuggestions(userData);
      if (response.success) {
        setSuggestions(response.data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Unable to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData && userData.grossSalary > 0) {
      fetchSuggestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const toggleExpand = (index) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const formatCurrency = (amount) => `₹${amount?.toLocaleString('en-IN') || 0}`;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⭐';
      case 'low': return '💡';
      default: return '📌';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Analyzing your tax-saving opportunities...</p>
      </div>
    );
  }

  if (!suggestions) return null;

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Lightbulb className="h-8 w-8 mr-3" />
              Personalized Tax-Saving Suggestions
            </h2>
            <p className="text-green-100 text-lg">
              You can save up to <span className="font-bold text-2xl">{formatCurrency(suggestions.totalPotentialSavings)}</span> in taxes!
            </p>
          </div>
          <TrendingUp className="h-16 w-16 opacity-50" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-green-400">
          <div className="text-center">
            <p className="text-3xl font-bold">{suggestions.summary?.highPriority || 0}</p>
            <p className="text-sm text-green-100">High Priority</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{suggestions.summary?.mediumPriority || 0}</p>
            <p className="text-sm text-green-100">Medium Priority</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{suggestions.summary?.lowPriority || 0}</p>
            <p className="text-sm text-green-100">Low Priority</p>
          </div>
        </div>
      </div>

      {/* Investment Deadlines */}
      {suggestions.deadlines && suggestions.deadlines.length > 0 && (
        <div className={`rounded-xl shadow-lg p-6 border-l-4 ${
          suggestions.deadlines[0].urgency === 'high' 
            ? 'bg-red-50 border-red-500' 
            : 'bg-yellow-50 border-yellow-500'
        }`}>
          <div className="flex items-start">
            <Calendar className={`h-6 w-6 mr-3 ${
              suggestions.deadlines[0].urgency === 'high' ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {suggestions.deadlines[0].title}
              </h3>
              <p className={`text-sm font-medium mb-3 ${
                suggestions.deadlines[0].urgency === 'high' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {suggestions.deadlines[0].message}
              </p>
              <div className="bg-white rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">Action Items:</p>
                <ul className="space-y-1">
                  {suggestions.deadlines[0].actions.map((action, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.suggestions.map((suggestion, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div 
              className={`p-5 cursor-pointer hover:bg-gray-50 transition-colors ${
                expanded[index] ? 'bg-gray-50' : ''
              }`}
              onClick={() => toggleExpand(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{getPriorityIcon(suggestion.priority)}</span>
                    <h3 className="text-lg font-semibold text-gray-800">{suggestion.category}</h3>
                    <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Current</p>
                      <p className="text-sm font-semibold text-gray-700">{formatCurrency(suggestion.currentAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Available Limit</p>
                      <p className="text-sm font-semibold text-blue-600">
                        {typeof suggestion.maxLimit === 'number' 
                          ? formatCurrency(suggestion.maxLimit) 
                          : suggestion.maxLimit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Potential Savings</p>
                      <p className="text-sm font-bold text-green-600">
                        {typeof suggestion.potentialSavings === 'number'
                          ? formatCurrency(suggestion.potentialSavings)
                          : suggestion.potentialSavings}
                      </p>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`h-6 w-6 text-gray-400 transition-transform ${
                  expanded[index] ? 'transform rotate-90' : ''
                }`} />
              </div>
            </div>

            {/* Expanded Details */}
            {expanded[index] && (
              <div className="border-t border-gray-200 p-5 bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Recommended Actions
                </h4>
                <div className="space-y-3">
                  {suggestion.recommendations.map((rec, recIdx) => (
                    <div key={recIdx} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-800">{rec.option}</h5>
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(rec.amount)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.benefit}</p>
                      <div className="flex items-center text-sm text-blue-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="font-medium">{rec.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeductionSuggestions;
