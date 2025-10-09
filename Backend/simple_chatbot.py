import os
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from sentence_transformers import SentenceTransformer
import numpy as np

def create_simple_rag_chatbot(pdf_path, question):
    """
    Creates a simple RAG model chatbot using the provided PDF document.
    Uses local sentence transformers without API calls.

    Args:
        pdf_path (str): The path to the PDF document.
        question (str): The user's question.

    Returns:
        str: The chatbot's answer based on document similarity.
    """
    print("Loading PDF and extracting text...")
    
    # Step 1: Extract text from the PDF
    text = ""
    with open(pdf_path, "rb") as f:
        pdf_reader = PdfReader(f)
        for page in pdf_reader.pages:
            text += page.extract_text()

    print(f"Extracted {len(text)} characters from PDF")

    # Step 2: Split the text into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    print(f"Split text into {len(chunks)} chunks")

    # Step 3: Create vector embeddings using sentence transformers
    print("Loading embedding model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    print("Creating embeddings for chunks...")
    chunk_embeddings = model.encode(chunks)
    
    print("Creating embedding for question...")
    question_embedding = model.encode([question])

    # Step 4: Find most similar chunks
    print("Finding similar chunks...")
    similarities = np.dot(chunk_embeddings, question_embedding.T).flatten()
    top_k = 3  # Get top 3 most relevant chunks
    top_indices = np.argsort(similarities)[-top_k:][::-1]
    
    # Step 5: Create a simple answer based on most relevant chunks
    relevant_chunks = [chunks[i] for i in top_indices]
    context = "\n\n".join(relevant_chunks)
    
    # Simple rule-based response
    answer = f"""Based on the document, here are the most relevant sections for your question "{question}":

{context}

This information is extracted from the document and should help answer your question about the topic."""

    return answer

def test_simple_chatbot():
    """Test function to demonstrate the chatbot"""
    pdf_file_path = "test_document.pdf"
    
    # Test different questions
    questions = [
        "What is agricultural income?",
        "What is this document about?",
        "Tell me about tax deductions"
    ]
    
    for question in questions:
        print(f"\n{'='*50}")
        print(f"Question: {question}")
        print(f"{'='*50}")
        
        try:
            answer = create_simple_rag_chatbot(pdf_file_path, question)
            print("Answer:")
            print(answer)
        except Exception as e:
            print(f"Error: {e}")
        
        print(f"\n{'='*50}\n")

if __name__ == "__main__":
    test_simple_chatbot()