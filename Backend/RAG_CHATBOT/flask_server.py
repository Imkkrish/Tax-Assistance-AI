"""
Enhanced Flask server to integrate RAG chatbot with the Node.js backend
Provides advanced features for better tax assistance
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from datetime import datetime

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Try to import chatbot (with fallback to simplified version)
try:
    from rag_chatbot import AdvancedRAGChatbot
    logger.info("✅ Using enhanced RAG chatbot with LangChain")
except ImportError as e:
    from rag_chatbot_simple import AdvancedRAGChatbot
    logger.info(f"✅ Using simplified RAG chatbot (reason: {str(e)[:100]})")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the chatbot
chatbot = None
server_stats = {
    'total_queries': 0,
    'successful_queries': 0,
    'failed_queries': 0,
    'start_time': datetime.now().isoformat()
}

def init_chatbot():
    """Initialize the chatbot instance"""
    global chatbot
    try:
        # Initialize with ITA_primary by default
        chatbot = AdvancedRAGChatbot("ITA_primary")
        logger.info("✅ RAG Chatbot initialized successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Error initializing chatbot: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Enhanced health check endpoint with statistics"""
    uptime = (datetime.now() - datetime.fromisoformat(server_stats['start_time'])).total_seconds()
    
    return jsonify({
        'status': 'healthy',
        'chatbot_ready': chatbot is not None,
        'message': 'Enhanced RAG Chatbot server is running',
        'stats': {
            'total_queries': server_stats['total_queries'],
            'successful_queries': server_stats['successful_queries'],
            'failed_queries': server_stats['failed_queries'],
            'success_rate': f"{(server_stats['successful_queries'] / max(server_stats['total_queries'], 1) * 100):.1f}%",
            'uptime_seconds': uptime
        },
        'document': chatbot.document_id if chatbot else None,
        'version': '2.0.0'
    })

@app.route('/api/rag/query', methods=['POST'])
def query_chatbot():
    """
    Handle chatbot queries with enhanced features
    
    Expected JSON payload:
    {
        "query": "user question",
        "top_k": 5 (optional),
        "document_id": "ITA_primary" (optional),
        "use_context": true (optional)
    }
    """
    global chatbot, server_stats
    
    server_stats['total_queries'] += 1
    start_time = datetime.now()
    
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            server_stats['failed_queries'] += 1
            return jsonify({
                'success': False,
                'error': 'Query is required'
            }), 400
        
        query = data['query']
        top_k = data.get('top_k', 5)
        document_id = data.get('document_id', None)
        use_context = data.get('use_context', True)
        
        logger.info(f"📥 Received query: {query[:100]}...")
        
        # Reinitialize chatbot if document_id is different
        if document_id and chatbot.document_id != document_id:
            logger.info(f"🔄 Switching to document: {document_id}")
            chatbot = AdvancedRAGChatbot(document_id)
        
        # Get answer from chatbot with enhanced features
        answer = chatbot.ask(query, top_k, use_context)
        
        # Get relevant chunks for additional info
        relevant_chunks = chatbot.find_relevant_chunks(query, top_k)
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Get conversation summary
        conversation_summary = chatbot.get_conversation_summary()
        
        server_stats['successful_queries'] += 1
        
        logger.info(f"✅ Query processed successfully in {processing_time:.2f}s")
        
        return jsonify({
            'success': True,
            'data': {
                'query': query,
                'answer': answer,
                'relevant_chunks_count': len(relevant_chunks),
                'document_id': chatbot.document_id,
                'processing_time': processing_time,
                'sources': [
                    {
                        'page': chunk['metadata'].get('page', 'N/A'),
                        'chunk_id': chunk['chunk_id'],
                        'similarity': chunk['similarity'],
                        'base_similarity': chunk.get('base_similarity', chunk['similarity']),
                        'keyword_boost': chunk.get('keyword_boost', 0.0)
                    }
                    for chunk in relevant_chunks
                ],
                'conversation_context': conversation_summary
            }
        })
        
    except Exception as e:
        server_stats['failed_queries'] += 1
        logger.error(f"❌ Error processing query: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }), 500

@app.route('/api/rag/documents', methods=['GET'])
def list_documents():
    """List available vector databases"""
    try:
        vector_db_path = "vector_database"
        
        if not os.path.exists(vector_db_path):
            return jsonify({
                'success': True,
                'documents': []
            })
        
        # Get all vector databases
        vector_files = [f.replace('_vectors', '') for f in os.listdir(vector_db_path) if f.endswith('_vectors')]
        
        return jsonify({
            'success': True,
            'documents': vector_files,
            'current': chatbot.document_id if chatbot else None
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/rag/switch', methods=['POST'])
def switch_document():
    """Switch to a different document database"""
    global chatbot
    
    try:
        data = request.get_json()
        document_id = data.get('document_id')
        
        if not document_id:
            return jsonify({
                'success': False,
                'error': 'document_id is required'
            }), 400
        
        logger.info(f"🔄 Switching to document: {document_id}")
        
        # Reinitialize chatbot with new document
        chatbot = AdvancedRAGChatbot(document_id)
        
        return jsonify({
            'success': True,
            'message': f'Switched to document: {document_id}',
            'current_document': chatbot.document_id
        })
        
    except Exception as e:
        logger.error(f"❌ Error switching document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/rag/conversation/summary', methods=['GET'])
def get_conversation_summary():
    """Get conversation history summary"""
    try:
        if not chatbot:
            return jsonify({
                'success': False,
                'error': 'Chatbot not initialized'
            }), 500
        
        summary = chatbot.get_conversation_summary()
        
        return jsonify({
            'success': True,
            'data': summary
        })
        
    except Exception as e:
        logger.error(f"❌ Error getting conversation summary: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/rag/conversation/clear', methods=['POST'])
def clear_conversation():
    """Clear conversation history and cache"""
    try:
        if not chatbot:
            return jsonify({
                'success': False,
                'error': 'Chatbot not initialized'
            }), 500
        
        chatbot.clear_history()
        logger.info("🧹 Conversation history cleared")
        
        return jsonify({
            'success': True,
            'message': 'Conversation history and cache cleared'
        })
        
    except Exception as e:
        logger.error(f"❌ Error clearing conversation: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/rag/stats', methods=['GET'])
def get_server_stats():
    """Get server statistics"""
    uptime = (datetime.now() - datetime.fromisoformat(server_stats['start_time'])).total_seconds()
    success_rate = (server_stats['successful_queries'] / max(server_stats['total_queries'], 1) * 100)
    
    return jsonify({
        'success': True,
        'data': {
            'total_queries': server_stats['total_queries'],
            'successful_queries': server_stats['successful_queries'],
            'failed_queries': server_stats['failed_queries'],
            'success_rate': f"{success_rate:.1f}%",
            'uptime_seconds': uptime,
            'uptime_minutes': uptime / 60,
            'uptime_hours': uptime / 3600,
            'queries_per_minute': server_stats['total_queries'] / max(uptime / 60, 1),
            'start_time': server_stats['start_time'],
            'current_document': chatbot.document_id if chatbot else None
        }
    })

@app.route('/api/rag/suggest', methods=['POST'])
def suggest_questions():
    """Suggest follow-up questions based on previous query"""
    try:
        data = request.get_json()
        previous_query = data.get('query', '')
        
        # Generate smart suggestions based on query type
        suggestions = generate_smart_suggestions(previous_query)
        
        return jsonify({
            'success': True,
            'data': {
                'suggestions': suggestions,
                'count': len(suggestions)
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error generating suggestions: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def generate_smart_suggestions(query: str) -> list:
    """Generate contextual follow-up questions"""
    query_lower = query.lower()
    
    suggestions = []
    
    if '80c' in query_lower or 'deduction' in query_lower:
        suggestions = [
            "What are the investment options under Section 80C?",
            "How to claim 80C deductions?",
            "What is the maximum limit for Section 80C?",
            "Can I claim 80C for my children's tuition fees?"
        ]
    elif 'regime' in query_lower:
        suggestions = [
            "Which regime is better for salaried employees?",
            "Can I switch between tax regimes every year?",
            "What deductions are not available in new regime?",
            "How to calculate tax under both regimes?"
        ]
    elif 'hra' in query_lower:
        suggestions = [
            "How is HRA exemption calculated?",
            "Can I claim HRA and home loan together?",
            "What documents are needed for HRA?",
            "When is HRA not available?"
        ]
    elif 'calculate' in query_lower or 'tax' in query_lower:
        suggestions = [
            "What are the tax slabs for this year?",
            "How to reduce my tax liability?",
            "What is standard deduction?",
            "How is cess calculated on income tax?"
        ]
    else:
        suggestions = [
            "What are the major tax deductions available?",
            "How do I file my income tax return?",
            "What is the difference between old and new tax regime?",
            "What documents do I need for tax filing?"
        ]
    
    return suggestions[:4]  # Return top 4 suggestions

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Starting Enhanced RAG Chatbot Flask Server...")
    print("=" * 60)
    print("📂 Working directory:", os.getcwd())
    
    # Initialize chatbot
    if not init_chatbot():
        logger.warning("⚠️ Warning: Chatbot initialization failed. Server will start but queries will fail.")
    else:
        logger.info(f"✅ Chatbot ready with document: {chatbot.document_id}")
    
    # Start Flask server
    port = int(os.environ.get('FLASK_PORT', 5555))
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    print("=" * 60)
    print(f"🌐 Server running on http://localhost:{port}")
    print(f"📝 API endpoint: http://localhost:{port}/api/rag/query")
    print(f"🏥 Health check: http://localhost:{port}/health")
    print(f"📊 Statistics: http://localhost:{port}/api/rag/stats")
    print("=" * 60)
    print("\n📚 Available Endpoints:")
    print("   POST /api/rag/query              - Query the chatbot")
    print("   GET  /api/rag/documents          - List available documents")
    print("   POST /api/rag/switch             - Switch document")
    print("   GET  /api/rag/conversation/summary - Get conversation history")
    print("   POST /api/rag/conversation/clear   - Clear conversation")
    print("   GET  /api/rag/stats              - Server statistics")
    print("   POST /api/rag/suggest            - Get question suggestions")
    print("   GET  /health                     - Health check")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
