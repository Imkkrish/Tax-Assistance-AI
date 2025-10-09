"""
Vector Database Builder for Tax Assistant
This script processes PDF documents and creates persistent vector embeddings
for efficient retrieval in the chatbot system.
"""

import os
import json
import pickle
from datetime import datetime
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
import numpy as np

class DocumentVectorizer:
    def __init__(self, embeddings_model="all-MiniLM-L6-v2", chunk_size=800, chunk_overlap=150):
        """
        Initialize the document vectorizer.
        
        Args:
            embeddings_model (str): HuggingFace model for embeddings
            chunk_size (int): Size of text chunks
            chunk_overlap (int): Overlap between chunks
        """
        self.embeddings_model = embeddings_model
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        print(f"Loading embeddings model: {embeddings_model}")
        self.embeddings = HuggingFaceEmbeddings(model_name=embeddings_model)
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
        # Create directories for storing data
        self.vector_db_path = "vector_database"
        self.metadata_path = "document_metadata"
        os.makedirs(self.vector_db_path, exist_ok=True)
        os.makedirs(self.metadata_path, exist_ok=True)
    
    def extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF with page numbers."""
        text_data = []
        
        with open(pdf_path, "rb") as file:
            pdf_reader = PdfReader(file)
            for page_num, page in enumerate(pdf_reader.pages, 1):
                text = page.extract_text()
                if text.strip():  # Only add non-empty pages
                    text_data.append({
                        'content': text,
                        'page': page_num,
                        'source': os.path.basename(pdf_path)
                    })
        
        return text_data
    
    def process_document(self, pdf_path, document_id=None):
        """
        Process a single PDF document and create vector embeddings.
        
        Args:
            pdf_path (str): Path to the PDF file
            document_id (str): Optional custom ID for the document
        
        Returns:
            str: Document ID for the processed document
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        # Generate document ID if not provided
        if document_id is None:
            document_id = f"doc_{os.path.basename(pdf_path).replace('.pdf', '')}_{int(datetime.now().timestamp())}"
        
        print(f"Processing document: {pdf_path}")
        print(f"Document ID: {document_id}")
        
        # Extract text from PDF
        text_data = self.extract_text_from_pdf(pdf_path)
        print(f"Extracted text from {len(text_data)} pages")
        
        # Create chunks with metadata
        all_chunks = []
        all_metadata = []
        
        for page_data in text_data:
            chunks = self.text_splitter.split_text(page_data['content'])
            
            for i, chunk in enumerate(chunks):
                all_chunks.append(chunk)
                all_metadata.append({
                    'document_id': document_id,
                    'source': page_data['source'],
                    'page': page_data['page'],
                    'chunk_id': f"{document_id}_p{page_data['page']}_c{i}",
                    'chunk_index': i,
                    'processed_at': datetime.now().isoformat()
                })
        
        print(f"Created {len(all_chunks)} text chunks")
        
        # Create vector store
        print("Creating vector embeddings...")
        vector_store = FAISS.from_texts(
            texts=all_chunks,
            embedding=self.embeddings,
            metadatas=all_metadata
        )
        
        # Save vector store
        vector_db_file = os.path.join(self.vector_db_path, f"{document_id}_vectors")
        vector_store.save_local(vector_db_file)
        print(f"Saved vector database to: {vector_db_file}")
        
        # Save metadata
        metadata_file = os.path.join(self.metadata_path, f"{document_id}_metadata.json")
        document_metadata = {
            'document_id': document_id,
            'source_file': pdf_path,
            'total_pages': len(text_data),
            'total_chunks': len(all_chunks),
            'chunk_size': self.chunk_size,
            'chunk_overlap': self.chunk_overlap,
            'embeddings_model': self.embeddings_model,
            'processed_at': datetime.now().isoformat(),
            'chunks_metadata': all_metadata
        }
        
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(document_metadata, f, indent=2, ensure_ascii=False)
        
        print(f"Saved metadata to: {metadata_file}")
        print(f"✅ Successfully processed document: {document_id}")
        
        return document_id
    
    def load_vector_database(self, document_id):
        """Load a previously created vector database."""
        vector_db_file = os.path.join(self.vector_db_path, f"{document_id}_vectors")
        
        if not os.path.exists(vector_db_file):
            raise FileNotFoundError(f"Vector database not found: {vector_db_file}")
        
        vector_store = FAISS.load_local(
            vector_db_file, 
            self.embeddings,
            allow_dangerous_deserialization=True
        )
        
        return vector_store
    
    def get_document_info(self, document_id):
        """Get metadata information about a processed document."""
        metadata_file = os.path.join(self.metadata_path, f"{document_id}_metadata.json")
        
        if not os.path.exists(metadata_file):
            return None
        
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        return metadata
    
    def list_processed_documents(self):
        """List all processed documents."""
        documents = []
        
        if os.path.exists(self.metadata_path):
            for filename in os.listdir(self.metadata_path):
                if filename.endswith('_metadata.json'):
                    doc_id = filename.replace('_metadata.json', '')
                    metadata = self.get_document_info(doc_id)
                    if metadata:
                        documents.append({
                            'document_id': doc_id,
                            'source_file': metadata.get('source_file', 'Unknown'),
                            'total_pages': metadata.get('total_pages', 0),
                            'total_chunks': metadata.get('total_chunks', 0),
                            'processed_at': metadata.get('processed_at', 'Unknown')
                        })
        
        return documents

def main():
    """Example usage of the DocumentVectorizer."""
    import sys
    
    vectorizer = DocumentVectorizer()
    
    # Get PDF path from command line arguments or use default
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    else:
        pdf_path = "test_document.pdf"
        print("No PDF file specified. Using default: test_document.pdf")
        print("Usage: python document_vectorizer.py <pdf_file_path>")
    
    if os.path.exists(pdf_path):
        try:
            doc_id = vectorizer.process_document(pdf_path)
            print(f"\n📄 Document processed successfully!")
            print(f"Document ID: {doc_id}")
            
            # Show document info
            info = vectorizer.get_document_info(doc_id)
            print(f"\n📊 Document Statistics:")
            print(f"- Total pages: {info['total_pages']}")
            print(f"- Total chunks: {info['total_chunks']}")
            print(f"- Embeddings model: {info['embeddings_model']}")
            
        except Exception as e:
            print(f"❌ Error processing document: {e}")
    else:
        print(f"❌ PDF file not found: {pdf_path}")
        print("Please create a test PDF first by running create_test_pdf.py")
    
    # List all processed documents
    print(f"\n📚 All processed documents:")
    docs = vectorizer.list_processed_documents()
    for doc in docs:
        print(f"- {doc['document_id']}: {doc['source_file']} ({doc['total_chunks']} chunks)")

if __name__ == "__main__":
    main()