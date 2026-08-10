# Alternative Setup: Application Default Credentials (ADC)

## When to Use This

Use this method if:
- ❌ Service account key creation is blocked by organization policy
- ✅ You're developing locally (not production)
- ✅ You have Google Cloud access with your personal account

**Note**: This is for **development only**. For production, you'll need service account keys or Workload Identity Federation.

---

## Setup Steps (5 minutes)

### 1. Install Google Cloud CLI

**On macOS**:
```bash
# Install via Homebrew
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

Verify installation:
```bash
gcloud --version
```

### 2. Authenticate with Your Google Account

```bash
# Login with your Google Cloud account
gcloud auth application-default login
```

This will:
1. Open your browser
2. Ask you to sign in with your Google account
3. Grant permissions to Google Cloud SDK
4. Store credentials at: `~/.config/gcloud/application_default_credentials.json`

### 3. Set Your Project

```bash
# Set default project
gcloud config set project papyr-production

# Or whatever your project ID is
# Find it at: https://console.cloud.google.com → Project dropdown
```

### 4. Update Your Papyr Environment

Edit `/Users/user/Ledger/Papyr/.env.local`:

**Remove or comment out**:
```bash
# GOOGLE_CLOUD_VISION_CREDENTIALS=/path/to/service-account.json
```

**The Google Cloud Vision client will automatically use ADC** when no explicit credentials are provided!

### 5. Test It Works

```bash
cd /Users/user/Ledger/Papyr

# Test ADC
node << 'EOF'
const vision = require('@google-cloud/vision');

async function testADC() {
  try {
    // No keyFilename specified - uses ADC automatically
    const client = new vision.ImageAnnotatorClient();
    
    console.log('✅ Application Default Credentials working!');
    console.log('✅ Using credentials from:', '~/.config/gcloud/');
    console.log('✅ Ready to recognize handwriting');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testADC();
EOF
```

Expected output:
```
✅ Application Default Credentials working!
✅ Using credentials from: ~/.config/gcloud/
✅ Ready to recognize handwriting
```

---

## Update API Route for ADC

Your API route needs a small update to support ADC:

Edit `/Users/user/Ledger/Papyr/src/app/api/ink/recognize-vision/route.ts`:

Find this section:
```typescript
// Check Google Cloud Vision configuration
const credentialsPath = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS;
const credentialsJson = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS_JSON;

if (!credentialsPath && !credentialsJson) {
  console.error('Google Cloud Vision credentials not configured');
  return NextResponse.json(
    { error: 'recognition_service_not_configured' },
    { status: 503 }
  );
}
```

Replace with:
```typescript
// Check Google Cloud Vision configuration
const credentialsPath = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS;
const credentialsJson = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS_JSON;
const useADC = process.env.GOOGLE_CLOUD_USE_ADC === 'true';

if (!credentialsPath && !credentialsJson && !useADC) {
  console.error('Google Cloud Vision credentials not configured');
  return NextResponse.json(
    { error: 'recognition_service_not_configured' },
    { status: 503 }
  );
}
```

And update the client initialization:
```typescript
// Initialize Google Cloud Vision client
let visionClient: vision.ImageAnnotatorClient;

if (useADC) {
  // Use Application Default Credentials
  visionClient = new vision.ImageAnnotatorClient();
} else if (credentialsJson) {
  // Production: Use JSON string from environment variable
  const credentials = JSON.parse(credentialsJson);
  visionClient = new vision.ImageAnnotatorClient({
    credentials,
  });
} else if (credentialsPath) {
  // Development: Use file path
  visionClient = new vision.ImageAnnotatorClient({
    keyFilename: credentialsPath,
  });
} else {
  throw new Error('No credentials available');
}
```

Then add to `.env.local`:
```bash
# Use Application Default Credentials (development only)
GOOGLE_CLOUD_USE_ADC=true
GOOGLE_CLOUD_PROJECT_ID=papyr-production
```

---

## Pros & Cons

### ✅ Pros:
- No service account key needed
- Easier setup for development
- Uses your personal Google Cloud permissions
- Automatically refreshes credentials

### ❌ Cons:
- **Only works locally** (not in production/Vercel)
- Requires Google Cloud SDK installed
- Uses your personal account (not isolated service account)
- Credentials expire and need re-authentication periodically

---

## For Production Deployment

ADC won't work in Vercel/production. You'll need ONE of these:

### Option A: Ask Admin for Service Account Key
- Request temporary policy override
- Create key
- Upload to Vercel as environment variable

### Option B: Workload Identity Federation
- More complex but more secure
- No keys needed
- See: https://cloud.google.com/iam/docs/workload-identity-federation

### Option C: Different Project
- Create a NEW Google Cloud project without the organization policy
- Use that project for Papyr
- Create service account in the new project

---

## Troubleshooting

### Error: "gcloud: command not found"
```bash
# Install Google Cloud SDK
brew install google-cloud-sdk

# Restart terminal
```

### Error: "Could not automatically determine credentials"
```bash
# Re-authenticate
gcloud auth application-default login

# Verify credentials exist
ls ~/.config/gcloud/application_default_credentials.json
```

### Error: "Permission denied"
```bash
# Make sure you have the right permissions in Google Cloud
# Go to: IAM & Admin → IAM
# Check your account has "Cloud Vision AI User" or similar role
```

### Error: "Project not set"
```bash
# Set project explicitly
gcloud config set project papyr-production

# Verify
gcloud config get-value project
```

---

## Summary

1. Install Google Cloud SDK: `brew install google-cloud-sdk`
2. Login: `gcloud auth application-default login`
3. Set project: `gcloud config set project papyr-production`
4. Remove service account path from `.env.local`
5. Add: `GOOGLE_CLOUD_USE_ADC=true`
6. Update API route (see above)
7. Test: `npm run dev`

**This works for development!** For production, you'll need a different approach.
