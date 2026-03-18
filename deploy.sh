#!/bin/bash

# Skype Chat - Local Docker Test Script
# For Cloud Run deployment, use the Google Cloud Console

echo "🐳 Building Docker image..."
docker build -t skype-chat .

if [ $? -eq 0 ]; then
  echo "✅ Docker image built successfully!"
  echo ""
  echo "To run locally:"
  echo "docker run -p 8080:8080 \\"
  echo "  -e SKYPE_API_KEY=your_key \\"
  echo "  -e SKYPE_AUTH_DOMAIN=your_domain \\"
  echo "  -e SKYPE_PROJECT_ID=your_project \\"
  echo "  -e SKYPE_STORAGE_BUCKET=your_bucket \\"
  echo "  -e SKYPE_MESSAGING_SENDER_ID=your_sender_id \\"
  echo "  -e SKYPE_APP_ID=your_app_id \\"
  echo "  skype-chat"
  echo ""
  echo "📖 For Cloud Run deployment instructions, see README.md"
else
  echo "❌ Docker build failed!"
  exit 1
fi
