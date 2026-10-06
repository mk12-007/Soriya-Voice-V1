# Soriya Voice (សុរិយា) — Khmer Text-to-Speech Studio

Soriya Voice is a Khmer-first text-to-speech (TTS) web application designed to convert Khmer Unicode text into natural, clear, and downloadable audio speech.

---

## Key Features

- **Khmer-First Typography & Workflow**: High-contrast, clean interface with tailored line-height and font rendering for Khmer Unicode script (`Kantumruy Pro`).
- **Deterministic Khmer Unicode NFC Processing**:
  - Automatically canonicalizes decomposed Khmer vowels and subscript Coeng (`្`) sequences into valid Unicode NFC.
  - Strips invisible Byte Order Mark (BOM `U+FEFF`) artifacts.
  - Collapses runs of excessive blank lines into structured double line breaks for natural paragraph pauses.
  - Preserves original text without transliteration or phonetic mangling.
  - Real-time text statistics: Character count, paragraph count, estimated word count, reading duration, and character limit meter.
  - Live "Text sent to voice service" inspection drawer.
- **Server-Side TTS Provider Adapter Architecture**:
  - Secure `POST /api/tts` proxy keeping API keys strictly server-side.
  - Built-in `GeminiTtsProvider` using `@google/genai` audio synthesis models and raw PCM-to-WAV encoding.
  - Transparent `DemoTtsProvider` for running out-of-the-box in demo mode.
  - Browser Speech Synthesis checking with genuine Khmer voice detection (`km`, `km-KH`).
- **Interactive Audio Player & Export**:
  - Animated soundwave visualizer.
  - Timeline scrubbing, elapsed/total time, volume slider, and playback speed multipliers (`0.75×`, `1.0×`, `1.25×`, `1.5×`).
  - Direct download in true `WAV` or `MP3` MIME format.
  - Save to local library with title editing, audio playback, and deletion.
- **Bilingual Interface**: Khmer (Primary) and English (Secondary) with complete manual translation dictionary.
- **Privacy & Transparency**: Explicit data disclosure detailing how input text is processed solely for speech generation, with temporary 24-hour TTL audio retention.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | *(empty)* | Google Gemini API key for server-side speech generation. |
| `TTS_PROVIDER` | `gemini` | Speech engine adapter (`gemini` or `demo`). |
| `TTS_MAX_CHARACTERS_PER_REQUEST` | `5000` | Maximum character limit per synthesis request. |
| `TTS_AUDIO_RETENTION_HOURS` | `24` | TTL duration for temporary generated audio caching. |

---

## Architecture Overview

```text
├── server.ts                    # Express server + Vite middleware
├── server/
│   ├── routes/tts.ts            # /api/tts, /api/voices, /api/capabilities, /api/audio/:id
│   └── services/
│       ├── ttsProvider.ts       # GeminiTtsProvider & DemoTtsProvider interfaces
│       ├── audioStore.ts        # In-memory temporary audio store with TTL cleanup
│       └── wavHelper.ts         # PCM-to-RIFF-WAV converter with headers
├── shared/
│   └── types.ts                 # Shared TypeScript models and interfaces
└── src/
    ├── lib/
    │   ├── khmerText.ts         # Deterministic Unicode NFC normalization & text stats
    │   ├── storage.ts           # Local storage for saved audio library & preferences
    │   └── translations.ts      # Bilingual Khmer/English dictionary
    ├── features/
    │   ├── studio/              # Studio editor, voice selector, audio player
    │   ├── library/             # Saved audio library management
    │   ├── settings/            # App preferences & privacy panel
    │   └── guide/               # Khmer typography & speech guide
    ├── components/              # Header, Toast, Modal
    └── App.tsx                  # Root application coordinator
```

---

## Running the Application

```bash
# Start development server
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```
