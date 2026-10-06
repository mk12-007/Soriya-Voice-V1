import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  Mic,
  FolderHeart,
  Settings,
  BookOpen,
  Sun,
  Moon,
  Globe,
  Sparkles,
  Volume2,
  FileText,
  Binary,
  Eraser,
  CornerDownLeft,
  X,
} from 'lucide-react';
import { AppLocale, AppTheme, SampleTextItem, VoiceOption } from '../../shared/types';
import { t } from '../lib/translations';
import { KHMER_SAMPLE_TEXTS } from '../lib/khmerText';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  locale: AppLocale;
  theme: AppTheme;
  onSelectTab: (tab: 'studio' | 'library' | 'settings' | 'guide') => void;
  onToggleLocale: (newLocale: AppLocale) => void;
  onToggleTheme: (newTheme: AppTheme) => void;
  voices: VoiceOption[];
  onSelectVoice: (voiceId: string) => void;
  onSelectSampleText: (sample: SampleTextItem) => void;
  onConvertDigits: () => void;
  onCleanSpaces: () => void;
}

interface PaletteAction {
  id: string;
  category: 'nav' | 'action' | 'voice' | 'sample';
  categoryLabel: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badge?: string;
  shortcut?: string;
  perform: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  locale,
  theme,
  onSelectTab,
  onToggleLocale,
  onToggleTheme,
  voices,
  onSelectVoice,
  onSelectSampleText,
  onConvertDigits,
  onCleanSpaces,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build list of all searchable actions
  const allActions: PaletteAction[] = [
    // Navigation
    {
      id: 'nav-studio',
      category: 'nav',
      categoryLabel: t(locale, 'navigationTitle'),
      title: t(locale, 'navStudio'),
      subtitle: locale === 'km' ? 'ផ្ទាំងសរសេរ និងបង្កើតសំឡេង' : 'Khmer Voice Generator & Studio',
      icon: Mic,
      shortcut: '⌘1',
      perform: () => {
        onSelectTab('studio');
        onClose();
      },
    },
    {
      id: 'nav-library',
      category: 'nav',
      categoryLabel: t(locale, 'navigationTitle'),
      title: t(locale, 'navLibrary'),
      subtitle: locale === 'km' ? 'ឯកសារសំឡេងដែលបានរក្សាទុក' : 'Saved Khmer Audio Files',
      icon: FolderHeart,
      shortcut: '⌘2',
      perform: () => {
        onSelectTab('library');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      category: 'nav',
      categoryLabel: t(locale, 'navigationTitle'),
      title: t(locale, 'navSettings'),
      subtitle: locale === 'km' ? 'កូនសោ API, រចនាប័ទ្ម និងការកំណត់' : 'API Key, Voice Settings & Theme',
      icon: Settings,
      shortcut: '⌘3',
      perform: () => {
        onSelectTab('settings');
        onClose();
      },
    },
    {
      id: 'nav-guide',
      category: 'nav',
      categoryLabel: t(locale, 'navigationTitle'),
      title: t(locale, 'navGuide'),
      subtitle: locale === 'km' ? 'គន្លឹះសរសេរអត្ថបទ និង Unicode NFC' : 'Khmer TTS Tips & Best Practices',
      icon: BookOpen,
      shortcut: '⌘4',
      perform: () => {
        onSelectTab('guide');
        onClose();
      },
    },

    // Quick Tools
    {
      id: 'action-convert-digits',
      category: 'action',
      categoryLabel: t(locale, 'quickActionsTitle'),
      title: t(locale, 'convertDigitsToKhmer'),
      subtitle: locale === 'km' ? 'បំប្លែងលេខ 0-9 ទៅជា ០-៩' : 'Convert 0-9 to Khmer numerals ០-៩',
      icon: Binary,
      perform: () => {
        onConvertDigits();
        onClose();
      },
    },
    {
      id: 'action-clean-spaces',
      category: 'action',
      categoryLabel: t(locale, 'quickActionsTitle'),
      title: t(locale, 'cleanSpacesBtn'),
      subtitle: locale === 'km' ? 'សម្អាតចន្លោះទំនេរដដែលៗ' : 'Normalize redundant spaces',
      icon: Eraser,
      perform: () => {
        onCleanSpaces();
        onClose();
      },
    },
    {
      id: 'action-toggle-theme',
      category: 'action',
      categoryLabel: t(locale, 'quickActionsTitle'),
      title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: theme === 'dark' ? 'ប្តូរទៅផ្ទៃភ្លឺ' : 'ប្តូរទៅផ្ទៃងងឹត',
      icon: theme === 'dark' ? Sun : Moon,
      perform: () => {
        onToggleTheme(theme === 'dark' ? 'light' : 'dark');
        onClose();
      },
    },
    {
      id: 'action-toggle-locale',
      category: 'action',
      categoryLabel: t(locale, 'quickActionsTitle'),
      title: locale === 'km' ? 'Switch to English' : 'ប្តូរជាភាសាខ្មែរ (Khmer)',
      subtitle: 'Change interface language',
      icon: Globe,
      perform: () => {
        onToggleLocale(locale === 'km' ? 'en' : 'km');
        onClose();
      },
    },

    // Voices
    ...voices.map((v) => ({
      id: `voice-${v.id}`,
      category: 'voice' as const,
      categoryLabel: t(locale, 'voiceOptionsTitle'),
      title: v.displayName,
      subtitle: v.description || (v.gender === 'female' ? t(locale, 'voiceInfoFemale') : t(locale, 'voiceInfoMale')),
      icon: Volume2,
      badge: v.accent || (v.gender === 'female' ? 'Female' : 'Male'),
      perform: () => {
        onSelectVoice(v.id);
        onSelectTab('studio');
        onClose();
      },
    })),

    // Sample Texts
    ...KHMER_SAMPLE_TEXTS.map((sample) => ({
      id: `sample-${sample.id}`,
      category: 'sample' as const,
      categoryLabel: t(locale, 'sampleTextsTitle'),
      title: locale === 'km' ? sample.titleKm : sample.titleEn,
      subtitle: sample.text.substring(0, 75) + '...',
      icon: FileText,
      badge: sample.category,
      perform: () => {
        onSelectSampleText(sample);
        onSelectTab('studio');
        onClose();
      },
    })),
  ];

  // Filter actions
  const filteredActions = allActions.filter((action) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      action.title.toLowerCase().includes(q) ||
      (action.subtitle && action.subtitle.toLowerCase().includes(q)) ||
      action.categoryLabel.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation inside command palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].perform();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Keep selected item in view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={t(locale, 'cmdPalettePlaceholder')}
            className="flex-1 bg-transparent border-0 text-sm sm:text-base font-khmer text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-khmer text-xs sm:text-sm">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-500" />
              <p>{t(locale, 'cmdPaletteNoResults')}</p>
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = action.icon;

              return (
                <div
                  key={action.id}
                  onClick={() => action.perform()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold font-khmer truncate">
                          {action.title}
                        </span>
                        {action.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                            {action.badge}
                          </span>
                        )}
                      </div>
                      {action.subtitle && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate leading-tight mt-0.5">
                          {action.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {action.shortcut ? (
                      <kbd className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {action.shortcut}
                      </kbd>
                    ) : isSelected ? (
                      <CornerDownLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint Bar */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-khmer">
          <div className="flex items-center gap-3">
            <span>↑↓ ដើម្បីរំកិល (Navigate)</span>
            <span>↵ ដើម្បីជ្រើសរើស (Select)</span>
          </div>
          <span>Soriya Voice Quick Palette</span>
        </div>
      </div>
    </div>
  );
};
