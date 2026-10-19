import React from 'react';
import {
  Home,
  QrCode,
  Barcode,
  ScanLine,
  Palette,
  Layers,
  Clock,
  Star,
  Settings,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { AppTab } from '../../types';
import { useTranslation } from '../../i18n';

interface SidebarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { t } = useTranslation();

  const navItems: Array<{ id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'create-qr', label: t.nav.createQR, icon: QrCode },
    { id: 'create-barcode', label: t.nav.createBarcode, icon: Barcode },
    { id: 'scan', label: t.nav.scan, icon: ScanLine },
    { id: 'design-lab', label: t.nav.designLab, icon: Palette },
    { id: 'batch', label: t.nav.batch, icon: Layers },
    { id: 'history', label: t.nav.history, icon: Clock },
    { id: 'favorites', label: t.nav.favorites, icon: Star },
    { id: 'settings', label: t.nav.settings, icon: Settings },
    { id: 'about', label: t.nav.about, icon: Info },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between border-r border-black/8 dark:border-white/10 bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl h-screen sticky top-0 select-none">
      <div className="flex flex-col p-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 px-3 py-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#0056B3] flex items-center justify-center shadow-sm shrink-0">
            <svg viewBox="0 0 100 100" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M15 15h30v30H15z M25 25h10v10H25z M55 15h30v30H55z M65 25h10v10H65z M15 55h30v30H15z M25 65h10v10H25z M60 60h8v25h-8z M72 60h6v25h-6z M82 60h6v25h-6z" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-[#171719] dark:text-[#F5F5F7] tracking-tight truncate">
              SFCode Studio
            </span>
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
              by SFCode - Shadat Fatih Code
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div className="px-3 pb-3 mb-2 border-b border-black/5 dark:border-white/5">
          <p className="text-[11px] font-medium text-[#007AFF] tracking-wide uppercase">
            Create. Customize. Connect.
          </p>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-[#007AFF] text-white shadow-sm font-semibold'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Signature & Local Privacy Notice */}
      <div className="p-4 border-t border-black/5 dark:border-white/5 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">100% Client-Side · Zero Telemetry</span>
        </div>
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
          v1.0.0 · SFCode Universal Suite
        </p>
      </div>
    </aside>
  );
};
