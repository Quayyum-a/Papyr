# Handwriting Recognition API Options for Papyr

## Research Summary (August 2026)

This document compares the best handwriting OCR solutions available for converting handwritten ledger entries into readable text.

---

## 🏆 Top Recommendation: Google ML Kit Digital Ink Recognition

### Why This is the Best Choice for Papyr

**✅ COMPLETELY FREE**
- No API costs whatsoever
- Unlimited usage
- No rate limits
- No credit card required

**✅ ON-DEVICE PROCESSING**
- Runs entirely on user's phone/tablet
- No server costs for you
- Works offline
- Privacy-friendly (data never leaves device)
- Instant recognition (no network latency)

**✅ OPTIMIZED FOR DIGITAL INK**
- Designed specifically for stylus/finger writing (exactly your use case)
- Uses same tech as Google Gboard, Google Translate, Quick Draw!
- Processes stroke data directly (x, y, timestamp, pressure)
- Much more accurate than image-based OCR for digital writing

**✅ EXCELLENT LANGUAGE SUPPORT**
- 300+ languages supported
- Excellent for multilingual ledgers
- Supports emojis and basic shapes
- Nigerian English fully supported

**✅ TECHNICAL COMPATIBILITY**
- iOS and Android support
- Integrates with React Native / Capacitor / Cordova
- Models downloaded on-demand (~20MB per language)
- Can work alongside your existing perfect-freehand rendering

### How It Works

```
User Draws Stroke
    ↓
Capture Stroke Data (x, y, t, pressure)
    ↓
Send to ML Kit API (on-device)
    ↓
Get Recognized Text
    ↓
Display in Ledger Cell
```

### Implementation Path

1. **For React Native / Expo** (if you want native mobile apps):
   ```bash
   npm install @react-native-ml-kit/ink-recognition
   ```

2. **For Web-based** (current Papyr setup):
   - Use **Capacitor** or **Cordova** to bridge to native ML Kit
   - Or use server-side proxy with Google Cloud Vision API (paid alternative)

3. **Stroke Data Format**:
   ```typescript
   interface Stroke {
     points: Array<{
       x: number;
       y: number;
       t: number; // timestamp in milliseconds
     }>;
   }
   
   // Send to ML Kit
   const text = await recognizeInk(strokes, languageCode);
   ```

### Limitations

- **Web-only limitation**: ML Kit is native mobile SDK (iOS/Android), not pure web
  - Your current web app would need native bridge (Capacitor/Cordova)
  - Or migrate to React Native for full native integration
- **Model download required**: First use downloads ~20MB language model
- **Requires stroke data**: Works on ink strokes, not images

---

## Alternative Options

### Option 2: Google Cloud Vision API (Handwriting OCR)

**Pricing**: 
- First 1,000 images/month: **FREE**
- After 1,000: $1.50 per 1,000 images
- $300 free credits for new Google Cloud accounts

**Pros**:
- ✅ Works with web applications (HTTP REST API)
- ✅ Excellent accuracy on handwriting
- ✅ No native mobile SDK required
- ✅ Free tier sufficient for MVP testing
- ✅ Scalable to production

**Cons**:
- ❌ Requires network connection
- ❌ Not free at scale (but very affordable)
- ❌ Works on images, not stroke data (slight accuracy loss)
- ❌ Server costs (minimal but present)

**Best For**: Web-based Papyr if you don't want to use native bridges

**Implementation**:
```typescript
// Already partially implemented in your /api/ink/recognize endpoint
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_CLOUD_CREDENTIALS
});

const [result] = await client.documentTextDetection(imageBuffer);
const text = result.fullTextAnnotation?.text;
```

### Option 3: Microsoft Azure Computer Vision Read API

**Pricing**:
- Free tier (F0): 20 calls/minute, 5,000 calls/month **FREE**
- Standard (S1): $1.00 per 1,000 transactions

**Pros**:
- ✅ Free tier for MVP
- ✅ Excellent handwriting support (printed + handwritten)
- ✅ Works with web apps (REST API)
- ✅ Mixed language support
- ✅ Modern unified API (Image Analysis 4.0)

**Cons**:
- ❌ Rate limits on free tier (20/min)
- ❌ Requires Azure account setup
- ❌ Works on images, not strokes

**Best For**: Organizations already using Azure

**Implementation**:
```typescript
import { ImageAnalysisClient } from '@azure/ai-vision-image-analysis';

const client = new ImageAnalysisClient(
  endpoint,
  new AzureKeyCredential(apiKey)
);

const result = await client.analyze(imageUrl, ['Read']);
```

### Option 4: Amazon Textract

**Pricing**:
- First 1,000 pages/month: **FREE** (12 months)
- After: $1.50 per 1,000 pages

**Pros**:
- ✅ Free tier for first year
- ✅ Good handwriting recognition
- ✅ AWS ecosystem integration

**Cons**:
- ❌ Complex AWS setup
- ❌ Overkill for simple handwriting (designed for forms/tables)
- ❌ Free tier only 12 months

**Best For**: AWS-native applications

---

## ❌ Options to AVOID

### Tesseract OCR
- **Accuracy**: 95.4% Word Error Rate on handwriting (unusable)
- **Why**: Designed for printed text, terrible at handwriting
- **Verdict**: ❌ Don't use for handwriting

### PaddleOCR / EasyOCR (Open Source)
- **Accuracy**: "Indistinguishable noise" on handwriting per research
- **Why**: Optimized for Chinese/printed text, not handwriting
- **Verdict**: ❌ Not suitable for Papyr

### TrueVault, Nanonets, Base64.ai
- **Cost**: $0.02-0.05 per page (expensive at scale)
- **Accuracy**: Good but expensive
- **Verdict**: ❌ Too expensive for free/MVP product

---

## 📊 Comparison Table

| Solution | Cost | Accuracy | Speed | Web Support | Offline |
|----------|------|----------|-------|-------------|---------|
| **ML Kit (Recommended)** | ✅ FREE | ⭐⭐⭐⭐⭐ | ⚡ Instant | ⚠️ Needs bridge | ✅ Yes |
| Google Cloud Vision | ⚠️ $1.50/1K | ⭐⭐⭐⭐ | 🌐 ~500ms | ✅ Yes | ❌ No |
| Azure Computer Vision | ⚠️ $1/1K | ⭐⭐⭐⭐ | 🌐 ~500ms | ✅ Yes | ❌ No |
| Amazon Textract | ⚠️ $1.50/1K | ⭐⭐⭐⭐ | 🌐 ~800ms | ✅ Yes | ❌ No |
| Tesseract (OSS) | ✅ FREE | ⭐ (unusable) | ⚡ Fast | ✅ Yes | ✅ Yes |

---

## 💡 Recommended Implementation Strategy

### Phase 1: Current MVP (Use Google Cloud Vision)
**Why**: Your web app is already set up, minimal changes needed

```typescript
// Already in /src/app/api/ink/recognize/route.ts
// Just improve the implementation and test thoroughly
```

**Setup**:
1. Enable Google Cloud Vision API
2. Create service account
3. Add credentials to `.env.local`
4. Use first 1,000 calls/month FREE
5. Each ledger cell recognition = 1 API call

**Cost Estimate**:
- Typical small business: 100-200 cells/day
- Monthly: ~3,000-6,000 cells
- Cost after free tier: $4.50-9.00/month per user
- Acceptable for paid product

### Phase 2: Native Mobile Apps (Use ML Kit)
**When**: If you build native iOS/Android apps or use React Native

**Why**: 
- Completely free
- Better UX (instant recognition)
- Works offline
- Privacy-friendly

**Migration Path**:
1. Option A: Keep Next.js web + use Capacitor for native bridge
2. Option B: Migrate to React Native + Expo
3. Option C: Hybrid - web app + native mobile app (share API)

**Code Structure**:
```
Papyr/
├── web/          # Current Next.js app (Google Cloud Vision)
└── mobile/       # React Native app (ML Kit)
    ├── ios/      # iOS with ML Kit
    └── android/  # Android with ML Kit
```

### Phase 3: Optimization (If Needed)
- Cache common words/phrases locally
- Implement client-side preprocessing (stroke smoothing)
- Add spell-check for Nigerian business terms
- Train custom model for accounting terms (₦, amounts, dates)

---

## 🎯 Final Recommendation for Papyr

**For Your Current Web App**: 
👉 **Use Google Cloud Vision API**

**Reasons**:
1. ✅ Works with existing Next.js web architecture
2. ✅ 1,000 free recognitions/month (sufficient for MVP testing)
3. ✅ $300 free credits for new accounts (6 months+ free)
4. ✅ Already have skeleton implementation in code
5. ✅ Excellent accuracy on handwriting
6. ✅ Scalable pricing (~$1.50 per 1,000 after free tier)
7. ✅ Quick integration (2-3 hours work)

**Future Migration**:
👉 **Plan to use ML Kit when building native mobile apps**

**Hybrid Approach** (Best of Both):
- Web users: Google Cloud Vision (network-based)
- Mobile users: ML Kit (on-device, free)
- Detect platform and route to appropriate API

---

## 📝 Implementation Checklist

### Google Cloud Vision Setup (Immediate)

- [ ] Create Google Cloud account (use $300 free credits)
- [ ] Enable Cloud Vision API
- [ ] Create service account
- [ ] Download credentials JSON
- [ ] Add to `.env.local`:
  ```
  GOOGLE_CLOUD_VISION_CREDENTIALS=/path/to/credentials.json
  ```
- [ ] Install SDK:
  ```bash
  npm install @google-cloud/vision
  ```
- [ ] Update `/api/ink/recognize` route
- [ ] Test with sample handwriting
- [ ] Optimize image capture (size, format)
- [ ] Add error handling and retry logic
- [ ] Monitor usage in Google Cloud Console

### ML Kit Setup (Future Native Apps)

- [ ] Research Capacitor vs React Native
- [ ] Set up native project structure
- [ ] Install ML Kit SDK
- [ ] Implement stroke-to-text pipeline
- [ ] Download language models
- [ ] Test offline functionality
- [ ] Compare accuracy vs Cloud Vision
- [ ] Measure performance benchmarks

---

## 🔗 Useful Links

### Google ML Kit
- [Official Docs](https://developers.google.com/ml-kit/vision/digital-ink-recognition)
- [iOS Implementation](https://developers.google.com/ml-kit/vision/digital-ink-recognition/ios)
- [Android Implementation](https://developers.google.com/ml-kit/vision/digital-ink-recognition/android)
- [Supported Languages](https://developers.google.com/ml-kit/vision/digital-ink-recognition/base-models)

### Google Cloud Vision
- [Handwriting OCR Docs](https://cloud.google.com/vision/docs/handwriting)
- [Pricing Calculator](https://cloud.google.com/vision/pricing)
- [Node.js Quickstart](https://cloud.google.com/vision/docs/setup)
- [Free Trial](https://cloud.google.com/free)

### Azure Computer Vision
- [OCR Overview](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview-ocr)
- [Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/computer-vision/)

### Research & Comparisons
- [Best Handwriting OCR 2026](https://www.handwritingocr.com/blog/best-ai-handwriting-ocr)
- [OCR Model Comparison](https://blog.roboflow.com/best-ocr-models-text-recognition/)

---

## 💬 Questions to Consider

1. **Do you plan to build native mobile apps?**
   - Yes → Plan for ML Kit migration
   - No → Stick with Google Cloud Vision

2. **What's your expected scale?**
   - <1,000 cells/month → Google Cloud Vision (FREE)
   - 1K-10K cells/month → Google Cloud Vision ($1.50-15/month)
   - >10K cells/month → Consider ML Kit or negotiate enterprise pricing

3. **Privacy requirements?**
   - High (medical, financial) → Prefer on-device ML Kit
   - Standard (business ledger) → Cloud Vision acceptable

4. **Offline requirement?**
   - Must work offline → ML Kit only option
   - Network OK → Cloud Vision simpler

---

## ✅ Next Steps

1. **Immediate**: Set up Google Cloud Vision API (2-3 hours)
2. **Test**: Create sample handwriting test suite
3. **Measure**: Track recognition accuracy on real Nigerian business writing
4. **Optimize**: Tune image preprocessing for best results
5. **Monitor**: Watch API usage and costs
6. **Plan**: Decide on native mobile app timeline
7. **Migrate**: When ready, add ML Kit for mobile users

---

**Content rephrased for compliance with licensing restrictions. Original research from multiple sources cited above.**

**Last Updated**: August 9, 2026
**Recommendation Valid**: Through 2026
**Review Date**: Q1 2027 (check for new models/pricing)
