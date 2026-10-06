import React, { useState } from 'react';
import { User, Check, Search } from 'lucide-react';
import { AppLocale, VoiceOption } from '../../../shared/types';
import { t } from '../../lib/translations';

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoiceId: string;
  onSelectVoice: (id: string) => void;
  locale: AppLocale;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoiceId,
  onSelectVoice,
  locale,
  disabled = false,
}) => {
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter voices
  const filteredVoices = voices.filter((v) => {
    const matchesGender =
      genderFilter === 'all' || v.gender === genderFilter;
    const matchesSearch =
      v.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.accent && v.accent.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesGender && matchesSearch;
  });

  return (
    <div className="space-y-3.5">
      {/* Header & Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 font-khmer">
          {t(locale, 'voiceSelectLabel')} ({voices.length})
        </label>

        {/* Gender Filter Chips */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => setGenderFilter('all')}
            className={`px-2 py-0.5 rounded-md font-semibold font-khmer transition-all cursor-pointer ${
              genderFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t(locale, 'voiceFilterAll')}
          </button>
          <button
            type="button"
            onClick={() => setGenderFilter('female')}
            className={`px-2 py-0.5 rounded-md font-semibold font-khmer transition-all cursor-pointer ${
              genderFilter === 'female'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t(locale, 'voiceFilterFemale')}
          </button>
          <button
            type="button"
            onClick={() => setGenderFilter('male')}
            className={`px-2 py-0.5 rounded-md font-semibold font-khmer transition-all cursor-pointer ${
              genderFilter === 'male'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t(locale, 'voiceFilterMale')}
          </button>
        </div>
      </div>

      {/* Voice Search (visible if > 3 voices) */}
      {voices.length > 3 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(locale, 'searchVoicesPlaceholder')}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-khmer text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}

      {/* Voices List */}
      <div className="grid grid-cols-1 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
        {filteredVoices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;

          return (
            <div
              key={voice.id}
              onClick={() => !disabled && onSelectVoice(voice.id)}
              className={`group relative flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isSelected
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                  : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/70 dark:hover:bg-slate-800'
              }`}
            >
              {/* Voice Avatar icon */}
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all ${
                  isSelected
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                }`}
              >
                <User className="w-4 h-4" />
              </div>

              {/* Voice details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-sm font-bold font-khmer truncate ${
                      isSelected
                        ? 'text-indigo-950 dark:text-indigo-200'
                        : 'text-slate-800 dark:text-white'
                    }`}
                  >
                    {voice.displayName}
                  </span>

                  {isSelected && (
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {/* Metadata badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[11px] px-2 py-0.2 rounded-md font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700">
                    {voice.gender === 'female'
                      ? t(locale, 'voiceInfoFemale')
                      : voice.gender === 'male'
                      ? t(locale, 'voiceInfoMale')
                      : t(locale, 'voiceInfoNeutral')}
                  </span>
                  {voice.accent && (
                    <span className="text-[11px] px-2 py-0.2 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                      {voice.accent}
                    </span>
                  )}
                  {voice.demoOnly && (
                    <span className="text-[11px] px-2 py-0.2 rounded-md font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                      Demo
                    </span>
                  )}
                </div>

                {/* Voice description */}
                {voice.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 leading-relaxed">
                    {voice.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
