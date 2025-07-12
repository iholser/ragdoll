#!/bin/zsh

# This script creates .env files for all the packages and provides local development
# settings. The variables are the defaults settings and can be
# overridden by creating a file called overrides.env in the same directory.
#  NOTE: the overrides.env file should not get checked into source control

# configure default settings
#################################################

# ======================
# AWS Bedrock Configuration
# ======================
AWS_REGION=us-west-2
AWS_PROFILE=dev

# Bedrock Model Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
BEDROCK_MAX_TOKENS=4096
BEDROCK_TEMPERATURE=0.8

# ======================
# ChromaDB Configuration (Docker)
# ======================
# ChromaDB runs by default on port 8000. Adjust as needed.
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
# Optional: set a default collection name
CHROMADB_COLLECTION=ragdoll-documents

# ======================
# Server Configuration
# ======================
PORT=3001
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=pdf,docx,txt

# Rate Limiting
RATE_LIMIT_TTL=60000    # 1 minute in milliseconds
RATE_LIMIT_MAX=100      # Max requests per TTL window

# ======================
# Client Configuration
# ======================
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=pdf,docx,txt

# ======================
# Text Processing Configuration
# ======================
# Chunk size for document processing
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Vector similarity threshold
SIMILARITY_THRESHOLD=0.7
MAX_RETRIEVED_CHUNKS=5

# ======================
# Logging Configuration
# ======================
LOG_LEVEL=info
LOG_FORMAT=combined

# load overrides
#################################################
DOTENV_OVERRIDES=$(dirname $0)/.env
if [ -f $DOTENV_OVERRIDES ]; then
  echo "loading environment overrides from: $DOTENV_OVERRIDES"
  source $DOTENV_OVERRIDES
fi

# client settings
#################################################
cat <<EOF > packages/client/.env
NODE_ENV=$NODE_ENV
VITE_CLIENT_BASE=$CLIENT_BASE
VITE_CLIENT_PORT=$CLIENT_PORT
VITE_SERVER_PORT=$SERVER_PORT
VITE_MAX_FILE_SIZE=$MAX_FILE_SIZE
VITE_ALLOWED_FILE_TYPES=$ALLOWED_FILE_TYPES
EOF

# server settings
#################################################
cat <<EOF > packages/server/.env
APP_VERSION=0
NODE_ENV=$NODE_ENV
SERVER_PORT=$SERVER_PORT
AWS_REGION=$AWS_REGION
AWS_PROFILE=$AWS_PROFILE
BEDROCK_MODEL_ID=$BEDROCK_MODEL_ID
BEDROCK_MAX_TOKENS=$BEDROCK_MAX_TOKENS
BEDROCK_TEMPERATURE=$BEDROCK_TEMPERATURE
MAX_FILE_SIZE=$MAX_FILE_SIZE
ALLOWED_FILE_TYPES=$ALLOWED_FILE_TYPES
RATE_LIMIT_TTL=$RATE_LIMIT_TTL
RATE_LIMIT_MAX=$RATE_LIMIT_MAX
SIMILARITY_THRESHOLD=$SIMILARITY_THRESHOLD
MAX_RETRIEVED_CHUNKS=$MAX_RETRIEVED_CHUNKS
LOG_LEVEL=$LOG_LEVEL
LOG_FORMAT=$LOG_FORMAT
EOF
