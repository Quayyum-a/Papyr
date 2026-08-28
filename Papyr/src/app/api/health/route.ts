import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Health check endpoint that reports service status and configuration validity.
 * Used for monitoring and debugging deployment issues.
 */
export async function GET() {
  // Check MyScript credentials
  const myscriptApplicationKey = process.env.MYSCRIPT_APPLICATION_KEY;
  const myscriptHmacKey = process.env.MYSCRIPT_HMAC_KEY;

  const myscriptConfigured = Boolean(myscriptApplicationKey && myscriptHmacKey);
  const myscriptPlaceholder = myscriptApplicationKey?.includes('your_myscript') || myscriptHmacKey?.includes('your_myscript');

  // Check Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

  // Check OpenRouter configuration (fallback)
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const openRouterConfigured = Boolean(openRouterApiKey && !openRouterApiKey.includes('your_openrouter'));

  // Determine overall health
  const hasValidRecognition = myscriptConfigured && !myscriptPlaceholder;

  const status = hasValidRecognition && supabaseConfigured ? 'healthy' : 'degraded';

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    services: {
      supabase: {
        configured: supabaseConfigured,
        url: supabaseUrl ? 'set' : 'missing',
      },
      recognition: {
        myscript: {
          configured: myscriptConfigured,
          valid: myscriptConfigured && !myscriptPlaceholder,
          applicationKey: myscriptApplicationKey ? (myscriptPlaceholder ? 'placeholder' : 'configured') : 'missing',
          hmacKey: myscriptHmacKey ? (myscriptPlaceholder ? 'placeholder' : 'configured') : 'missing',
        },
        openrouter: {
          configured: openRouterConfigured,
          apiKey: openRouterApiKey ? (openRouterConfigured ? 'configured' : 'placeholder') : 'missing',
        },
        primary: 'myscript',
        fallback: 'openrouter',
      },
    },
    checks: {
      database: supabaseConfigured,
      handwritingRecognition: hasValidRecognition,
      recognitionFallback: openRouterConfigured,
    },
  }, {
    status: status === 'healthy' ? 200 : 503,
  });
}