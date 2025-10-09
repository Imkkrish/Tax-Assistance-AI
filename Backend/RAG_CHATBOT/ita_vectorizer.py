#!/usr/bin/env python3
"""
Comprehensive ITA.pdf Vectorizer
Creates a high-quality vector database specifically for ITA.pdf
"""

import os
import json
import time
import PyPDF2
import faiss
import numpy as np
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import SentenceTransformer
import pickle
from typing import List, Dict, Optional
import re

class ITAVectorizer:
    def __init__(self):
        """Initialize the ITA PDF vectorizer with optimized settings"""
        print("🚀 Initializing ITA PDF Vectorizer...")
        
        # Use smaller chunks for better precision with legal documents
        self.chunk_size = 800
        self.chunk_overlap = 150
        
        # Initialize embeddings model
        self.embeddings = HuggingFaceEmbeddings(
            model_name='all-MiniLM-L6-v2',
            model_kwargs={'device': 'cpu'}
        )
        
        # Initialize text splitter with legal document optimizations
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=[
                "\n\n",  # Paragraph breaks
                "\n",    # Line breaks
                ".",     # Sentence endings
                ";",     # Clause separators
                ":",     # List separators
                " ",     # Word breaks
                ""       # Character level
            ]
        )
        
        print("✅ Vectorizer initialized successfully!")
    
    def extract_text_from_pdf(self, pdf_path: str) -> Dict:
        """Extract text from ITA.pdf with enhanced processing"""
        print(f"📖 Extracting text from: {pdf_path}")
        
        text_by_page = {}
        total_text = ""
        failed_pages = []
        
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                total_pages = len(pdf_reader.pages)
                
                print(f"📄 Total pages in ITA.pdf: {total_pages}")
                
                for page_num in range(total_pages):
                    if page_num % 25 == 0:  # Progress indicator every 25 pages
                        print(f"   Processing page {page_num + 1}/{total_pages}")
                    
                    try:
                        page = pdf_reader.pages[page_num]
                        text = page.extract_text()
                        
                        if text and text.strip():
                            # Clean and preprocess text
                            cleaned_text = self.clean_legal_text(text)
                            if len(cleaned_text.strip()) > 50:  # Only meaningful content
                                text_by_page[page_num + 1] = cleaned_text
                                total_text += f"\n\n=== Page {page_num + 1} ===\n{cleaned_text}"
                        else:
                            failed_pages.append(page_num + 1)
                            
                    except Exception as e:
                        print(f"⚠️ Error processing page {page_num + 1}: {e}")
                        failed_pages.append(page_num + 1)
                        continue
                
                processed_pages = len(text_by_page)
                print(f"✅ Successfully processed {processed_pages}/{total_pages} pages")
                
                if failed_pages:
                    print(f"⚠️ Failed to process {len(failed_pages)} pages: {failed_pages[:10]}{'...' if len(failed_pages) > 10 else ''}")
                
                return {
                    'total_text': total_text,
                    'text_by_page': text_by_page,
                    'total_pages': total_pages,
                    'processed_pages': processed_pages,
                    'failed_pages': failed_pages,
                    'success_rate': (processed_pages / total_pages) * 100
                }
                
        except Exception as e:
            print(f"❌ Error reading ITA.pdf: {e}")
            return None
    
    def clean_legal_text(self, text: str) -> str:
        """Clean and preprocess legal document text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Fix common OCR issues in legal documents
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # Add space between camelCase
        text = re.sub(r'(\d+)([A-Z])', r'\1 \2', text)    # Add space between number and letter
        
        # Clean up section numbering
        text = re.sub(r'(\d+)\s*\.\s*(\d+)', r'\1.\2', text)  # Fix section numbering
        
        # Remove page headers/footers patterns
        text = re.sub(r'Page\s+\d+.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Income\s+Tax\s+Act.*\d{4}', '', text, flags=re.IGNORECASE)
        
        return text.strip()
    
    def create_enhanced_chunks(self, pdf_data: Dict) -> List[Dict]:
        """Create enhanced chunks with comprehensive metadata"""
        print(f"🧩 Creating optimized text chunks...")
        
        total_text = pdf_data['total_text']
        text_by_page = pdf_data['text_by_page']
        
        # Split text into chunks
        chunks = self.text_splitter.split_text(total_text)
        
        print(f"📝 Created {len(chunks)} initial chunks")
        
        # Create enhanced metadata for each chunk
        chunks_with_metadata = []
        
        for i, chunk in enumerate(chunks):
            # Find which page this chunk belongs to
            page_num = self.find_page_for_chunk(chunk, text_by_page)
            
            # Extract section information if available
            section_info = self.extract_section_info(chunk)
            
            # Analyze chunk content type
            content_type = self.analyze_chunk_content(chunk)
            
            chunk_metadata = {
                'chunk_id': f"ita_chunk_{i:04d}",
                'page': page_num,
                'length': len(chunk),
                'section': section_info,
                'content_type': content_type,
                'preview': chunk[:150] + "..." if len(chunk) > 150 else chunk
            }
            
            chunks_with_metadata.append({
                'text': chunk,
                'metadata': chunk_metadata
            })
        
        # Filter out very short or empty chunks
        filtered_chunks = [
            chunk for chunk in chunks_with_metadata 
            if len(chunk['text'].strip()) > 100  # Minimum meaningful content
        ]
        
        print(f"✅ Created {len(filtered_chunks)} high-quality chunks (filtered from {len(chunks)})")
        return filtered_chunks
    
    def find_page_for_chunk(self, chunk: str, text_by_page: Dict) -> int:
        """Find which page a chunk belongs to with improved accuracy"""
        # Look for page markers first
        page_match = re.search(r'=== Page (\d+) ===', chunk)
        if page_match:
            return int(page_match.group(1))
        
        # Use word overlap method as fallback
        chunk_words = set(chunk.lower().split()[:15])  # Use first 15 words
        
        best_page = 1
        best_score = 0
        
        for page_num, page_text in text_by_page.items():
            page_words = set(page_text.lower().split())
            overlap = len(chunk_words.intersection(page_words))
            
            if overlap > best_score:
                best_score = overlap
                best_page = page_num
        
        return best_page
    
    def extract_section_info(self, chunk: str) -> str:
        """Extract section information from chunk"""
        # Look for section patterns in legal documents
        section_patterns = [
            r'Section\s+(\d+[A-Z]*)',
            r'Chapter\s+([IVX]+)',
            r'Rule\s+(\d+)',
            r'Sub-section\s+\((\d+)\)',
            r'Clause\s+\(([a-z])\)'
        ]
        
        for pattern in section_patterns:
            match = re.search(pattern, chunk, re.IGNORECASE)
            if match:
                return match.group(0)
        
        return "General"
    
    def analyze_chunk_content(self, chunk: str) -> str:
        """Analyze the type of content in the chunk"""
        chunk_lower = chunk.lower()
        
        if any(word in chunk_lower for word in ['definition', 'means', 'shall mean']):
            return 'definition'
        elif any(word in chunk_lower for word in ['exemption', 'exempt', 'not taxable']):
            return 'exemption'
        elif any(word in chunk_lower for word in ['penalty', 'fine', 'punishment']):
            return 'penalty'
        elif any(word in chunk_lower for word in ['procedure', 'process', 'filing']):
            return 'procedure'
        elif any(word in chunk_lower for word in ['rate', 'percentage', 'calculation']):
            return 'calculation'
        elif any(word in chunk_lower for word in ['deduction', 'allowance', 'relief']):
            return 'deduction'
        else:
            return 'general'
    
    def create_ita_vector_database(self) -> bool:
        """Create comprehensive vector database for ITA.pdf"""
        start_time = time.time()
        
        pdf_path = "ITA.pdf"
        
        if not os.path.exists(pdf_path):
            print(f"❌ ITA.pdf not found in current directory")
            return False
        
        print(f"🚀 Starting comprehensive vectorization of ITA.pdf")
        print(f"📊 File size: {os.path.getsize(pdf_path) / (1024*1024):.2f} MB")
        
        # Extract text from PDF
        pdf_data = self.extract_text_from_pdf(pdf_path)
        if not pdf_data:
            return False
        
        print(f"📈 Text extraction success rate: {pdf_data['success_rate']:.1f}%")
        
        # Create chunks with metadata
        chunks_with_metadata = self.create_enhanced_chunks(pdf_data)
        
        if not chunks_with_metadata:
            print("❌ No chunks created")
            return False
        
        # Prepare texts for vectorization
        texts = [chunk['text'] for chunk in chunks_with_metadata]
        metadatas = [chunk['metadata'] for chunk in chunks_with_metadata]
        
        print(f"🔄 Creating FAISS vector database with {len(texts)} chunks...")
        
        try:
            # Create FAISS vector store with progress indication
            vector_store = FAISS.from_texts(
                texts=texts,
                embedding=self.embeddings,
                metadatas=metadatas
            )
            
            # Create directories
            os.makedirs("vector_database", exist_ok=True)
            os.makedirs("document_metadata", exist_ok=True)
            
            # Save vector database with specific name for ITA
            vector_db_path = "vector_database/ITA_primary_vectors"
            vector_store.save_local(vector_db_path)
            
            # Save comprehensive metadata
            processing_time = time.time() - start_time
            
            # Analyze content distribution
            content_types = {}
            for chunk in chunks_with_metadata:
                content_type = chunk['metadata']['content_type']
                content_types[content_type] = content_types.get(content_type, 0) + 1
            
            metadata = {
                'filename': 'ITA.pdf',
                'document_id': 'ITA_primary',
                'total_pages': pdf_data['total_pages'],
                'processed_pages': pdf_data['processed_pages'],
                'total_chunks': len(chunks_with_metadata),
                'chunk_size': self.chunk_size,
                'chunk_overlap': self.chunk_overlap,
                'processing_time': f"{processing_time:.2f} seconds",
                'success_rate': f"{pdf_data['success_rate']:.1f}%",
                'content_distribution': content_types,
                'failed_pages': pdf_data.get('failed_pages', []),
                'chunks_metadata': metadatas,
                'created_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                'model_used': 'all-MiniLM-L6-v2'
            }
            
            with open("document_metadata/ITA_primary_metadata.json", 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            print(f"\n🎉 ITA.pdf Vector Database Created Successfully!")
            print(f"=" * 50)
            print(f"📄 Document: ITA.pdf")
            print(f"📊 Pages processed: {pdf_data['processed_pages']}/{pdf_data['total_pages']} ({pdf_data['success_rate']:.1f}%)")
            print(f"🧩 Total chunks: {len(chunks_with_metadata)}")
            print(f"⏱️ Processing time: {processing_time:.2f} seconds")
            print(f"🏷️ Content types: {content_types}")
            print(f"💾 Vector database: vector_database/ITA_primary_vectors")
            print(f"📝 Metadata: document_metadata/ITA_primary_metadata.json")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating vector database: {e}")
            return False

def main():
    """Main function to create ITA vector database"""
    vectorizer = ITAVectorizer()
    
    success = vectorizer.create_ita_vector_database()
    
    if success:
        print(f"\n✅ ITA.pdf is now ready for RAG chatbot!")
        print(f"🚀 To test the chatbot, run:")
        print(f"   python3 rag_chatbot.py")
        print(f"\n💡 The chatbot will automatically use ITA_primary as the main database")
    else:
        print(f"\n❌ Failed to create ITA vector database!")

if __name__ == "__main__":
    main()