import os
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import numpy as np
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM

def create_rag_chatbot(pdf_path, question):
    """
    Creates a RAG model chatbot using the provided PDF document.
    Uses local models to avoid API issues.

    Args:
        pdf_path (str): The path to the PDF document.
        question (str): The user's question.

    Returns:
        str: The chatbot's answer.
    """
    print(f"Processing question: {question}")
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
        chunk_size=500,
        chunk_overlap=100,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    print(f"Split text into {len(chunks)} chunks")

    # Step 3: Create vector embeddings and find relevant chunks
    print("Loading embedding model...")
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    print("Creating embeddings for chunks...")
    chunk_embeddings = embedding_model.encode(chunks)
    question_embedding = embedding_model.encode([question])

    # Find most similar chunks
    similarities = np.dot(chunk_embeddings, question_embedding.T).flatten()
    top_k = min(3, len(chunks))  # Get top 3 most relevant chunks or all if less than 3
    top_indices = np.argsort(similarities)[-top_k:][::-1]
    
    relevant_chunks = [chunks[i] for i in top_indices]
    context = " ".join(relevant_chunks)
    
    print("Loading text generation model...")
    # Step 4: Use local text generation model
    try:
        # Try to use a local T5 model for question answering
        model_name = "google/flan-t5-small"  # Smaller model for better compatibility
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        
        # Create prompt
        prompt = f"Context: {context}\n\nQuestion: {question}\n\nAnswer:"
        
        # Generate answer
        inputs = tokenizer.encode(prompt, return_tensors="pt", max_length=512, truncation=True)
        outputs = model.generate(inputs, max_length=150, num_beams=4, early_stopping=True)
        answer = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        print("Generated answer using T5 model")
        
    except Exception as e:
        print(f"T5 model failed: {e}")
        print("Falling back to simple context-based response")
        # Fallback to simple context-based response
        answer = f"Based on the document, here's the relevant information for your question:\n\n{context}"
    
    return answer

if __name__ == "__main__":
    pdf_file_path = "test_document.pdf"
    user_question = "What is this document about?"

    answer = create_rag_chatbot(pdf_file_path, user_question)
    print("Chatbot:", answer)