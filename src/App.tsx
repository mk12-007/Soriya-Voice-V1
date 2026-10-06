import React, { useEffect, useState } from 'react';
import {
  AppLocale,
  AppTheme,
  AudioFormat,
  AudioHistoryItem,
  ProviderCapabilities,
  VoiceOption,
} from '../shared/types';
import { fetchCapabilities, fetchVoices } from './services/api';
import {
  clearAllLibrary,
  clearAllLocalStudioData,
  deleteLibraryItem,
  getSavedLibrary,
  getStudioDraft,
  getUserPreferences,
  saveLibraryItem,
  saveUserPreferences,
  updateLibraryItemTitle,
} from './lib/storage';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { ToastContainer, ToastMessage } from './components/Toast';
import { StudioPage } from './features/studio/StudioPage';
import { LibraryPage } from './features/library/LibraryPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { GuidePage } from './features/guide/GuidePage';
import { cleanKhmerDoubleSpaces, convertKhmerDigits } from './lib/khmerText';
import { SampleTextItem } from '../shared/types';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<'studio' | 'library' | 'settings' | 'guide'>(
    'studio'
  );

  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // App settings & preferences
  const [preferences, setPreferences] = useState(() => getUserPreferences());
  const [locale, setLocale] = useState<AppLocale>(preferences.locale);
  const [theme, setTheme] = useState<AppTheme>(preferences.theme || 'system');
  const [defaultVoiceId, setDefaultVoiceId] = useState<string>(preferences.defaultVoiceId);
  const [defaultStyleId, setDefaultStyleId] = useState<string>(preferences.defaultStyle || 'natural');
  const [preferredFormat, setPreferredFormat] = useState<AudioFormat>(preferences.preferredFormat);
  const [autoSaveAudio, setAutoSaveAudio] = useState<boolean>(preferences.autoSaveAudio !== false);

  // Server state
  const [capabilities, setCapabilities] = useState<ProviderCapabilities | null>(null);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Saved library items
  const [libraryItems, setLibraryItems] = useState<AudioHistoryItem[]>(() => getSavedLibrary());

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Studio transfer state (when opening an item from library into studio)
  const [studioDraftText, setStudioDraftText] = useState<string>(() => getStudioDraft());
  const [studioVoiceId, setStudioVoiceId] = useState<string>(preferences.defaultVoiceId);
  const [studioStyleId, setStudioStyleId] = useState<string>(preferences.defaultStyle || 'natural');

  // Synchronize Dark / Light Theme with document HTML root
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
        body.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    const listener = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Global macOS keyboard shortcuts for tabs (Cmd+1..4) and Command Palette (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setIsCommandPaletteOpen((prev) => !prev);
        } else if (e.key === '1') {
          e.preventDefault();
          setCurrentTab('studio');
        } else if (e.key === '2') {
          e.preventDefault();
          setCurrentTab('library');
        } else if (e.key === '3') {
          e.preventDefault();
          setCurrentTab('settings');
        } else if (e.key === '4') {
          e.preventDefault();
          setCurrentTab('guide');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load server capabilities and voices
  const refreshVoicesAndCapabilities = async (customKey?: string) => {
    try {
      const [caps, voiceList] = await Promise.all([
        fetchCapabilities(customKey).catch(() => null),
        fetchVoices(customKey).catch(() => []),
      ]);

      if (caps) setCapabilities(caps);
      if (voiceList && voiceList.length > 0) {
        setVoices(voiceList);
        const exists = voiceList.some((v) => v.id === defaultVoiceId);
        if (!exists) {
          setDefaultVoiceId(voiceList[0].id);
          saveUserPreferences({ defaultVoiceId: voiceList[0].id });
        }
      }
    } catch (err) {
      console.error('Error loading server data:', err);
    }
  };

  useEffect(() => {
    async function initServerData() {
      try {
        await refreshVoicesAndCapabilities();
      } finally {
        setLoadingInitial(false);
      }
    }

    initServerData();
  }, []);

  const handleApiKeyChange = (newKey: string) => {
    refreshVoicesAndCapabilities(newKey);
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Preference handlers
  const handleToggleLocale = (newLocale: AppLocale) => {
    setLocale(newLocale);
    saveUserPreferences({ locale: newLocale });
  };

  const handleSelectTheme = (newTheme: AppTheme) => {
    setTheme(newTheme);
    saveUserPreferences({ theme: newTheme });
  };

  const handleSelectDefaultVoice = (voiceId: string) => {
    setDefaultVoiceId(voiceId);
    saveUserPreferences({ defaultVoiceId: voiceId });
    showToast('info', 'បានកំណត់សំឡេងលំនាំដើម');
  };

  const handleSelectDefaultStyle = (styleId: string) => {
    setDefaultStyleId(styleId);
    saveUserPreferences({ defaultStyle: styleId });
    showToast('info', 'បានកំណត់រចនាប័ទ្មសំឡេងលំនាំដើម');
  };

  const handleSelectPreferredFormat = (format: AudioFormat) => {
    setPreferredFormat(format);
    saveUserPreferences({ preferredFormat: format });
    showToast('info', `ទម្រង់ឯកសារលំនាំដើម៖ ${format.toUpperCase()}`);
  };

  const handleToggleAutoSave = (enabled: boolean) => {
    setAutoSaveAudio(enabled);
    saveUserPreferences({ autoSaveAudio: enabled });
    showToast(
      'info',
      enabled
        ? locale === 'km'
          ? 'បានបើកការរក្សាទុកសំឡេងស្វ័យប្រវត្តិ'
          : 'Auto-save audio enabled'
        : locale === 'km'
        ? 'បានបិទការរក្សាទុកសំឡេងស្វ័យប្រវត្តិ'
        : 'Auto-save audio disabled'
    );
  };

  // Library Handlers
  const handleSaveToLibrary = (item: AudioHistoryItem) => {
    const updated = saveLibraryItem(item);
    setLibraryItems(updated);
  };

  const handleDeleteLibraryItem = (id: string) => {
    const updated = deleteLibraryItem(id);
    setLibraryItems(updated);
    showToast('info', 'បានលុបឯកសារសំឡេង');
  };

  const handleUpdateLibraryTitle = (id: string, newTitle: string) => {
    const updated = updateLibraryItemTitle(id, newTitle);
    setLibraryItems(updated);
    showToast('success', 'បានប្តូរចំណងជើង');
  };

  const handleClearAllLibrary = () => {
    clearAllLibrary();
    setLibraryItems([]);
    showToast('info', 'បានលុបបណ្ណាល័យទាំងអស់');
  };

  const handleClearAllLocalData = () => {
    clearAllLocalStudioData();
    setLibraryItems([]);
    setStudioDraftText('');
  };

  const handleLoadInStudio = (item: AudioHistoryItem) => {
    setStudioDraftText(item.fullText);
    setStudioVoiceId(item.voiceId);
    if (item.style) {
      setStudioStyleId(item.style);
    }
    setCurrentTab('studio');
  };

  const handleSelectSampleFromPalette = (sample: SampleTextItem) => {
    setStudioDraftText(sample.text);
    setCurrentTab('studio');
    showToast('info', `បានជ្រើសរើស៖ ${locale === 'km' ? sample.titleKm : sample.titleEn}`);
  };

  const handleConvertDigitsInStudio = () => {
    // If text contains Khmer digits, convert to Western; else convert to Khmer
    const hasKhmer = /[០-៩]/.test(studioDraftText);
    const converted = convertKhmerDigits(studioDraftText, !hasKhmer);
    setStudioDraftText(converted);
    setCurrentTab('studio');
    showToast('success', 'បានប្តូរទម្រង់លេខ');
  };

  const handleCleanSpacesInStudio = () => {
    const cleaned = cleanKhmerDoubleSpaces(studioDraftText);
    setStudioDraftText(cleaned);
    setCurrentTab('studio');
    showToast('success', 'បានសម្អាតចន្លោះទំនេរស្ទួន');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f17] text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-600/20 dark:selection:bg-indigo-500/30 selection:text-slate-900 dark:selection:text-white transition-colors duration-200">
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        locale={locale}
        theme={theme}
        onSelectTab={setCurrentTab}
        onToggleLocale={handleToggleLocale}
        onToggleTheme={handleSelectTheme}
        voices={voices}
        onSelectVoice={(vId) => {
          setStudioVoiceId(vId);
          handleSelectDefaultVoice(vId);
        }}
        onSelectSampleText={handleSelectSampleFromPalette}
        onConvertDigits={handleConvertDigitsInStudio}
        onCleanSpaces={handleCleanSpacesInStudio}
      />

      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        locale={locale}
        onToggleLocale={handleToggleLocale}
        theme={theme}
        onToggleTheme={handleSelectTheme}
        capabilities={capabilities}
        savedItemCount={libraryItems.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'studio' && (
          <StudioPage
            locale={locale}
            voices={voices}
            capabilities={capabilities}
            onSaveToLibrary={handleSaveToLibrary}
            showToast={showToast}
            initialText={studioDraftText}
            initialVoiceId={studioVoiceId || defaultVoiceId}
            initialStyleId={studioStyleId || defaultStyleId}
            initialFormat={preferredFormat}
            onDraftTextChange={setStudioDraftText}
          />
        )}

        {currentTab === 'library' && (
          <LibraryPage
            items={libraryItems}
            locale={locale}
            onDeleteItem={handleDeleteLibraryItem}
            onUpdateTitle={handleUpdateLibraryTitle}
            onClearAll={handleClearAllLibrary}
            onLoadInStudio={handleLoadInStudio}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsPage
            locale={locale}
            onSelectLocale={handleToggleLocale}
            theme={theme}
            onSelectTheme={handleSelectTheme}
            voices={voices}
            defaultVoiceId={defaultVoiceId}
            onSelectDefaultVoice={handleSelectDefaultVoice}
            defaultStyleId={defaultStyleId}
            onSelectDefaultStyle={handleSelectDefaultStyle}
            preferredFormat={preferredFormat}
            onSelectPreferredFormat={handleSelectPreferredFormat}
            autoSaveAudio={autoSaveAudio}
            onToggleAutoSave={handleToggleAutoSave}
            capabilities={capabilities}
            onClearLocalData={handleClearAllLocalData}
            onApiKeyChange={handleApiKeyChange}
            showToast={showToast}
          />
        )}

        {currentTab === 'guide' && <GuidePage locale={locale} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 dark:text-slate-400 font-khmer transition-colors">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">Soriya Voice (សុរិយា)</span>
            <span>•</span>
            <span>Khmer Text-to-Speech Studio</span>
          </div>
          <p className="text-slate-400">
            Deterministic Khmer Unicode NFC Processing • Secure Server-Side Architecture
          </p>
        </div>
      </footer>
    </div>
  );
}
