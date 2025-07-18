#!/bin/bash

echo "Testing ChromaDB connectivity and basic operations..."

# Test heartbeat
echo "1. Testing heartbeat..."
curl -s http://localhost:8000/api/v1/heartbeat
echo -e "\n"

# Test version
echo "2. Testing version..."
curl -s http://localhost:8000/api/v1/version
echo -e "\n"

# Create a test collection and capture the response
echo "3. Creating test collection..."
COLLECTION_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_rag_collection",
    "metadata": {"description": "Test collection for RAG functionality"}
  }')

echo $COLLECTION_RESPONSE
echo -e "\n"

# Extract collection ID from response
COLLECTION_ID=$(echo $COLLECTION_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Collection ID: $COLLECTION_ID"
echo -e "\n"

# Add a test document to the collection using the collection ID
echo "4. Adding test document..."
curl -s -X POST http://localhost:8000/api/v1/collections/$COLLECTION_ID/add \
  -H "Content-Type: application/json" \
  -d '{
    "documents": ["This is a test document about project management best practices. It covers planning, execution, and monitoring of projects."],
    "metadatas": [{"source": "test", "topic": "project_management", "type": "guide"}],
    "ids": ["doc1"]
  }'
echo -e "\n"

# Wait a moment for indexing
sleep 2

# Query the collection using embeddings approach
echo "5. Querying collection for project management..."
curl -s -X POST http://localhost:8000/api/v1/collections/$COLLECTION_ID/query \
  -H "Content-Type: application/json" \
  -d '{
    "query_texts": ["help with project planning"],
    "n_results": 1,
    "include": ["documents", "metadatas", "distances"]
  }'
echo -e "\n"

# Get collection info
echo "6. Getting collection info..."
curl -s -X GET http://localhost:8000/api/v1/collections/$COLLECTION_ID
echo -e "\n"

echo "ChromaDB test completed successfully!"
