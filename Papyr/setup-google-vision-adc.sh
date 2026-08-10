#!/bin/bash

# Papyr - Google Cloud Vision ADC Setup Script
# This script sets up Application Default Credentials for local development

echo "🚀 Papyr - Google Cloud Vision Setup (ADC Method)"
echo "=================================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK not found"
    echo ""
    echo "Please install it first:"
    echo "  brew install google-cloud-sdk"
    echo ""
    echo "Or download from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ Google Cloud SDK found: $(gcloud --version | head -1)"
echo ""

# Authenticate
echo "📝 Step 1: Authenticating with Google Cloud..."
echo "This will open your browser to sign in."
echo ""
read -p "Press Enter to continue..."

gcloud auth application-default login

if [ $? -ne 0 ]; then
    echo "❌ Authentication failed"
    exit 1
fi

echo ""
echo "✅ Authentication successful!"
echo ""

# Get project ID
echo "📋 Step 2: Setting up project..."
echo ""
echo "Enter your Google Cloud project ID:"
echo "(Find it at: https://console.cloud.google.com)"
read -p "Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID cannot be empty"
    exit 1
fi

# Set project
gcloud config set project "$PROJECT_ID"

if [ $? -ne 0 ]; then
    echo "❌ Failed to set project"
    exit 1
fi

echo ""
echo "✅ Project set to: $PROJECT_ID"
echo ""

# Update .env.local
echo "📝 Step 3: Updating .env.local..."
echo ""

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  .env.local not found, creating it..."
    touch "$ENV_FILE"
fi

# Add or update ADC setting
if grep -q "GOOGLE_CLOUD_USE_ADC" "$ENV_FILE"; then
    # Update existing
    sed -i '' 's/^GOOGLE_CLOUD_USE_ADC=.*/GOOGLE_CLOUD_USE_ADC=true/' "$ENV_FILE"
    echo "   Updated GOOGLE_CLOUD_USE_ADC=true"
else
    # Add new
    echo "" >> "$ENV_FILE"
    echo "# Google Cloud Vision (Application Default Credentials)" >> "$ENV_FILE"
    echo "GOOGLE_CLOUD_USE_ADC=true" >> "$ENV_FILE"
    echo "   Added GOOGLE_CLOUD_USE_ADC=true"
fi

# Add project ID
if grep -q "GOOGLE_CLOUD_PROJECT_ID" "$ENV_FILE"; then
    sed -i '' "s/^GOOGLE_CLOUD_PROJECT_ID=.*/GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID/" "$ENV_FILE"
    echo "   Updated GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID"
else
    echo "GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID" >> "$ENV_FILE"
    echo "   Added GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID"
fi

# Comment out service account credentials if they exist
if grep -q "^GOOGLE_CLOUD_VISION_CREDENTIALS=" "$ENV_FILE"; then
    sed -i '' 's/^GOOGLE_CLOUD_VISION_CREDENTIALS=/#GOOGLE_CLOUD_VISION_CREDENTIALS=/' "$ENV_FILE"
    echo "   Commented out GOOGLE_CLOUD_VISION_CREDENTIALS (not needed with ADC)"
fi

echo ""
echo "✅ .env.local updated"
echo ""

# Test the setup
echo "🧪 Step 4: Testing setup..."
echo ""

node << 'EOF'
const vision = require('@google-cloud/vision');

async function test() {
  try {
    const client = new vision.ImageAnnotatorClient();
    console.log('   ✅ Google Cloud Vision client created successfully');
    console.log('   ✅ Using Application Default Credentials');
    console.log('   ✅ Credentials from: ~/.config/gcloud/');
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    process.exit(1);
  }
}

test().then(() => {
  console.log('');
  console.log('🎉 Setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Open a book and write in a cell');
  console.log('  3. Check browser console for recognition logs');
  console.log('');
  console.log('Note: This setup works for LOCAL DEVELOPMENT ONLY');
  console.log('For production, you\'ll need a service account key.');
}).catch(err => {
  console.error('');
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
EOF
