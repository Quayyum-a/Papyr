import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return healthy when MyScript and Supabase are configured', async () => {
    vi.stubEnv('MYSCRIPT_APPLICATION_KEY', 'valid-app-key');
    vi.stubEnv('MYSCRIPT_HMAC_KEY', 'valid-hmac-key');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'valid-anon-key');
    vi.stubEnv('NODE_ENV', 'test');

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.services.recognition.myscript.valid).toBe(true);
    expect(data.services.supabase.configured).toBe(true);
    expect(data.checks.handwritingRecognition).toBe(true);
  });

  it('should return degraded when MyScript credentials are placeholders', async () => {
    vi.stubEnv('MYSCRIPT_APPLICATION_KEY', 'your_myscript_application_key');
    vi.stubEnv('MYSCRIPT_HMAC_KEY', 'your_myscript_hmac_key');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'valid-anon-key');
    vi.stubEnv('NODE_ENV', 'test');

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.services.recognition.myscript.valid).toBe(false);
    expect(data.services.recognition.myscript.applicationKey).toBe('placeholder');
    expect(data.checks.handwritingRecognition).toBe(false);
  });

  it('should return degraded when MyScript credentials are missing', async () => {
    vi.stubEnv('MYSCRIPT_APPLICATION_KEY', '');
    vi.stubEnv('MYSCRIPT_HMAC_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'valid-anon-key');
    vi.stubEnv('NODE_ENV', 'test');

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.services.recognition.myscript.configured).toBe(false);
    expect(data.checks.handwritingRecognition).toBe(false);
  });

  it('should return degraded when Supabase is not configured', async () => {
    vi.stubEnv('MYSCRIPT_APPLICATION_KEY', 'valid-app-key');
    vi.stubEnv('MYSCRIPT_HMAC_KEY', 'valid-hmac-key');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    vi.stubEnv('NODE_ENV', 'test');

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.services.supabase.configured).toBe(false);
    expect(data.checks.database).toBe(false);
  });

  it('should report OpenRouter fallback status', async () => {
    vi.stubEnv('MYSCRIPT_APPLICATION_KEY', 'valid-app-key');
    vi.stubEnv('MYSCRIPT_HMAC_KEY', 'valid-hmac-key');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'valid-anon-key');
    vi.stubEnv('OPENROUTER_API_KEY', 'valid-openrouter-key');
    vi.stubEnv('NODE_ENV', 'test');

    const response = await GET();
    const data = await response.json();

    expect(data.services.recognition.openrouter.configured).toBe(true);
    expect(data.checks.recognitionFallback).toBe(true);
  });

  it('should include timestamp and version', async () => {
    vi.stubEnv('MYSCRIPT_APPLICATION_KEY', 'valid-app-key');
    vi.stubEnv('MYSCRIPT_HMAC_KEY', 'valid-hmac-key');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'valid-anon-key');
    vi.stubEnv('npm_package_version', '1.0.0-test');
    vi.stubEnv('NODE_ENV', 'test');

    const response = await GET();
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    expect(data.version).toBe('1.0.0-test');
    expect(data.environment).toBe('test');
  });
});