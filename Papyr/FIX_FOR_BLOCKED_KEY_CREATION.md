# ✅ Solution: Service Account Key Creation Blocked

## Your Error

```
Service account key creation is disabled
An Organization Policy that blocks service accounts key creation 
has been enforced on your organization.
Policy ID: iam.disableServiceAccountKeyCreation
```

## Why This Happens

Your Google Cloud organization has a security policy that prevents creating service account keys. This is actually a **good security practice**, but it means we need a different approach.

---

## 🚀 Quick Solution: Use Application Default Credentials (ADC)

### What is ADC?

Instead of downloading a service account key file, you'll authenticate with your **personal Google Cloud account**. The credentials are stored securely by Google Cloud SDK.

### Setup (5 minutes)

#### Step 1: Install Google Cloud SDK

```bash
# On macOS
brew install google-cloud-sdk
```

Verify installation:
```bash
gcloud --version
```

#### Step 2: Run the Setup Script

I've created an automated setup script for you:

```bash
cd /Users/user/Ledger/Papyr
./setup-google-vision-adc.sh
```

This script will:
1. Authenticate you with Google Cloud (opens browser)
2. Ask for your project ID (e.g., `papyr-production`)
3. Update your `.env.local` automatically
4. Test the setup

**OR** do it manually:

```bash
# Step 2a: Login
gcloud auth application-default login

# Step 2b: Set project (replace with your actual project ID)
gcloud config set project papyr-production

# Step 2c: Update .env.local
echo "GOOGLE_CLOUD_USE_ADC=true" >> .env.local
echo "GOOGLE_CLOUD_PROJECT_ID=papyr-production" >> .env.local
```

#### Step 3: Test It Works

```bash
npm run dev
```

Then:
1. Open http://localhost:3000
2. Sign in and open a book
3. Write in a cell
4. Check browser console for: `[Recognition] Google Cloud Vision succeeded`

---

## ✅ Benefits of This Approach

- ✅ No service account key needed
- ✅ Works immediately for local development
- ✅ Uses your existing Google Cloud permissions
- ✅ More secure (credentials auto-refresh)
- ✅ Bypasses organization policy

---

## ⚠️ Important Limitations

### This Works For:
- ✅ Local development on your Mac
- ✅ Testing and debugging
- ✅ Development environment

### This Does NOT Work For:
- ❌ Production deployment (Vercel, etc.)
- ❌ CI/CD pipelines
- ❌ Other team members (they need to run the setup too)

---

## 📋 For Production Deployment

When you're ready to deploy to production, you'll need ONE of these solutions:

### Option A: Ask Your Admin for Exception

Contact your organization's Google Cloud administrator and ask them to:

1. **Temporarily disable the policy** for your project
2. Create a service account key
3. Re-enable the policy

Explain: "I need a service account key for Papyr's handwriting recognition feature in production. It will be stored securely in Vercel as an encrypted environment variable."

### Option B: Use a Different Project

Create a **new Google Cloud project** that's NOT under your organization:

1. Go to https://console.cloud.google.com/
2. Create new project (not under your organization)
3. Enable Cloud Vision API in the new project
4. Create service account + key (no policy blocking)
5. Use this project for Papyr

### Option C: Workload Identity Federation (Advanced)

Use Workload Identity Federation to connect Vercel to Google Cloud without keys:
- More secure (no keys)
- More complex to set up
- See: https://cloud.google.com/iam/docs/workload-identity-federation

---

## 🧪 Verifying Your Setup

### 1. Check ADC is working:

```bash
gcloud auth application-default print-access-token
```

Should output a long access token (means it's working).

### 2. Check API endpoint:

```bash
curl http://localhost:3000/api/ink/recognize-vision
```

Should return:
```json
{
  "service": "google-cloud-vision",
  "configured": true,
  "method": "application-default-credentials",
  "status": "ready"
}
```

### 3. Check your .env.local:

```bash
cat .env.local | grep GOOGLE_CLOUD
```

Should show:
```
GOOGLE_CLOUD_USE_ADC=true
GOOGLE_CLOUD_PROJECT_ID=papyr-production
```

---

## 🔧 Troubleshooting

### Error: "gcloud: command not found"

**Solution**:
```bash
brew install google-cloud-sdk
# Then restart your terminal
```

### Error: "Could not automatically determine credentials"

**Solution**:
```bash
# Re-authenticate
gcloud auth application-default login

# Verify credentials exist
ls ~/.config/gcloud/application_default_credentials.json
```

### Error: "Permission denied" when recognizing

**Solution**:
```bash
# Make sure you have Vision API access
# Go to: https://console.cloud.google.com/iam-admin/iam
# Check your account has "Cloud Vision User" role or similar
```

### Recognition not working in browser

**Solution**:
```bash
# 1. Restart dev server
npm run dev

# 2. Check server logs for [Vision] messages
# 3. Check browser console for [Recognition] messages
# 4. Verify .env.local has GOOGLE_CLOUD_USE_ADC=true
```

---

## 📚 Documentation Files

- **GOOGLE_CLOUD_ADC_SETUP.md** - Detailed ADC setup guide
- **setup-google-vision-adc.sh** - Automated setup script
- **GOOGLE_CLOUD_VISION_SETUP.md** - Original setup guide (service account method)
- **HANDWRITING_SETUP_QUICKSTART.md** - Quick reference

---

## ✅ Summary

1. Your organization blocks service account key creation (security feature)
2. **Solution**: Use Application Default Credentials (ADC)
3. **Setup**: Run `./setup-google-vision-adc.sh` or follow manual steps
4. **Works for**: Local development only
5. **For production**: You'll need a different approach (see options above)

---

## 🚀 Quick Start

```bash
# Install Google Cloud SDK
brew install google-cloud-sdk

# Run setup script
cd /Users/user/Ledger/Papyr
./setup-google-vision-adc.sh

# Start dev server
npm run dev

# Test handwriting recognition!
```

**That's it!** Your local development environment is ready to use Google Cloud Vision for handwriting recognition.

For production deployment, revisit this document and choose one of the production solutions.
