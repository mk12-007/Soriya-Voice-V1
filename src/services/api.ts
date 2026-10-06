import { ProviderCapabilities, SynthesisResult, TtsRequest, VoiceOption } from '../../shared/types';
import { getGeminiApiKey } from '../lib/storage';

export class ApiError extends Error {
  constructor(message: string, public status?: number, public details?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAuthHeaders(): Record<string, string> {
  const key = getGeminiApiKey();
  const headers: Record<string, string> = {};
  if (key && key.trim()) {
    headers['x-gemini-api-key'] = key.trim();
  }
  return headers;
}

export async function fetchCapabilities(customKey?: string): Promise<ProviderCapabilities> {
  const headers = customKey ? { 'x-gemini-api-key': customKey.trim() } : getAuthHeaders();
  const response = await fetch('/api/capabilities', { headers });
  if (!response.ok) {
    throw new ApiError('Failed to fetch provider capabilities', response.status);
  }
  return response.json();
}

export async function fetchVoices(customKey?: string): Promise<VoiceOption[]> {
  const headers = customKey ? { 'x-gemini-api-key': customKey.trim() } : getAuthHeaders();
  const response = await fetch('/api/voices', { headers });
  if (!response.ok) {
    throw new ApiError('Failed to fetch available voices', response.status);
  }
  return response.json();
}

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; message?: string }> {
  const response = await fetch('/api/validate-key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey: apiKey.trim() }),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    return {
      valid: false,
      message: errJson.message || 'Validation request failed',
    };
  }

  return response.json();
}

export async function synthesizeSpeech(
  request: TtsRequest,
  signal?: AbortSignal
): Promise<SynthesisResult> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    let errorMsg = 'Failed to synthesize speech audio';
    let details: string | undefined;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
      if (errJson.details) details = errJson.details;
    } catch {
      // Non-JSON response
    }
    throw new ApiError(errorMsg, response.status, details);
  }

  return response.json();
}
