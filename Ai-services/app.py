import logging
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_core import ingest_static_data, final_chain, delete_session_history

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TaxBotAPI")

app = FastAPI(title="Tax Assistant AI")

# CORS is vital for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    session_id: str

class EndSessionRequest(BaseModel):
    session_id: str

@app.on_event("startup")
async def startup_event():
    """Run ingestion on startup."""
    ingest_static_data()

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Invoke the pre-built chain
        response = final_chain.invoke(
            {"input": request.query},
            config={"configurable": {"session_id": request.session_id}}
        )
        return {"answer": response["answer"]}
    except Exception as e:
        logger.error(f"Chat Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error processing your request.")

@app.post("/end_session")
async def end_session(request: EndSessionRequest):
    delete_session_history(request.session_id)
    return {"message": "Session ended. Memory cleared."}

@app.get("/health")
def health_check():
    return {"status": "active", "service": "Tax Assistant RAG"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)