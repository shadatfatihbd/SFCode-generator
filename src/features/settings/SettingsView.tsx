import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  Globe,
  Sliders,
  HardDrive,
  Download,
  Upload,
  Smartphone,
  Check,
  ShieldCheck,
  Trash2,
  Share2,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  getHistoryCount,
  exportDatabaseBackup,
  importDatabaseBackup,
  clearAllHistory,
} from '../../lib/db';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

interface SettingsViewProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDark,
  onToggleTheme,
  onShowToast,
}) => {
  const { language, setLanguage, t } = useTranslation();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [recordCount, setRecordCount] = useState<number>(0);
  const [resolution, setResolution] = useState<number>(2);
  const [includeBrandFooter, setIncludeBrandFooter] = useState<boolean>(true);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  useEffect(() => {
    getHistoryCount().then(setRecordCount);
  }, []);

  // Handle Export Backup
  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportDatabaseBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SFCode_Studio_Backup_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      onShowToast('Database backup downloaded successfully', 'success');
    } catch {
      onShowToast('Failed to export backup', 'error');
    }
  };

  // Handle Import Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const count = await importDatabaseBackup(text);
        const updated = await getHistoryCount();
        setRecordCount(updated);
        onShowToast(`Successfully restored ${count} records!`, 'success');
      } catch (err: any) {
        onShowToast(err.message || 'Failed to import backup', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Handle Clear
  const handleClearAll = async () => {
    await clearAllHistory();
    setRecordCount(0);
    setShowClearConfirm(false);
    onShowToast('Local records cleared', 'info');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-8">
      {/* Header bar */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl sm:text-2xl font-bold text-[#171719] dark:text-[#F5F5F7] tracking-tight">
          {t.settings.title}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Appearance & Language */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-5">
        <h3 className="text-sm font-semibold text-[#171719] dark:text-[#F5F5F7]">
          {t.settings.appearance}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Theme Mode</span>
            <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
              <button
                onClick={() => { if (isDark) onToggleTheme(); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !isDark ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.settings.themeLight}</span>
              </button>
              <button
                onClick={() => { if (!isDark) onToggleTheme(); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isDark ? 'bg-[#2C2C2E] text-white shadow-xs' : 'text-neutral-500'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-neutral-200" />
                <span>{t.settings.themeDark}</span>
              </button>
            </div>
          </div>

          {/* Language selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{t.settings.language}</span>
            <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#171719] dark:text-white shadow-xs'
                    : 'text-neutral-500'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('bn')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  language === 'bn'
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#171719] dark:text-white shadow-xs'
                    : 'text-neutral-500'
                }`}
              >
                বাংলা (Bengali)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Settings */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-5">
        <h3 className="text-sm font-semibold text-[#171719] dark:text-[#F5F5F7]">
          {t.settings.exportDefaults}
        </h3>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {t.settings.resolution}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { val: 1, label: t.settings.resolution1x },
                { val: 2, label: t.settings.resolution2x },
                { val: 4, label: t.settings.resolution4x },
              ].map((r) => (
                <button
                  key={r.val}
                  onClick={() => setResolution(r.val)}
                  className={`p-2.5 rounded-xl border text-xs text-left font-medium transition-colors ${
                    resolution === r.val
                      ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] font-semibold'
                      : 'border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#171719] dark:text-[#F5F5F7]">
                {t.settings.brandFooter}
              </span>
              <span className="text-[11px] text-neutral-500">
                {t.settings.brandFooterDesc}
              </span>
            </div>
            <input
              type="checkbox"
              checked={includeBrandFooter}
              onChange={(e) => setIncludeBrandFooter(e.target.checked)}
              className="w-4 h-4 rounded text-[#007AFF] accent-[#007AFF]"
            />
          </div>
        </div>
      </div>

      {/* Local Storage & Backup */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-[#171719] dark:text-[#F5F5F7]">
              {t.settings.storage}
            </h3>
            <span className="text-[11px] text-neutral-500">
              {t.settings.storageDesc}
            </span>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {recordCount} Records Stored
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.settings.exportBackup}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportBackup}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.settings.importBackup}</span>
          </button>

          {recordCount > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.common.clearAll}</span>
            </button>
          )}
        </div>
      </div>

      {/* PWA & Capacitor Platform Status */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[#171719] dark:text-[#F5F5F7]">
          {t.settings.pwaSection}
        </h3>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs text-neutral-600 dark:text-neutral-300">
          <Smartphone className="w-5 h-5 text-[#007AFF] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-[#171719] dark:text-[#F5F5F7]">
              {isInstalled ? t.settings.pwaStatusInstalled : t.settings.pwaStatusAvailable}
            </span>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Equipped with offline service workers, app manifest, and instant home screen capability.
            </p>
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="mt-2 self-start flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#007AFF] text-white text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.common.installApp}</span>
              </button>
            )}
          </div>
        </div>
      </div>

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
