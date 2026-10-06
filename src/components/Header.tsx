import React from 'react';
import {
  Mic,
  FolderHeart,
  Settings,
  BookOpen,
  Globe,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Sun,
  Moon,
} from 'lucide-react';
import { AppLocale, AppTheme, ProviderCapabilities } from '../../shared/types';
import { t } from '../lib/translations';
import { SoriyaLogo } from './SoriyaLogo';

interface HeaderProps {
  currentTab: 'studio' | 'library' | 'settings' | 'guide';
  onSelectTab: (tab: 'studio' | 'library' | 'settings' | 'guide') => void;
  locale: AppLocale;
  onToggleLocale: (newLocale: AppLocale) => void;
  theme: AppTheme;
  onToggleTheme: (newTheme: AppTheme) => void;
  capabilities: ProviderCapabilities | null;
  savedItemCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  locale,
  onToggleLocale,
  theme,
  onToggleTheme,
  capabilities,
  savedItemCount,
}) => {
  const isDemo = capabilities?.status === 'demo';
  const isDesktop =
    typeof window !== 'undefined' &&
    (Boolean((window as any).electronAPI?.isDesktop) || navigator.userAgent.includes('Electron'));

  const handleCycleTheme = () => {
    if (theme === 'light') onToggleTheme('dark');
    else if (theme === 'dark') onToggleTheme('light');
    else {
      // If currently system, toggle based on current DOM state
      const isDark = document.documentElement.classList.contains('dark');
      onToggleTheme(isDark ? 'light' : 'dark');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-all app-drag-region">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 gap-3 lg:gap-4 ${isDesktop ? 'pl-20' : ''}`}>
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none app-no-drag group shrink-0"
            onClick={() => onSelectTab('studio')}
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0 p-2">
              <SoriyaLogo className="w-full h-full text-white" variant="white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5 whitespace-nowrap">
                  Soriya <span className="text-indigo-600 dark:text-indigo-400">Voice</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 uppercase tracking-wider shrink-0">
                  {isDesktop ? 'macOS' : 'TTS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 hidden xl:block whitespace-nowrap">
                {t(locale, 'tagline')}
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/60 app-no-drag shrink-0">
            <button
              id="nav-studio-btn"
              type="button"
              onClick={() => onSelectTab('studio')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer select-none shrink-0 ${
                currentTab === 'studio'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-medium'
              }`}
            >
              <Mic className="w-4 h-4 shrink-0" />
              <span>{t(locale, 'navStudio')}</span>
            </button>

            <button
              id="nav-library-btn"
              type="button"
              onClick={() => onSelectTab('library')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer select-none shrink-0 ${
                currentTab === 'library'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-medium'
              }`}
            >
              <FolderHeart className="w-4 h-4 shrink-0" />
              <span>{t(locale, 'navLibrary')}</span>
              {savedItemCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                  {savedItemCount}
                </span>
              )}
            </button>

            <button
              id="nav-settings-btn"
              type="button"
              onClick={() => onSelectTab('settings')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer select-none shrink-0 ${
                currentTab === 'settings'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-medium'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>{t(locale, 'navSettings')}</span>
            </button>

            <button
              id="nav-guide-btn"
              type="button"
              onClick={() => onSelectTab('guide')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer select-none shrink-0 ${
                currentTab === 'guide'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-medium'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>{t(locale, 'navGuide')}</span>
            </button>
          </nav>

          {/* Right Header Status, Theme & Language Toggle */}
          <div className="flex items-center gap-2 app-no-drag shrink-0">
            {/* Status Pill Badge */}
            <div className="hidden lg:flex items-center">
              {isDemo ? (
                <div
                  className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 whitespace-nowrap shrink-0"
                  title="Demo synthesis fallback active"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{t(locale, 'providerStatusDemo')}</span>
                </div>
              ) : (
                <div
                  className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 whitespace-nowrap shrink-0"
                  title="Cloud Gemini AI Active"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t(locale, 'providerStatusConnected')}</span>
                </div>
              )}
            </div>

            {/* Quick Dark/Light Theme Switcher Button */}
            <button
              type="button"
              onClick={handleCycleTheme}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center cursor-pointer shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 transition-transform -rotate-12 hover:rotate-0" />
              )}
            </button>

            {/* Bilingual Switcher */}
            <div className="h-9 inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0 gap-0.5">
              <button
                type="button"
                onClick={() => onToggleLocale('km')}
                className={`h-7 px-2.5 sm:px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                  locale === 'km'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Khmer
              </button>
              <button
                type="button"
                onClick={() => onToggleLocale('en')}
                className={`h-7 px-2.5 sm:px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                  locale === 'en'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sub-navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2 app-no-drag">
        <button
          type="button"
          onClick={() => onSelectTab('studio')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-all ${
            currentTab === 'studio' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span className="whitespace-nowrap">{t(locale, 'navStudio')}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('library')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium relative transition-all ${
            currentTab === 'library' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FolderHeart className="w-4 h-4" />
          <span className="whitespace-nowrap">{t(locale, 'navLibrary')}</span>
          {savedItemCount > 0 && (
            <span className="absolute top-0 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
              {savedItemCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-all ${
            currentTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="whitespace-nowrap">{t(locale, 'navSettings')}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('guide')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-all ${
            currentTab === 'guide' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="whitespace-nowrap">{t(locale, 'navGuide')}</span>
        </button>
      </div>
    </header>
  );
};
