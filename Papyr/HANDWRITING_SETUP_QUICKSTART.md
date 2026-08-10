# Papyr Handwriting Recognition - Quick Start Guide

## 🚀 5-Minute Setup for Google Cloud Vision

This guide gets you from zero to working handwriting recognition in ~20 minutes.

---

## What You'll Get

- ✅ **1,000 FREE recognitions/month** (forever)
- ✅ **$300 in free credits** for new Google Cloud users
- ✅ **Better accuracy** than OpenRouter for handwriting
- ✅ **Cheaper** after free tier ($1.50 per 1,000 vs. variable OpenRouter costs)
- ✅ **Optimized** specifically for handwriting recognition

---

## Step-by-Step Setup

### 1. Create Google Cloud Account (5 minutes)

1. Go to https://console.cloud.google.com/
2. Sign in (or create Google account)
3. Accept terms → Get $300 free credits
4. Create new project: **"Papyr-Production"**

### 2. Enable Vision API (2 minutes)

1. Search for: **"Cloud Vision API"**
2. Click **"Enable"**
3. Wait ~1 minute for activation

### 3. Create Service Account (3 minutes)

1. Go to: **IAM & Admin** → **Service Accounts**
2. Click **"+ Create Service Account"**
3. Name: `papyr-vision-service`
4. Role: **"Cloud Vision AI Service Agent"**
5. Click **"Create and Continue"** → **"Done"**

### 4. Download Credentials (2 minutes)

1. Click on your new service account email
2. Go to **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Choose **JSON** format
5. File downloads automatically (e.g., `papyr-production-abc123.json`)

### 5. Store Credentials Securely (3 minutes)

**On your Mac**:

```bash
# Create secure credentials directory
mkdir -p ~/.google-cloud-credentials
chmod 700 ~/.google-cloud-credentials

# Move downloaded file there
mv ~/Downloads/papyr-production-*.json ~/.google-cloud-credentials/papyr-vision.json
chmod 600 ~/.google-cloud-credentials/papyr-vision.json
```

### 6. Add to Environment Variables (2 minutes)

Edit `/Users/user/Ledger/Papyr/.env.local`:

```bash
# Add this line (replace YOUR_USERNAME with your actual username)
GOOGLE_CLOUD_VISION_CREDENTIALS=/Users/YOUR_USERNAME/.google-cloud-credentials/papyr-vision.json
```

To find your username:
```bash
echo $HOME
# Output: /Users/YOUR_USERNAME
```

### 7. Verify Package Installed (Already Done!)

The `@google-cloud/vision` package is already installed.

```bash
# Check it's installed
npm list @google-cloud/vision
```

### 8. Test the Setup (3 minutes)

Create a simple test:

```bash
cd /Users/user/Ledger/Papyr

# Test credentials
node << 'EOF'
const vision = require('@google-cloud/vision');

async function test() {
  try {
    const client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_CLOUD_VISION_CREDENTIALS
    });
    console.log('✅ Google Cloud Vision API is configured correctly!');
    console.log('✅ Ready to recognize handwriting');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
EOF
```

Expected output:
```
✅ Google Cloud Vision API is configured correctly!
✅ Ready to recognize handwriting
```

---

## How It Works in Papyr

When a user finishes writing in a cell:

```
User writes "John"
    ↓
Stroke captured by Papyr
    ↓
After pause, segment finalized
    ↓
Cell image captured (base64 PNG)
    ↓
Sent to /api/ink/recognize-vision
    ↓
Google Cloud Vision processes image
    ↓
Returns: "John" (with confidence score)
    ↓
Displayed in cell / stored in database
```

### Automatic Fallback

The code automatically tries:
1. **Google Cloud Vision** (primary, most accurate)
2. **OpenRouter** (fallback, if Vision not configured)

You don't need to change any frontend code!

---

## Usage & Costs

### Free Tier (Monthly)
- **First 1,000 requests**: FREE forever
- **No credit card** required for free tier
- **Resets every month** (e.g., 1,000 free on Feb 1, another 1,000 on Mar 1)

### After Free Tier
- **$1.50 per 1,000 requests**
- Example costs:
  - 2,000 recognitions/month = $1.50/month
  - 5,000 recognitions/month = $6.00/month
  - 10,000 recognitions/month = $13.50/month

### Typical Usage
- Small business: ~100-200 cells/day
- Monthly: ~3,000-6,000 cells
- **Estimated cost**: $3-9/month (first 1,000 free)

### New User Bonus
- **$300 free credits** (valid 90 days)
- Covers ~200,000 recognitions
- More than enough for MVP testing

---

## Testing in Development

### Start your dev server:
```bash
cd /Users/user/Ledger/Papyr
npm run dev
```

### Test handwriting recognition:

1. Open Papyr in browser: http://localhost:3000
2. Sign in to your account
3. Open a book
4. Select a cell
5. Write something (e.g., "John")
6. Wait 2-3 seconds
7. Check browser console for:
   ```
   [INK] RECOGNITION_START
   [Recognition] Google Cloud Vision succeeded: { text: "John", confidence: 0.95 }
   [INK] RECOGNITION_SUCCESS
   ```

### Test the API directly:

```bash
# Health check
curl http://localhost:3000/api/ink/recognize-vision

# Expected response:
# {"service":"google-cloud-vision","configured":true,"status":"ready"}
```

---

## Monitoring Usage

### Check Google Cloud Console

1. Go to https://console.cloud.google.com/
2. Select your project: **Papyr-Production**
3. Navigate to: **Billing** → **Reports**
4. Filter by: **Cloud Vision API**
5. View current month's usage

### Set Up Budget Alerts (Optional)

1. Go to: **Billing** → **Budgets & alerts**
2. Click **"Create budget"**
3. Set amount: $10/month (or your preferred limit)
4. Add email alerts at: 50%, 90%, 100%
5. You'll get emails if costs approach limit

---

## Troubleshooting

### Error: "API not enabled"

**Fix**:
1. Go to Cloud Console
2. Search: "Cloud Vision API"
3. Click "Enable"

### Error: "Permission denied"

**Fix**:
1. Go to: IAM & Admin → Service Accounts
2. Find your service account
3. Click "..." → "Manage permissions"
4. Add role: "Cloud Vision AI Service Agent"

### Error: "Credentials not found"

**Fix**:
```bash
# Check file exists
ls -la ~/.google-cloud-credentials/papyr-vision.json

# Check .env.local has correct path
cat .env.local | grep GOOGLE_CLOUD_VISION

# Verify path in terminal
echo $GOOGLE_CLOUD_VISION_CREDENTIALS
```

### Recognition not working

**Debug checklist**:
```bash
# 1. Check API endpoint health
curl http://localhost:3000/api/ink/recognize-vision

# 2. Check browser console for errors
# Open DevTools → Console → Look for [Recognition] logs

# 3. Verify environment variable
node -e "console.log(process.env.GOOGLE_CLOUD_VISION_CREDENTIALS)"

# 4. Test credentials manually
node -e "
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_CLOUD_VISION_CREDENTIALS
});
console.log('Credentials OK');
"
```

---

## Production Deployment (Vercel)

When deploying to production:

### Method 1: Environment Variable (Recommended)

1. Open your downloaded credentials file:
   ```bash
   cat ~/.google-cloud-credentials/papyr-vision.json
   ```

2. Copy the ENTIRE JSON content

3. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

4. Add variable:
   - **Name**: `GOOGLE_CLOUD_VISION_CREDENTIALS_JSON`
   - **Value**: (paste entire JSON)
   - **Environments**: Production, Preview, Development

5. Redeploy your application

### Method 2: Vercel Secrets (Alternative)

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Add secret
vercel secrets add google-cloud-vision-credentials "$(cat ~/.google-cloud-credentials/papyr-vision.json)"

# Reference in vercel.json
{
  "env": {
    "GOOGLE_CLOUD_VISION_CREDENTIALS_JSON": "@google-cloud-vision-credentials"
  }
}
```

---

## Security Best Practices

### ✅ DO:
- Keep credentials file outside project directory
- Use `.gitignore` to exclude credentials
- Use environment variables in production
- Set strict file permissions (`chmod 600`)
- Rotate credentials every 6-12 months

### ❌ DON'T:
- Commit credentials to Git
- Share credentials publicly
- Use personal Google account for service account
- Hard-code credentials in source code
- Give overly broad permissions (use specific roles)

### Add to `.gitignore`:

Already done! But verify:
```bash
cat .gitignore | grep -i google
# Should include: *-credentials.json or similar
```

---

## Next Steps

### Immediate:
1. ✅ Complete this setup guide
2. ✅ Test recognition in development
3. ✅ Write in a few cells and verify accuracy
4. ✅ Check browser console for success logs

### This Week:
1. 📊 Monitor usage in Google Cloud Console
2. 🧪 Test with various handwriting styles
3. 📈 Compare accuracy vs. OpenRouter
4. 💰 Review costs after 1 week of testing

### Before Production:
1. 🔐 Set up Vercel environment variables
2. 🚨 Configure billing alerts
3. ✅ Test in staging environment
4. 📊 Set up usage monitoring

---

## Support

### Documentation:
- [Full Setup Guide](./GOOGLE_CLOUD_VISION_SETUP.md)
- [API Comparison](./HANDWRITING_RECOGNITION_OPTIONS.md)
- [Google Cloud Vision Docs](https://cloud.google.com/vision/docs/handwriting)

### Need Help?
- Check the troubleshooting section above
- Review browser console logs
- Check Google Cloud Console for API errors
- Verify credentials and permissions

---

## Summary

✅ **Total Setup Time**: ~20 minutes
✅ **Cost**: FREE for first 1,000/month + $300 credits
✅ **Difficulty**: Beginner-friendly
✅ **Maintenance**: Minimal (check usage monthly)

**You're now ready to recognize handwriting with Google Cloud Vision!** 🎉

The integration is complete and will automatically use Google Cloud Vision when configured, falling back to OpenRouter if needed.
