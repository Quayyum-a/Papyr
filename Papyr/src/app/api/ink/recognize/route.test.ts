import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: () => [],
    setAll: () => {},
    set: () => {},
  })),
}));

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
  })),
}));

describe('POST /api/ink/recognize', () => {
  const originalEnv = process.env;
  let fetchMock: any;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.OPENROUTER_API_KEY = 'test-api-key';
    process.env.OPENROUTER_VISION_MODELS = 'model-1:free,model-2:free,model-3:free';

    // Mock global fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValueOnce({
        auth: {
          getUser: vi.fn(() => Promise.resolve({
            data: { user: null },
            error: null,
          })),
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/png;base64,test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('unauthorized');
    });

    it('should return 500 if Supabase is not configured', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/png;base64,test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('server_misconfiguration');
    });
  });

  describe('Configuration Validation', () => {
    it('should return 503 if OpenRouter API key is not configured', async () => {
      delete process.env.OPENROUTER_API_KEY;

      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/png;base64,test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('recognition_service_not_configured');
    });

    it('should return 503 if vision models list is not configured', async () => {
      delete process.env.OPENROUTER_VISION_MODELS;

      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/png;base64,test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('recognition_service_not_configured');
    });
  });

  describe('Request Validation', () => {
    it('should return 400 if request body is invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('invalid_request_body');
    });

    it('should return 400 if image is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('missing_or_invalid_image');
    });

    it('should return 400 if image is not a string', async () => {
      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 12345,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('missing_or_invalid_image');
    });
  });

  describe('Model Fallback Logic', () => {
    it('should try first model and return result if successful', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'John Doe',
              },
            },
          ],
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/png;base64,test',
          columnLabel: 'Name',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe('John Doe');
      expect(data.model).toBe('model-1:free');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should try second model if first fails and return second model result', async () => {
      // First model fails with non-200 status
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Second model succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '$1,234.56',
              },
            },
          ],
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/png;base64,test',
          columnLabel: 'Debit',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe('$1,234.56');
      expect(data.model).toBe('model-2:free');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should skip model that returns error and try next model', async () => {
      // First model returns API error
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: {
            message: 'Model not available',
            code: 'model_unavailable',
          },
        }),
      });

      // Second model succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '2024-01-15',
              },
            },
          ],
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/png;base64,test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe('2024-01-15');
      expect(data.model).toBe('model-2:free');
    });

    it('should return recognition_unavailable if all models fail', async () => {
      // All models fail
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
      fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
      fetchMock.mockResolvedValueOnce({ ok: false, status: 429 });

      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/png;base64,test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('recognition_unavailable');
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should handle network errors and try next model', async () => {
      // First model throws network error
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      // Second model succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Test content',
              },
            },
          ],
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/png;base64,test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe('Test content');
      expect(data.model).toBe('model-2:free');
    });

    it('should handle empty string response as valid result', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '',
              },
            },
          ],
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/png;base64,test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe('');
      expect(data.model).toBe('model-1:free');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should not stop trying models if response has no choices array', async () => {
      // First model returns malformed response
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // Second model succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Valid text',
              },
            },
          ],
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/png;base64,test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe('Valid text');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Request Format', () => {
    it('should send correct request to OpenRouter API', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test' } }],
        }),
      });

      const imageData = 'data:image/png;base64,iVBORw0KGgo=';
      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: imageData,
          columnLabel: 'Description',
        }),
      });

      await POST(request);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );

      const callArgs = fetchMock.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.model).toBe('model-1:free');
      expect(requestBody.messages).toHaveLength(1);
      expect(requestBody.messages[0].role).toBe('user');
      expect(requestBody.messages[0].content).toHaveLength(2);
      expect(requestBody.messages[0].content[0].type).toBe('text');
      expect(requestBody.messages[0].content[0].text).toContain('Transcribe the handwritten text');
      expect(requestBody.messages[0].content[0].text).toContain("labeled 'Description'");
      expect(requestBody.messages[0].content[1].type).toBe('image_url');
      expect(requestBody.messages[0].content[1].image_url.url).toBe(imageData);
    });

    it('should not include column label in prompt if not provided', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test' } }],
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/ink/recognize', {
        method: 'POST',
        body: JSON.stringify({
          image: 'data:image/png;base64,test',
        }),
      });

      await POST(request);

      const callArgs = fetchMock.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      const promptText = requestBody.messages[0].content[0].text;

      expect(promptText).toContain('Transcribe the handwritten text');
      expect(promptText).not.toContain('labeled');
      expect(promptText).not.toContain('column');
    });
  });
});
