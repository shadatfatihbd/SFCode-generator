import React, { useState } from 'react';
import {
  Home,
  QrCode,
  Barcode,
  ScanLine,
  MoreHorizontal,
  Palette,
  Layers,
  Clock,
  Star,
  Settings,
  Info,
  X,
} from 'lucide-react';
import { AppTab } from '../../types';
import { useTranslation } from '../../i18n';

interface MobileNavProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const { t } = useTranslation();
  const [showDrawer, setShowDrawer] = useState(false);

  const mainTabs: Array<{ id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'create-qr', label: t.nav.createQR, icon: QrCode },
    { id: 'create-barcode', label: t.nav.createBarcode, icon: Barcode },
    { id: 'scan', label: t.nav.scan, icon: ScanLine },
  ];

  const drawerTabs: Array<{ id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'design-lab', label: t.nav.designLab, icon: Palette },
    { id: 'batch', label: t.nav.batch, icon: Layers },
    { id: 'history', label: t.nav.history, icon: Clock },
    { id: 'favorites', label: t.nav.favorites, icon: Star },
    { id: 'settings', label: t.nav.settings, icon: Settings },
    { id: 'about', label: t.nav.about, icon: Info },
  ];

  const isMoreActive = drawerTabs.some((tab) => tab.id === currentTab);

  const handleSelect = (tab: AppTab) => {
    onSelectTab(tab);
    setShowDrawer(false);
  };

  return (
    <>
      {/* Bottom Sticky Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 apple-glass border-t border-black/10 dark:border-white/10 px-2 py-1 flex items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-colors ${
                isActive ? 'text-[#007AFF]' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}

        {/* More Drawer Trigger */}
        <button
          onClick={() => setShowDrawer(true)}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-colors ${
            isMoreActive ? 'text-[#007AFF]' : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </nav>

      {/* Drawer Bottom Sheet */}
      {showDrawer && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#202022] rounded-t-3xl border-t border-black/10 dark:border-white/10 p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#171719] dark:text-[#F5F5F7]">
                  SFCode Studio
                </span>
                <span className="text-[11px] text-neutral-500">
                  by SFCode - Shadat Fatih Code
                </span>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-4 pb-6">
              {drawerTabs.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-medium text-left transition-colors ${
                      isActive
                        ? 'bg-[#007AFF] text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
