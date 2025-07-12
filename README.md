# RAG-Powered AI Chat Agent

A modern web application that enables users to upload documents and chat with an AI agent that uses Retrieval-Augmented Generation (RAG) to provide contextually relevant responses.

## 🚀 Demo

The application is now running locally:
- **Client**: http://localhost:5176
- **Server**: http://localhost:3001  
- **API Documentation**: http://localhost:3001/api

## 📋 Features

- 📄 **Document Upload**: Support for PDF, DOCX, and TXT files
- 🔍 **Text Processing**: Intelligent chunking and embedding generation
- 🗃️ **Vector Storage**: Efficient similarity search with Chromadb
- 🤖 **AI Chat**: Streaming responses from AWS Bedrock
- 💬 **Modern UI**: Clean, responsive chat interface
- 🔒 **Security**: Rate limiting, input validation, secure credential handling
- 🧪 **Testing**: Comprehensive test coverage
- 🐳 **Docker**: Production-ready containerization

## 🛠️ Tech Stack

- **Server**: Node.js with NestJS and TypeScript
- **Client**: React with TypeScript and Vite
- **AI Integration**: AWS Bedrock via AI SDK from Vercel
- **Vector Database**: ChromaDB
- **Document Processing**: PDF, DOCX, and TXT support
- **UI Components**: Radix UI with Tailwind CSS
- **Testing**: Jest (server), Vitest (client)

## 📁 Project Structure

```
ragdoll/
├── packages/
│   ├── server/                     # NestJS API server
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   ├── common/             # Shared utilities, guards, filters
│   │   │   ├── config/             # Configuration management
│   │   │   ├── documents/          # Document upload & processing
│   │   │   ├── chat/               # Chat endpoint & RAG logic
│   │   │   ├── vector/             # Vector database integration
│   │   │   ├── ai/                 # AWS Bedrock integration
│   │   │   └── health/             # Health check endpoint
│   │   ├── test/                   # E2E tests
│   │   ├── uploads/                # Document upload directory
│   │   └── Dockerfile
│   └── client/                     # React web app
│       ├── src/
│       │   ├── components/         # Reusable UI components
│       │   ├── services/           # API client & utilities
│       │   ├── stores/             # State management
│       │   ├── types/              # TypeScript type definitions
│       │   └── lib/                # Utility functions
│       └── Dockerfile
├── docker-compose.yml
├── .env.example
├── .env                            # Local environment variables
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS account with Bedrock access (optional for demo)
- Pinecone account (optional for demo)

### Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development**:
   ```bash
   npm run dev
   ```

   This will start:
   - Server at `http://localhost:3001`
   - Client at `http://localhost:5176` (or next available port)

3. **Test the application**:
   - Open the client URL in your browser
   - Upload a document (PDF, DOCX, or TXT)
   - Start chatting with the AI about your documents

### Production Setup

For production deployment with real AWS and Pinecone integration:

1. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual AWS and Pinecone credentials
   ```

2. **Set up AWS Bedrock**:
   - Enable model access in AWS Bedrock console
   - Create IAM user with Bedrock permissions
   - Add credentials to `.env`

3. **Set up Pinecone**:
   - Create a Pinecone account
   - Create an index with 1536 dimensions
   - Add API key and environment to `.env`

4. **Deploy with Docker**:
   ```bash
   npm run docker:build
   npm run docker:up
   ```

## 🎯 How to Use

### 1. Upload Documents
- Drag and drop files or click to select
- Supported formats: PDF, DOCX, TXT
- Maximum file size: 10MB
- Documents are automatically processed and indexed

### 2. Chat with AI
- Type questions about your uploaded documents
- The AI will search for relevant content
- View sources used for each response
- Responses are streamed in real-time

### 3. View Sources
- Click "View sources" under AI responses
- See which documents were used
- Review the exact text chunks that informed the answer

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both server and client
npm run dev:server       # Start only server
npm run dev:client       # Start only client

# Building
npm run build           # Build both packages
npm run build:server    # Build server only
npm run build:client    # Build client only

# Testing
npm run test            # Run all tests
npm run test:server     # Run server tests
npm run test:client     # Run client tests

# Docker
npm run docker:build    # Build Docker images
npm run docker:up       # Start with Docker Compose
npm run docker:down     # Stop Docker containers
```

### Environment Variables

Key environment variables for configuration:

```env
# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# Pinecone
PINECONE_API_KEY=your_api_key
PINECONE_ENVIRONMENT=your_environment
PINECONE_INDEX_NAME=ragdoll-documents

# Server
PORT=3001
CORS_ORIGINS=http://localhost:5176
MAX_FILE_SIZE=10485760

# Client
VITE_API_BASE_URL=http://localhost:3001
```

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests**: For individual components and services
- **Integration Tests**: For API endpoints and database operations
- **E2E Tests**: For complete user workflows
- **Mock Services**: For external dependencies (AWS, Pinecone)

Run tests with:
```bash
npm run test
```

## 🐳 Docker Deployment

### Development with Docker

```bash
docker-compose up --build
```

### Production Deployment

1. **Build images**:
   ```bash
   docker-compose -f docker-compose.yml build
   ```

2. **Start services**:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Check health**:
   ```bash
   curl http://localhost/health
   ```

## 🔒 Security Features

- Input validation and sanitization
- File upload restrictions (size, type)
- Rate limiting on API endpoints
- Secure credential storage
- CORS configuration
- Error handling without information leakage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🚨 Development Notes

- The application includes mock responses when AWS/Pinecone are not configured
- Vector search is disabled without proper Pinecone configuration
- Real AI responses require valid AWS Bedrock credentials
- File uploads are stored locally in the `uploads/` directory
- The application uses in-memory storage for development

## 📞 Support

For support, please check the documentation or open an issue in the repository.
