#!/bin/bash

echo "Testing ChromaDB with collection name approach..."

# Delete existing collections first
echo "1. Cleaning up existing collections..."
curl -s -X DELETE http://localhost:8000/api/v1/collections/test_rag_collection 2>/dev/null
echo -e "\n"

# Create a test collection
echo "2. Creating test collection..."
curl -s -X POST http://localhost:8000/api/v1/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_rag_collection",
    "metadata": {"description": "Test collection for RAG functionality"}
  }'
echo -e "\n"

# Add a test document to the collection using collection name
echo "3. Adding test document..."
curl -s -X POST http://localhost:8000/api/v1/collections/test_rag_collection/add \
  -H "Content-Type: application/json" \
  -d '{
    "documents": ["This is a test document about project management best practices. It covers planning, execution, and monitoring of projects."],
    "metadatas": [{"source": "test", "topic": "project_management", "type": "guide"}],
    "ids": ["doc1"]
  }'
echo -e "\n"

# Get collection count
echo "4. Getting collection count..."
curl -s -X GET http://localhost:8000/api/v1/collections/test_rag_collection/count
echo -e "\n"

# List all items in collection
echo "5. Getting all items in collection..."
curl -s -X POST http://localhost:8000/api/v1/collections/test_rag_collection/get \
  -H "Content-Type: application/json" \
  -d '{
    "include": ["documents", "metadatas"]
  }'
echo -e "\n"

echo "ChromaDB basic operations test completed!"
