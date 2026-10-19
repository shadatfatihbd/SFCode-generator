import React, { useState } from 'react';
import { Sun, Moon, Download, Globe, WifiOff, Share } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { AppTab } from '../../types';

interface HeaderProps {
  currentTab: AppTab;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, isDark, onToggleTheme }) => {
  const { language, setLanguage, t } = useTranslation();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const getTabLabel = (tab: AppTab) => {
    switch (tab) {
      case 'home':
        return t.nav.home;
      case 'create-qr':
        return t.nav.createQR;
      case 'create-barcode':
        return t.nav.createBarcode;
      case 'scan':
        return t.nav.scan;
      case 'design-lab':
        return t.nav.designLab;
      case 'batch':
        return t.nav.batch;
      case 'history':
        return t.nav.history;
      case 'favorites':
        return t.nav.favorites;
      case 'settings':
        return t.nav.settings;
      case 'about':
        return t.nav.about;
      default:
        return 'SFCode Studio';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-black/8 dark:border-white/10 apple-glass">
      {/* Breadcrumb / Title zone */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 hidden sm:inline">
          SFCode Studio
        </span>
        <span className="text-xs text-neutral-300 dark:text-neutral-600 hidden sm:inline">/</span>
        <h1 className="text-sm sm:text-base font-semibold text-[#171719] dark:text-[#F5F5F7] tracking-tight">
          {getTabLabel(currentTab)}
        </h1>
        {!isOnline && (
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <WifiOff className="w-3 h-3" />
            Offline
          </span>
        )}
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button */}
        {!isInstalled && isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-medium shadow-sm transition-all active:scale-95"
            title={t.common.installApp}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{t.common.installApp}</span>
          </button>
        )}

        {!isInstalled && isIOS && (
          <button
            onClick={() => setShowIOSModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-200/80 dark:bg-neutral-800 text-[#171719] dark:text-neutral-200 text-xs font-medium transition-colors"
            title={t.common.installOnIOS}
          >
            <Share className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{t.common.installOnIOS}</span>
          </button>
        )}

        {/* Language switch button */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#171719] dark:text-neutral-200 transition-colors"
          title="Switch language / ভাষা পরিবর্তন"
        >
          <Globe className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
        </button>

        {/* Theme switch button */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-xl text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
        </button>
      </div>

      {/* iOS Safari PWA Install Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-[#202022] rounded-2xl p-6 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-[#171719] dark:text-[#F5F5F7]">
              {t.common.installOnIOS}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {t.common.safariInstructions}
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-2 w-full py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
