import { AppLocale, AppTheme, AudioFormat, AudioHistoryItem } from '../../shared/types';
import { deleteCachedAudio, clearAllCachedAudio } from './audioCache';

const STORAGE_KEYS = {
  LIBRARY: 'soriya_audio_library_v1',
  LOCALE: 'soriya_user_locale_v1',
  THEME: 'soriya_theme_mode_v1',
  DEFAULT_VOICE: 'soriya_default_voice_v1',
  DEFAULT_STYLE: 'soriya_default_style_v1',
  PREFERRED_FORMAT: 'soriya_preferred_format_v1',
  STUDIO_DRAFT: 'soriya_studio_draft_v1',
  GEMINI_API_KEY: 'soriya_gemini_api_key_v1',
  AUTO_SAVE: 'soriya_auto_save_audio_v1',
};

export interface UserPreferences {
  locale: AppLocale;
  theme: AppTheme;
  defaultVoiceId: string;
  defaultStyle?: string;
  preferredFormat: AudioFormat;
  geminiApiKey?: string;
  autoSaveAudio?: boolean;
}

export function getSavedLibrary(): AudioHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LIBRARY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch (e) {
    console.error('Error loading library from storage:', e);
    return [];
  }
}

export function saveLibraryItem(item: AudioHistoryItem): AudioHistoryItem[] {
  try {
    const current = getSavedLibrary();
    // Prepend new item
    const updated = [item, ...current.filter((i) => i.id !== item.id)];
    localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving library item:', e);
    return getSavedLibrary();
  }
}

export function updateLibraryItemTitle(id: string, newTitle: string): AudioHistoryItem[] {
  try {
    const current = getSavedLibrary();
    const updated = current.map((item) =>
      item.id === id ? { ...item, title: newTitle.trim() || item.title } : item
    );
    localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error updating library item title:', e);
    return getSavedLibrary();
  }
}

export function deleteLibraryItem(id: string): AudioHistoryItem[] {
  try {
    const current = getSavedLibrary();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(updated));
    deleteCachedAudio(id).catch(() => {});
    return updated;
  } catch (e) {
    console.error('Error deleting library item:', e);
    return getSavedLibrary();
  }
}

export function clearAllLibrary(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.LIBRARY);
    clearAllCachedAudio().catch(() => {});
  } catch (e) {
    console.error('Error clearing library:', e);
  }
}

export function getUserPreferences(): UserPreferences {
  try {
    const locale = (localStorage.getItem(STORAGE_KEYS.LOCALE) as AppLocale) || 'km';
    const theme = (localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme) || 'system';
    const defaultVoiceId = localStorage.getItem(STORAGE_KEYS.DEFAULT_VOICE) || 'voice-soriya-kore';
    const defaultStyle = localStorage.getItem(STORAGE_KEYS.DEFAULT_STYLE) || 'natural';
    const preferredFormat = (localStorage.getItem(STORAGE_KEYS.PREFERRED_FORMAT) as AudioFormat) || 'wav';
    const geminiApiKey = localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY) || '';
    const autoSaveRaw = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE);
    const autoSaveAudio = autoSaveRaw !== null ? autoSaveRaw === 'true' : true;

    return {
      locale: locale === 'en' ? 'en' : 'km',
      theme: (['light', 'dark', 'system'].includes(theme) ? theme : 'system') as AppTheme,
      defaultVoiceId,
      defaultStyle,
      preferredFormat,
      geminiApiKey,
      autoSaveAudio,
    };
  } catch {
    return {
      locale: 'km',
      theme: 'system',
      defaultVoiceId: 'voice-soriya-kore',
      defaultStyle: 'natural',
      preferredFormat: 'wav',
      geminiApiKey: '',
      autoSaveAudio: true,
    };
  }
}

export function saveUserPreferences(prefs: Partial<UserPreferences>): void {
  try {
    if (prefs.locale) localStorage.setItem(STORAGE_KEYS.LOCALE, prefs.locale);
    if (prefs.theme) localStorage.setItem(STORAGE_KEYS.THEME, prefs.theme);
    if (prefs.defaultVoiceId) localStorage.setItem(STORAGE_KEYS.DEFAULT_VOICE, prefs.defaultVoiceId);
    if (prefs.defaultStyle) localStorage.setItem(STORAGE_KEYS.DEFAULT_STYLE, prefs.defaultStyle);
    if (prefs.preferredFormat) localStorage.setItem(STORAGE_KEYS.PREFERRED_FORMAT, prefs.preferredFormat);
    if (prefs.autoSaveAudio !== undefined) {
      localStorage.setItem(STORAGE_KEYS.AUTO_SAVE, String(prefs.autoSaveAudio));
    }
    if (prefs.geminiApiKey !== undefined) {
      if (prefs.geminiApiKey.trim()) {
        localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, prefs.geminiApiKey.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
      }
    }
  } catch (e) {
    console.error('Error saving user preferences:', e);
  }
}

export function getSavedTheme(): AppTheme {
  try {
    const theme = (localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme) || 'system';
    return (['light', 'dark', 'system'].includes(theme) ? theme : 'system') as AppTheme;
  } catch {
    return 'system';
  }
}

export function saveSavedTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {
    console.error('Error saving theme:', e);
  }
}

export function getAutoSaveAudio(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE);
    return raw !== null ? raw === 'true' : true;
  } catch {
    return true;
  }
}

export function saveAutoSaveAudio(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTO_SAVE, String(enabled));
  } catch (e) {
    console.error('Error saving autoSave preference:', e);
  }
}

export function getGeminiApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY) || '';
  } catch {
    return '';
  }
}

export function saveGeminiApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
    }
  } catch (e) {
    console.error('Error saving Gemini API key:', e);
  }
}

export function clearGeminiApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
  } catch (e) {
    console.error('Error clearing Gemini API key:', e);
  }
}

export function getStudioDraft(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.STUDIO_DRAFT) || '';
  } catch {
    return '';
  }
}

export function saveStudioDraft(text: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDIO_DRAFT, text);
  } catch {
    // Ignore storage quota errors
  }
}

export function clearAllLocalStudioData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.LIBRARY);
    localStorage.removeItem(STORAGE_KEYS.STUDIO_DRAFT);
    localStorage.removeItem(STORAGE_KEYS.DEFAULT_VOICE);
    localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
    localStorage.removeItem(STORAGE_KEYS.AUTO_SAVE);
    clearAllCachedAudio().catch(() => {});
  } catch (e) {
    console.error('Error clearing local data:', e);
  }
}
