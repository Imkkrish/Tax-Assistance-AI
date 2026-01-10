import os
import shutil
import logging
from dotenv import load_dotenv

# --- UPDATED IMPORTS ---
from langchain_openai import OpenAIEmbeddings  # <--- NEW IMPORT
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# LangChain Classic Chains
from langchain_classic.chains import create_history_aware_retriever, create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

# Load Env
load_dotenv()
logger = logging.getLogger(__name__)

# Constants
PERSIST_DIRECTORY = "./chroma_db"
PDF_PATH = "INOME_TAX_ACT.pdf" 

# --- Global Models ---
# 1. Initialize OpenAI Embeddings
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY is missing! Please add it to your .env file.")

embeddings = OpenAIEmbeddings(model="text-embedding-3-small") # Efficient & Cheap

# 2. Keep Gemini for Chat (Optional: You can switch this to ChatOpenAI too if you want)
if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY is missing!")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3,
    convert_system_message_to_human=True
)

def ingest_static_data():
    """
    Checks if vector store exists. If not, ingests the PDF.
    """
    if os.path.exists(PERSIST_DIRECTORY):
        # OPTIONAL: Auto-clean old DB if switching models to prevent dimension errors
        # If you are sure you want to rebuild, uncomment the next 2 lines:
        # shutil.rmtree(PERSIST_DIRECTORY)
        # logger.info("🗑️ Old vector store deleted for model switch.")
        
        if os.listdir(PERSIST_DIRECTORY):
            logger.info("✅ Vector store found. Skipping ingestion.")
            return

    if not os.path.exists(PDF_PATH):
        logger.warning(f"⚠️ {PDF_PATH} not found. Cannot ingest.")
        return

    logger.info("🔄 Ingesting static data with OpenAI Embeddings...")
    try:
        loader = PyPDFLoader(PDF_PATH)
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        
        Chroma.from_documents(
            documents=splits,
            embedding=embeddings,
            persist_directory=PERSIST_DIRECTORY
        )
        logger.info("✅ Ingestion complete.")
    except Exception as e:
        logger.error(f"❌ Ingestion failed: {e}")

# --- Memory Management ---
store = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

def delete_session_history(session_id: str):
    if session_id in store:
        del store[session_id]

# --- RAG Chain Construction ---
def get_rag_chain():
    vectorstore = Chroma(
        persist_directory=PERSIST_DIRECTORY, 
        embedding_function=embeddings
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

    # 1. History Awareness Prompt
    contextualize_q_system_prompt = (
        "Given a chat history and the latest user question "
        "which might reference context in the chat history, "
        "formulate a standalone question which can be understood "
        "without the chat history. Do NOT answer the question, "
        "just reformulate it if needed and otherwise return it as is."
    )
    
    contextualize_q_prompt = ChatPromptTemplate.from_messages([
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    
    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_q_prompt
    )

    # 2. Answer Prompt
    system_prompt = (
        "You are an AI Tax Assistant based on the Income Tax Act 1961. "
        "Use the following pieces of retrieved context to answer the question. "
        "If the information is not present in the context or if the context is irrelevant, "
        "strictly answer with: 'I cannot help you with that based on the provided documents.' "
        "Do not attempt to fabricate an answer."
        "\n\n"
        "{context}"
    )
    
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    
    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

    return RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )

# Initialize the chain once
final_chain = get_rag_chain()