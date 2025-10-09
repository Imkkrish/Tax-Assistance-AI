#!/usr/bin/env python3
"""
Rebuild vector database in a format compatible with the simplified RAG chatbot
This script extracts text from the PDF and creates a new FAISS index without LangChain dependencies
"""

import os
import json
import pickle
import hashlib
import numpy as np
from typing import List, Dict
import faiss
from sentence_transformers import SentenceTransformer
import PyPDF2

class VectorDBRebuilder:
    def __init__(self, pdf_path: str, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.pdf_path = pdf_path
        self.model = SentenceTransformer(model_name)
        self.chunks = []
        self.metadata = []
        
    def extract_text_from_pdf(self) -> List[Dict]:
        """Extract text chunks from PDF with metadata"""
        print(f"📄 Reading PDF: {self.pdf_path}")
        chunks_with_metadata = []
        
        with open(self.pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            total_pages = len(pdf_reader.pages)
            print(f"📚 Total pages: {total_pages}")
            
            for page_num in range(total_pages):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                
                if text.strip():
                    # Split page into chunks (roughly 500 characters each)
                    chunk_size = 500
                    overlap = 100
                    
                    page_text = text.strip()
                    start = 0
                    chunk_id_on_page = 0
                    
                    while start < len(page_text):
                        end = start + chunk_size
                        chunk_text = page_text[start:end]
                        
                        # Try to break at sentence boundary
                        if end < len(page_text):
                            last_period = chunk_text.rfind('.')
                            last_newline = chunk_text.rfind('\n')
                            break_point = max(last_period, last_newline)
                            if break_point > chunk_size * 0.7:  # At least 70% of chunk size
                                chunk_text = chunk_text[:break_point + 1]
                                end = start + break_point + 1
                        
                        if len(chunk_text.strip()) > 50:  # Minimum chunk size
                            chunks_with_metadata.append({
                                'text': chunk_text.strip(),
                                'page': page_num + 1,  # 1-indexed pages
                                'chunk_id': chunk_id_on_page,
                                'char_start': start,
                                'char_end': end
                            })
                            chunk_id_on_page += 1
                        
                        start = end - overlap
                
                if (page_num + 1) % 50 == 0:
                    print(f"   Processed {page_num + 1}/{total_pages} pages...")
        
        print(f"✅ Extracted {len(chunks_with_metadata)} chunks")
        return chunks_with_metadata
    
    def build_faiss_index(self, chunks_with_metadata: List[Dict]) -> faiss.Index:
        """Build FAISS index from chunks"""
        print("🔄 Encoding chunks with sentence transformer...")
        
        # Extract texts
        texts = [chunk['text'] for chunk in chunks_with_metadata]
        self.chunks = texts
        
        # Extract metadata
        self.metadata = [
            {
                'page': chunk['page'],
                'chunk_id': chunk['chunk_id'],
                'char_start': chunk['char_start'],
                'char_end': chunk['char_end']
            }
            for chunk in chunks_with_metadata
        ]
        
        # Encode all chunks
        embeddings = self.model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
        embeddings = embeddings.astype('float32')
        
        # Create FAISS index
        dimension = embeddings.shape[1]
        print(f"📐 Creating FAISS index (dimension: {dimension})...")
        index = faiss.IndexFlatL2(dimension)
        index.add(embeddings)
        
        print(f"✅ FAISS index created with {index.ntotal} vectors")
        return index
    
    def save_vector_database(self, output_dir: str, document_id: str):
        """Save vector database in simplified format"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Create document-specific directory
        vector_dir = os.path.join(output_dir, f"{document_id}_vectors")
        os.makedirs(vector_dir, exist_ok=True)
        
        # Save FAISS index
        faiss_path = os.path.join(vector_dir, "index.faiss")
        print(f"💾 Saving FAISS index to: {faiss_path}")
        faiss.write_index(self.faiss_index, faiss_path)
        
        # Save chunks as simple list (no LangChain objects)
        chunks_path = os.path.join(vector_dir, "index.pkl")
        print(f"💾 Saving chunks to: {chunks_path}")
        with open(chunks_path, 'wb') as f:
            pickle.dump(self.chunks, f)
        
        # Save metadata
        metadata_dir = os.path.join(os.path.dirname(output_dir), "document_metadata")
        os.makedirs(metadata_dir, exist_ok=True)
        
        doc_hash = hashlib.md5(document_id.encode()).hexdigest()[:8]
        timestamp = int(os.path.getmtime(self.pdf_path))
        metadata_filename = f"{document_id}_{doc_hash}_{timestamp}_metadata.json"
        metadata_path = os.path.join(metadata_dir, metadata_filename)
        
        metadata_info = {
            'filename': os.path.basename(self.pdf_path),
            'document_id': document_id,
            'total_chunks': len(self.chunks),
            'embedding_model': 'sentence-transformers/all-MiniLM-L6-v2',
            'created_at': timestamp,
            'chunks_metadata': self.metadata,
            'format_version': '2.0'
        }
        
        print(f"💾 Saving metadata to: {metadata_path}")
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata_info, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Vector database saved successfully!")
        print(f"   📁 Vectors: {vector_dir}")
        print(f"   📋 Metadata: {metadata_path}")
        print(f"   📊 Total chunks: {len(self.chunks)}")
    
    def rebuild(self, output_dir: str = "./vector_database", document_id: str = "ITA_primary"):
        """Full rebuild process"""
        print("=" * 60)
        print("🔨 REBUILDING VECTOR DATABASE")
        print("=" * 60)
        
        # Step 1: Extract text
        chunks_with_metadata = self.extract_text_from_pdf()
        
        # Step 2: Build FAISS index
        self.faiss_index = self.build_faiss_index(chunks_with_metadata)
        
        # Step 3: Save everything
        self.save_vector_database(output_dir, document_id)
        
        print("\n" + "=" * 60)
        print("✅ REBUILD COMPLETE!")
        print("=" * 60)

def main():
    # Configuration
    PDF_PATH = "./ITA.pdf"
    OUTPUT_DIR = "./vector_database"
    DOCUMENT_ID = "ITA_primary"
    
    if not os.path.exists(PDF_PATH):
        print(f"❌ Error: PDF file not found: {PDF_PATH}")
        print("   Please ensure ITA.pdf is in the RAG_CHATBOT directory")
        return
    
    # Rebuild
    rebuilder = VectorDBRebuilder(PDF_PATH)
    rebuilder.rebuild(OUTPUT_DIR, DOCUMENT_ID)
    
    print("\n🚀 You can now restart the RAG server to use the new database")
    print("   docker-compose restart rag-server")

if __name__ == "__main__":
    main()
