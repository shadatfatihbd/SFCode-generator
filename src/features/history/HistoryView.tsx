import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Star,
  Trash2,
  Copy,
  CopyPlus,
  Download,
  Share2,
  Edit3,
  Sliders,
  AlertTriangle,
  QrCode,
  Barcode,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { HistoryItem, AppTab, QRConfig, BarcodeConfig } from '../../types';
import {
  getHistoryItems,
  toggleFavorite,
  deleteHistoryItem,
  clearAllHistory,
  saveHistoryItem,
} from '../../lib/db';
import { useTranslation } from '../../i18n';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

interface HistoryViewProps {
  onLoadItemIntoEditor: (item: HistoryItem) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onlyFavorites?: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onLoadItemIntoEditor,
  onShowToast,
  onlyFavorites = false,
}) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'qr' | 'barcode'>(onlyFavorites ? 'all' : 'all');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load items from IndexedDB
  const refreshItems = async () => {
    try {
      const all = await getHistoryItems();
      setItems(all);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    refreshItems();
  }, []);

  // Handle Toggle Favorite
  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = await toggleFavorite(id);
    if (onlyFavorites && !isFav) {
      setItems((prev) => prev.filter((it) => it.id !== id));
    } else {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, isFavorite: isFav } : it))
      );
    }
    onShowToast(isFav ? 'Pinned to favorites' : 'Removed from favorites', 'info');
  };

  // Handle Delete
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteHistoryItem(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    onShowToast('Item deleted', 'info');
  };

  // Handle Clear All
  const handleClearAll = async () => {
    await clearAllHistory();
    setItems([]);
    setShowClearConfirm(false);
    onShowToast('History cleared completely', 'info');
  };

  // Handle Duplicate
  const handleDuplicate = async (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const dup: HistoryItem = {
      ...item,
      id: `${item.type}-${Date.now()}`,
      createdAt: Date.now(),
      title: `${item.title} (Copy)`,
      isFavorite: false,
    };
    await saveHistoryItem(dup);
    await refreshItems();
    onShowToast('Record duplicated', 'success');
  };

  // Handle Copy Payload
  const handleCopyPayload = (payload: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(payload);
    setCopiedId(id);
    onShowToast(t.common.copied, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter items
  const filtered = items.filter((item) => {
    if (onlyFavorites && !item.isFavorite) return false;
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.payload.toLowerCase().includes(q) ||
      item.format.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#171719] dark:text-[#F5F5F7] tracking-tight">
            {onlyFavorites ? t.favorites.title : t.history.title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            {onlyFavorites ? t.favorites.subtitle : t.history.subtitle}
          </p>
        </div>

        {!onlyFavorites && items.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.common.clearAll}</span>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.history.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#202022] text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
          />
        </div>

        {/* Type Filter Buttons */}
        {!onlyFavorites && (
          <div className="flex items-center gap-1 p-1 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-white dark:bg-[#202022] text-[#171719] dark:text-[#F5F5F7] shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {t.history.filterAll}
            </button>
            <button
              onClick={() => setFilterType('qr')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'qr'
                  ? 'bg-white dark:bg-[#202022] text-[#171719] dark:text-[#F5F5F7] shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {t.history.filterQR}
            </button>
            <button
              onClick={() => setFilterType('barcode')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'barcode'
                  ? 'bg-white dark:bg-[#202022] text-[#171719] dark:text-[#F5F5F7] shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {t.history.filterBarcode}
            </button>
          </div>
        )}
      </div>

      {/* Items Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs hover:border-[#007AFF]/40 flex flex-col justify-between gap-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    {item.type === 'qr' ? (
                      <QrCode className="w-4 h-4 text-[#007AFF]" />
                    ) : (
                      <Barcode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="text-xs font-semibold text-[#171719] dark:text-[#F5F5F7] truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {item.format.toUpperCase()} · {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Favorite Star Button */}
                <button
                  onClick={(e) => handleToggleFavorite(item.id, e)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    item.isFavorite
                      ? 'text-amber-500 bg-amber-500/10'
                      : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                  }`}
                  title={item.isFavorite ? t.common.unfavorite : t.common.favorite}
                >
                  <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Thumbnail or Payload preview */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5 flex items-center gap-3">
                {item.thumbnailDataUrl ? (
                  <img
                    src={item.thumbnailDataUrl}
                    alt={item.title}
                    className="w-14 h-14 object-contain rounded-lg bg-white p-1 border border-black/5 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                    <QrCode className="w-6 h-6 text-neutral-400" />
                  </div>
                )}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-medium">Payload</span>
                  <p className="text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate">
                    {item.payload}
                  </p>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5">
                <button
                  onClick={() => onLoadItemIntoEditor(item)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#007AFF] hover:underline"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{t.common.edit}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleCopyPayload(item.payload, item.id, e)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title={t.common.copy}
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={(e) => handleDuplicate(item, e)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title={t.common.duplicate}
                  >
                    <CopyPlus className="w-3.5 h-3.5" />
                  </button>

                  {item.thumbnailDataUrl && (
                    <a
                      href={item.thumbnailDataUrl}
                      download={`${item.title || 'code'}.png`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title={t.common.download}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    title={t.common.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center gap-3 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10">
          <Clock className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
          <h3 className="text-sm font-semibold text-[#171719] dark:text-[#F5F5F7]">
            {onlyFavorites ? t.favorites.emptyTitle : t.history.emptyTitle}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm">
            {onlyFavorites ? t.favorites.emptyDesc : t.history.emptyDesc}
          </p>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title={t.history.clearConfirmTitle}
        description={t.history.clearConfirmDesc}
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
        isDestructive={true}
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
