import React from 'react';
import {
  Sparkles,
  BookOpen,
  Radio,
  GraduationCap,
  Zap,
  Heart,
  Music,
  Check,
  Layers,
} from 'lucide-react';
import { AppLocale, VoiceStyleOption } from '../../../shared/types';
import { KHMER_VOICE_STYLES } from '../../lib/voiceStyles';
import { t } from '../../lib/translations';

interface VoiceStyleSelectorProps {
  selectedStyleId: string;
  onSelectStyle: (styleId: string) => void;
  locale: AppLocale;
  disabled?: boolean;
}

const STYLE_ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  BookOpen,
  Radio,
  GraduationCap,
  Zap,
  Heart,
  Music,
};

export const VoiceStyleSelector: React.FC<VoiceStyleSelectorProps> = ({
  selectedStyleId,
  onSelectStyle,
  locale,
  disabled = false,
}) => {
  const currentStyle =
    KHMER_VOICE_STYLES.find((s) => s.id === selectedStyleId) ||
    KHMER_VOICE_STYLES[0];

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 font-khmer flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{t(locale, 'voiceStyleLabel')}</span>
          </label>
        </div>
      </div>

      {/* Interactive Style Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
        {KHMER_VOICE_STYLES.map((style) => {
          const isSelected = style.id === selectedStyleId;
          const IconComponent = STYLE_ICON_MAP[style.iconName] || Sparkles;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => !disabled && onSelectStyle(style.id)}
              disabled={disabled}
              title={locale === 'km' ? style.descriptionKm : style.descriptionEn}
              className={`group relative flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${
                isSelected
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/80 dark:hover:bg-slate-800'
              }`}
            >
              {/* Icon avatar */}
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
              </div>

              {/* Text metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-xs font-bold truncate block ${
                      isSelected ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {locale === 'km' ? style.nameKm : style.nameEn}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 leading-normal opacity-90">
                  {locale === 'km' ? style.descriptionKm : style.descriptionEn}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active style preview pill */}
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
        <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">•</span>
        <p className="leading-relaxed">
          <strong className="text-slate-800 dark:text-white font-bold">
            {locale === 'km' ? currentStyle.nameKm : currentStyle.nameEn}:
          </strong>{' '}
          {locale === 'km' ? currentStyle.descriptionKm : currentStyle.descriptionEn}
        </p>
      </div>
    </div>
  );
};
