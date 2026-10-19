import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode,
  Download,
  Copy,
  BookmarkPlus,
  Check,
  AlertCircle,
  FileDown,
  FileText,
  Info,
  Sliders,
} from 'lucide-react';
import { BarcodeConfig, BarcodeFormat, HistoryItem } from '../../types';
import {
  BARCODE_FORMATS,
  validateAndNormalizeBarcode,
  renderBarcodeToCanvas,
  renderBarcodeToSVG,
} from '../../lib/barcode-engine';
import { downloadCanvasAsPNG, downloadCanvasAsPDF, downloadSVG } from '../../lib/export-engine';
import { saveHistoryItem } from '../../lib/db';
import { useTranslation } from '../../i18n';

interface BarcodeGeneratorViewProps {
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialConfig?: BarcodeConfig;
}

export const BarcodeGeneratorView: React.FC<BarcodeGeneratorViewProps> = ({
  onShowToast,
  initialConfig,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [format, setFormat] = useState<BarcodeFormat>(initialConfig?.format || 'code128');
  const [barcodeText, setBarcodeText] = useState<string>(initialConfig?.text || 'SFCODE-INV-2026');
  const [includeText, setIncludeText] = useState<boolean>(initialConfig?.includeText ?? true);
  const [height, setHeight] = useState<number>(initialConfig?.height || 16);
  const [scale, setScale] = useState<number>(initialConfig?.scale || 3);
  const [barColor, setBarColor] = useState<string>(initialConfig?.barColor || '#000000');
  const [bgColor, setBgColor] = useState<string>(initialConfig?.bgColor || '#FFFFFF');
  const [transparentBg, setTransparentBg] = useState<boolean>(initialConfig?.transparentBg || false);
  const [caption, setCaption] = useState<string>(initialConfig?.caption || 'Studio Pro Wireless Headphones');
  const [sku, setSku] = useState<string>(initialConfig?.sku || 'SF-HD-902');
  const [price, setPrice] = useState<string>(initialConfig?.price || '149.99');
  const [currency, setCurrency] = useState<string>(initialConfig?.currency || '$');

  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [checksumNote, setChecksumNote] = useState<string | null>(null);

  const selectedFormatMeta = BARCODE_FORMATS.find((f) => f.id === format) || BARCODE_FORMATS[0];

  // When format switches, set suitable default sample text if empty or previous was from another type
  const handleFormatChange = (newFormat: BarcodeFormat) => {
    setFormat(newFormat);
    const meta = BARCODE_FORMATS.find((f) => f.id === newFormat);
    if (meta) {
      setBarcodeText(meta.sampleValue);
    }
  };

  const currentConfig: BarcodeConfig = {
    format,
    text: barcodeText,
    includeText,
    height,
    scale,
    barColor,
    bgColor,
    transparentBg,
    caption,
    sku,
    price,
    currency,
  };

  // Render barcode whenever config changes
  useEffect(() => {
    let isMounted = true;
    const render = async () => {
      if (!canvasRef.current) return;
      try {
        const validation = validateAndNormalizeBarcode(format, barcodeText);
        if (!validation.valid) {
          setValidationError(validation.errorMessage || 'Invalid input');
          setChecksumNote(null);
          return;
        }

        setValidationError(null);
        setChecksumNote(validation.checksumNote || null);

        await renderBarcodeToCanvas(canvasRef.current, {
          ...currentConfig,
          text: validation.normalizedValue,
        });
      } catch (err: any) {
        if (isMounted) {
          setValidationError(err.message || 'Failed to render barcode');
        }
      }
    };
    render();
    return () => {
      isMounted = false;
    };
  }, [format, barcodeText, includeText, height, scale, barColor, bgColor, transparentBg, caption, sku, price, currency]);

  // Handle Export PNG
  const handleDownloadPNG = (resolutionFactor: number = 2) => {
    if (!canvasRef.current) return;
    downloadCanvasAsPNG(canvasRef.current, {
      filename: `SFCode_Barcode_${format}_${Date.now()}`,
      resolutionFactor,
      title: `${selectedFormatMeta.name} Barcode`,
      sku,
      price: price ? `${currency}${price}` : undefined,
    });
    onShowToast(t.common.saved, 'success');
  };

  // Handle Export PDF
  const handleDownloadPDF = () => {
    if (!canvasRef.current) return;
    downloadCanvasAsPDF(canvasRef.current, {
      filename: `SFCode_Barcode_${format}_${Date.now()}`,
      title: caption || `${selectedFormatMeta.name} Barcode`,
      subtitle: `Code: ${barcodeText} · Format: ${selectedFormatMeta.name}`,
      sku,
      price: price ? `${currency}${price}` : undefined,
      includeBrandFooter: true,
    });
    onShowToast(t.common.saved, 'success');
  };

  // Handle Export SVG
  const handleDownloadSVG = () => {
    try {
      const svg = renderBarcodeToSVG(currentConfig);
      downloadSVG(svg, `SFCode_Barcode_${format}_${Date.now()}`);
      onShowToast(t.common.saved, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to export SVG', 'error');
    }
  };

  // Handle Copy PNG
  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          onShowToast(t.common.copied, 'success');
          setTimeout(() => setCopied(false), 2000);
        } catch {
          await navigator.clipboard.writeText(barcodeText);
          setCopied(true);
          onShowToast('Barcode data copied to clipboard!', 'info');
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch {
      onShowToast('Failed to copy', 'error');
    }
  };

  // Handle Save to Local History
  const handleSaveToHistory = async () => {
    if (!canvasRef.current) return;
    try {
      const item: HistoryItem = {
        id: 'barcode-' + Date.now(),
        createdAt: Date.now(),
        type: 'barcode',
        format,
        title: caption || sku || `${selectedFormatMeta.name} (${barcodeText})`,
        payload: barcodeText,
        config: currentConfig,
        isFavorite: false,
        thumbnailDataUrl: canvasRef.current.toDataURL('image/png'),
      };
      await saveHistoryItem(item);
      setSaved(true);
      onShowToast(t.common.saved, 'success');
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      onShowToast(err.message || 'Error saving to history', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-8">
      {/* Header bar */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl sm:text-2xl font-bold text-[#171719] dark:text-[#F5F5F7] tracking-tight">
          {t.barcode.title}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          {t.barcode.subtitle}
        </p>
      </div>

      {/* Main Barcode Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Format Selector Pills */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Barcode Standard & Format
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BARCODE_FORMATS.map((fmt) => {
                const isActive = format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => handleFormatChange(fmt.id)}
                    className={`flex flex-col p-2.5 rounded-xl text-left transition-all truncate ${
                      isActive
                        ? 'bg-[#007AFF] text-white shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="text-xs font-semibold truncate">{fmt.name}</span>
                    <span className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-neutral-400'}`}>
                      {fmt.category.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
              {selectedFormatMeta.description}
            </p>
          </div>

          {/* Value and Label Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-4">
            {/* Value Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.barcode.fields.barcodeValue}
                </label>
                {checksumNote && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    {checksumNote}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={barcodeText}
                onChange={(e) => setBarcodeText(e.target.value)}
                placeholder={selectedFormatMeta.placeholder}
                className="w-full px-3.5 py-2.5 font-mono rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
            </div>

            {/* Validation alert */}
            {validationError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Product Meta: Caption, SKU, Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-black/5 dark:border-white/5">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.barcode.fields.caption}
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Wireless Headset"
                  className="px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.barcode.fields.sku}
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. SKU-8492"
                  className="px-3.5 py-2 font-mono rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Currency</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="px-2.5 py-2 text-center rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t.barcode.fields.price}
                  </label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="29.99"
                    className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>
            </div>

            {/* Dimension & Display Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-black/5 dark:border-white/5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.barcode.fields.height} ({height}mm)
                </label>
                <input
                  type="range"
                  min={8}
                  max={35}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="accent-[#007AFF] cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.barcode.fields.scale} ({scale}x)
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="accent-[#007AFF] cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="includeTextCheck"
                  checked={includeText}
                  onChange={(e) => setIncludeText(e.target.checked)}
                  className="w-4 h-4 rounded text-[#007AFF] accent-[#007AFF]"
                />
                <label htmlFor="includeTextCheck" className="text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                  Human-readable digits
                </label>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-black/5 dark:border-white/5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.barcode.fields.barColor}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={barColor}
                    onChange={(e) => setBarColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={barColor}
                    onChange={(e) => setBarColor(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs uppercase"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.barcode.fields.bgColor}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    disabled={transparentBg}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent disabled:opacity-40"
                  />
                  <input
                    type="text"
                    value={transparentBg ? 'Transparent' : bgColor}
                    disabled={transparentBg}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs uppercase disabled:opacity-40"
                  />
                </div>
              </div>
            </div>

            {/* GS1 Important Retail Notice */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{t.barcode.gs1Notice}</p>
            </div>
          </div>
        </div>

        {/* Right Preview Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-20">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col items-center gap-5">
            <div className="w-full flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t.common.preview}
              </span>
              <span className="text-xs font-mono text-[#007AFF]">
                {selectedFormatMeta.name}
              </span>
            </div>

            {/* Canvas Viewport */}
            <div className="relative p-5 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5 flex items-center justify-center min-h-[220px] w-full overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain rounded-lg shadow-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleDownloadPNG(2)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG</span>
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#171719] dark:text-neutral-200 text-xs font-semibold transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  onClick={handleDownloadSVG}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#171719] dark:text-neutral-200 text-xs font-semibold transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span>SVG</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyImage}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.common.copied : t.common.copy}</span>
                </button>

                <button
                  onClick={handleSaveToHistory}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-medium transition-colors"
                >
                  {saved ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                  <span>{saved ? t.common.saved : t.common.saveToHistory}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
