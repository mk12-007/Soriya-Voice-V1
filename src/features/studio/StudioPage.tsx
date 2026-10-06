import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  Clipboard,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Volume2,
  Play,
  Square,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  Shield,
  Binary,
  Eraser,
  FileUp,
  Undo2,
  Check,
  Gauge,
  Clock,
  FileText,
} from 'lucide-react';
import { SoriyaLogo } from '../../components/SoriyaLogo';
import {
  AppLocale,
  AudioFormat,
  AudioHistoryItem,
  ProviderCapabilities,
  SynthesisResult,
  TtsStatus,
  VoiceOption,
} from '../../../shared/types';
import {
  cleanKhmerDoubleSpaces,
  convertKhmerDigits,
  getTextStats,
  normalizeKhmerInput,
} from '../../lib/khmerText';
import { synthesizeSpeech } from '../../services/api';
import { getAutoSaveAudio, getStudioDraft, saveStudioDraft } from '../../lib/storage';
import { fetchAndCacheAudio } from '../../lib/audioCache';
import { t } from '../../lib/translations';
import { AudioPlayer } from './AudioPlayer';
import { VoiceSelector } from './VoiceSelector';
import { VoiceStyleSelector } from './VoiceStyleSelector';

interface StudioPageProps {
  voices: VoiceOption[];
  capabilities: ProviderCapabilities | null;
  locale: AppLocale;
  onSaveToLibrary: (item: AudioHistoryItem) => void;
  onRefreshCapabilities?: () => void;
  initialText?: string;
  initialVoiceId?: string;
  initialStyleId?: string;
  initialFormat?: AudioFormat;
  onDraftTextChange?: (text: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const StudioPage: React.FC<StudioPageProps> = ({
  voices,
  capabilities,
  locale,
  onSaveToLibrary,
  onRefreshCapabilities,
  initialText = '',
  initialVoiceId,
  initialStyleId = 'natural',
  initialFormat = 'mp3',
  onDraftTextChange,
  showToast,
}) => {
  // Input Text State
  const [text, setText] = useState<string>(() => {
    const savedDraft = getStudioDraft();
    if (savedDraft !== null && savedDraft !== undefined && savedDraft.length > 0) {
      return savedDraft;
    }
    if (initialText) return initialText;
    if (typeof window !== 'undefined' && localStorage.getItem('soriya_studio_draft_v1') !== null) {
      return '';
    }
    return '';
  });

  // Undo memory
  const [lastClearedText, setLastClearedText] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showNormalizationInspector, setShowNormalizationInspector] = useState(false);

  // Voice Controls State
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    initialVoiceId || voices[0]?.id || 'voice-soriya-kore'
  );
  const [selectedStyleId, setSelectedStyleId] = useState<string>(
    initialStyleId || 'natural'
  );
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [outputFormat, setOutputFormat] = useState<AudioFormat>(initialFormat);
  const [addParagraphPauses, setAddParagraphPauses] = useState<boolean>(true);

  // Synthesis & Result State
  const [status, setStatus] = useState<TtsStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentResult, setCurrentResult] = useState<SynthesisResult | null>(null);
  const [isSavedInLibrary, setIsSavedInLibrary] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sticky Bar visibility trigger
  const [isScrolledPast, setIsScrolledPast] = useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Max characters limit from server or default
  const maxLimit = capabilities?.maxCharacters || 5000;
  const stats = getTextStats(text, maxLimit);
  const normalization = normalizeKhmerInput(text);

  // Real-time character counter metrics
  const charPercent = Math.min(100, Math.round((stats.characters / maxLimit) * 100));
  const charsRemaining = maxLimit - stats.characters;
  const isNearLimit = charPercent >= 80 && !stats.hasExcessiveLength;
  const isOverLimit = stats.hasExcessiveLength;

  // Sync initial voice ID if voices load later
  useEffect(() => {
    if (voices.length > 0 && !voices.some((v) => v.id === selectedVoiceId)) {
      setSelectedVoiceId(voices[0].id);
    }
  }, [voices, selectedVoiceId]);

  // Sync initialText if passed externally from library
  useEffect(() => {
    if (initialText && initialText !== text) {
      setText(initialText);
      saveStudioDraft(initialText);
      if (onDraftTextChange) {
        onDraftTextChange(initialText);
      }
    }
  }, [initialText]);

  // Persist draft on every text change
  useEffect(() => {
    saveStudioDraft(text);
    if (onDraftTextChange) {
      onDraftTextChange(text);
    }
  }, [text]);

  // Detect scroll position for sticky generate bar
  useEffect(() => {
    const handleScroll = () => {
      if (editorRef.current) {
        const rect = editorRef.current.getBoundingClientRect();
        setIsScrolledPast(rect.bottom < 150);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Text Handlers & Tools
  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
        showToast('info', locale === 'km' ? 'បានបិទភ្ជាប់អត្ថបទដោយជោគជ័យ' : 'Pasted text from clipboard');
      }
    } catch {
      showToast('error', 'មិនអាចបិទភ្ជាប់អត្ថបទបានទេ។ សូមប្រើ Ctrl+V ឬ Command+V');
    }
  };

  const handleClear = () => {
    if (text) {
      setLastClearedText(text);
      setText('');
      saveStudioDraft('');
      if (onDraftTextChange) {
        onDraftTextChange('');
      }
      setCurrentResult(null);
      setIsSavedInLibrary(false);
      showToast('info', t(locale, 'clearBtn'));
    }
  };

  const handleUndoClear = () => {
    if (lastClearedText) {
      setText(lastClearedText);
      setLastClearedText(null);
      showToast('success', t(locale, 'undoClearToast'));
    }
  };

  const handleTrimToLimit = () => {
    if (text.length > maxLimit) {
      const trimmed = text.slice(0, maxLimit);
      setText(trimmed);
      showToast('info', t(locale, 'trimSuccessToast').replace('%d', maxLimit.toLocaleString()));
    }
  };

  // Convert digits tool
  const handleToggleDigits = (toKhmer: boolean) => {
    const converted = convertKhmerDigits(text, toKhmer);
    setText(converted);
    showToast('success', t(locale, 'digitsConvertedToast'));
  };

  // Clean double-spaces tool
  const handleCleanSpaces = () => {
    const cleaned = cleanKhmerDoubleSpaces(text);
    setText(cleaned);
    showToast('success', t(locale, 'spacesCleanedToast'));
  };

  // Drag & drop file import
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        if (content) {
          setText(content);
          showToast('success', t(locale, 'fileImportedToast'));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        if (content) {
          setText(content);
          showToast('success', t(locale, 'fileImportedToast'));
        }
      };
      reader.readAsText(file);
    }
  };

  // Primary Synthesis Trigger
  const handleGenerate = async () => {
    if (!text.trim()) {
      showToast('error', t(locale, 'errorEmptyText'));
      return;
    }

    if (stats.hasExcessiveLength) {
      showToast('error', t(locale, 'errorTooLong').replace('%d', maxLimit.toString()));
      return;
    }

    // Step 1: Validating
    setStatus('validating');
    setStatusMessage(t(locale, 'stageValidating'));

    // Step 2: Preparing text
    setTimeout(() => {
      setStatus('preparing_text');
      setStatusMessage(t(locale, 'stagePreparing'));
    }, 200);

    abortControllerRef.current = new AbortController();

    try {
      setTimeout(() => {
        setStatus('synthesizing');
        setStatusMessage(t(locale, 'stageSynthesizing'));
      }, 500);

      const result = await synthesizeSpeech(
        {
          text,
          controls: {
            voiceId: selectedVoiceId,
            style: selectedStyleId,
            rate,
            pitch,
            outputFormat,
            addParagraphPauses,
          },
          locale: 'km-KH',
        },
        abortControllerRef.current.signal
      );

      setCurrentResult(result);
      setStatus('ready');
      setStatusMessage('');

      const autoSave = getAutoSaveAudio();
      if (autoSave) {
        const historyItem: AudioHistoryItem = {
          id: result.jobId,
          title: normalization.normalizedText.substring(0, 40) || 'Khmer Voice Recording',
          createdAt: new Date().toISOString(),
          voiceId: result.voiceId,
          voiceName: result.voiceName,
          style: result.style || selectedStyleId,
          sourcePreview: normalization.normalizedText.substring(0, 120),
          fullText: normalization.normalizedText,
          durationSeconds: result.durationSeconds,
          format: result.format,
          audioUrl: result.audioUrl,
          status: 'ready',
          characterCount: result.characterCount,
          fileSizeBytes: result.fileSizeBytes,
        };

        onSaveToLibrary(historyItem);
        setIsSavedInLibrary(true);
        fetchAndCacheAudio(result.jobId, result.audioUrl).catch(() => {});
        showToast(
          'success',
          locale === 'km'
            ? 'សំឡេងត្រូវបានបង្កើត និងរក្សាទុកក្នុងបណ្ណាល័យ!'
            : 'Speech generated and auto-saved to My Audio!'
        );
      } else {
        setIsSavedInLibrary(false);
        showToast('success', locale === 'km' ? 'សំឡេងត្រូវបានបង្កើតរួចរាល់!' : 'Speech generated successfully!');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStatus('cancelled');
        showToast('info', t(locale, 'errorCancelled'));
      } else {
        setStatus('error');
        showToast('error', err.message || t(locale, 'errorGeneral'));
      }
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus('idle');
      setStatusMessage('');
    }
  };

  const handleSaveToLibrary = () => {
    if (!currentResult) return;

    const historyItem: AudioHistoryItem = {
      id: currentResult.jobId,
      title: normalization.normalizedText.substring(0, 40) || 'Khmer Voice Recording',
      createdAt: new Date().toISOString(),
      voiceId: currentResult.voiceId,
      voiceName: currentResult.voiceName,
      style: currentResult.style || selectedStyleId,
      sourcePreview: normalization.normalizedText.substring(0, 120),
      fullText: normalization.normalizedText,
      durationSeconds: currentResult.durationSeconds,
      format: currentResult.format,
      audioUrl: currentResult.audioUrl,
      status: 'ready',
      characterCount: currentResult.characterCount,
      fileSizeBytes: currentResult.fileSizeBytes,
    };

    onSaveToLibrary(historyItem);
    setIsSavedInLibrary(true);
    fetchAndCacheAudio(currentResult.jobId, currentResult.audioUrl).catch(() => {});
    showToast('success', t(locale, 'savedToLibrarySuccess'));
  };

  const isGenerating =
    status === 'validating' || status === 'preparing_text' || status === 'synthesizing';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.text"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Text Editor Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-5" ref={editorRef}>
          {/* Editor Card */}
          <div
            className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-5 sm:p-6 space-y-4 transition-all ${
              isDragOver
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
          >
            {/* Action toolbar above textarea */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-khmer flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t(locale, 'inputLabel')}</span>
                </h2>

                {/* Real-time character badge in toolbar */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
                    isOverLimit
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 ring-1 ring-rose-200 font-bold animate-pulse'
                      : isNearLimit
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                  title={`${stats.characters} of ${maxLimit} max characters`}
                >
                  <span>
                    {stats.characters.toLocaleString()} / {maxLimit.toLocaleString()}
                  </span>
                  <span className="text-[11px] opacity-75">
                    ({charPercent}%)
                  </span>
                </div>
              </div>

              {/* Top Editor Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Import File Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  title="Import .txt or .md file"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{locale === 'km' ? 'នាំចូលឯកសារ' : 'Import'}</span>
                </button>

                {/* Paste from Clipboard */}
                <button
                  type="button"
                  onClick={handlePaste}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t(locale, 'pasteBtn')}</span>
                </button>

                {/* Undo Clear Button */}
                {lastClearedText && (
                  <button
                    type="button"
                    onClick={handleUndoClear}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition-all cursor-pointer"
                    title={t(locale, 'undoClearBtn')}
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>{t(locale, 'undoClearBtn')}</span>
                  </button>
                )}

                {/* Clear Text Button */}
                {text && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                    title={t(locale, 'clearBtn')}
                    aria-label="Clear text input"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Khmer Textarea with Drag & Drop */}
            <div className="relative space-y-2">
              <textarea
                id="khmer-text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (!isGenerating && text.trim() && !stats.hasExcessiveLength) {
                      handleGenerate();
                    }
                  }
                }}
                placeholder={t(locale, 'inputPlaceholder')}
                rows={8}
                className={`w-full text-base sm:text-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent border-0 focus:ring-0 resize-y p-0 leading-relaxed tracking-normal focus:outline-none transition-colors ${
                  isOverLimit ? 'text-rose-950 dark:text-rose-300 selection:bg-rose-200' : ''
                }`}
                style={{ minHeight: '200px' }}
              />

              {/* Text Transformation Quick Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Clean Double Spaces */}
                  <button
                    type="button"
                    onClick={handleCleanSpaces}
                    disabled={!text}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-40"
                    title={t(locale, 'cleanSpacesBtn')}
                  >
                    <Eraser className="w-3 h-3 text-indigo-500" />
                    <span>{locale === 'km' ? 'សម្អាតចន្លោះ' : 'Clean Spaces'}</span>
                  </button>

                  {/* Convert Digits to Khmer (0-9 -> ០-៩) */}
                  <button
                    type="button"
                    onClick={() => handleToggleDigits(true)}
                    disabled={!text}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-40"
                    title={t(locale, 'convertDigitsToKhmer')}
                  >
                    <Binary className="w-3 h-3 text-indigo-500" />
                    <span>0-9 ➔ ០-៩</span>
                  </button>

                  {/* Convert Digits to Western (០-៩ -> 0-9) */}
                  <button
                    type="button"
                    onClick={() => handleToggleDigits(false)}
                    disabled={!text}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-40"
                    title={t(locale, 'convertDigitsToWestern')}
                  >
                    <Binary className="w-3 h-3 text-slate-400" />
                    <span>០-៩ ➔ 0-9</span>
                  </button>
                </div>

                {/* Auto-Saved status */}
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium select-none">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{locale === 'km' ? 'រក្សាទុកស្វ័យប្រវត្តិ' : 'Auto-saved'}</span>
                </div>
              </div>
            </div>

            {/* Real-Time Linear Progress Indicator */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ease-out rounded-full ${
                  isOverLimit
                    ? 'bg-rose-500 w-full'
                    : isNearLimit
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500'
                }`}
                style={{ width: isOverLimit ? '100%' : `${charPercent}%` }}
              />
            </div>

            {/* Over-Limit Alert Banner with Quick Trim Action */}
            {isOverLimit && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in duration-150">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">
                      {t(locale, 'limitExceededWarning').replace('%d', maxLimit.toLocaleString())}
                    </p>
                    <p className="text-rose-600 dark:text-rose-400 text-xs">
                      {locale === 'km'
                        ? `អត្ថបទរបស់អ្នកមាន ${stats.characters.toLocaleString()} តួអក្សរ (លើស ${(stats.characters - maxLimit).toLocaleString()} តួអក្សរ)។`
                        : `Your text has ${stats.characters.toLocaleString()} characters (${(stats.characters - maxLimit).toLocaleString()} over the limit).`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTrimToLimit}
                  className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-lg font-semibold text-xs bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs cursor-pointer"
                >
                  {t(locale, 'trimToLimitBtn')} ({maxLimit.toLocaleString()})
                </button>
              </div>
            )}

            {/* Metrics & Unicode Status Line */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <strong className="text-slate-700 dark:text-slate-200">{stats.characters.toLocaleString()}</strong> chars
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-700 dark:text-slate-200">{stats.paragraphs}</strong> {t(locale, 'paragraphCount')}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  ~<strong className="text-slate-700 dark:text-slate-200">{stats.readingTimeSecondsEstimate}</strong>s
                </span>
                <span>•</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  {(normalization.khmerCharRatio * 100).toFixed(0)}% Khmer script
                </span>
              </div>

              {/* Normalization Indicator Toggle */}
              <button
                type="button"
                onClick={() => setShowNormalizationInspector(!showNormalizationInspector)}
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium cursor-pointer text-xs"
              >
                <span>
                  {showNormalizationInspector
                    ? t(locale, 'hidePreparedText')
                    : t(locale, 'viewPreparedText')}
                </span>
                {showNormalizationInspector ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Collapsible Normalization Inspector */}
            {showNormalizationInspector && (
              <div className="p-4 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <Shield className="w-4 h-4" />
                    <span>Unicode NFC & Text Safety</span>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Khmer Ratio: {(normalization.khmerCharRatio * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      {t(locale, 'originalTextLabel')} ({normalization.originalLength} chars):
                    </span>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 max-h-24 overflow-y-auto whitespace-pre-wrap">
                      {text || '—'}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      {t(locale, 'preparedTextLabel')} ({normalization.normalizedLength} chars):
                    </span>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-100 max-h-24 overflow-y-auto whitespace-pre-wrap">
                      {normalization.normalizedText || '—'}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <span className="font-semibold">{t(locale, 'normalizationDiffs')}</span>
                  {normalization.changesMade.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                      {normalization.changesMade.map((change, i) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-emerald-700 dark:text-emerald-400">
                      ✓ {t(locale, 'noNormalizationChanges')}
                    </p>
                  )}
                </div>

                {!normalization.isKhmerScript && text.trim().length > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-amber-800 dark:text-amber-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{t(locale, 'nonKhmerWarning')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Primary Synthesis Action Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-3 w-full">
              {/* Primary Generate Voice Button (Full width & Large) */}
              <button
                id="generate-voice-btn"
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim() || stats.hasExcessiveLength}
                className={`flex-1 flex items-center justify-center gap-3 py-3.5 sm:py-4 px-6 rounded-xl font-bold text-base sm:text-lg text-white shadow-md font-khmer transition-all transform cursor-pointer ${
                  isGenerating || !text.trim() || stats.hasExcessiveLength
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 shadow-indigo-500/25 active:scale-[0.99]'
                }`}
                title="Convert text to speech (⌘ + Enter)"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{statusMessage || t(locale, 'generatingBtn')}</span>
                  </>
                ) : (
                  <>
                    <SoriyaLogo className="w-5 h-5 text-white shrink-0" variant="white" />
                    <span>{t(locale, 'generateBtn')}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-white/20 text-white font-medium ml-1">
                      ⌘↵
                    </span>
                  </>
                )}
              </button>

              {/* Cancel Button during active generation */}
              {isGenerating && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-semibold font-khmer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                >
                  {t(locale, 'cancelBtn')}
                </button>
              )}
            </div>
          </div>

          {/* Generated Result Audio Player Surface */}
          {currentResult && (
            <AudioPlayer
              result={currentResult}
              locale={locale}
              onSaveToLibrary={handleSaveToLibrary}
              onRegenerate={handleGenerate}
              isSaved={isSavedInLibrary}
            />
          )}
        </div>

        {/* Right Column: Voice & Speech Settings (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-khmer flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{t(locale, 'voiceSettingsTitle')}</span>
              </h3>
            </div>

            {/* Voice Selection */}
            <VoiceSelector
              voices={voices}
              selectedVoiceId={selectedVoiceId}
              onSelectVoice={(id) => setSelectedVoiceId(id)}
              locale={locale}
              disabled={isGenerating}
            />

            {/* Voice Style Selection */}
            <VoiceStyleSelector
              selectedStyleId={selectedStyleId}
              onSelectStyle={(id) => setSelectedStyleId(id)}
              locale={locale}
              disabled={isGenerating}
            />

            {/* Speaking Rate Slider & Presets */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-khmer">
                  <Gauge className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t(locale, 'speedLabel')}</span>
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{rate.toFixed(2)}×</span>
              </div>

              {/* Quick speed preset chips */}
              <div className="flex items-center gap-1.5">
                {[0.8, 1.0, 1.2, 1.5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRate(preset)}
                    className={`flex-1 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      rate === preset
                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {preset}×
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                aria-label="Speaking rate slider"
              />
            </div>

            {/* Natural Paragraph Pauses Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-start gap-3 cursor-pointer font-khmer">
                <input
                  type="checkbox"
                  checked={addParagraphPauses}
                  onChange={(e) => setAddParagraphPauses(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                />
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {t(locale, 'paragraphPausesLabel')}
                  </span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {t(locale, 'paragraphPausesHint')}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Floating / Sticky Quick Action Bar when scrolled past editor */}
      {isScrolledPast && text.trim() && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 dark:bg-slate-950/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/60 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 text-xs font-medium font-khmer">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{stats.characters} chars</span>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || stats.hasExcessiveLength}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-khmer bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md"
          >
            {isGenerating ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SoriyaLogo className="w-3.5 h-3.5 text-white" variant="white" />
            )}
            <span>{t(locale, 'generateBtn')}</span>
            <kbd className="text-[10px] font-mono bg-white/20 px-1 py-0.2 rounded">⌘↵</kbd>
          </button>
        </div>
      )}
    </div>
  );
};
