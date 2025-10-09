import os
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import faiss
from typing import List, Dict, Tuple
import re
from datetime import datetime

class AdvancedRAGChatbot:
    def __init__(self, document_id: str = None):
        """
        Initialize the Advanced RAG Chatbot with enhanced features
        
        Args:
            document_id (str): Specific document ID to load, or None to use ITA_primary as default
        """
        print("🚀 Initializing Enhanced RAG Chatbot...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chunks = []
        self.embeddings = None
        self.metadata = []
        self.conversation_history = []
        self.query_cache = {}  # Cache for frequently asked questions
        
        # Default to ITA_primary if no specific document_id is provided
        self.document_id = document_id if document_id else "ITA_primary"
        
        # Tax-specific keywords for better context understanding
        self.tax_keywords = {
            'deduction': ['80c', '80d', '80e', '80g', '24b', 'deduction', 'exemption'],
            'income': ['salary', 'income', 'earnings', 'revenue', 'profit'],
            'regime': ['old regime', 'new regime', 'tax regime', 'regime comparison'],
            'calculation': ['calculate', 'computation', 'formula', 'how to compute'],
            'filing': ['itr', 'return', 'filing', 'form 16', 'form 26as'],
            'penalty': ['penalty', 'late fee', 'interest', 'default'],
            'assessment': ['assessment', 'notice', 'scrutiny']
        }
        
        # Load the vector database
        self.load_vector_database()
        print("✅ RAG Chatbot initialized successfully!")
    
    def load_vector_database(self):
        """Load the pre-created vector database"""
        try:
            # Find available documents
            vector_db_path = "vector_database"
            metadata_path = "document_metadata"
            
            if not os.path.exists(vector_db_path) or not os.path.exists(metadata_path):
                print("❌ Vector database not found. Please run document_vectorizer.py first to create the database.")
                print("Usage: python document_vectorizer.py <pdf_file_path>")
                exit(1)
            
            # Get all available document IDs
            vector_files = [f for f in os.listdir(vector_db_path) if f.endswith('_vectors')]
            if not vector_files:
                print("❌ No vector databases found.")
                exit(1)
            
            # Use specified document_id (default is ITA_primary)
            vector_file = f"{self.document_id}_vectors"
            metadata_file = f"{self.document_id}_metadata.json"
            
            # Check if the specified vector database exists
            if not os.path.exists(os.path.join(vector_db_path, vector_file)):
                print(f"⚠️ Specified database '{self.document_id}' not found. Available databases:")
                for vf in vector_files:
                    print(f"   - {vf.replace('_vectors', '')}")
                
                if vector_files:
                    # Fall back to the most recent vector file
                    vector_file = max(vector_files, key=lambda x: os.path.getctime(os.path.join(vector_db_path, x)))
                    doc_id = vector_file.replace('_vectors', '')
                    metadata_file = f"{doc_id}_metadata.json"
                    self.document_id = doc_id
                    print(f"📋 Using fallback database: {self.document_id}")
                else:
                    raise FileNotFoundError("No vector databases found")
            
            # Load FAISS index and chunks
            vector_dir = os.path.join(vector_db_path, vector_file)
            faiss_index_path = os.path.join(vector_dir, "index.faiss")
            chunks_path = os.path.join(vector_dir, "index.pkl")
            
            # Load FAISS index
            self.faiss_index = faiss.read_index(faiss_index_path)
            
            # Load chunks from LangChain FAISS format
            with open(chunks_path, 'rb') as f:
                docstore, index_to_id = pickle.load(f)
                # Extract chunks from docstore
                self.chunks = []
                for i in range(len(index_to_id)):
                    if i in index_to_id:
                        doc_id = index_to_id[i]
                        if doc_id in docstore._dict:
                            doc = docstore._dict[doc_id]
                            self.chunks.append(doc.page_content)
                        else:
                            self.chunks.append("")
                    else:
                        self.chunks.append("")
            
            # Load metadata
            metadata_path_full = os.path.join(metadata_path, metadata_file)
            with open(metadata_path_full, 'r', encoding='utf-8') as f:
                metadata_info = json.load(f)
                self.metadata = metadata_info['chunks_metadata']
            
            print(f"✅ Loaded vector database '{self.document_id}' with {len(self.chunks)} chunks")
            print(f"📄 Document: {metadata_info.get('filename', 'Unknown')}")
            
        except FileNotFoundError as e:
            print(f"❌ Vector database file not found: {e}")
            print("Please run document_vectorizer.py first to create the database.")
            exit(1)
        except Exception as e:
            print(f"❌ Error loading vector database: {e}")
            exit(1)
    
    def find_relevant_chunks(self, query: str, top_k: int = 5, similarity_threshold: float = 0.3) -> List[Dict]:
        """
        Find the most relevant chunks for a given query using FAISS with enhanced features
        
        Args:
            query (str): User's question
            top_k (int): Number of top chunks to return
            similarity_threshold (float): Minimum similarity score to consider
            
        Returns:
            List[Dict]: List of relevant chunks with metadata
        """
        # Check cache first
        cache_key = f"{query.lower()}_{top_k}"
        if cache_key in self.query_cache:
            print("📦 Using cached results")
            return self.query_cache[cache_key]
        
        # Enhance query with tax-specific context
        enhanced_query = self.enhance_query(query)
        
        # Embed the enhanced query
        query_embedding = self.model.encode([enhanced_query]).astype('float32')
        
        # Search using FAISS with more candidates initially
        search_k = min(top_k * 3, len(self.chunks))  # Get 3x candidates for better filtering
        scores, indices = self.faiss_index.search(query_embedding, search_k)
        
        relevant_chunks = []
        seen_content = set()  # Avoid duplicate content
        
        for i, (distance, idx) in enumerate(zip(scores[0], indices[0])):
            if idx < len(self.chunks):
                chunk_content = self.chunks[idx]
                
                # Skip duplicates or near-duplicates
                if chunk_content[:100] in seen_content:
                    continue
                seen_content.add(chunk_content[:100])
                
                # Convert FAISS distance to similarity score
                similarity_score = 1.0 / (1.0 + distance) if distance >= 0 else 1.0
                
                # Apply threshold
                if similarity_score >= similarity_threshold:
                    # Calculate relevance boost based on keyword matching
                    keyword_boost = self.calculate_keyword_relevance(query, chunk_content)
                    final_score = similarity_score * (1 + keyword_boost * 0.2)  # Up to 20% boost
                    
                    relevant_chunks.append({
                        'chunk': chunk_content,
                        'similarity': float(final_score),
                        'base_similarity': float(similarity_score),
                        'keyword_boost': float(keyword_boost),
                        'metadata': self.metadata[idx] if idx < len(self.metadata) else {'page': 'N/A', 'chunk_id': idx},
                        'chunk_id': int(idx)
                    })
                
                # Stop when we have enough high-quality chunks
                if len(relevant_chunks) >= top_k:
                    break
        
        # Sort by final score
        relevant_chunks.sort(key=lambda x: x['similarity'], reverse=True)
        relevant_chunks = relevant_chunks[:top_k]
        
        # Cache the results
        self.query_cache[cache_key] = relevant_chunks
        
        # Limit cache size
        if len(self.query_cache) > 100:
            # Remove oldest entries
            oldest_keys = list(self.query_cache.keys())[:20]
            for key in oldest_keys:
                del self.query_cache[key]
        
        return relevant_chunks
    
    def enhance_query(self, query: str) -> str:
        """
        Enhance query with additional context for better semantic search
        
        Args:
            query (str): Original user query
            
        Returns:
            str: Enhanced query
        """
        query_lower = query.lower()
        enhancements = []
        
        # Add context based on tax keywords
        for category, keywords in self.tax_keywords.items():
            if any(kw in query_lower for kw in keywords):
                enhancements.append(category)
        
        # Add section numbers if mentioned
        section_pattern = r'section\s+(\d+[a-z]*)'
        sections = re.findall(section_pattern, query_lower)
        if sections:
            enhancements.extend(sections)
        
        # Combine original query with enhancements
        if enhancements:
            return f"{query} context: {' '.join(enhancements)}"
        return query
    
    def calculate_keyword_relevance(self, query: str, chunk: str) -> float:
        """
        Calculate keyword-based relevance boost
        
        Args:
            query (str): User query
            chunk (str): Document chunk
            
        Returns:
            float: Relevance boost score (0-1)
        """
        query_lower = query.lower()
        chunk_lower = chunk.lower()
        
        # Extract important terms from query
        query_terms = set(re.findall(r'\b\w+\b', query_lower))
        # Remove common stop words
        stop_words = {'is', 'are', 'the', 'a', 'an', 'what', 'how', 'why', 'when', 'where', 'can', 'do', 'does'}
        query_terms = query_terms - stop_words
        
        if not query_terms:
            return 0.0
        
        # Count matches
        matches = sum(1 for term in query_terms if term in chunk_lower)
        
        # Calculate boost
        boost = matches / len(query_terms)
        
        # Extra boost for exact phrase matches
        if query_lower in chunk_lower:
            boost += 0.3
        
        return min(boost, 1.0)
    
    def generate_contextual_answer(self, query: str, relevant_chunks: List[Dict]) -> str:
        """
        Generate a contextual answer based on relevant chunks with enhanced formatting
        
        Args:
            query (str): User's question
            relevant_chunks (List[Dict]): Relevant document chunks
            
        Returns:
            str: Generated answer with source attribution and formatting
        """
        if not relevant_chunks:
            return self.generate_fallback_answer(query)
        
        # Store in conversation history
        self.conversation_history.append({
            'query': query,
            'timestamp': datetime.now().isoformat(),
            'chunks_used': len(relevant_chunks)
        })
        
        # Create context from relevant chunks
        context_parts = []
        sources = []
        
        for i, chunk_data in enumerate(relevant_chunks, 1):
            chunk = chunk_data['chunk']
            metadata = chunk_data['metadata']
            similarity = chunk_data['similarity']
            
            context_parts.append(f"[Source {i}] {chunk}")
            
            # Format source with more details
            page_info = metadata.get('page', 'N/A')
            chunk_id = metadata.get('chunk_id', chunk_data['chunk_id'])
            confidence = self.get_confidence_label(similarity)
            
            sources.append({
                'number': i,
                'page': page_info,
                'chunk_id': chunk_id,
                'similarity': similarity,
                'confidence': confidence
            })
        
        context = "\n\n".join(context_parts)
        
        # Generate structured answer based on query type
        answer = self.create_structured_answer(query, context, relevant_chunks)
        
        # Add enhanced source attribution
        source_attribution = self.format_sources(sources)
        
        # Add confidence score and quality indicators
        avg_similarity = sum(s['similarity'] for s in sources) / len(sources)
        confidence_section = self.format_confidence(avg_similarity, len(relevant_chunks))
        
        return f"{answer}\n\n{source_attribution}\n\n{confidence_section}"
    
    def generate_fallback_answer(self, query: str) -> str:
        """
        Generate a helpful fallback answer when no relevant chunks are found
        
        Args:
            query (str): User's question
            
        Returns:
            str: Fallback answer with suggestions
        """
        return f"""I couldn't find specific information about "{query}" in the Income Tax Act documents.

**Here's how I can help:**

💡 **Try rephrasing your question:**
   - Use specific terms like "Section 80C", "deduction", "tax calculation"
   - Ask about specific tax scenarios or provisions

📚 **I can answer questions about:**
   - Tax deductions and exemptions
   - Income tax calculations
   - Tax filing procedures
   - Specific sections of Income Tax Act
   - Tax regime comparisons

🔍 **Example questions:**
   - "What is Section 80C?"
   - "How to calculate HRA exemption?"
   - "What are the tax slabs for new regime?"

Please try asking in a different way or be more specific about what you'd like to know."""
    
    def get_confidence_label(self, similarity: float) -> str:
        """Get human-readable confidence label"""
        if similarity >= 0.8:
            return "Very High"
        elif similarity >= 0.6:
            return "High"
        elif similarity >= 0.4:
            return "Medium"
        else:
            return "Low"
    
    def format_sources(self, sources: List[Dict]) -> str:
        """
        Format sources in a clean, readable way
        
        Args:
            sources (List[Dict]): List of source information
            
        Returns:
            str: Formatted source attribution
        """
        source_lines = ["📚 **Sources & References:**"]
        
        for source in sources:
            confidence_emoji = "🟢" if source['similarity'] >= 0.7 else "🟡" if source['similarity'] >= 0.5 else "🟠"
            source_lines.append(
                f"   {confidence_emoji} Source {source['number']}: Page {source['page']} "
                f"(Relevance: {source['similarity']:.2f} - {source['confidence']})"
            )
        
        return "\n".join(source_lines)
    
    def format_confidence(self, avg_similarity: float, chunk_count: int) -> str:
        """
        Format confidence and quality information
        
        Args:
            avg_similarity (float): Average similarity score
            chunk_count (int): Number of chunks used
            
        Returns:
            str: Formatted confidence section
        """
        confidence_emoji = "✅" if avg_similarity >= 0.7 else "⚠️" if avg_similarity >= 0.5 else "ℹ️"
        
        confidence_text = f"{confidence_emoji} **Answer Confidence:** {avg_similarity:.1%}"
        quality_text = f"📊 **Based on:** {chunk_count} relevant document sections"
        
        disclaimer = ""
        if avg_similarity < 0.6:
            disclaimer = "\n\n⚠️ *Note: This answer has moderate confidence. Please verify with official sources or consult a tax professional for critical decisions.*"
        
        return f"{confidence_text}\n{quality_text}{disclaimer}"
    
    def create_structured_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """
        Create a structured answer based on the query type and context
        
        Args:
            query (str): User's question
            context (str): Relevant context from documents
            relevant_chunks (List[Dict]): List of relevant chunks with metadata
            
        Returns:
            str: Structured answer
        """
        query_lower = query.lower()
        
        # Analyze query type
        if any(word in query_lower for word in ['what is', 'define', 'definition', 'meaning']):
            return self.create_definition_answer(query, context, relevant_chunks)
        elif any(word in query_lower for word in ['how to', 'how do', 'process', 'procedure', 'steps']):
            return self.create_process_answer(query, context, relevant_chunks)
        elif any(word in query_lower for word in ['example', 'examples', 'instance', 'case']):
            return self.create_example_answer(query, context, relevant_chunks)
        elif any(word in query_lower for word in ['calculate', 'computation', 'formula']):
            return self.create_calculation_answer(query, context, relevant_chunks)
        elif any(word in query_lower for word in ['benefit', 'advantage', 'exemption', 'deduction']):
            return self.create_benefit_answer(query, context, relevant_chunks)
        else:
            return self.create_general_answer(query, context, relevant_chunks)
    
    def create_definition_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """Create a definition-style answer"""
        # Extract the most relevant chunk for definition
        top_chunk = relevant_chunks[0]['chunk']
        
        # Look for definition patterns
        definition_lines = []
        for line in top_chunk.split('\n'):
            if line.strip() and (
                'is defined as' in line.lower() or 
                'means' in line.lower() or 
                'includes' in line.lower() or
                'refers to' in line.lower()
            ):
                definition_lines.append(line.strip())
        
        if definition_lines:
            answer = f"**Definition:**\n\n{chr(10).join(definition_lines)}"
        else:
            # Use the most relevant chunk
            answer = f"**Answer:**\n\n{top_chunk}"
        
        # Add additional context if available
        if len(relevant_chunks) > 1:
            additional_info = []
            for chunk_data in relevant_chunks[1:3]:  # Get next 2 chunks
                chunk = chunk_data['chunk']
                if len(chunk.strip()) > 50:  # Only add substantial chunks
                    additional_info.append(chunk.strip())
            
            if additional_info:
                answer += f"\n\n**Additional Information:**\n\n{chr(10).join(additional_info[:2])}"
        
        return answer
    
    def create_process_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """Create a process/procedure-style answer"""
        # Look for numbered lists, bullet points, or step-by-step information
        steps = []
        for chunk_data in relevant_chunks:
            chunk = chunk_data['chunk']
            lines = chunk.split('\n')
            for line in lines:
                line = line.strip()
                if line and (
                    line[0].isdigit() or 
                    line.startswith('•') or 
                    line.startswith('-') or
                    line.lower().startswith('step') or
                    'must' in line.lower() or
                    'should' in line.lower()
                ):
                    steps.append(line)
        
        if steps:
            answer = f"**Process/Steps:**\n\n" + "\n".join(f"• {step}" for step in steps)
        else:
            answer = f"**Procedure:**\n\n{relevant_chunks[0]['chunk']}"
        
        return answer
    
    def create_example_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """Create an example-focused answer"""
        examples = []
        for chunk_data in relevant_chunks:
            chunk = chunk_data['chunk']
            if any(word in chunk.lower() for word in ['example', 'for instance', 'such as', 'like']):
                examples.append(chunk)
        
        if examples:
            answer = f"**Examples:**\n\n" + "\n\n".join(examples)
        else:
            answer = f"**Relevant Information:**\n\n{relevant_chunks[0]['chunk']}"
        
        return answer
    
    def create_calculation_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """Create a calculation/formula-focused answer"""
        # Look for mathematical expressions, percentages, formulas
        calc_info = []
        for chunk_data in relevant_chunks:
            chunk = chunk_data['chunk']
            if any(char in chunk for char in ['%', '₹', '$', '=', '+', '-', '×', '÷']) or \
               any(word in chunk.lower() for word in ['calculate', 'formula', 'rate', 'percentage', 'amount']):
                calc_info.append(chunk)
        
        if calc_info:
            answer = f"**Calculation Information:**\n\n" + "\n\n".join(calc_info)
        else:
            answer = f"**Related Information:**\n\n{relevant_chunks[0]['chunk']}"
        
        return answer
    
    def create_benefit_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """Create a benefits/exemptions-focused answer"""
        benefits = []
        for chunk_data in relevant_chunks:
            chunk = chunk_data['chunk']
            if any(word in chunk.lower() for word in ['benefit', 'exemption', 'deduction', 'allowance', 'relief']):
                benefits.append(chunk)
        
        if benefits:
            answer = f"**Benefits/Exemptions:**\n\n" + "\n\n".join(benefits)
        else:
            answer = f"**Relevant Information:**\n\n{relevant_chunks[0]['chunk']}"
        
        return answer
    
    def create_general_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """Create a general answer"""
        # Combine top chunks for comprehensive answer
        combined_chunks = []
        for chunk_data in relevant_chunks[:3]:  # Use top 3 chunks
            chunk = chunk_data['chunk'].strip()
            if chunk and len(chunk) > 30:  # Only substantial chunks
                combined_chunks.append(chunk)
        
        answer = f"**Answer:**\n\n" + "\n\n".join(combined_chunks)
        return answer
    
    def ask(self, query: str, top_k: int = 5, use_context: bool = True) -> str:
        """
        Main method to ask a question and get an answer with enhanced features
        
        Args:
            query (str): User's question
            top_k (int): Number of relevant chunks to consider
            use_context (bool): Whether to use conversation context
            
        Returns:
            str: Generated answer with sources and confidence
        """
        print(f"🔍 Processing query: {query}")
        
        # Add conversation context if enabled
        if use_context and len(self.conversation_history) > 0:
            query = self.add_conversation_context(query)
        
        # Find relevant chunks
        relevant_chunks = self.find_relevant_chunks(query, top_k)
        
        if not relevant_chunks:
            print("⚠️ No relevant chunks found")
            return self.generate_fallback_answer(query)
        
        print(f"📚 Found {len(relevant_chunks)} relevant chunks")
        print(f"   Top similarity: {relevant_chunks[0]['similarity']:.3f}")
        
        # Generate answer
        answer = self.generate_contextual_answer(query, relevant_chunks)
        
        return f"💡 **Answer:**\n\n{answer}"
    
    def add_conversation_context(self, query: str) -> str:
        """
        Add context from recent conversation history
        
        Args:
            query (str): Current query
            
        Returns:
            str: Enhanced query with context
        """
        if not self.conversation_history:
            return query
        
        # Get last 2 queries for context
        recent_queries = [h['query'] for h in self.conversation_history[-2:]]
        
        # Check if current query refers to previous context
        if any(word in query.lower() for word in ['it', 'this', 'that', 'these', 'those', 'also', 'more']):
            context = " (previous context: " + "; ".join(recent_queries) + ")"
            return query + context
        
        return query
    
    def get_conversation_summary(self) -> Dict:
        """
        Get summary of conversation history
        
        Returns:
            Dict: Conversation statistics
        """
        if not self.conversation_history:
            return {
                'total_queries': 0,
                'avg_chunks_used': 0,
                'recent_topics': []
            }
        
        total_chunks = sum(h['chunks_used'] for h in self.conversation_history)
        
        return {
            'total_queries': len(self.conversation_history),
            'avg_chunks_used': total_chunks / len(self.conversation_history),
            'recent_topics': [h['query'] for h in self.conversation_history[-5:]],
            'session_start': self.conversation_history[0]['timestamp'] if self.conversation_history else None
        }
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        self.query_cache = {}
        print("🧹 Conversation history and cache cleared")
    
    def interactive_chat(self):
        """Start an interactive chat session"""
        print("🚀 Advanced Tax Assistant RAG Chatbot")
        print("📖 Loaded document knowledge base")
        print("💬 Type your questions (type 'quit' to exit)")
        print("=" * 50)
        
        while True:
            try:
                query = input("\n❓ Your question: ").strip()
                
                if query.lower() in ['quit', 'exit', 'bye', 'q']:
                    print("👋 Goodbye!")
                    break
                
                if not query:
                    print("⚠️ Please enter a question.")
                    continue
                
                answer = self.ask(query)
                print(f"\n{answer}")
                print("\n" + "=" * 50)
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")

def test_chatbot():
    """Test the chatbot with various questions"""
    chatbot = AdvancedRAGChatbot()
    
    test_questions = [
        "What is agricultural income?",
        "How to calculate tax on agricultural income?",
        "What are the exemptions for agricultural income?",
        "Give me examples of agricultural income",
        "What is the definition of income tax?",
        "Tell me about tax deductions",
        "What are the filing requirements?",
        "How do I file my tax returns?"
    ]
    
    print("🧪 Testing Advanced RAG Chatbot")
    print("=" * 60)
    
    for i, question in enumerate(test_questions, 1):
        print(f"\n{i}. Testing: {question}")
        print("-" * 40)
        answer = chatbot.ask(question)
        print(answer)
        print("\n" + "=" * 60)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_chatbot()
    else:
        chatbot = AdvancedRAGChatbot()
        chatbot.interactive_chat()