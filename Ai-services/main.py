import os
import json
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
from dotenv import load_dotenv
from pypdf import PdfReader
import io

# 1. Setup & Configuration
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    # Warning: Ensure GOOGLE_API_KEY is set in .env
    print("WARNING: GOOGLE_API_KEY not found in environment variables.")

genai.configure(api_key=api_key)

# Configure the model
model = genai.GenerativeModel('gemini-2.5-flash-lite')

app = FastAPI(title="AI Tax Assistant Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Data Models
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

# 3. Helper Function
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text from PDF: {str(e)}")

# 4. API Endpoints

@app.get("/")
async def health_check():
    return {"status": "running"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        system_prompt = "You are an expert Indian Income Tax Assistant. Answer queries based on the latest Indian tax laws. Keep answers concise."
        
        # Combine prompts
        full_prompt = f"{system_prompt}\n"
        if request.context:
            full_prompt += f"Context: {request.context}\n"
        full_prompt += f"User Message: {request.message}"
        
        response = model.generate_content(full_prompt)
        
        return {"reply": response.text}
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-document")
async def analyze_document_endpoint(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        content = await file.read()
        pdf_text = extract_text_from_pdf(content)
        
        prompt = (
            "Extract the following tax details from the text below:\n"
            "- Gross Salary\n"
            "- HRA\n"
            "- Basic Salary\n"
            "- Standard Deduction\n"
            "- TDS\n"
            "- 80C Investments\n\n"
            "Return the result as a valid JSON object ONLY. Do not include Markdown formatting (like ```json ... ```).\n"
            f"Text content:\n{pdf_text[:10000]}" # Limit text length to avoid token limits if file is huge
        )
        
        response = model.generate_content(prompt)
        
        # Clean response if it contains markdown code blocks despite instructions
        cleaned_text = response.text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.startswith("```"):
            cleaned_text = cleaned_text[3:] 
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
            
        return json.loads(cleaned_text)
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON.")
    except Exception as e:
        print(f"Error in analyze-document endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 5. Configuration for deployment
backend_url_env = os.getenv("BACKEND_URL", "http://localhost:5000")
if not backend_url_env.startswith("http"):
    backend_url = f"https://{backend_url_env}"
else:
    backend_url = backend_url_env

print(f"🔗 Backend URL configured as: {backend_url}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True, timeout_keep_alive=300)
