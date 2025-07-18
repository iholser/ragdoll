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

# Test collections list (should be empty initially)
echo "3. Testing collections list..."
curl -s -X GET http://localhost:8000/api/v1/collections
echo -e "\n"

# Create a test collection
echo "4. Creating test collection..."
curl -s -X POST http://localhost:8000/api/v1/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_collection",
    "metadata": {"description": "Test collection for RAG"}
  }'
echo -e "\n"

# List collections again (should now show our test collection)
echo "5. Listing collections after creation..."
curl -s -X GET http://localhost:8000/api/v1/collections
echo -e "\n"

# Add a test document to the collection
echo "6. Adding test document..."
curl -s -X POST http://localhost:8000/api/v1/collections/2fd30585-f205-42d2-a535-5678b00ce267/add \
  -H "Content-Type: application/json" \
  -d '{
    "documents": ["This is a test document about project management best practices."],
    "metadatas": [{"source": "test", "topic": "project_management"}],
    "ids": ["doc1"]
  }'
echo -e "\n"

# Query the collection
echo "7. Querying collection..."
curl -s -X POST http://localhost:8000/api/v1/collections/2fd30585-f205-42d2-a535-5678b00ce267/query \
  -H "Content-Type: application/json" \
  -d '{
    "query_texts": ["project management"],
    "n_results": 1,
    "include": ["documents", "metadatas", "distances"]
  }'
echo -e "\n"

echo "ChromaDB test completed!"
