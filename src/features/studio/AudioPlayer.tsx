import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Repeat,
} from 'lucide-react';
import { AppLocale, SynthesisResult } from '../../../shared/types';
import { t } from '../../lib/translations';

interface AudioPlayerProps {
  result: SynthesisResult;
  locale: AppLocale;
  onSaveToLibrary?: () => void;
  onRegenerate?: () => void;
  isSaved?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  result,
  locale,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(result.durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  useEffect(() => {
    // Reset state when a new result arrives
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [result.jobId, result.audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.error('Audio play error:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const skipTime = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    if (audioRef.current) {
      audioRef.current.loop = next;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume > 0 ? volume : 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id="soriya-result-player"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 sm:p-6 transition-all animate-in fade-in slide-in-from-bottom-3"
    >
      <audio
        ref={audioRef}
        src={result.audioUrl}
        loop={isLooping}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          if (!isLooping) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xs">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white font-khmer flex items-center gap-2">
              <span>{t(locale, 'resultTitle')}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/50">
                {t(locale, 'readyBadge')}
              </span>
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{result.voiceName}</span>
              {result.style && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100/80 dark:border-indigo-800 capitalize text-xs">
                    {result.style}
                  </span>
                </>
              )}
              <span>•</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{result.format.toUpperCase()}</span>
              <span>•</span>
              <span>{result.characterCount} {locale === 'km' ? 'តួអក្សរ' : 'chars'}</span>
              <span>•</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Speed Pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => changePlaybackRate(rate)}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                playbackRate === rate
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {rate}×
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Sound Waveform simulation */}
      <div
        className="my-5 relative flex items-center justify-between gap-1 h-14 px-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const pct = Math.max(0, Math.min(1, clickX / rect.width));
          if (audioRef.current && duration > 0) {
            audioRef.current.currentTime = pct * duration;
            setCurrentTime(pct * duration);
          }
        }}
        title="Click anywhere on waveform to seek"
      >
        {Array.from({ length: 42 }).map((_, i) => {
          const progress = duration > 0 ? currentTime / duration : 0;
          const isPassed = i / 42 <= progress;
          const seed = (Math.sin(i * 0.35) + Math.cos(i * 0.85) + 2) / 4;
          const dynamicHeight = isPlaying ? Math.max(18, seed * 100) : Math.max(18, seed * 65);

          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-150 ${
                isPassed
                  ? 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                  : 'bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
              }`}
              style={{
                height: `${dynamicHeight}%`,
                minWidth: '2px',
                maxWidth: '6px',
              }}
            />
          );
        })}
      </div>

      {/* Scrubber & Time Display */}
      <div className="space-y-1 mb-4">
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
          aria-label="Audio timeline progress"
        />
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-latin font-medium">
          <span className="font-mono">{formatTime(currentTime)}</span>
          <span className="font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Play/Pause, Skip 5s, Loop, Volume */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Rewind 5s */}
          <button
            type="button"
            onClick={() => skipTime(-5)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={t(locale, 'backward5s')}
            aria-label={t(locale, 'backward5s')}
          >
            <span className="text-[10px] font-bold font-mono">-5s</span>
          </button>

          {/* Play/Pause */}
          <button
            id="play-pause-btn"
            type="button"
            onClick={togglePlay}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none transition-all transform active:scale-95 cursor-pointer"
            aria-label={isPlaying ? 'Pause speech' : 'Play speech'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          {/* Forward 5s */}
          <button
            type="button"
            onClick={() => skipTime(5)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={t(locale, 'forward5s')}
            aria-label={t(locale, 'forward5s')}
          >
            <span className="text-[10px] font-bold font-mono">+5s</span>
          </button>

          {/* Loop toggle */}
          <button
            type="button"
            onClick={toggleLoop}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${
              isLooping
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={t(locale, 'loopAudio')}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Volume control */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={toggleMute}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Toggle mute"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
              aria-label="Volume slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
