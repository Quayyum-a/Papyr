# Google Cloud Vision API Setup Guide for Papyr

## Overview

This guide will help you set up Google Cloud Vision API for handwriting recognition in Papyr. You'll get **1,000 free recognitions per month** and **$300 in free credits** as a new user.

---

## Step 1: Create Google Cloud Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account (or create one)
3. Accept terms and conditions
4. **New users get $300 in free credits** (valid for 90 days)

---

## Step 2: Create a New Project

1. Click the project dropdown at the top (next to "Google Cloud")
2. Click **"New Project"**
3. Enter project details:
   - **Project Name**: `Papyr-Production` (or any name you prefer)
   - **Organization**: (leave as "No organization" if you don't have one)
4. Click **"Create"**
5. Wait for project creation (takes ~30 seconds)
6. Select your new project from the dropdown

---

## Step 3: Enable Cloud Vision API

1. In the search bar at the top, type: **"Cloud Vision API"**
2. Click on **"Cloud Vision API"** in the results
3. Click the **"Enable"** button
4. Wait for activation (~1-2 minutes)
5. You'll see a dashboard showing "API enabled"

---

## Step 4: Create Service Account

1. In the left sidebar, go to **"IAM & Admin"** → **"Service Accounts"**
   - Or search for "Service Accounts" in the top search bar
2. Click **"+ Create Service Account"** at the top
3. Enter service account details:
   - **Service account name**: `papyr-vision-service`
   - **Service account ID**: (auto-generated, e.g., `papyr-vision-service@your-project.iam.gserviceaccount.com`)
   - **Description**: `Service account for Papyr handwriting recognition`
4. Click **"Create and Continue"**

---

## Step 5: Grant Permissions

1. On the "Grant this service account access to project" screen:
   - Click **"Select a role"** dropdown
   - Search for: **"Cloud Vision AI Service Agent"**
   - Select **"Cloud Vision AI Service Agent"**
   - Alternatively, use **"Owner"** for testing (less secure but simpler)
2. Click **"Continue"**
3. Skip the "Grant users access to this service account" section
4. Click **"Done"**

---

## Step 6: Create and Download Credentials

1. Find your newly created service account in the list
2. Click on the **email address** (e.g., `papyr-vision-service@...`)
3. Go to the **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Choose **"JSON"** format (recommended)
6. Click **"Create"**
7. A JSON file will automatically download (e.g., `papyr-production-abc123.json`)
8. **IMPORTANT**: Keep this file secure! It contains credentials.

---

## Step 7: Store Credentials Securely

### Option A: Local Development (File Path)

1. Create a secure directory on your machine:
   ```bash
   mkdir -p ~/.google-cloud-credentials
   chmod 700 ~/.google-cloud-credentials
   ```

2. Move the downloaded JSON file there:
   ```bash
   mv ~/Downloads/papyr-production-*.json ~/.google-cloud-credentials/papyr-vision.json
   chmod 600 ~/.google-cloud-credentials/papyr-vision.json
   ```

3. Add to your `.env.local`:
   ```bash
   # Google Cloud Vision API
   GOOGLE_CLOUD_VISION_CREDENTIALS=/Users/YOUR_USERNAME/.google-cloud-credentials/papyr-vision.json
   ```

   Replace `YOUR_USERNAME` with your actual username.

### Option B: Production Deployment (Environment Variable)

For Vercel/production, you'll set the entire JSON content as an environment variable (see Step 9).

---

## Step 8: Install Required Package

In your Papyr project directory:

```bash
cd /Users/user/Ledger/Papyr
npm install @google-cloud/vision
```

This installs the official Google Cloud Vision Node.js client library.

---

## Step 9: Configure Environment Variables

### For Local Development

Add to `/Users/user/Ledger/Papyr/.env.local`:

```bash
# Google Cloud Vision API (Local Development)
GOOGLE_CLOUD_VISION_CREDENTIALS=/Users/YOUR_USERNAME/.google-cloud-credentials/papyr-vision.json

# Optional: Explicitly set project ID
GOOGLE_CLOUD_PROJECT_ID=papyr-production
```

### For Vercel Production

1. Open your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

   **Variable 1:**
   - Key: `GOOGLE_CLOUD_VISION_CREDENTIALS_JSON`
   - Value: (paste the ENTIRE contents of your JSON credentials file)
   - Environments: Production, Preview, Development

   **Variable 2:**
   - Key: `GOOGLE_CLOUD_PROJECT_ID`
   - Value: `papyr-production` (or your project ID)
   - Environments: Production, Preview, Development

4. Redeploy your application

---

## Step 10: Test the Setup

### Quick Test Script

Create a test file to verify your setup:

```bash
cd /Users/user/Ledger/Papyr
cat > test-vision-api.js << 'EOF'
const vision = require('@google-cloud/vision');

async function testVisionAPI() {
  try {
    const client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_CLOUD_VISION_CREDENTIALS
    });

    console.log('✓ Vision API client created successfully');
    console.log('✓ Setup complete! You can now use Google Cloud Vision API');
    
    // Optionally test with a sample image
    // const [result] = await client.textDetection('https://example.com/sample.png');
    // console.log('Text detected:', result.fullTextAnnotation?.text);
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Check your credentials path and API enablement');
  }
}

testVisionAPI();
EOF

node test-vision-api.js
```

Expected output:
```
✓ Vision API client created successfully
✓ Setup complete! You can now use Google Cloud Vision API
```

If you see errors:
- Check credentials file path
- Verify API is enabled in Google Cloud Console
- Ensure service account has correct permissions

---

## Step 11: Update Your Code

I'll create the updated API route in the next step. The new implementation will:
- Use Google Cloud Vision instead of OpenRouter
- Support both handwriting and printed text
- Handle errors gracefully
- Be more cost-effective

---

## Pricing & Usage Monitoring

### Free Tier
- **1,000 requests/month**: FREE forever
- **$300 credits**: For new Google Cloud accounts

### After Free Tier
- **Text Detection**: $1.50 per 1,000 images
- **Document Text Detection** (better for handwriting): $1.50 per 1,000 images

### Typical Papyr Usage
- Small business: ~100-200 recognitions/day
- Monthly: ~3,000-6,000 recognitions
- Cost: $0-9/month (first 1,000 free)

### Monitor Usage
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **"Billing"** → **"Reports"**
4. Filter by **"Cloud Vision API"**
5. View usage and costs

---

## Troubleshooting

### Error: "API not enabled"
**Solution**: Go to Cloud Console → APIs & Services → Enable Cloud Vision API

### Error: "Permission denied"
**Solution**: 
- Check service account has "Cloud Vision AI Service Agent" role
- Verify credentials file path is correct

### Error: "Credentials not found"
**Solution**:
- Check `.env.local` has correct path
- Verify file exists: `ls -la ~/.google-cloud-credentials/`
- Check file permissions: Should be readable by your user

### Error: "Quota exceeded"
**Solution**:
- Check usage in Cloud Console
- You've exceeded 1,000 free requests/month
- Billing will automatically apply (or enable billing if disabled)

### Error: "Invalid credentials JSON"
**Solution**:
- Re-download credentials from Google Cloud Console
- Ensure JSON file is valid (not corrupted)
- Check for trailing newlines or spaces

---

## Security Best Practices

### ✅ DO:
- Keep credentials file permissions strict (`chmod 600`)
- Store credentials outside project directory
- Use environment variables for production
- Rotate credentials periodically (every 6-12 months)
- Use service accounts (not personal accounts)

### ❌ DON'T:
- Commit credentials to Git (add to `.gitignore`)
- Share credentials publicly
- Use owner role in production (use specific roles)
- Hard-code credentials in source code

### Add to `.gitignore`:
```bash
# Google Cloud credentials
*.json
.google-cloud-credentials/
*-credentials.json
papyr-production-*.json
```

---

## Next Steps

1. ✅ Complete this setup guide
2. ✅ Test credentials with the test script
3. ✅ Update API route to use Google Cloud Vision (next file)
4. ✅ Test handwriting recognition in Papyr
5. ✅ Monitor usage and costs
6. 📅 Set calendar reminder to check usage after 1 month

---

## Support & Resources

- [Cloud Vision API Documentation](https://cloud.google.com/vision/docs)
- [Handwriting OCR Guide](https://cloud.google.com/vision/docs/handwriting)
- [Node.js Client Library](https://googleapis.dev/nodejs/vision/latest/)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [Support](https://cloud.google.com/support)

---

**Setup Time**: ~15-20 minutes
**Difficulty**: Beginner-friendly
**Cost**: FREE for first 1,000/month + $300 credits

Ready to proceed with the code implementation!
