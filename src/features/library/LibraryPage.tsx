import React, { useState, useEffect } from 'react';
import {
  FolderHeart,
  Search,
  Play,
  Pause,
  Trash2,
  Edit2,
  Download,
  Calendar,
  Layers,
  FileAudio,
  AlertCircle,
  Loader2,
  FolderOpen,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Sparkles,
  RotateCcw,
  Clock,
  Check,
  Volume2,
} from 'lucide-react';
import { AppLocale, AudioHistoryItem } from '../../../shared/types';
import { t } from '../../lib/translations';
import { Modal } from '../../components/Modal';
import { downloadAudioFile } from '../../lib/download';
import { getCachedAudioUrl } from '../../lib/audioCache';

interface LibraryPageProps {
  items: AudioHistoryItem[];
  locale: AppLocale;
  onDeleteItem: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  onLoadInStudio: (item: AudioHistoryItem) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  items,
  locale,
  onDeleteItem,
  onUpdateTitle,
  onClearAll,
  onLoadInStudio,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoiceFilter, setSelectedVoiceFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Multi-selection state for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Currently playing audio in library
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Rename modal state
  const [editingItem, setEditingItem] = useState<AudioHistoryItem | null>(null);
  const [newTitleText, setNewTitleText] = useState('');

  // Delete confirm modal
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [batchDownloading, setBatchDownloading] = useState(false);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sourcePreview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.voiceName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVoice =
      selectedVoiceFilter === 'all' || item.voiceId === selectedVoiceFilter;

    return matchesSearch && matchesVoice;
  });

  // Extract unique voices for filter
  const uniqueVoices = Array.from(new Set(items.map((i) => i.voiceId))).map((id) => {
    const found = items.find((i) => i.voiceId === id);
    return { id, name: found?.voiceName || id };
  });

  // Total metrics
  const totalCharacters = items.reduce((acc, i) => acc + (i.characterCount || 0), 0);
  const totalDurationSeconds = items.reduce((acc, i) => acc + (i.durationSeconds || 0), 0);

  const handlePlayToggle = async (item: AudioHistoryItem) => {
    if (activePlayingId === item.id) {
      audioElement?.pause();
      setActivePlayingId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const playUrl = await getCachedAudioUrl(item.id, item.audioUrl);
      const newAudio = new Audio(playUrl);
      newAudio.onended = () => setActivePlayingId(null);
      newAudio.play().catch((err) => console.error('Play error in library:', err));
      setAudioElement(newAudio);
      setActivePlayingId(item.id);
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleBatchDownload = async () => {
    if (batchDownloading || selectedIds.size === 0) return;
    setBatchDownloading(true);

    try {
      const selectedItems = items.filter((i) => selectedIds.has(i.id));
      for (const item of selectedItems) {
        const filename = `soriya-${item.id}.${item.format || 'wav'}`;
        await downloadAudioFile(item.audioUrl, filename, item.id);
        // Small stagger to prevent browser choking
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (err) {
      console.error('Batch download failed:', err);
    } finally {
      setBatchDownloading(false);
    }
  };

  const handleBatchDelete = () => {
    selectedIds.forEach((id) => onDeleteItem(id));
    setSelectedIds(new Set());
    setBatchDeleteConfirmOpen(false);
  };

  const handleOpenRename = (item: AudioHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setNewTitleText(item.title);
  };

  const handleSaveRename = () => {
    if (editingItem && newTitleText.trim()) {
      onUpdateTitle(editingItem.id, newTitleText.trim());
      setEditingItem(null);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      if (activePlayingId === deletingId && audioElement) {
        audioElement.pause();
      }
      onDeleteItem(deletingId);
      setDeletingId(null);
    }
  };

  const handleDownloadItem = async (item: AudioHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadingId) return;
    setDownloadingId(item.id);
    const filename = `soriya-${item.id}.${item.format || 'wav'}`;
    try {
      await downloadAudioFile(item.audioUrl, filename, item.id);
    } catch (err) {
      console.error('Library item download failed:', err);
    } finally {
      setTimeout(() => {
        setDownloadingId((cur) => (cur === item.id ? null : cur));
      }, 800);
    }
  };

  const handleOpenAudioFolder = async () => {
    if ((window as any).electronAPI?.openFolder) {
      await (window as any).electronAPI.openFolder('SoriyaVoice');
    }
  };

  const handleShowInFolder = async (item: AudioHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const safeTitle = item.title.replace(/[\/\\?%*:|"<>]/g, '_').trim() || 'soriya_audio';
    const filename = `${safeTitle}.${item.format || 'wav'}`;

    if ((window as any).electronAPI?.showInFolder) {
      try {
        let base64Data: string | undefined;
        const playUrl = await getCachedAudioUrl(item.id, item.audioUrl);
        if (playUrl.startsWith('data:audio')) {
          base64Data = playUrl;
        } else {
          const res = await fetch(playUrl);
          const blob = await res.blob();
          const reader = new FileReader();
          base64Data = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
        await (window as any).electronAPI.showInFolder({ filename, base64Data });
      } catch (err) {
        console.error('Error revealing in folder:', err);
      }
    } else {
      await handleDownloadItem(item, e);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(locale === 'km' ? 'km-KH' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatSeconds = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '0s';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      {/* Header & Stats Overview Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xs">
            <FolderHeart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white font-khmer">
              {t(locale, 'libraryTitle')}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-khmer">
              {t(locale, 'librarySubtitle')}
            </p>
          </div>
        </div>

        {/* Overview Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-khmer">
            <FileAudio className="w-3.5 h-3.5 text-indigo-500" />
            <span>{items.length} {t(locale, 'totalSaved')}</span>
          </div>

          {items.length > 0 && (
            <>
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-khmer">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{formatSeconds(totalDurationSeconds)}</span>
              </div>

              <button
                type="button"
                onClick={handleOpenAudioFolder}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold font-khmer transition-colors cursor-pointer border border-indigo-100 dark:border-indigo-800/60"
                title={t(locale, 'openAudioFolderBtn')}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{t(locale, 'openAudioFolderBtn')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter, Search & View Controls Bar */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(locale, 'searchLibraryPlaceholder')}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-khmer text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Voice filter dropdown */}
            {uniqueVoices.length > 1 && (
              <select
                value={selectedVoiceFilter}
                onChange={(e) => setSelectedVoiceFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 font-khmer focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">{t(locale, 'allVoicesFilter')}</option>
                {uniqueVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Right Controls: Batch Actions & View Switcher */}
          <div className="flex items-center gap-2">
            {/* Batch actions if any selected */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 p-1 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-in fade-in">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 px-2 font-khmer">
                  {t(locale, 'selectedItemsCount').replace('%d', selectedIds.size.toString())}
                </span>

                <button
                  type="button"
                  onClick={handleBatchDownload}
                  disabled={batchDownloading}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer font-khmer shadow-2xs"
                >
                  {batchDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  <span>{t(locale, 'batchDownloadBtn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchDeleteConfirmOpen(true)}
                  className="p-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                  title={t(locale, 'batchDeleteBtn')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Select All Toggle */}
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold font-khmer transition-colors cursor-pointer"
            >
              {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {selectedIds.size === filteredItems.length && filteredItems.length > 0
                  ? t(locale, 'deselectAllBtn')
                  : t(locale, 'selectAllBtn')}
              </span>
            </button>

            {/* View Grid/List toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title={t(locale, 'viewModeGrid')}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title={t(locale, 'viewModeList')}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FolderHeart className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto font-khmer">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {t(locale, 'emptyLibraryTitle')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t(locale, 'emptyLibraryDesc')}
            </p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-400 font-khmer text-sm">
          រកមិនឃើញឯកសារសំឡេងដែលត្រូវគ្នានឹងការស្វែងរករបស់អ្នកទេ។
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isPlaying = activePlayingId === item.id;
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handlePlayToggle(item)}
                className={`group bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative ${
                  isPlaying
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                    : isSelected
                    ? 'border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Checkbox select */}
                <button
                  type="button"
                  onClick={(e) => handleToggleSelect(item.id, e)}
                  className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                  )}
                </button>

                <div className="space-y-2.5 pr-6">
                  {/* Title & Date */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white font-khmer line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  {/* Text preview */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-khmer line-clamp-2 leading-relaxed">
                    {item.sourcePreview}
                  </p>

                  {/* Voice & Format metadata tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                      {item.voiceName}
                    </span>
                    {item.style && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                        {item.style}
                      </span>
                    )}
                    <span className="text-[11px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.format || 'WAV'}
                    </span>
                    {item.durationSeconds && (
                      <span className="text-[11px] text-slate-400 font-mono ml-auto">
                        {formatSeconds(item.durationSeconds)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  {/* Play/Pause Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayToggle(item);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-khmer transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-rose-600 text-white shadow-2xs animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isPlaying ? t(locale, 'pause') : t(locale, 'play')}</span>
                  </button>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1">
                    {/* Load in studio */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadInStudio(item);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                      title={t(locale, 'loadInStudioBtn')}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Rename */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenRename(item, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={t(locale, 'renameBtn')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Download */}
                    <button
                      type="button"
                      onClick={(e) => handleDownloadItem(item, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={t(locale, 'downloadBtn')}
                    >
                      {downloadingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Show in folder */}
                    <button
                      type="button"
                      onClick={(e) => handleShowInFolder(item, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                      title={t(locale, 'showInFolderBtn')}
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(item.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title={t(locale, 'deleteBtn')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
          {filteredItems.map((item) => {
            const isPlaying = activePlayingId === item.id;
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handlePlayToggle(item)}
                className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  isPlaying
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/40'
                    : isSelected
                    ? 'bg-indigo-50/30 dark:bg-indigo-950/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleSelect(item.id, e)}
                    className="p-1 text-slate-400 hover:text-indigo-600 shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 opacity-50" />
                    )}
                  </button>

                  {/* Play Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayToggle(item);
                    }}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all ${
                      isPlaying
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </button>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white font-khmer truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 shrink-0">
                        {item.voiceName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-400 font-khmer truncate mt-0.5">
                      {item.sourcePreview}
                    </p>
                  </div>
                </div>

                {/* Right metadata and buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400 font-mono hidden md:inline">
                    {formatDate(item.createdAt)}
                  </span>

                  {/* Edit in Studio */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadInStudio(item);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                    title={t(locale, 'loadInStudioBtn')}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Rename */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenRename(item, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={t(locale, 'renameBtn')}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Download */}
                  <button
                    type="button"
                    onClick={(e) => handleDownloadItem(item, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={t(locale, 'downloadBtn')}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(item.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title={t(locale, 'deleteBtn')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rename Modal */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title={t(locale, 'renameBtn')}
      >
        <div className="space-y-4 font-khmer">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            ចំណងជើងឯកសារសំឡេង៖
          </label>
          <input
            type="text"
            value={newTitleText}
            onChange={(e) => setNewTitleText(e.target.value)}
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              {t(locale, 'cancelBtn')}
            </button>
            <button
              type="button"
              onClick={handleSaveRename}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {locale === 'km' ? 'រក្សាទុក' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Single Delete Confirm Modal */}
      <Modal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        title={t(locale, 'confirmDeleteTitle')}
      >
        <div className="space-y-4 font-khmer">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {t(locale, 'confirmDeleteDesc')}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeletingId(null)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {t(locale, 'cancelDeleteBtn')}
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {t(locale, 'confirmDeleteBtn')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Batch Delete Confirm Modal */}
      <Modal
        isOpen={batchDeleteConfirmOpen}
        onClose={() => setBatchDeleteConfirmOpen(false)}
        title="លុបឯកសារដែលបានជ្រើសរើស?"
      >
        <div className="space-y-4 font-khmer">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            តើអ្នកប្រាកដជាចង់លុបឯកសារសំឡេងចំនួន {selectedIds.size} ដែលបានជ្រើសរើសនេះទេ?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBatchDeleteConfirmOpen(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {t(locale, 'cancelDeleteBtn')}
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {t(locale, 'batchDeleteBtn')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
