You are an expert AI-powered no-code platform assistant. Help me scaffold and build "RAGdoll", a “RAG-powered Customer Service Agent Builder” web application that lets non-developers configure and deploy AI chat agents.

## Overview
- **Purpose:** No-code solution for creating, configuring, and embedding specialized customer-service agents.  
- **Runtime Agents:** Each agent draws from a document knowledgebase and can trigger actions (e.g., create tickets, send emails) based on conversational conditions.  
- **Embedding:** Provide a lightweight web component that sites can drop in to instantiate any configured agent.

## Tech stack
- **Monorepo Management:** Turbo Repo  
- **Backend:** Node.js + Fastify + TypeScript  
- **Frontend (Admin UI):** React + TypeScript + Tailwind CSS  
- **Embedding Widget:** Framework-agnostic web component (e.g. via Stencil or custom element)  
- **AI & RAG:**  
  - **Primary:** Vercel’s `ai` module + `@ai-sdk/amazon-bedrock`  
  - **Alternate:** Ollama (local LLM) with Vercel’s `ai` module + `ollama-ai-provider`  
  - **Vector DB (dev):** ChromaDB inside Docker  
- **Actions & Integrations:** Pluggable actions (REST webhooks, AWS SNS/email, Zendesk/ticket API, etc.)

## High-Level Goals
1. **Project Scaffold**  
   - Turbo monorepo with folders:  
     ```
     /apps
       ├─ admin-ui
       ├─ agent-runtime
       └─ widget
     /packages
       ├─ shared-types
       └─ ai-integrations
     ```
2. **Admin UI**  
   - No-code canvas to define:  
     - Knowledgebase sources (upload & index docs)  
     - Conditional workflows (“If user asks about billing & sentiment negative → create support ticket”)  
     - Agent profiles (name, welcome prompt, fallback)  
   - Save configurations to PostgreSQL.
3. **Backend Services**  
   - **Document Module:** upload, extract, chunk, index in ChromaDB (dev) / production vector store  
   - **Agent Manager Module:** CRUD endpoints for agent profiles, workflows, knowledge links  
   - **Runtime Endpoint:**  
     - Accept widget requests with `agentId` + message  
     - Retrieve context, run RAG via Vercel AI or Ollama, evaluate conditions, fire actions, return chat response  
4. **Embedding Widget**  
   - Expose `<customer-agent agent-id="…"></customer-agent>`  
   - Loads chat UI and securely pipes messages to the Fastify runtime
5. **DevOps & Examples**  
   - Sample `.env`, Dockerfiles (incl. ChromaDB), `turbo.json` config  
   - Terraform/CDK stubs for AWS resources  
   - GitHub Actions CI/CD for admin and runtime deployments

## Instructions for Copilot
- Always include TypeScript interfaces, Zod or `@sinclair/typebox` schemas, and Fastify route decorators.  
- Show folder/file structure as an ASCII tree.  
- For conditional actions, illustrate with sequence diagrams or code comments.  
- Prefix external library references with install commands (`npm install ai @ai-sdk/amazon-bedrock ollama-client`).  
- Show secure credential handling (Vercel AI config, AWS & Ollama env vars).  
- Step through incremental deliverables:  
  1. Turbo Repo scaffold + root `package.json` & `turbo.json`.  
  2. Admin-UI React app bootstrapped with Tailwind.  
  3. Fastify modules for document ingestion (ChromaDB).  
  4. Agent Manager CRUD.  
  5. Runtime chat endpoint + widget integration.

Begin by outputting only the Turbo monorepo scaffold (folder tree) and root `package.json` (with `workspaces` and dependencies for Fastify, `ai`, ollama-client, etc.).  
