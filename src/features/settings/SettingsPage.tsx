import React, { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Volume2,
  FileAudio,
  ShieldCheck,
  Trash2,
  Server,
  Info,
  Check,
  Layers,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  BookmarkCheck,
  HardDriveDownload,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import {
  AppLocale,
  AppTheme,
  AudioFormat,
  ProviderCapabilities,
  VoiceOption,
} from '../../../shared/types';
import { t } from '../../lib/translations';
import { KHMER_VOICE_STYLES } from '../../lib/voiceStyles';
import { Modal } from '../../components/Modal';
import { getGeminiApiKey, saveGeminiApiKey, clearGeminiApiKey } from '../../lib/storage';
import { validateApiKey } from '../../services/api';

interface SettingsPageProps {
  locale: AppLocale;
  onSelectLocale: (l: AppLocale) => void;
  theme: AppTheme;
  onSelectTheme: (t: AppTheme) => void;
  voices: VoiceOption[];
  defaultVoiceId: string;
  onSelectDefaultVoice: (id: string) => void;
  defaultStyleId?: string;
  onSelectDefaultStyle?: (styleId: string) => void;
  preferredFormat: AudioFormat;
  onSelectPreferredFormat: (f: AudioFormat) => void;
  autoSaveAudio?: boolean;
  onToggleAutoSave?: (enabled: boolean) => void;
  capabilities: ProviderCapabilities | null;
  onClearLocalData: () => void;
  onApiKeyChange?: (key: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  locale,
  onSelectLocale,
  theme,
  onSelectTheme,
  voices,
  defaultVoiceId,
  onSelectDefaultVoice,
  defaultStyleId = 'natural',
  onSelectDefaultStyle,
  preferredFormat,
  onSelectPreferredFormat,
  autoSaveAudio = true,
  onToggleAutoSave,
  capabilities,
  onClearLocalData,
  onApiKeyChange,
  showToast,
}) => {
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState(() => getGeminiApiKey());
  const [showKey, setShowKey] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState<{
    tested: boolean;
    valid: boolean;
    message?: string;
  }>({
    tested: false,
    valid: false,
  });

  useEffect(() => {
    const stored = getGeminiApiKey();
    setApiKeyInput(stored);
  }, []);

  const handleSaveAndVerifyKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      clearGeminiApiKey();
      setKeyValidationStatus({ tested: false, valid: false });
      onApiKeyChange?.('');
      showToast('info', t(locale, 'apiKeyRemovedSuccess'));
      return;
    }

    setIsValidatingKey(true);
    setKeyValidationStatus({ tested: false, valid: false });

    try {
      const res = await validateApiKey(trimmed);
      if (res.valid) {
        saveGeminiApiKey(trimmed);
        setKeyValidationStatus({
          tested: true,
          valid: true,
          message: res.message || t(locale, 'apiKeyValid'),
        });
        onApiKeyChange?.(trimmed);
        showToast('success', t(locale, 'apiKeySavedSuccess'));
      } else {
        setKeyValidationStatus({
          tested: true,
          valid: false,
          message: res.message || t(locale, 'apiKeyInvalid'),
        });
        showToast('error', res.message || t(locale, 'apiKeyInvalid'));
      }
    } catch (err: any) {
      setKeyValidationStatus({
        tested: true,
        valid: false,
        message: err.message || t(locale, 'apiKeyInvalid'),
      });
      showToast('error', t(locale, 'apiKeyInvalid'));
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleRemoveKey = () => {
    clearGeminiApiKey();
    setApiKeyInput('');
    setKeyValidationStatus({ tested: false, valid: false });
    onApiKeyChange?.('');
    showToast('info', t(locale, 'apiKeyRemovedSuccess'));
  };

  const handleReset = () => {
    onClearLocalData();
    setApiKeyInput('');
    setKeyValidationStatus({ tested: false, valid: false });
    setResetConfirmOpen(false);
    showToast('success', t(locale, 'clearedSuccess'));
  };

  const isKeyActive = Boolean(
    apiKeyInput &&
    apiKeyInput.trim().length > 0 &&
    (keyValidationStatus.valid || capabilities?.status === 'connected')
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white font-khmer">
            {t(locale, 'settingsTitle')}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-khmer">{t(locale, 'settingsSubtitle')}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* APPEARANCE & THEME SECTION */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-khmer">
                {t(locale, 'themeSectionTitle')}
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-khmer">
            {t(locale, 'themeToggleDesc')}
          </p>

          <div className="grid grid-cols-3 gap-3 pt-1">
            {/* Light Mode */}
            <button
              type="button"
              onClick={() => onSelectTheme('light')}
              className={`p-3.5 rounded-xl border text-left flex flex-col sm:flex-row items-center sm:justify-between gap-2 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold font-khmer">{t(locale, 'themeLight')}</span>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => onSelectTheme('dark')}
              className={`p-3.5 rounded-xl border text-left flex flex-col sm:flex-row items-center sm:justify-between gap-2 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-semibold font-khmer">{t(locale, 'themeDark')}</span>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            </button>

            {/* System Default */}
            <button
              type="button"
              onClick={() => onSelectTheme('system')}
              className={`p-3.5 rounded-xl border text-left flex flex-col sm:flex-row items-center sm:justify-between gap-2 transition-all cursor-pointer ${
                theme === 'system'
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Laptop className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-xs font-semibold font-khmer">{t(locale, 'themeSystem')}</span>
              </div>
              {theme === 'system' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            </button>
          </div>
        </div>

        {/* GEMINI API KEY SECTION */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xs">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>{t(locale, 'apiKeySectionTitle')}</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                    <Sparkles className="w-3 h-3" />
                    AI Voices
                  </span>
                </h3>
              </div>
            </div>

            {/* Status indicator pill */}
            <div className="flex items-center">
              {isKeyActive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t(locale, 'apiKeyActiveStatus')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {t(locale, 'apiKeyNotSetStatus')}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {t(locale, 'apiKeySectionDesc')}
          </p>

          {/* Key Input & Actions */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    if (keyValidationStatus.tested) {
                      setKeyValidationStatus({ tested: false, valid: false });
                    }
                  }}
                  placeholder={t(locale, 'apiKeyPlaceholder')}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAndVerifyKey}
                  disabled={isValidatingKey || !apiKeyInput.trim()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:pointer-events-none shadow-xs transition-all cursor-pointer"
                >
                  {isValidatingKey ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t(locale, 'apiKeyTesting')}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t(locale, 'apiKeySaveBtn')}</span>
                    </>
                  )}
                </button>

                {getGeminiApiKey() && (
                  <button
                    type="button"
                    onClick={handleRemoveKey}
                    disabled={isValidatingKey}
                    className="px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
                    title={t(locale, 'apiKeyRemoveBtn')}
                  >
                    {t(locale, 'apiKeyRemoveBtn')}
                  </button>
                )}
              </div>
            </div>

            {/* Validation Feedback Message */}
            {keyValidationStatus.tested && (
              <div
                className={`p-3 rounded-xl flex items-start gap-2.5 text-xs transition-all ${
                  keyValidationStatus.valid
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {keyValidationStatus.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <span className="font-bold block">
                    {keyValidationStatus.valid ? t(locale, 'apiKeyValid') : t(locale, 'apiKeyInvalid')}
                  </span>
                  {keyValidationStatus.message && (
                    <span className="text-xs opacity-90 block">
                      {keyValidationStatus.message}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Help & Privacy Notes Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold hover:underline"
              >
                <span>{t(locale, 'apiKeyGetLink')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-400 dark:text-slate-400">
                {t(locale, 'apiKeyPrivacyNote')}
              </span>
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-khmer">
              {t(locale, 'languageSectionTitle')}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSelectLocale('km')}
              className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                locale === 'km'
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div>
                <span className="text-sm font-bold block">ភាសាខ្មែរ</span>
                <span className="text-xs text-slate-400 dark:text-slate-400">Khmer (Primary)</span>
              </div>
              {locale === 'km' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            </button>

            <button
              type="button"
              onClick={() => onSelectLocale('en')}
              className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                locale === 'en'
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div>
                <span className="text-sm font-bold block">English</span>
                <span className="text-xs text-slate-400 dark:text-slate-400">អង់គ្លេស</span>
              </div>
              {locale === 'en' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            </button>
          </div>
        </div>

        {/* Default Voice & Format Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              {t(locale, 'defaultVoiceSectionTitle')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Default Voice selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                {t(locale, 'voiceSelectLabel')}
              </label>
              <select
                value={defaultVoiceId}
                onChange={(e) => onSelectDefaultVoice(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {v.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Voice Style selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                {t(locale, 'voiceStyleLabel')}
              </label>
              <select
                value={defaultStyleId}
                onChange={(e) => onSelectDefaultStyle?.(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs"
              >
                {KHMER_VOICE_STYLES.map((style) => (
                  <option key={style.id} value={style.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {locale === 'km' ? style.nameKm : style.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Output format */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                {t(locale, 'preferredFormatTitle')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['wav', 'mp3'] as AudioFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => onSelectPreferredFormat(fmt)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all border cursor-pointer ${
                      preferredFormat === fmt
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Save Audio Option Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <HardDriveDownload className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>{t(locale, 'autoSaveTitle')}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                  Offline IndexedDB
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl leading-relaxed">
                {t(locale, 'autoSaveDesc')}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoSaveAudio}
              onChange={(e) => onToggleAutoSave?.(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Connected Provider Status Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              ព័ត៌មានម៉ាស៊ីនសំឡេង (Provider Status)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-slate-400 dark:text-slate-400">ម៉ាស៊ីនសំឡេងសកម្ម៖</span>
              <span className="font-bold text-slate-800 dark:text-white block">
                {capabilities?.providerName || 'Gemini Cloud Audio'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-slate-400 dark:text-slate-400">ចំនួនតួអក្សរអតិបរមា៖</span>
              <span className="font-bold text-slate-800 dark:text-white block">
                {capabilities?.maxCharacters || 5000} chars
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-slate-400 dark:text-slate-400">រយៈពេលរក្សាទុកបណ្តោះអាសន្ន៖</span>
              <span className="font-bold text-slate-800 dark:text-white block">
                {capabilities?.audioRetentionHours || 24} hours TTL
              </span>
            </div>
          </div>
        </div>

        {/* Privacy & Transparency */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-sm font-bold font-khmer">
              {t(locale, 'privacySectionTitle')}
            </h3>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-khmer leading-relaxed">
            {t(locale, 'privacyDesc1')}
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-khmer leading-relaxed">
            {t(locale, 'privacyDesc2')}
          </p>
        </div>

        {/* Local Storage Reset Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white font-khmer">
              {t(locale, 'localDataSectionTitle')}
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-khmer mt-0.5">
              លុបទិន្នន័យព្រាង កូនសោ API និងប្រវត្តិសំឡេងទាំងអស់ដែលបានរក្សាទុកលើ Browser នេះ
            </p>
          </div>
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 transition-colors font-khmer cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t(locale, 'clearLocalDataBtn')}</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="សម្អាតទិន្នន័យ Studio ទាំងអស់?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 font-khmer leading-relaxed">
            {t(locale, 'clearLocalDataConfirm')}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setResetConfirmOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-khmer cursor-pointer"
            >
              បោះបង់
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 font-khmer shadow-xs cursor-pointer"
            >
              សម្អាតទាំងអស់
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
