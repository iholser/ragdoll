# RAGdoll 🎭

> **RAG-powered Customer Service Agent Builder**

A comprehensive no-code platform for creating, configuring, and deploying AI-powered customer service agents that can understand documents, trigger actions, and provide intelligent responses.

## 🚀 Features

- **No-Code Agent Builder**: Visual interface for configuring AI agents
- **Document Knowledge Base**: Upload and index documents for RAG-powered responses
- **Conditional Workflows**: Set up automated actions based on conversation context
- **Multi-Provider AI**: Support for Amazon Bedrock and Ollama
- **Embeddable Widget**: Framework-agnostic web component for easy integration
- **Real-time Chat**: WebSocket-powered live conversations
- **Multi-tenant**: Support for multiple organizations and users

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin UI      │    │  Agent Runtime  │    │     Widget      │
│   (React)       │◄──►│   (Fastify)     │◄──►│ (Web Component) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   ChromaDB      │
                    │   Vector Store  │
                    └─────────────────┘
```

## 📁 Project Structure

```
ragdoll/
├── apps/
│   ├── admin-ui/          # React admin dashboard
│   ├── agent-runtime/     # Fastify backend API
│   └── widget/           # Embeddable chat widget
├── packages/
│   ├── shared-types/     # TypeScript types and schemas
│   └── ai-integrations/  # AI provider integrations
├── docker/
│   ├── docker-compose.dev.yml
│   └── init-db.sql
├── package.json
├── turbo.json
└── tsconfig.json
```

## 🛠️ Tech Stack

- **Monorepo**: Turbo Repo
- **Backend**: Node.js + Fastify + TypeScript
- **Frontend**: React + TypeScript + Tailwind CSS
- **Widget**: Framework-agnostic web component
- **AI**: Vercel AI SDK + Amazon Bedrock / Ollama
- **Vector DB**: ChromaDB (dev) / Production vector store
- **Database**: PostgreSQL
- **Validation**: Zod + TypeBox schemas

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ragdoll.git
   cd ragdoll
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development services**
   ```bash
   pnpm run docker:dev
   ```

5. **Build packages**
   ```bash
   pnpm run build
   ```

6. **Start development servers**
   ```bash
   pnpm run dev
   ```

### Services

- **Admin UI**: http://localhost:3001
- **Agent Runtime**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **ChromaDB**: http://localhost:8000
- **Redis**: localhost:6379
- **Ollama**: http://localhost:11434

## 📖 Usage

### 1. Create an Agent

1. Open the Admin UI at http://localhost:3001
2. Navigate to "Agents" and click "Create Agent"
3. Configure your agent's name, welcome message, and system prompt
4. Save the agent

### 2. Upload Knowledge Base

1. Go to "Knowledge Base" in the Admin UI
2. Upload documents (PDF, DOC, TXT, MD)
3. Wait for processing and indexing
4. Documents are automatically chunked and vectorized

### 3. Set Up Workflows

1. Navigate to "Workflows"
2. Create conditional logic (e.g., "If user asks about billing AND sentiment is negative")
3. Configure actions (e.g., "Create support ticket", "Send email")
4. Activate the workflow

### 4. Deploy Widget

1. Get your agent ID from the Admin UI
2. Add the widget to your website:
   ```html
   <script src="http://localhost:3000/widget.js"></script>
   <customer-agent 
     agent-id="your-agent-id"
     title="Chat with us"
     primary-color="#3B82F6">
   </customer-agent>
   ```

## 🔧 Configuration

### AI Providers

**Amazon Bedrock**
```env
AI_PROVIDER=bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

**Ollama (Local)**
```env
AI_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2:7b
```

### Database

```env
DATABASE_URL=postgresql://ragdoll:ragdoll@localhost:5432/ragdoll
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

## 🧪 Development

### Scripts

```bash
# Development
pnpm run dev              # Start all services in dev mode
pnpm run build           # Build all packages
pnpm run clean           # Clean build artifacts

# Docker
pnpm run docker:dev      # Start development services
pnpm run docker:down     # Stop development services

# Code Quality
pnpm run lint            # Lint all packages
pnpm run format          # Format code
pnpm run type-check      # Type check all packages
```

### Package Development

Each package can be developed independently:

```bash
# Work on shared types
cd packages/shared-types
pnpm run dev

# Work on AI integrations
cd packages/ai-integrations
pnpm run dev

# Work on admin UI
cd apps/admin-ui
pnpm run dev
```

## 🚀 Deployment

### Production Build

```bash
pnpm run build
```

### Docker Production

```bash
docker-compose -f docker/docker-compose.prod.yml up -d
```

### Environment Variables

Production environment variables are documented in `.env.example`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vercel AI SDK](https://sdk.vercel.ai/) for AI integrations
- [Fastify](https://www.fastify.io/) for the backend framework
- [ChromaDB](https://www.trychroma.com/) for vector storage
- [Turbo](https://turbo.build/) for monorepo management

## 📞 Support

For support, email support@ragdoll.dev or join our Discord community.

---

**RAGdoll** - Making AI customer service accessible to everyone 🎭
