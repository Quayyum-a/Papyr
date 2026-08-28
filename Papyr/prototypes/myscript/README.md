# MyScript iinkTS Prototype

This prototype compares two MyScript integration approaches:

1. **iinkTS (Client-side)** - Interactive editor with real-time recognition via WebSocket
2. **Server-side MyScript REST API** - Batch recognition via HTTP (current production implementation)

## Quick Start

### 1. Get MyScript Credentials
1. Sign up at [developer.myscript.com](https://developer.myscript.com)
2. Create a new application
3. Note your **Application Key** and **HMAC Key**

### 2. Run the Web Prototype (Recommended)
```bash
cd prototypes/myscript
npm install
npm run dev
```
- Opens at `http://localhost:5173`
- Enter your credentials
- Write test words in the editor
- Compare real-time iinkTS results with server-side REST API

### 3. Run Comparison Test (Node.js)
```bash
cd prototypes/myscript
export MYSCRIPT_APPLICATION_KEY=your_app_key
export MYSCRIPT_HMAC_KEY=your_hmac_key
node comparison-test.js
```

## Test Words to Compare

The prototype includes these test words (matching the task requirements):
- **iPhone** (cursive and print/separate letters)
- Hello, World
- Papyr, Ledger
- Handwriting, Recognition
- Test, Demo
- 2024, $1,234.56
- January, February

## Architecture Comparison

| Aspect | iinkTS (Client) | Server-side REST |
|--------|-----------------|------------------|
| **Latency** | Real-time (WebSocket) | Batch (HTTP) |
| **UX** | Interactive, immediate feedback | Delayed, async |
| **Offline** | Not supported | Queue locally, sync later |
| **Accuracy** | Same engine, same model | Same engine, same model |
| **Integration** | Requires editor component | Simple API call |
| **Cost** | Same MyScript quota | Same MyScript quota |

## Current Production System

The current Papyr app uses **server-side MyScript REST API** via:
- `RecognitionService` (client) → `/api/ink/recognize` (server) → MyScript Cloud

The old OpenRouter-based pipeline has been replaced.

## Migration Considerations

If migrating to iinkTS:
1. Replace `RecognitionService` with iinkTS editor per cell
2. Handle stroke capture directly in editor (no canvas-to-image conversion)
3. Manage editor lifecycle per cell (mount/unmount)
4. Consider: iinkTS doesn't work offline - would need fallback

## Files

- `index.html` - Web prototype with iinkTS editor
- `comparison-test.js` - Node.js script for automated testing
- `vite.config.js` - Vite config for development
- `package.json` - Dependencies (iink-ts, vite)