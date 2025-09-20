#!/bin/bash

# BiteAlert Deployment Script for Render

echo "🚀 Starting BiteAlert deployment to Render..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the React app
echo "🔨 Building React app..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Error: Build failed. No build directory found."
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Build files are ready in the 'build' directory"
echo ""
echo "🎯 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Render"
echo "3. Deploy using the render.yaml configuration"
echo "4. Set up environment variables in Render dashboard"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
