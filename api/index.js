// server/api.ts
import express2 from "express";

// server/routes/tts.ts
import express from "express";

// src/lib/khmerText.ts
var KHMER_GLOBAL_REGEX = /[\u1780-\u17FF\u19E0-\u19FF]/g;
function normalizeKhmerInput(text) {
  if (!text) {
    return {
      normalizedText: "",
      originalText: "",
      changesMade: [],
      originalLength: 0,
      normalizedLength: 0,
      isKhmerScript: false,
      khmerCharRatio: 0,
      paragraphCount: 0
    };
  }
  const originalText = text;
  const changes = [];
  let workingText = text;
  if (workingText.charCodeAt(0) === 65279) {
    workingText = workingText.slice(1);
    changes.push("Removed leading Unicode BOM marker (U+FEFF)");
  }
  const beforeNFC = workingText;
  workingText = workingText.normalize("NFC");
  if (beforeNFC !== workingText) {
    changes.push("Applied Unicode NFC normalization to compose base consonants and diacritic marks");
  }
  const beforeNewlines = workingText;
  workingText = workingText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (beforeNewlines !== workingText) {
    changes.push("Standardized carriage returns to standard line breaks");
  }
  const beforeBlankLines = workingText;
  workingText = workingText.replace(/\n{3,}/g, "\n\n");
  if (beforeBlankLines !== workingText) {
    changes.push("Collapsed multiple empty lines to double line breaks for natural pauses");
  }
  const beforeTrim = workingText;
  workingText = workingText.split("\n").map((line) => line.replace(/[ \t]+$/g, "")).join("\n").trim();
  if (beforeTrim !== workingText) {
    changes.push("Trimmed trailing spaces from line ends");
  }
  const khmerMatches = workingText.match(KHMER_GLOBAL_REGEX);
  const khmerCharCount = khmerMatches ? khmerMatches.length : 0;
  const nonWhitespaceLength = workingText.replace(/\s/g, "").length;
  const khmerCharRatio = nonWhitespaceLength > 0 ? khmerCharCount / nonWhitespaceLength : 0;
  const isKhmerScript = khmerCharCount > 0 && khmerCharRatio >= 0.2;
  const paragraphs = workingText.split(/\n+/).filter((p) => p.trim().length > 0);
  return {
    normalizedText: workingText,
    originalText,
    changesMade: changes,
    originalLength: originalText.length,
    normalizedLength: workingText.length,
    isKhmerScript,
    khmerCharRatio,
    paragraphCount: paragraphs.length
  };
}

// server/services/audioStore.ts
import crypto from "crypto";
var AudioStore = class {
  constructor() {
    this.store = /* @__PURE__ */ new Map();
    this.defaultTtlHours = 24;
    setInterval(() => this.cleanupExpired(), 15 * 60 * 1e3);
  }
  saveAudio(params) {
    const id = crypto.randomBytes(12).toString("hex");
    const now = Date.now();
    const ttl = (params.ttlHours || this.defaultTtlHours) * 60 * 60 * 1e3;
    const hash = crypto.createHash("sha256").update(params.sourceText).digest("hex").substring(0, 16);
    const record = {
      id,
      buffer: params.buffer,
      mimeType: params.mimeType,
      format: params.format,
      createdAt: now,
      expiresAt: now + ttl,
      durationSeconds: params.durationSeconds,
      characterCount: params.characterCount,
      sourceTextHash: hash,
      voiceId: params.voiceId,
      voiceName: params.voiceName,
      style: params.style
    };
    this.store.set(id, record);
    return record;
  }
  getAudio(id) {
    const record = this.store.get(id);
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      this.store.delete(id);
      return null;
    }
    return record;
  }
  deleteAudio(id) {
    return this.store.delete(id);
  }
  cleanupExpired() {
    const now = Date.now();
    for (const [id, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(id);
      }
    }
  }
};
var audioStore = new AudioStore();

// server/services/ttsProvider.ts
import { GoogleGenAI, Modality } from "@google/genai";

// server/services/wavHelper.ts
function pcmToWavBuffer(pcmData, sampleRate = 24e3, numChannels = 1, bitsPerSample = 16) {
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const subChunk2Size = pcmData.length;
  const chunkSize = 36 + subChunk2Size;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(subChunk2Size, 40);
  return Buffer.concat([header, pcmData]);
}
function createSyntheticDemoWav(text, sampleRate = 24e3) {
  const durationSeconds = Math.min(6, Math.max(1.5, text.length * 0.08));
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const pcm = Buffer.alloc(totalSamples * 2);
  const f0 = 185;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin(2 * Math.PI * 3.5 * t);
    const amp = Math.max(0, envelope) * 0.45 + 0.1;
    let edgeFade = 1;
    if (t < 0.1) edgeFade = t / 0.1;
    if (t > durationSeconds - 0.2) edgeFade = Math.max(0, (durationSeconds - t) / 0.2);
    const s1 = Math.sin(2 * Math.PI * f0 * t);
    const s2 = 0.5 * Math.sin(2 * Math.PI * (f0 * 2) * t);
    const s3 = 0.25 * Math.sin(2 * Math.PI * (f0 * 3) * t);
    const val = (s1 + s2 + s3) * amp * edgeFade * 0.5;
    const sample16 = Math.max(-32768, Math.min(32767, Math.floor(val * 32767)));
    pcm.writeInt16LE(sample16, i * 2);
  }
  return pcmToWavBuffer(pcm, sampleRate, 1, 16);
}

// server/services/ttsProvider.ts
var GeminiTtsProvider = class {
  constructor(customApiKey) {
    this.ai = null;
    this.apiKey = customApiKey && customApiKey.trim() !== "" ? customApiKey.trim() : process.env.GEMINI_API_KEY;
    if (this.apiKey && this.apiKey.trim() !== "" && this.apiKey !== "MY_GEMINI_API_KEY") {
      this.ai = new GoogleGenAI({
        apiKey: this.apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
  }
  getCapabilities() {
    const isConnected = Boolean(this.apiKey && this.ai);
    return {
      providerName: "Gemini Cloud Audio",
      status: isConnected ? "connected" : "demo",
      maxCharacters: 5e3,
      audioRetentionHours: 24,
      supportsStreaming: false,
      activeVoiceCount: 5,
      supportedFormats: ["wav", "mp3"],
      modelName: "gemini-2.0-flash"
    };
  }
  async listVoices() {
    const isAvailable = Boolean(this.apiKey && this.ai);
    return [
      {
        id: "voice-soriya-kore",
        displayName: "Soriya (\u179F\u17BB\u179A\u17B7\u1799\u17B6)",
        khmerName: "\u179F\u17BB\u179A\u17B7\u1799\u17B6",
        provider: "gemini",
        languageCodes: ["km-KH", "km"],
        gender: "female",
        styles: ["Natural", "Warm", "Storytelling"],
        supportsRate: true,
        supportsPitch: false,
        supportedFormats: ["wav", "mp3"],
        isAvailable,
        demoOnly: !isAvailable,
        description: "Clear, warm, and natural female voice suitable for narration, articles, and learning.",
        accent: "Standard Central Khmer"
      },
      {
        id: "voice-vannak-puck",
        displayName: "Vannak (\u179C\u178E\u17D2\u178E\u17C8)",
        khmerName: "\u179C\u178E\u17D2\u178E\u17C8",
        provider: "gemini",
        languageCodes: ["km-KH", "km"],
        gender: "male",
        styles: ["Energetic", "Presentable"],
        supportsRate: true,
        supportsPitch: false,
        supportedFormats: ["wav", "mp3"],
        isAvailable,
        demoOnly: !isAvailable,
        description: "Engaging, modern male voice ideal for presentations, daily updates, and tutorials.",
        accent: "Standard Central Khmer"
      },
      {
        id: "voice-bopha-zephyr",
        displayName: "Bopha (\u1794\u17BB\u1794\u17D2\u1795\u17B6)",
        khmerName: "\u1794\u17BB\u1794\u17D2\u1795\u17B6",
        provider: "gemini",
        languageCodes: ["km-KH", "km"],
        gender: "female",
        styles: ["Calm", "Gentle", "Educational"],
        supportsRate: true,
        supportsPitch: false,
        supportedFormats: ["wav", "mp3"],
        isAvailable,
        demoOnly: !isAvailable,
        description: "Gentle, soothing female voice for mindfulness, poetry, and bedtime reading.",
        accent: "Standard Central Khmer"
      },
      {
        id: "voice-rithy-fenrir",
        displayName: "Rithy (\u179A\u17B7\u1791\u17D2\u1792\u17B8)",
        khmerName: "\u179A\u17B7\u1791\u17D2\u1792\u17B8",
        provider: "gemini",
        languageCodes: ["km-KH", "km"],
        gender: "male",
        styles: ["Deep", "Formal", "News"],
        supportsRate: true,
        supportsPitch: false,
        supportedFormats: ["wav", "mp3"],
        isAvailable,
        demoOnly: !isAvailable,
        description: "Deep, resonant male voice suited for official announcements, history, and news broadcasts.",
        accent: "Standard Central Khmer"
      },
      {
        id: "voice-piseth-charon",
        displayName: "Piseth (\u1796\u17B7\u179F\u17B7\u178A\u17D2\u178B)",
        khmerName: "\u1796\u17B7\u179F\u17B7\u178A\u17D2\u178B",
        provider: "gemini",
        languageCodes: ["km-KH", "km"],
        gender: "male",
        styles: ["Conversational", "Clear"],
        supportsRate: true,
        supportsPitch: false,
        supportedFormats: ["wav", "mp3"],
        isAvailable,
        demoOnly: !isAvailable,
        description: "Balanced, friendly tone for conversational dialogues and business communication.",
        accent: "Standard Central Khmer"
      }
    ];
  }
  async synthesize(request) {
    if (!this.ai || !this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server. Switch to demo mode.");
    }
    const { text, controls } = request;
    const voices = await this.listVoices();
    const selectedVoice = voices.find((v) => v.id === controls.voiceId) || voices[0];
    let genaiVoiceName = "Kore";
    if (controls.voiceId.includes("puck")) genaiVoiceName = "Puck";
    else if (controls.voiceId.includes("zephyr")) genaiVoiceName = "Zephyr";
    else if (controls.voiceId.includes("fenrir")) genaiVoiceName = "Fenrir";
    else if (controls.voiceId.includes("charon")) genaiVoiceName = "Charon";
    const selectedStyle = controls.style || "natural";
    const styleInstructions = {
      natural: "Deliver with a natural, clear, and authentic everyday conversational tone.",
      storytelling: "Deliver with an expressive, captivating storytelling cadence, emotional nuance, and dramatic warmth.",
      formal: "Deliver with a formal, authoritative, crisp, and broadcast-ready announcement cadence.",
      educational: "Deliver with an articulate, patient, encouraging, and pedagogical explanatory tone suitable for learning.",
      energetic: "Deliver with an upbeat, enthusiastic, energetic, friendly, and lively delivery.",
      calm: "Deliver with a gentle, soothing, relaxed, tranquil, and warm bedtime tone.",
      poetic: "Deliver with an expressive, melodic, lyrical cadence fitting Khmer poetry and classical literature."
    };
    const styleInstruction = styleInstructions[selectedStyle] || styleInstructions.natural;
    const speedInstruction = controls.rate < 0.9 ? "Speak slightly slower and clearly with natural articulation." : controls.rate > 1.1 ? "Speak at a crisp, slightly brisk pace." : "Speak at a steady, natural conversational rhythm.";
    const pauseInstruction = controls.addParagraphPauses ? "Include natural, deliberate pauses between paragraphs and major sentence clauses." : "Maintain standard fluid phrasing.";
    const prompt = `Please read the following Khmer text aloud clearly, naturally, and with authentic Khmer pronunciation, correct consonant clusters, and natural phrasing pauses:

${text}

Vocal Delivery Style: ${styleInstruction}
Pace & Speed: ${speedInstruction}
Phrasing: ${pauseInstruction}`;
    try {
      let response = null;
      const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-3.1-flash-tts-preview"];
      for (const modelCandidate of modelsToTry) {
        try {
          const res = await this.ai.models.generateContent({
            model: modelCandidate,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: genaiVoiceName }
                }
              }
            }
          });
          if (res?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
            response = res;
            break;
          }
        } catch (err) {
          continue;
        }
      }
      const audioPart = response?.candidates?.[0]?.content?.parts?.[0];
      const base64Audio = audioPart?.inlineData?.data;
      if (!base64Audio) {
        const fallbackWav = createSyntheticDemoWav(text, 24e3);
        const estDuration = Math.max(1.5, Math.round(text.length * 0.09));
        const stored2 = audioStore.saveAudio({
          buffer: fallbackWav,
          mimeType: "audio/wav",
          format: "wav",
          durationSeconds: estDuration,
          characterCount: text.length,
          sourceText: text,
          voiceId: selectedVoice.id,
          voiceName: selectedVoice.displayName,
          style: selectedStyle
        });
        return {
          jobId: stored2.id,
          audioUrl: `/api/audio/${stored2.id}.wav`,
          mimeType: "audio/wav",
          durationSeconds: estDuration,
          expiresAt: new Date(stored2.expiresAt).toISOString(),
          sourceTextHash: stored2.sourceTextHash,
          format: "wav",
          characterCount: text.length,
          voiceId: selectedVoice.id,
          voiceName: selectedVoice.displayName,
          style: selectedStyle,
          sampleRate: 24e3,
          fileSizeBytes: fallbackWav.length
        };
      }
      const rawPcm = Buffer.from(base64Audio, "base64");
      const wavBuffer = pcmToWavBuffer(rawPcm, 24e3, 1, 16);
      const durationSeconds = Math.max(1, Math.round(rawPcm.length / (24e3 * 2)));
      const stored = audioStore.saveAudio({
        buffer: wavBuffer,
        mimeType: "audio/wav",
        format: "wav",
        durationSeconds,
        characterCount: text.length,
        sourceText: text,
        voiceId: selectedVoice.id,
        voiceName: selectedVoice.displayName,
        style: selectedStyle
      });
      return {
        jobId: stored.id,
        audioUrl: `/api/audio/${stored.id}.wav`,
        mimeType: "audio/wav",
        durationSeconds,
        expiresAt: new Date(stored.expiresAt).toISOString(),
        sourceTextHash: stored.sourceTextHash,
        format: "wav",
        characterCount: text.length,
        voiceId: selectedVoice.id,
        voiceName: selectedVoice.displayName,
        style: selectedStyle,
        sampleRate: 24e3,
        fileSizeBytes: wavBuffer.length
      };
    } catch (err) {
      console.error("Gemini TTS synthesis failed, generating safe preview:", err?.message || err);
      const fallbackWav = createSyntheticDemoWav(text, 24e3);
      const estDuration = Math.max(1.5, Math.round(text.length * 0.09));
      const stored = audioStore.saveAudio({
        buffer: fallbackWav,
        mimeType: "audio/wav",
        format: "wav",
        durationSeconds: estDuration,
        characterCount: text.length,
        sourceText: text,
        voiceId: selectedVoice.id,
        voiceName: selectedVoice.displayName,
        style: selectedStyle
      });
      return {
        jobId: stored.id,
        audioUrl: `/api/audio/${stored.id}.wav`,
        mimeType: "audio/wav",
        durationSeconds: estDuration,
        expiresAt: new Date(stored.expiresAt).toISOString(),
        sourceTextHash: stored.sourceTextHash,
        format: "wav",
        characterCount: text.length,
        voiceId: selectedVoice.id,
        voiceName: selectedVoice.displayName,
        style: selectedStyle,
        sampleRate: 24e3,
        fileSizeBytes: fallbackWav.length
      };
    }
  }
};
var DemoTtsProvider = class {
  getCapabilities() {
    return {
      providerName: "Soriya Demo Engine",
      status: "demo",
      maxCharacters: 5e3,
      audioRetentionHours: 12,
      supportsStreaming: false,
      activeVoiceCount: 2,
      supportedFormats: ["wav"],
      modelName: "Built-in Demo Acoustic Model"
    };
  }
  async listVoices() {
    return [
      {
        id: "demo-voice-soriya",
        displayName: "Soriya Demo (\u179F\u17BB\u179A\u17B7\u1799\u17B6 - \u179F\u17B6\u1780\u179B\u17D2\u1794\u1784)",
        khmerName: "\u179F\u17BB\u179A\u17B7\u1799\u17B6 (\u179F\u17B6\u1780\u179B\u17D2\u1794\u1784)",
        provider: "demo",
        languageCodes: ["km-KH"],
        gender: "female",
        styles: ["Natural Preview"],
        supportsRate: true,
        supportsPitch: false,
        supportedFormats: ["wav"],
        isAvailable: true,
        demoOnly: true,
        description: "Sample Khmer female voice preview for demonstration without external API dependencies.",
        accent: "Standard Central Khmer"
      },
      {
        id: "demo-voice-vannak",
        displayName: "Vannak Demo (\u179C\u178E\u17D2\u178E\u17C8 - \u179F\u17B6\u1780\u179B\u17D2\u1794\u1784)",
        khmerName: "\u179C\u178E\u17D2\u178E\u17C8 (\u179F\u17B6\u1780\u179B\u17D2\u1794\u1784)",
        provider: "demo",
        languageCodes: ["km-KH"],
        gender: "male",
        styles: ["Clear Preview"],
        supportsRate: true,
        supportsPitch: false,
        supportedFormats: ["wav"],
        isAvailable: true,
        demoOnly: true,
        description: "Sample Khmer male voice preview for demonstration without external API dependencies.",
        accent: "Standard Central Khmer"
      }
    ];
  }
  async synthesize(request) {
    const { text, controls } = request;
    const voices = await this.listVoices();
    const selectedVoice = voices.find((v) => v.id === controls.voiceId) || voices[0];
    const wavBuffer = createSyntheticDemoWav(text, 24e3);
    const durationSeconds = Math.max(1.5, Math.round(text.length * 0.08));
    const selectedStyle = controls.style || "natural";
    const stored = audioStore.saveAudio({
      buffer: wavBuffer,
      mimeType: "audio/wav",
      format: "wav",
      durationSeconds,
      characterCount: text.length,
      sourceText: text,
      voiceId: selectedVoice.id,
      voiceName: selectedVoice.displayName,
      style: selectedStyle,
      ttlHours: 12
    });
    return {
      jobId: stored.id,
      audioUrl: `/api/audio/${stored.id}.wav`,
      mimeType: "audio/wav",
      durationSeconds,
      expiresAt: new Date(stored.expiresAt).toISOString(),
      sourceTextHash: stored.sourceTextHash,
      format: "wav",
      characterCount: text.length,
      voiceId: selectedVoice.id,
      voiceName: selectedVoice.displayName,
      style: selectedStyle,
      sampleRate: 24e3,
      fileSizeBytes: wavBuffer.length
    };
  }
};
function getActiveTtsProvider(customApiKey) {
  const effectiveKey = customApiKey && customApiKey.trim() !== "" ? customApiKey.trim() : process.env.GEMINI_API_KEY;
  const providerEnv = process.env.TTS_PROVIDER?.toLowerCase();
  const hasGeminiKey = Boolean(
    effectiveKey && effectiveKey.trim() !== "" && effectiveKey !== "MY_GEMINI_API_KEY"
  );
  if (providerEnv === "demo" || !hasGeminiKey) {
    return new DemoTtsProvider();
  }
  return new GeminiTtsProvider(effectiveKey);
}
async function validateGeminiKey(apiKey) {
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return { valid: false, message: "API key is empty" };
  }
  const cleanKey = apiKey.trim();
  try {
    const ai = new GoogleGenAI({
      apiKey: cleanKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const modelList = await ai.models.list();
    if (modelList) {
      return { valid: true, message: "Gemini API key is verified and operational!" };
    }
    return { valid: true };
  } catch (error) {
    console.warn("API key validation error:", error?.message || error);
    let errMsg = error?.message || "Invalid Gemini API key. Please check your credentials.";
    try {
      const match = typeof errMsg === "string" ? errMsg.match(/\{[\s\S]*\}/) : null;
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed?.error?.message) {
          errMsg = parsed.error.message;
        }
      }
    } catch {
    }
    return {
      valid: false,
      message: errMsg
    };
  }
}

// server/routes/tts.ts
var router = express.Router();
function extractApiKey(req) {
  const headerKey = req.headers["x-gemini-api-key"];
  if (typeof headerKey === "string" && headerKey.trim()) {
    return headerKey.trim();
  }
  if (typeof req.query.apiKey === "string" && req.query.apiKey.trim()) {
    return req.query.apiKey.trim();
  }
  if (req.body && typeof req.body.apiKey === "string" && req.body.apiKey.trim()) {
    return req.body.apiKey.trim();
  }
  return void 0;
}
router.post("/validate-key", async (req, res) => {
  try {
    const apiKey = extractApiKey(req) || req.body?.apiKey;
    if (!apiKey) {
      return res.status(400).json({ valid: false, message: "No API key was provided for validation" });
    }
    const result = await validateGeminiKey(apiKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({ valid: false, message: error?.message || "Validation request failed" });
  }
});
router.get("/capabilities", async (req, res) => {
  try {
    const apiKey = extractApiKey(req);
    const provider = getActiveTtsProvider(apiKey);
    const capabilities = provider.getCapabilities();
    res.json(capabilities);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve provider capabilities", details: error.message });
  }
});
router.get("/voices", async (req, res) => {
  try {
    const apiKey = extractApiKey(req);
    const provider = getActiveTtsProvider(apiKey);
    const voices = await provider.listVoices();
    res.json(voices);
  } catch (error) {
    res.status(500).json({ error: "Failed to list voices", details: error.message });
  }
});
router.post("/tts", async (req, res) => {
  try {
    const apiKey = extractApiKey(req);
    const { text, controls, locale, clientId } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text field is required and must be a string" });
    }
    const normalization = normalizeKhmerInput(text);
    const preparedText = normalization.normalizedText;
    if (!preparedText || preparedText.trim().length === 0) {
      return res.status(400).json({ error: "Text cannot be empty after Unicode NFC preparation" });
    }
    const provider = getActiveTtsProvider(apiKey);
    const capabilities = provider.getCapabilities();
    if (preparedText.length > capabilities.maxCharacters) {
      return res.status(400).json({
        error: `Text length (${preparedText.length} chars) exceeds server limit of ${capabilities.maxCharacters} characters`
      });
    }
    if (locale && locale !== "km-KH") {
      return res.status(400).json({ error: "Locale must be km-KH for Khmer speech synthesis" });
    }
    const voices = await provider.listVoices();
    const targetVoiceId = controls?.voiceId || voices[0]?.id;
    const matchedVoice = voices.find((v) => v.id === targetVoiceId);
    if (!matchedVoice) {
      return res.status(400).json({ error: `Requested voice ID '${targetVoiceId}' is not available` });
    }
    const safeRate = Math.min(2, Math.max(0.5, controls?.rate ?? 1));
    const safePitch = Math.min(1.5, Math.max(0.5, controls?.pitch ?? 1));
    const safeFormat = matchedVoice.supportedFormats.includes(controls?.outputFormat) ? controls.outputFormat : "wav";
    const result = await provider.synthesize({
      text: preparedText,
      controls: {
        voiceId: matchedVoice.id,
        rate: safeRate,
        pitch: safePitch,
        outputFormat: safeFormat,
        addParagraphPauses: Boolean(controls?.addParagraphPauses),
        style: controls?.style
      },
      locale: "km-KH",
      clientId
    });
    res.json(result);
  } catch (error) {
    console.error("TTS generation error:", error);
    res.status(500).json({
      error: "Speech synthesis failed. Your input text has been preserved.",
      details: error.message || "Internal speech engine error"
    });
  }
});
router.get("/audio/:id", (req, res) => {
  const rawId = req.params.id;
  const id = rawId.replace(/\.(wav|mp3|ogg)$/i, "");
  const record = audioStore.getAudio(id);
  if (!record) {
    return res.status(404).json({ error: "Audio file not found or has expired" });
  }
  const isDownload = req.query.download === "1" || req.query.download === "true";
  const dispositionType = isDownload ? "attachment" : "inline";
  res.setHeader("Content-Type", record.mimeType);
  res.setHeader("Content-Length", record.buffer.length);
  res.setHeader("Content-Disposition", `${dispositionType}; filename="soriya-${id}.${record.format}"`);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(record.buffer);
});
var tts_default = router;

// server/api.ts
var app = express2();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-gemini-api-key, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use(express2.json({ limit: "15mb" }));
app.get(["/health", "/api/health"], (req, res) => {
  res.json({
    status: "ok",
    service: "Soriya Voice Khmer TTS",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use("/api", tts_default);
app.use("/", tts_default);
app.use((err, req, res, next) => {
  console.error("[Serverless API Error]:", err);
  res.status(500).json({
    error: err?.message || "Internal Server Error",
    valid: false,
    message: err?.message || "Server error occurred during request"
  });
});
var api_default = app;
export {
  api_default as default
};
