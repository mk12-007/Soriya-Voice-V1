import express from 'express';
import { normalizeKhmerInput } from '../../src/lib/khmerText';
import { TtsRequest } from '../../shared/types';
import { audioStore } from '../services/audioStore';
import { getActiveTtsProvider, validateGeminiKey } from '../services/ttsProvider';

const router = express.Router();

function extractApiKey(req: express.Request): string | undefined {
  const headerKey = req.headers['x-gemini-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }
  if (typeof req.query.apiKey === 'string' && req.query.apiKey.trim()) {
    return req.query.apiKey.trim();
  }
  if (req.body && typeof req.body.apiKey === 'string' && req.body.apiKey.trim()) {
    return req.body.apiKey.trim();
  }
  return undefined;
}

// POST /api/validate-key - Test user Gemini API key
router.post('/validate-key', async (req, res) => {
  try {
    const apiKey = extractApiKey(req) || req.body?.apiKey;
    if (!apiKey) {
      return res.status(400).json({ valid: false, message: 'No API key was provided for validation' });
    }
    const result = await validateGeminiKey(apiKey);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ valid: false, message: error?.message || 'Validation request failed' });
  }
});

// GET /api/capabilities - Provider health & capability info
router.get('/capabilities', async (req, res) => {
  try {
    const apiKey = extractApiKey(req);
    const provider = getActiveTtsProvider(apiKey);
    const capabilities = provider.getCapabilities();
    res.json(capabilities);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve provider capabilities', details: error.message });
  }
});

// GET /api/voices - List all active/available Khmer-capable voices
router.get('/voices', async (req, res) => {
  try {
    const apiKey = extractApiKey(req);
    const provider = getActiveTtsProvider(apiKey);
    const voices = await provider.listVoices();
    res.json(voices);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list voices', details: error.message });
  }
});

// POST /api/tts - Synthesize Khmer speech
router.post('/tts', async (req, res) => {
  try {
    const apiKey = extractApiKey(req);
    const { text, controls, locale, clientId } = req.body as TtsRequest;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text field is required and must be a string' });
    }

    // 1. Deterministic normalization
    const normalization = normalizeKhmerInput(text);
    const preparedText = normalization.normalizedText;

    if (!preparedText || preparedText.trim().length === 0) {
      return res.status(400).json({ error: 'Text cannot be empty after Unicode NFC preparation' });
    }

    const provider = getActiveTtsProvider(apiKey);
    const capabilities = provider.getCapabilities();

    if (preparedText.length > capabilities.maxCharacters) {
      return res.status(400).json({
        error: `Text length (${preparedText.length} chars) exceeds server limit of ${capabilities.maxCharacters} characters`,
      });
    }

    if (locale && locale !== 'km-KH') {
      return res.status(400).json({ error: 'Locale must be km-KH for Khmer speech synthesis' });
    }

    // 2. Validate voice and controls
    const voices = await provider.listVoices();
    const targetVoiceId = controls?.voiceId || voices[0]?.id;
    const matchedVoice = voices.find((v) => v.id === targetVoiceId);

    if (!matchedVoice) {
      return res.status(400).json({ error: `Requested voice ID '${targetVoiceId}' is not available` });
    }

    const safeRate = Math.min(2.0, Math.max(0.5, controls?.rate ?? 1.0));
    const safePitch = Math.min(1.5, Math.max(0.5, controls?.pitch ?? 1.0));
    const safeFormat = matchedVoice.supportedFormats.includes(controls?.outputFormat)
      ? controls.outputFormat
      : 'wav';

    // 3. Delegate to provider
    const result = await provider.synthesize({
      text: preparedText,
      controls: {
        voiceId: matchedVoice.id,
        rate: safeRate,
        pitch: safePitch,
        outputFormat: safeFormat,
        addParagraphPauses: Boolean(controls?.addParagraphPauses),
        style: controls?.style,
      },
      locale: 'km-KH',
      clientId,
    });

    res.json(result);
  } catch (error: any) {
    console.error('TTS generation error:', error);
    res.status(500).json({
      error: 'Speech synthesis failed. Your input text has been preserved.',
      details: error.message || 'Internal speech engine error',
    });
  }
});

// GET /api/audio/:id - Stream audio file binary or download attachment
router.get('/audio/:id', (req, res) => {
  const rawId = req.params.id;
  // Strip file extension if present (e.g. abc.wav -> abc)
  const id = rawId.replace(/\.(wav|mp3|ogg)$/i, '');

  const record = audioStore.getAudio(id);
  if (!record) {
    return res.status(404).json({ error: 'Audio file not found or has expired' });
  }

  const isDownload = req.query.download === '1' || req.query.download === 'true';
  const dispositionType = isDownload ? 'attachment' : 'inline';

  res.setHeader('Content-Type', record.mimeType);
  res.setHeader('Content-Length', record.buffer.length);
  res.setHeader('Content-Disposition', `${dispositionType}; filename="soriya-${id}.${record.format}"`);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.send(record.buffer);
});

export default router;
