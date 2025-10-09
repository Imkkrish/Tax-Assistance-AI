# TaxEase - AI-Assisted Tax Filing System
## Hack Qubit Hackathon Project by Conquer Bytes

### 🚀 Quick Start

Get up and running in 2 minutes:

```bash
# Start all services (Backend, Frontend, RAG Chatbot)
./start-all.sh

# Open in browser
open http://localhost:5174
```

**Chat Assistant**: Navigate to http://localhost:5174/assistant

### 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 2-minute setup guide 
- **[INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)** - Complete integration overview
- **[RAG_INTEGRATION_GUIDE.md](RAG_INTEGRATION_GUIDE.md)** - Detailed setup and API docs
- **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** - Visual system architecture
- **[Frontend/MULTILINGUAL_GUIDE.md](Frontend/MULTILINGUAL_GUIDE.md)** - Multi-language support documentation

### ✨ Features

- ✅ **RAG-Powered Chatbot** - Semantic search on Income Tax Act using FAISS
- ✅ **JWT Authentication** - Secure login and registration
- ✅ **Tax Calculator** - Calculate taxes under different regimes
- ✅ **Document Upload** - Upload and process tax documents
- ✅ **AI Assistant** - Get answers to tax-related queries
- ✅ **Multi-Language Support** - 5 languages: English, Hindi, Marathi, Tamil, Telugu
  - Beautiful language switcher with flags
  - Automatic browser language detection
  - Persistent language preferences

### 🏗️ Architecture

```
Frontend (React) → Backend (Node.js) → RAG Server (Flask/Python) → FAISS Vector DB
                        ↓
                   MongoDB
```

### 🛠️ Tech Stack

**Frontend**: React 19, Vite 7, Tailwind CSS 4  
**Backend**: Node.js, Express, MongoDB, JWT  
**RAG Server**: Python, Flask, FAISS, Sentence Transformers  

### 📦 Services

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5174 | http://localhost:5174 |
| Backend | 8080 | http://localhost:8080 |
| RAG Server | 5555 | http://localhost:5555 |
| MongoDB | 27017 | mongodb://localhost:27017 |

### 🧪 Testing

```bash
# Test all services
./test-integration.sh

# View logs
tail -f logs/backend.log
tail -f logs/frontend.log  
tail -f logs/rag_server.log
```

### 🛑 Stopping Services

```bash
./stop-all.sh
```

### 📖 API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

#### AI Assistant  
- `POST /api/ai/query` - Query the RAG chatbot
- `GET /api/ai/history` - Get query history

#### Documents
- `POST /api/documents/upload` - Upload documents
- `GET /api/documents` - List documents

### 🤖 RAG Chatbot

The system uses a Retrieval-Augmented Generation (RAG) chatbot powered by:
- **FAISS** for vector similarity search
- **Sentence Transformers** for text embeddings  
- **Flask** REST API wrapper
- **Income Tax Act** documents as knowledge base

### 🔧 Configuration

Edit `Backend/.env`:

```properties
# Enable/disable RAG chatbot
USE_RAG_CHATBOT=true

# RAG server URL
RAG_SERVER_URL=http://localhost:5555
```

### 📊 Project Structure

```
├── Frontend/              # React application
├── Backend/               # Node.js server
│   └── RAG_CHATBOT/      # Python RAG server
├── logs/                  # Service logs
├── start-all.sh          # Start script
├── stop-all.sh           # Stop script
└── test-integration.sh   # Test script
```

### 🐛 Troubleshooting

**Services won't start**: Check `logs/` directory  
**Port conflicts**: Run `./stop-all.sh` first  
**RAG errors**: Set `USE_RAG_CHATBOT=false` in `.env`

### 👥 Team: Conquer Bytes

Built for Hack Qubit Hackathon

### 📄 License

MIT License

---

**Status**: ✅ Production Ready  
**Last Updated**: January 2025
