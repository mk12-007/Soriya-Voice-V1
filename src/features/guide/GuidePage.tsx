import React from 'react';
import { BookOpen, Sparkles, CheckCircle2, Shield, Code2, Volume2, HelpCircle } from 'lucide-react';
import { AppLocale } from '../../../shared/types';
import { t } from '../../lib/translations';

interface GuidePageProps {
  locale: AppLocale;
}

export const GuidePage: React.FC<GuidePageProps> = ({ locale }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white font-khmer">
            {t(locale, 'guideTitle')}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-khmer">{t(locale, 'guideSubtitle')}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <span className="text-lg font-bold font-khmer">។</span>
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-khmer">
              {t(locale, 'tip1Title')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-khmer leading-relaxed">
              {t(locale, 'tip1Desc')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-khmer">
              {t(locale, 'tip2Title')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-khmer leading-relaxed">
              {t(locale, 'tip2Desc')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-khmer">
              {t(locale, 'tip3Title')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-khmer leading-relaxed">
              {t(locale, 'tip3Desc')}
            </p>
          </div>
        </div>

        {/* Detailed Best Practices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-800 dark:text-white font-khmer">
            គន្លឹះសរសេរអត្ថបទសម្រាប់ TTS (Best Practices)
          </h3>

          <div className="space-y-4 text-xs font-khmer leading-relaxed text-slate-700 dark:text-slate-300">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>១. លេខខ្មែរ និងលេខអារ៉ាប់ (Khmer & Arabic Digits)</span>
              </h4>
              <p>
                ម៉ាស៊ីនសំឡេងគាំទ្រទាំងលេខខ្មែរ (០ ១ ២ ៣...) និងលេខអារ៉ាប់ (0 1 2 3...)។
                សម្រាប់ការអានកាលបរិច្ឆេទ ឬម៉ោងឱ្យកាន់តែច្បាស់
                ការសរសេរជាពាក្យពេញដូចជា "ម៉ោង ៨ និង ៣០ នាទី" នឹងផ្តល់នូវការបញ្ចេញសំឡេងធម្មជាតិបំផុត។
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>២. សញ្ញាលេខទោ (ៗ) និងសញ្ញាឧទាន (!)</span>
              </h4>
              <p>
                សញ្ញាលេខទោ (ៗ) ជួយឱ្យម៉ាស៊ីនដឹងពីការអានពាក្យដដែលៗដូចជា "បន្តិចម្តងៗ" ឬ "រឿយៗ"
                ដោយមិនចាំបាច់សរសេរពាក្យពីរដងឡើយ។
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>៣. ជើងអក្សរ និងព្យញ្ជនៈផ្សំ (Subscript Coeng ្)</span>
              </h4>
              <p>
                Soriya Voice ត្រួតពិនិត្យ និងរៀបចំអក្សរតាមស្តង់ដារ Unicode Canonical Composition (NFC)
                ដើម្បីការពារបញ្ហាជើងអក្សរច្រឡំទីតាំង ដែលធ្លាប់កើតមាននៅលើពុម្ពអក្សរចាស់ៗ (Legacy Fonts)។
              </p>
            </div>
          </div>
        </div>

        {/* Developer Integration & Environment Variables */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-6 shadow-sm space-y-4 border border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold">
              Server Architecture & Provider Configuration
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Soriya Voice utilizes a decoupled provider architecture. Configure the speech provider via environment variables:
          </p>
          <div className="bg-black/50 p-3.5 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto border border-white/5">
            <code>
              TTS_PROVIDER=gemini<br />
              GEMINI_API_KEY=YOUR_GEMINI_API_KEY<br />
              TTS_MAX_CHARACTERS_PER_REQUEST=5000<br />
              TTS_AUDIO_RETENTION_HOURS=24
            </code>
          </div>
          <p className="text-xs text-slate-400">
            All synthesis requests are handled through the secure server-side endpoint <span className="text-white font-mono">POST /api/tts</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
