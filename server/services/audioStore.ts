import crypto from 'crypto';

export interface StoredAudio {
  id: string;
  buffer: Buffer;
  mimeType: string;
  format: 'wav' | 'mp3' | 'ogg';
  createdAt: number;
  expiresAt: number;
  durationSeconds: number;
  characterCount: number;
  sourceTextHash: string;
  voiceId: string;
  voiceName: string;
  style?: string;
}

class AudioStore {
  private store = new Map<string, StoredAudio>();
  private defaultTtlHours = 24;

  constructor() {
    // Run cleanup interval every 15 minutes
    setInterval(() => this.cleanupExpired(), 15 * 60 * 1000);
  }

  public saveAudio(params: {
    buffer: Buffer;
    mimeType: string;
    format: 'wav' | 'mp3' | 'ogg';
    durationSeconds: number;
    characterCount: number;
    sourceText: string;
    voiceId: string;
    voiceName: string;
    style?: string;
    ttlHours?: number;
  }): StoredAudio {
    const id = crypto.randomBytes(12).toString('hex');
    const now = Date.now();
    const ttl = (params.ttlHours || this.defaultTtlHours) * 60 * 60 * 1000;
    const hash = crypto.createHash('sha256').update(params.sourceText).digest('hex').substring(0, 16);

    const record: StoredAudio = {
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
      style: params.style,
    };

    this.store.set(id, record);
    return record;
  }

  public getAudio(id: string): StoredAudio | null {
    const record = this.store.get(id);
    if (!record) return null;

    if (Date.now() > record.expiresAt) {
      this.store.delete(id);
      return null;
    }

    return record;
  }

  public deleteAudio(id: string): boolean {
    return this.store.delete(id);
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [id, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(id);
      }
    }
  }
}

export const audioStore = new AudioStore();
