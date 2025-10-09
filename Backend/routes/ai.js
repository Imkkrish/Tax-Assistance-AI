import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth.js';
import { validateAIQuery, validateObjectId } from '../middleware/validation.js';
import { catchAsync } from '../middleware/errorHandler.js';
import AIQuery from '../models/AIQuery.js';

const router = express.Router();

// RAG Chatbot Flask server configuration
const RAG_SERVER_URL = process.env.RAG_SERVER_URL || 'http://localhost:5555';
const USE_RAG_CHATBOT = process.env.USE_RAG_CHATBOT !== 'false'; // Enable by default

// All routes require authentication
router.use(protect);

// @desc    Create AI query
// @route   POST /api/ai/query
// @access  Private
router.post('/query', validateAIQuery, catchAsync(async (req, res, next) => {
  const { query, queryType, sessionId, context } = req.body;

  console.log('📥 Received AI query:', {
    user: req.user?.email || req.user?._id,
    query: query.substring(0, 100),
    queryType,
    sessionId,
    USE_RAG_CHATBOT
  });

  // Create AI query record
  const aiQuery = await AIQuery.create({
    user: req.user._id,
    sessionId,
    query,
    queryType,
    context: context || {},
    status: 'processing'
  });

  // Integrate with RAG Chatbot or fallback to mock responses
  try {
    let aiResponse;
    
    // Try to use RAG chatbot if enabled and available
    if (USE_RAG_CHATBOT) {
      try {
        console.log('🤖 Attempting RAG query to:', RAG_SERVER_URL);
        aiResponse = await generateRAGResponse(query, context);
        console.log('✅ Used RAG Chatbot for response');
      } catch (ragError) {
        console.log('⚠️ RAG Chatbot unavailable, using fallback:', ragError.message);
        console.error('RAG Error details:', ragError.response?.data || ragError);
        aiResponse = await generateAIResponse(query, queryType, context);
      }
    } else {
      aiResponse = await generateAIResponse(query, queryType, context);
    }

    aiQuery.response = aiResponse.response;
    aiQuery.metadata = {
      ...aiQuery.metadata,
      model: aiResponse.model || 'mock-assistant',
      tokens: aiResponse.tokens,
      processingTime: aiResponse.processingTime,
      confidence: aiResponse.confidence,
      sources: aiResponse.sources
    };
    aiQuery.status = 'completed';
    await aiQuery.save();

    res.status(201).json({
      success: true,
      data: {
        query: aiQuery.query,
        response: aiQuery.response,
        queryType: aiQuery.queryType,
        confidence: aiQuery.metadata.confidence,
        sources: aiQuery.metadata.sources,
        sessionId: aiQuery.sessionId
      }
    });
  } catch (error) {
    await aiQuery.markAsFailed(error.message, 'AI_PROCESSING_ERROR');
    return res.status(500).json({
      success: false,
      message: 'AI query processing failed'
    });
  }
}));

// @desc    Get query history
// @route   GET /api/ai/history
// @access  Private
router.get('/history', catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  const total = await AIQuery.countDocuments({
    user: req.user._id,
    isArchived: false
  });

  const queries = await AIQuery
    .find({ user: req.user._id, isArchived: false })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .select('query response queryType createdAt feedback metadata.confidence');

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalQueries: total,
    hasNext: page * limit < total,
    hasPrev: page > 1
  };

  res.status(200).json({
    success: true,
    count: queries.length,
    pagination,
    data: queries
  });
}));

// @desc    Get single query
// @route   GET /api/ai/query/:id
// @access  Private
router.get('/query/:id', validateObjectId, catchAsync(async (req, res, next) => {
  const query = await AIQuery.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!query) {
    return res.status(404).json({
      success: false,
      message: 'Query not found'
    });
  }

  res.status(200).json({
    success: true,
    data: query
  });
}));

// @desc    Add feedback to query
// @route   POST /api/ai/query/:id/feedback
// @access  Private
router.post('/query/:id/feedback', validateObjectId, catchAsync(async (req, res, next) => {
  const { rating, helpful, comments } = req.body;

  const query = await AIQuery.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!query) {
    return res.status(404).json({
      success: false,
      message: 'Query not found'
    });
  }

  await query.addFeedback(rating, helpful, comments);

  res.status(200).json({
    success: true,
    message: 'Feedback submitted successfully'
  });
}));

// @desc    Get session queries
// @route   GET /api/ai/session/:sessionId
// @access  Private
router.get('/session/:sessionId', catchAsync(async (req, res, next) => {
  const queries = await AIQuery.getSessionQueries(req.params.sessionId);

  // Filter to only user's queries
  const userQueries = queries.filter(query => query.user.toString() === req.user._id.toString());

  res.status(200).json({
    success: true,
    count: userQueries.length,
    data: userQueries
  });
}));

// @desc    Get AI performance metrics
// @route   GET /api/ai/metrics
// @access  Private
router.get('/metrics', catchAsync(async (req, res, next) => {
  const days = parseInt(req.query.days, 10) || 7;

  const metrics = await AIQuery.getPerformanceMetrics(req.user._id, days);

  res.status(200).json({
    success: true,
    data: metrics.length > 0 ? metrics[0] : {
      totalQueries: 0,
      avgProcessingTime: 0,
      avgConfidence: 0,
      avgRating: 0,
      successRate: 0
    }
  });
}));

// @desc    Get popular query types
// @route   GET /api/ai/popular-types
// @access  Private
router.get('/popular-types', catchAsync(async (req, res, next) => {
  const days = parseInt(req.query.days, 10) || 30;

  const popularTypes = await AIQuery.getPopularQueryTypes(req.user._id, days);

  res.status(200).json({
    success: true,
    data: popularTypes
  });
}));

// @desc    Archive query
// @route   PUT /api/ai/query/:id/archive
// @access  Private
router.put('/query/:id/archive', validateObjectId, catchAsync(async (req, res, next) => {
  const query = await AIQuery.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isArchived: true },
    { new: true }
  );

  if (!query) {
    return res.status(404).json({
      success: false,
      message: 'Query not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Query archived successfully'
  });
}));

// @desc    Delete query
// @route   DELETE /api/ai/query/:id
// @access  Private
router.delete('/query/:id', validateObjectId, catchAsync(async (req, res, next) => {
  const query = await AIQuery.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!query) {
    return res.status(404).json({
      success: false,
      message: 'Query not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Query deleted successfully'
  });
}));

// @desc    Search queries
// @route   GET /api/ai/search
// @access  Private
router.get('/search', catchAsync(async (req, res, next) => {
  const { q, type, from, to } = req.query;

  let query = { user: req.user._id, isArchived: false };

  // Text search
  if (q) {
    query.$or = [
      { query: { $regex: q, $options: 'i' } },
      { response: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } }
    ];
  }

  // Filter by type
  if (type) {
    query.queryType = type;
  }

  // Date range
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  const queries = await AIQuery
    .find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .select('query response queryType createdAt tags');

  res.status(200).json({
    success: true,
    count: queries.length,
    data: queries
  });
}));

// @desc    Get RAG chatbot statistics
// @route   GET /api/ai/rag/stats
// @access  Private
router.get('/rag/stats', catchAsync(async (req, res, next) => {
  try {
    if (!USE_RAG_CHATBOT) {
      return res.status(400).json({
        success: false,
        message: 'RAG chatbot is disabled'
      });
    }

    const response = await axios.get(`${RAG_SERVER_URL}/api/rag/stats`, {
      timeout: 5000
    });

    res.status(200).json({
      success: true,
      data: response.data.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RAG stats',
      error: error.message
    });
  }
}));

// @desc    Get conversation summary from RAG
// @route   GET /api/ai/conversation/summary
// @access  Private
router.get('/conversation/summary', catchAsync(async (req, res, next) => {
  try {
    if (!USE_RAG_CHATBOT) {
      return res.status(400).json({
        success: false,
        message: 'RAG chatbot is disabled'
      });
    }

    const response = await axios.get(`${RAG_SERVER_URL}/api/rag/conversation/summary`, {
      timeout: 5000
    });

    res.status(200).json({
      success: true,
      data: response.data.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation summary',
      error: error.message
    });
  }
}));

// @desc    Clear RAG conversation history
// @route   POST /api/ai/conversation/clear
// @access  Private
router.post('/conversation/clear', catchAsync(async (req, res, next) => {
  try {
    if (!USE_RAG_CHATBOT) {
      return res.status(400).json({
        success: false,
        message: 'RAG chatbot is disabled'
      });
    }

    const response = await axios.post(`${RAG_SERVER_URL}/api/rag/conversation/clear`, {}, {
      timeout: 5000
    });

    res.status(200).json({
      success: true,
      message: 'Conversation history cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear conversation history',
      error: error.message
    });
  }
}));

// @desc    Get question suggestions
// @route   POST /api/ai/suggestions
// @access  Private
router.post('/suggestions', catchAsync(async (req, res, next) => {
  const { query } = req.body;

  try {
    if (USE_RAG_CHATBOT) {
      const response = await axios.post(`${RAG_SERVER_URL}/api/rag/suggest`, {
        query
      }, {
        timeout: 5000
      });

      return res.status(200).json({
        success: true,
        data: response.data.data.suggestions
      });
    }

    // Fallback suggestions
    const fallbackSuggestions = [
      'What are the major tax deductions available?',
      'How do I calculate my income tax?',
      'What is the difference between old and new tax regime?',
      'Can you explain Section 80C deductions?'
    ];

    res.status(200).json({
      success: true,
      data: fallbackSuggestions
    });
  } catch (error) {
    // Return fallback on error
    res.status(200).json({
      success: true,
      data: [
        'What are the major tax deductions available?',
        'How do I calculate my income tax?',
        'What is the difference between old and new tax regime?',
        'Can you explain Section 80C deductions?'
      ]
    });
  }
}));

// RAG Chatbot response generator with enhanced features
async function generateRAGResponse(query, context) {
  const startTime = Date.now();

  try {
    const response = await axios.post(`${RAG_SERVER_URL}/api/rag/query`, {
      query,
      top_k: context?.top_k || 5,
      document_id: context?.document_id || 'ITA_primary',
      use_context: context?.use_context !== false  // Default to true
    }, {
      timeout: 30000 // 30 second timeout
    });

    const processingTime = Date.now() - startTime;

    if (!response.data.success) {
      throw new Error(response.data.error || 'RAG query failed');
    }

    const data = response.data.data;

    return {
      response: data.answer,
      tokens: {
        prompt: Math.floor(query.length / 4),
        completion: Math.floor(data.answer.length / 4),
        total: Math.floor((query.length + data.answer.length) / 4)
      },
      processingTime: data.processing_time || processingTime / 1000,
      confidence: calculateConfidence(data.sources),
      sources: data.sources.map(source => ({
        type: 'income_tax_act',
        reference: `Page ${source.page}`,
        section: `Chunk ${source.chunk_id}`,
        similarity: source.similarity,
        base_similarity: source.base_similarity,
        keyword_boost: source.keyword_boost
      })),
      model: 'rag-faiss-chatbot-v2',
      conversation_context: data.conversation_context
    };
  } catch (error) {
    console.error('❌ RAG Server Error:', error.message);
    throw error;
  }
}

// Calculate confidence score based on similarity scores
function calculateConfidence(sources) {
  if (!sources || sources.length === 0) return 0.5;
  
  const avgSimilarity = sources.reduce((sum, source) => sum + (source.similarity || 0), 0) / sources.length;
  
  // Convert similarity (0-1) to confidence (0-1)
  // Higher similarity = higher confidence
  return Math.min(Math.max(avgSimilarity, 0.3), 0.95);
}

// Mock AI response generator (fallback when RAG is unavailable)
async function generateAIResponse(query, queryType, context) {
  const startTime = Date.now();

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  const processingTime = Date.now() - startTime;

  // Generate mock response based on query type
  let response = '';
  let sources = [];
  let confidence = 0.8;

  switch (queryType) {
    case 'tax_calculation_help':
      response = `Based on your query about tax calculations, here's what you need to know:

1. **Taxable Income Calculation**: Your taxable income is calculated as Total Income minus Deductions minus Exemptions.

2. **Current Tax Slabs**: Under the new tax regime, the slabs are:
   - ₹0 - ₹3,00,000: Nil
   - ₹3,00,000 - ₹7,00,000: 5%
   - ₹7,00,000 - ₹10,00,000: 10%
   - ₹10,00,000 - ₹12,00,000: 15%
   - Above ₹12,00,000: 20%

3. **Key Deductions**: Make sure to claim deductions under Section 80C (up to ₹1,50,000), 80D for medical insurance, and HRA if applicable.

For personalized advice, please provide more details about your income sources and deductions.`;
      sources = [
        { type: 'income_tax_act', reference: 'Section 4', section: 'Computation of total income' },
        { type: 'rules', reference: 'Rule 12', section: 'New tax regime slabs' }
      ];
      break;

    case 'deduction_guidance':
      response = `Here are the most common tax deductions you can claim:

**Section 80C** (Maximum ₹1,50,000):
- Life insurance premium
- ELSS investments
- PPF contributions
- Home loan principal repayment
- Children's education fees

**Section 80D** (Medical Insurance):
- Self and family: ₹25,000
- Parents: ₹25,000 (₹50,000 if senior citizens)

**Section 24(b)** (Home Loan Interest): ₹2,00,000

**Other Important Deductions**:
- HRA exemption
- LTA exemption
- Standard deduction (₹50,000)

Remember to keep all receipts and investment proofs for tax filing.`;
      sources = [
        { type: 'income_tax_act', reference: 'Section 80C', section: 'Deductions' },
        { type: 'income_tax_act', reference: 'Section 80D', section: 'Medical insurance' }
      ];
      break;

    case 'regime_comparison':
      response = `Comparing Old vs New Tax Regime:

**Old Regime**:
- More deductions available
- Higher tax rates
- Suitable if you have significant deductions

**New Regime**:
- Lower tax rates
- Limited deductions
- Simpler calculation
- Mandatory for high-income individuals

**Recommendation**: Calculate your tax liability under both regimes with your actual income and deductions to determine which is more beneficial for you.

Generally, if your deductions exceed ₹3,00,000, old regime might be better. Otherwise, new regime could save you money.`;
      sources = [
        { type: 'income_tax_act', reference: 'Section 115BAC', section: 'New tax regime' },
        { type: 'guidelines', reference: 'CBDT Circular', section: 'Tax regime comparison' }
      ];
      break;

    default:
      response = `Thank you for your tax-related query. Based on the Income Tax Act, 1961, and current tax rules, here's some general guidance:

Please provide more specific details about your situation for more accurate advice. Remember that this is general information and not personalized tax advice. Consult a chartered accountant for your specific tax planning needs.

Key points to remember:
- File your ITR before the due date
- Keep all supporting documents
- Report all income sources accurately
- Claim eligible deductions`;
      sources = [
        { type: 'income_tax_act', reference: 'Section 139', section: 'Return of income' }
      ];
      confidence = 0.7;
  }

  return {
    response,
    tokens: { prompt: Math.floor(query.length / 4), completion: Math.floor(response.length / 4), total: Math.floor((query.length + response.length) / 4) },
    processingTime,
    confidence,
    sources
  };
}

export default router;