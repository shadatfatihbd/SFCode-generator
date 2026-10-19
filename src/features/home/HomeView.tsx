import React from 'react';
import {
  QrCode,
  Barcode,
  ScanLine,
  Palette,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  HardDrive,
  FileCheck2,
} from 'lucide-react';
import { AppTab } from '../../types';
import { useTranslation } from '../../i18n';

interface HomeViewProps {
  onNavigate: (tab: AppTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const quickActions = [
    {
      tab: 'create-qr' as AppTab,
      title: t.nav.createQR,
      desc: 'URLs, Wi-Fi passwords, vCards, SMS, payments, geo-coordinates, and calendar events.',
      icon: QrCode,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      tab: 'create-barcode' as AppTab,
      title: t.nav.createBarcode,
      desc: 'Code 128, EAN-13, UPC-A, ITF-14, Code 39, Data Matrix with standard checksum calculations.',
      icon: Barcode,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      tab: 'scan' as AppTab,
      title: t.nav.scan,
      desc: 'Real-time camera or image file scanner with safe payload analysis and zero auto-redirects.',
      icon: ScanLine,
      color: 'from-violet-500 to-purple-600',
    },
    {
      tab: 'design-lab' as AppTab,
      title: t.nav.designLab,
      desc: 'Dot patterns, finder eyes, brand logos, gradients, and live in-browser scan verification.',
      icon: Palette,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      tab: 'batch' as AppTab,
      title: t.nav.batch,
      desc: 'Bulk generate from CSV files or pasted lines, with row validation and ZIP manifest download.',
      icon: Layers,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  const standards = [
    { name: 'ISO/IEC 18004:2015', label: 'QR Code Specification', type: '2D Matrix' },
    { name: 'ISO/IEC 15417', label: 'Code 128 Alphanumeric', type: '1D Linear' },
    { name: 'ISO/IEC 15420', label: 'EAN/UPC Retail Barcode', type: '1D Linear' },
    { name: 'ISO/IEC 16022', label: 'Data Matrix Standard', type: '2D Matrix' },
    { name: 'GS1 General Spec', label: 'GTIN Checksum & Application IDs', type: 'Enterprise' },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-2">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white to-neutral-50/50 dark:from-[#202022] dark:to-[#171719] p-6 sm:p-10 border border-black/8 dark:border-white/10 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#007AFF] uppercase tracking-wider">
              Universal Code Platform
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              by SFCode - Shadat Fatih Code
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#171719] dark:text-[#F5F5F7] text-balance">
            Create. Customize. Connect.
          </h2>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
            SFCode Studio is an industrial-strength, privacy-centric QR Code and Barcode workstation.
            Generate standard-compliant retail and logistics barcodes, design beautiful branded QR codes,
            scan safely, and export high-resolution assets—100% client-side with zero cloud tracking.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('create-qr')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95"
            >
              <span>{t.nav.createQR}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('create-barcode')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#171719] dark:text-neutral-200 text-xs sm:text-sm font-semibold transition-colors"
            >
              <span>{t.nav.createBarcode}</span>
            </button>
            <button
              onClick={() => onNavigate('scan')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-[#007AFF] dark:hover:text-[#0A84FF] text-xs sm:text-sm font-medium transition-colors"
            >
              <ScanLine className="w-4 h-4" />
              <span>{t.nav.scan}</span>
            </button>
          </div>
        </div>

        {/* Decorative corner glyph */}
        <div className="absolute -right-8 -bottom-8 opacity-5 dark:opacity-10 pointer-events-none select-none">
          <QrCode className="w-64 h-64 text-[#007AFF]" />
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#171719] dark:text-[#F5F5F7]">
            Workstation Tools
          </h3>
          <span className="text-xs text-neutral-500">5 Dedicated Suites</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.tab}
                onClick={() => onNavigate(action.tab)}
                className="group relative cursor-pointer p-5 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 hover:border-[#007AFF]/50 dark:hover:border-[#007AFF]/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#171719] dark:text-[#F5F5F7] group-hover:text-[#007AFF] transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {action.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 pt-4 text-xs font-semibold text-[#007AFF]">
                  <span>Launch Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Architectural Guarantees & Privacy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-[#171719] dark:text-[#F5F5F7]">
            Zero-Server Privacy
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Wi-Fi passwords, contact cards, private URLs, and scanned codes never leave your browser memory.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-[#007AFF] flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-[#171719] dark:text-[#F5F5F7]">
            Sub-Millisecond Engine
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Direct client-side canvas rendering without network bottlenecks or third-party API rate limits.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-[#171719] dark:text-[#F5F5F7]">
            Persistent IndexedDB
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            History, favorites, and custom configurations remain locally accessible across browser restarts.
          </p>
        </div>
      </div>

      {/* Barcode & QR Standards Strip */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#007AFF]" />
            <h4 className="text-xs font-semibold text-[#171719] dark:text-[#F5F5F7]">
              Supported Barcode & QR Standards
            </h4>
          </div>
          <span className="text-[11px] text-neutral-400">ISO / IEC & GS1 Compliant</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {standards.map((s) => (
            <div key={s.name} className="flex flex-col p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
              <span className="text-[11px] font-semibold text-[#171719] dark:text-neutral-200">
                {s.name}
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                {s.label}
              </span>
              <span className="text-[9px] font-medium text-[#007AFF] mt-1">
                {s.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
