import mongoose from 'mongoose';

const aiQuerySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    index: true
  },
  query: {
    type: String,
    required: [true, 'Query is required'],
    trim: true,
    maxlength: [1000, 'Query cannot exceed 1000 characters']
  },
  response: {
    type: String,
    required: false, // Response is added after AI processing
    maxlength: [4000, 'Response cannot exceed 4000 characters']
  },
  queryType: {
    type: String,
    required: [true, 'Query type is required'],
    enum: {
      values: [
        'tax_calculation_help',
        'deduction_guidance',
        'document_analysis',
        'regime_comparison',
        'filing_assistance',
        'general_tax_info',
        'compliance_check',
        'investment_advice'
      ],
      message: 'Invalid query type'
    }
  },
  context: {
    financialYear: String,
    taxRegime: {
      type: String,
      enum: ['old', 'new']
    },
    incomeRange: {
      min: Number,
      max: Number
    },
    documentTypes: [String],
    previousQueries: [{
      query: String,
      response: String,
      timestamp: Date
    }]
  },
  metadata: {
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    tokens: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    processingTime: Number, // in milliseconds
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    sources: [{
      type: {
        type: String,
        enum: ['income_tax_act', 'rules', 'notifications', 'case_law', 'guidelines']
      },
      reference: String,
      section: String
    }]
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    helpful: Boolean,
    comments: String,
    providedAt: Date
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  error: {
    message: String,
    code: String
  },
  tags: [String], // For categorization and search
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
aiQuerySchema.index({ user: 1, createdAt: -1 });
aiQuerySchema.index({ queryType: 1 });
aiQuerySchema.index({ tags: 1 });
aiQuerySchema.index({ 'metadata.sources.section': 1 });

// Virtual for response preview
aiQuerySchema.virtual('responsePreview').get(function() {
  return this.response.length > 100
    ? this.response.substring(0, 100) + '...'
    : this.response;
});

// Pre-save middleware to extract tags
aiQuerySchema.pre('save', function(next) {
  if (this.isModified('query') || this.isNew) {
    this.extractTags();
  }
  next();
});

// Method to extract tags from query and response
aiQuerySchema.methods.extractTags = function() {
  const tags = new Set();

  // Keywords for different tax topics
  const taxKeywords = {
    salary: ['salary', 'form16', 'tds', 'employer'],
    business: ['business', 'profession', 'presumptive', 'turnover'],
    house: ['house property', 'rent', 'home loan', 'section24'],
    capital: ['capital gains', 'shares', 'mutual funds', 'stocks'],
    deductions: ['80c', '80d', 'hra', 'lta', 'medical', 'donation'],
    filing: ['itr', 'filing', 'return', 'due date', 'extension'],
    regime: ['old regime', 'new regime', 'comparison', 'savings']
  };

  const content = `${this.query} ${this.response}`.toLowerCase();

  Object.entries(taxKeywords).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (content.includes(keyword.toLowerCase())) {
        tags.add(category);
      }
    });
  });

  // Add query type as tag
  tags.add(this.queryType);

  this.tags = Array.from(tags);
};

// Method to add feedback
aiQuerySchema.methods.addFeedback = function(rating, helpful, comments) {
  this.feedback = {
    rating,
    helpful,
    comments,
    providedAt: new Date()
  };
  return this.save();
};

// Method to mark as failed
aiQuerySchema.methods.markAsFailed = function(errorMessage, errorCode) {
  this.status = 'failed';
  this.error = {
    message: errorMessage,
    code: errorCode
  };
  return this.save();
};

// Static method to get user's query history
aiQuerySchema.statics.getUserQueryHistory = function(userId, limit = 50) {
  return this.find({ user: userId, isArchived: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('query response queryType createdAt feedback');
};

// Static method to get session queries
aiQuerySchema.statics.getSessionQueries = function(sessionId) {
  return this.find({ sessionId })
    .sort({ createdAt: 1 });
};

// Static method to get popular query types
aiQuerySchema.statics.getPopularQueryTypes = function(userId, days = 30) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: dateThreshold },
        isArchived: false
      }
    },
    {
      $group: {
        _id: '$queryType',
        count: { $sum: 1 },
        avgRating: { $avg: '$feedback.rating' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get AI performance metrics
aiQuerySchema.statics.getPerformanceMetrics = function(userId, days = 7) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: dateThreshold },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalQueries: { $sum: 1 },
        avgProcessingTime: { $avg: '$metadata.processingTime' },
        avgConfidence: { $avg: '$metadata.confidence' },
        avgRating: { $avg: '$feedback.rating' },
        successRate: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        totalQueries: 1,
        avgProcessingTime: 1,
        avgConfidence: 1,
        avgRating: 1,
        successRate: {
          $multiply: [
            { $divide: ['$successRate', '$totalQueries'] },
            100
          ]
        }
      }
    }
  ]);
};

const AIQuery = mongoose.model('AIQuery', aiQuerySchema);

export default AIQuery;