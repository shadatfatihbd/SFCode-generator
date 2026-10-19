import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  Smartphone,
  Terminal,
  ExternalLink,
  Code2,
  CheckCircle2,
  Sparkles,
  Layers,
  Copy,
  Check,
  Cpu,
  BookOpen,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

export const AboutView: React.FC = () => {
  const { t, language } = useTranslation();
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const featureMatrix = [
    {
      feature: 'Supported Standard Types',
      qr: '12 payload types (URL, Wi-Fi, vCard, etc.)',
      barcode: '9 formats (Code 128, EAN-13, UPC-A, etc.)',
      design: 'QR with custom dots, frames, eyes',
      scanner: 'All standard 1D & 2D formats',
      batch: 'QR and all 9 Barcode types',
    },
    {
      feature: 'Execution Model',
      qr: '100% Client-Side In-Memory',
      barcode: '100% Client-Side In-Memory',
      design: 'Client-Side Canvas 2D Engine',
      scanner: 'Client-Side Wasm / JS Vision Decoder',
      batch: 'Client-Side Concurrent Canvas Loop',
    },
    {
      feature: 'Export Formats',
      qr: 'PNG (1x/2x/4x), SVG Vector, PDF',
      barcode: 'PNG (1x/2x/4x), SVG Vector, PDF',
      design: 'PNG (1x/2x/4x), SVG Vector, PDF',
      scanner: 'Payload Copy, Share, Safe Open',
      batch: 'Bulk ZIP Archive with Index Manifest',
    },
    {
      feature: 'Input Validation',
      qr: 'Format-specific regex & schema checks',
      barcode: 'Mod-10 Checksum, length & alphabet checks',
      design: 'In-browser ZXing live reliability scan',
      scanner: 'Payload type inspection & malformed checks',
      batch: 'Row-by-row syntax & validity testing',
    },
    {
      feature: 'Persistence',
      qr: 'IndexedDB Local Database',
      barcode: 'IndexedDB Local Database',
      design: 'IndexedDB Local Database',
      scanner: 'Auto-recorded to IndexedDB',
      batch: 'Exportable JSON / CSV / ZIP',
    },
    {
      feature: 'Offline PWA Support',
      qr: 'Full Offline Functionality',
      barcode: 'Full Offline Functionality',
      design: 'Full Offline Functionality',
      scanner: 'Full Offline Functionality',
      batch: 'Full Offline Functionality',
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Brand Hero */}
      <div className="relative overflow-hidden p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-sm flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#0056B3] flex items-center justify-center text-white shadow-lg">
          <svg viewBox="0 0 100 100" className="w-11 h-11 text-white" fill="currentColor">
            <path d="M15 15h30v30H15z M25 25h10v10H25z M55 15h30v30H55z M65 25h10v10H65z M15 55h30v30H15z M25 65h10v10H25z M60 60h8v25h-8z M72 60h6v25h-6z M82 60h6v25h-6z" />
          </svg>
        </div>

        <div className="flex flex-col gap-1.5 max-w-xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#171719] dark:text-[#F5F5F7] tracking-tight">
            SFCode Studio
          </h2>
          <span className="text-base font-semibold text-[#007AFF]">
            by SFCode - Shadat Fatih Code
          </span>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mt-1">
            Create. Customize. Connect.
          </p>
        </div>

        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 max-w-2xl leading-relaxed pt-2">
          {t.about.mission}
        </p>

        <div className="flex items-center gap-4 pt-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Zero-Cloud Telemetry</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#007AFF]" />
            <span>Sub-Millisecond Engine</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-purple-500" />
            <span>Android & PWA Ready</span>
          </div>
        </div>
      </div>

      {/* Security & Privacy Architecture */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-bold text-[#171719] dark:text-[#F5F5F7]">
            {t.about.privacyTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {t.about.privacyPoints.map((pt, i) => (
            <div key={i} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5 flex flex-col gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {pt}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Matrix Table */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#007AFF]" />
            <h3 className="text-base font-bold text-[#171719] dark:text-[#F5F5F7]">
              Feature Matrix & Platform Capabilities
            </h3>
          </div>
          <span className="text-xs text-neutral-400">Architectural Comparison</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-black/8 dark:border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-black/8 dark:border-white/10">
              <tr>
                <th className="p-3">Capability</th>
                <th className="p-3">QR Generator</th>
                <th className="p-3">Barcode Gen</th>
                <th className="p-3">Design Lab</th>
                <th className="p-3">Smart Scanner</th>
                <th className="p-3">Batch Studio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-neutral-600 dark:text-neutral-300">
              {featureMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="p-3 font-semibold text-[#171719] dark:text-[#F5F5F7] whitespace-nowrap">
                    {row.feature}
                  </td>
                  <td className="p-3">{row.qr}</td>
                  <td className="p-3">{row.barcode}</td>
                  <td className="p-3">{row.design}</td>
                  <td className="p-3">{row.scanner}</td>
                  <td className="p-3">{row.batch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Barcode Standards & GS1 Deep Dive */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="w-5 h-5 text-[#007AFF]" />
          <h3 className="text-base font-bold text-[#171719] dark:text-[#F5F5F7]">
            {t.about.standardsTitle}
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {t.about.standardsDesc}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* GS1 & Retail Identifiers */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5 flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-[#171719] dark:text-[#F5F5F7] flex items-center gap-1.5">
              <span>Retail GTIN & GS1 Assignment Rules</span>
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Global Trade Item Numbers (GTIN-13 for EAN, GTIN-12 for UPC, GTIN-8, GTIN-14) require a genuine GS1 Company Prefix to guarantee global uniqueness. SFCode Studio calculates standard modulo-10 check digits precisely according to the GS1 formula:
            </p>
            <div className="p-2.5 rounded-lg bg-neutral-900 text-neutral-300 font-mono text-[11px]">
              Sum = ∑ (digit × weight), where weights alternate [3, 1, 3, 1...]<br />
              Check Digit = (10 - (Sum mod 10)) mod 10
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Important: SFCode Studio never fabricates retail barcodes or generates unauthorized company prefixes.
            </p>
          </div>

          {/* 1D vs 2D Comparison */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5 flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-[#171719] dark:text-[#F5F5F7]">
              1D Linear vs. 2D Matrix Symbologies
            </h4>
            <div className="flex flex-col gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-[#007AFF] shrink-0">1D Linear:</span>
                <span>Code 128, EAN-13, UPC-A, ITF-14 encode information strictly in horizontal bar widths. Best for fast laser checkout scanners and warehouse racking.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-[#007AFF] shrink-0">2D Matrix:</span>
                <span>QR Codes (ISO/IEC 18004) and Data Matrix (ISO/IEC 16022) encode data in horizontal and vertical grids with Reed-Solomon error correction, allowing damage recovery up to 30%.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Standard Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs">
            <span className="font-semibold block text-[#171719] dark:text-[#F5F5F7]">QR Code</span>
            <span className="text-[11px] text-neutral-400">ISO/IEC 18004:2015</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs">
            <span className="font-semibold block text-[#171719] dark:text-[#F5F5F7]">Code 128</span>
            <span className="text-[11px] text-neutral-400">ISO/IEC 15417</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs">
            <span className="font-semibold block text-[#171719] dark:text-[#F5F5F7]">EAN / UPC</span>
            <span className="text-[11px] text-neutral-400">ISO/IEC 15420</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs">
            <span className="font-semibold block text-[#171719] dark:text-[#F5F5F7]">Data Matrix</span>
            <span className="text-[11px] text-neutral-400">ISO/IEC 16022</span>
          </div>
        </div>
      </div>

      {/* Capacitor Android Packaging Guide */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-[#171719] dark:text-[#F5F5F7]">
              {t.about.capacitorTitle}
            </h3>
          </div>
          <span className="text-xs text-neutral-400">Android APK & AAB Packaging</span>
        </div>

        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          SFCode Studio is intentionally engineered with clean device adapters. Once you export the web build, Capacitor wraps the static assets into a native Android application with hardware camera and storage access:
        </p>

        <div className="flex flex-col gap-2 pt-2">
          {t.about.capacitorSteps.map((step, idx) => {
            const isCommand = step.includes('npm') || step.includes('npx');
            const cmdText = isCommand ? step.replace(/^[0-9\.\s]+/, '') : '';
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 text-neutral-200 font-mono text-xs overflow-x-auto gap-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#007AFF] select-none font-bold">$</span>
                  <span>{step}</span>
                </div>
                {cmdText && (
                  <button
                    onClick={() => copyCommand(cmdText)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors shrink-0"
                    title="Copy command"
                  >
                    {copiedCmd === cmdText ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Author & Brand Identity Footer Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col text-center sm:text-left">
          <span className="text-xs font-semibold uppercase text-neutral-400">
            Brand Identity & Engineering
          </span>
          <span className="text-sm font-bold text-[#171719] dark:text-[#F5F5F7]">
            by SFCode - Shadat Fatih Code
          </span>
          <span className="text-xs text-neutral-500">
            SFCode Studio · Universal Barcode & QR Workstation
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-xs font-semibold">
            Create. Customize. Connect.
          </span>
        </div>
      </div>
    </div>
  );
};
