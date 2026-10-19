import React, { useState, useEffect } from 'react';
import { I18nProvider, useTranslation } from './i18n';
import { AppTab, QRConfig, BarcodeConfig, HistoryItem } from './types';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { HomeView } from './features/home/HomeView';
import { QRGeneratorView } from './features/qr/QRGeneratorView';
import { BarcodeGeneratorView } from './features/barcode/BarcodeGeneratorView';
import { DesignLabView } from './features/design/DesignLabView';
import { ScannerView } from './features/scanner/ScannerView';
import { BatchView } from './features/batch/BatchView';
import { HistoryView } from './features/history/HistoryView';
import { SettingsView } from './features/settings/SettingsView';
import { AboutView } from './features/about/AboutView';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sfcode_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Active configurations passed between views
  const [customizingQR, setCustomizingQR] = useState<QRConfig | undefined>(undefined);
  const [customizingBarcode, setCustomizingBarcode] = useState<BarcodeConfig | undefined>(undefined);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sfcode_theme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };

  // Sync dark class on document root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Navigate to Design Lab with a specific QRConfig
  const handleNavigateToDesignLab = (config: QRConfig) => {
    setCustomizingQR(config);
    setCurrentTab('design-lab');
  };

  // Load a History item into its respective editor
  const handleLoadItemIntoEditor = (item: HistoryItem) => {
    if (item.type === 'qr') {
      setCustomizingQR(item.config as QRConfig);
      setCurrentTab('design-lab');
      showToast(`Loaded "${item.title}" into Design Lab`, 'info');
    } else {
      setCustomizingBarcode(item.config as BarcodeConfig);
      setCurrentTab('create-barcode');
      showToast(`Loaded "${item.title}" into Barcode Generator`, 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#171719] text-[#171719] dark:text-[#F5F5F7] flex flex-row">
      {/* Desktop Left Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-16 md:pb-6">
        <Header
          currentTab={currentTab}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'home' && <HomeView onNavigate={setCurrentTab} />}

          {currentTab === 'create-qr' && (
            <QRGeneratorView
              onNavigateToDesignLab={handleNavigateToDesignLab}
              onShowToast={showToast}
              initialConfig={customizingQR}
            />
          )}

          {currentTab === 'create-barcode' && (
            <BarcodeGeneratorView
              onShowToast={showToast}
              initialConfig={customizingBarcode}
            />
          )}

          {currentTab === 'scan' && <ScannerView onShowToast={showToast} />}

          {currentTab === 'design-lab' && (
            <DesignLabView
              initialConfig={customizingQR}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'batch' && <BatchView onShowToast={showToast} />}

          {currentTab === 'history' && (
            <HistoryView
              onLoadItemIntoEditor={handleLoadItemIntoEditor}
              onShowToast={showToast}
              onlyFavorites={false}
            />
          )}

          {currentTab === 'favorites' && (
            <HistoryView
              onLoadItemIntoEditor={handleLoadItemIntoEditor}
              onShowToast={showToast}
              onlyFavorites={true}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              isDark={isDark}
              onToggleTheme={handleToggleTheme}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'about' && <AboutView />}
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
