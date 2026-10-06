export type AppLocale = 'km' | 'en';
export type AppTheme = 'light' | 'dark' | 'system';

export type TtsStatus =
  | 'idle'
  | 'validating'
  | 'preparing_text'
  | 'queued'
  | 'synthesizing'
  | 'ready'
  | 'error'
  | 'cancelled';

export type AudioFormat = 'wav' | 'mp3' | 'ogg';

export interface VoiceStyleOption {
  id: string;
  nameKm: string;
  nameEn: string;
  descriptionKm: string;
  descriptionEn: string;
  iconName: string;
  promptInstruction: string;
}

export interface VoiceOption {
  id: string;
  displayName: string;
  khmerName?: string;
  provider: 'gemini' | 'google-cloud' | 'browser' | 'demo';
  languageCodes: string[];
  gender?: 'female' | 'male' | 'neutral' | 'unknown';
  styles?: string[];
  supportsRate: boolean;
  supportsPitch: boolean;
  supportedFormats: AudioFormat[];
  isAvailable: boolean;
  demoOnly?: boolean;
  description?: string;
  accent?: string;
}

export interface TtsControls {
  voiceId: string;
  rate: number; // 0.5 to 2.0 (default 1.0)
  pitch: number; // 0.5 to 1.5 (default 1.0)
  style?: string;
  outputFormat: AudioFormat;
  addParagraphPauses: boolean;
}

export interface TtsRequest {
  text: string;
  controls: TtsControls;
  locale: 'km-KH';
  clientId?: string;
}

export interface SynthesisResult {
  jobId: string;
  audioUrl: string;
  mimeType: string;
  durationSeconds?: number;
  expiresAt?: string;
  sourceTextHash: string;
  format: AudioFormat;
  characterCount: number;
  voiceId: string;
  voiceName: string;
  style?: string;
  sampleRate?: number;
  fileSizeBytes?: number;
}

export interface AudioHistoryItem {
  id: string;
  title: string;
  createdAt: string;
  voiceId: string;
  voiceName: string;
  style?: string;
  sourcePreview: string;
  fullText: string;
  durationSeconds?: number;
  format: AudioFormat;
  audioUrl: string;
  status: 'ready' | 'expired' | 'error';
  fileSizeBytes?: number;
  characterCount: number;
}

export interface ProviderCapabilities {
  providerName: string;
  status: 'connected' | 'demo' | 'unavailable';
  maxCharacters: number;
  audioRetentionHours: number;
  supportsStreaming: boolean;
  activeVoiceCount: number;
  supportedFormats: AudioFormat[];
  modelName?: string;
}

export interface NormalizationResult {
  normalizedText: string;
  originalText: string;
  changesMade: string[];
  originalLength: number;
  normalizedLength: number;
  isKhmerScript: boolean;
  khmerCharRatio: number;
  paragraphCount: number;
}

export interface SampleTextItem {
  id: string;
  titleKm: string;
  titleEn: string;
  category: 'welcome' | 'education' | 'daily' | 'proverb' | 'announcement' | 'news' | 'story' | string;
  text: string;
  descriptionKm: string;
  descriptionEn: string;
}
