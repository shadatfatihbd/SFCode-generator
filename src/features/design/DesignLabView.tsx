import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Eye,
  Image as ImageIcon,
  Square,
  ShieldCheck,
  AlertTriangle,
  Download,
  Copy,
  RotateCcw,
  BookmarkPlus,
  Check,
  Layers,
  Sparkles,
  FileDown,
  FileText,
} from 'lucide-react';
import { QRConfig, QRDotStyle, QREyeStyle, QRErrorCorrection, HistoryItem } from '../../types';
import { renderQRToCanvas, verifyCanvasScanReliability, QRScanVerificationResult, renderQRToSVG } from '../../lib/qr-engine';
import { downloadCanvasAsPNG, downloadCanvasAsPDF, downloadSVG } from '../../lib/export-engine';
import { saveHistoryItem } from '../../lib/db';
import { useTranslation } from '../../i18n';

interface DesignLabViewProps {
  initialConfig?: QRConfig;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const PALETTES = [
  { name: 'Apple Classic', fg: '#171719', bg: '#FFFFFF' },
  { name: 'Apple Blue', fg: '#007AFF', bg: '#FFFFFF' },
  { name: 'Midnight Deep', fg: '#0A84FF', bg: '#171719' },
  { name: 'Emerald Forest', fg: '#059669', bg: '#F0FDF4' },
  { name: 'Sunset Bronze', fg: '#C2410C', bg: '#FFF7ED' },
  { name: 'Royal Indigo', fg: '#4F46E5', bg: '#EEF2FF' },
  { name: 'Obsidian Gold', fg: '#D97706', bg: '#1C1917' },
];

export const DesignLabView: React.FC<DesignLabViewProps> = ({ initialConfig, onShowToast }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<'pattern' | 'colors' | 'logo' | 'frame' | 'reliability'>('pattern');

  // Configuration state
  const [payload, setPayload] = useState<string>(initialConfig?.rawPayload || 'https://sfcode.studio');
  const [dotStyle, setDotStyle] = useState<QRDotStyle>(initialConfig?.dotStyle || 'rounded');
  const [eyeStyle, setEyeStyle] = useState<QREyeStyle>(initialConfig?.eyeStyle || 'rounded');
  const [fgColor, setFgColor] = useState<string>(initialConfig?.fgColor || '#007AFF');
  const [bgColor, setBgColor] = useState<string>(initialConfig?.bgColor || '#FFFFFF');
  const [transparentBg, setTransparentBg] = useState<boolean>(initialConfig?.transparentBg || false);

  // Gradient
  const [gradientEnabled, setGradientEnabled] = useState<boolean>(initialConfig?.gradient?.enabled || false);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>(initialConfig?.gradient?.type || 'linear');
  const [gradientColor2, setGradientColor2] = useState<string>(initialConfig?.gradient?.color2 || '#0056B3');
  const [gradientAngle, setGradientAngle] = useState<number>(initialConfig?.gradient?.angle || 45);

  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(initialConfig?.logo?.url || null);
  const [logoSizeRatio, setLogoSizeRatio] = useState<number>(initialConfig?.logo?.sizeRatio || 0.22);
  const [logoPadding, setLogoPadding] = useState<number>(initialConfig?.logo?.padding || 1);
  const [logoCircular, setLogoCircular] = useState<boolean>(initialConfig?.logo?.circular ?? true);
  const [logoImgElement, setLogoImgElement] = useState<HTMLImageElement | null>(null);

  // Frame
  const [frameStyle, setFrameStyle] = useState<'none' | 'simple' | 'banner-bottom' | 'banner-top'>(
    initialConfig?.frame?.style || 'banner-bottom'
  );
  const [frameLabel, setFrameLabel] = useState<string>(initialConfig?.frame?.label || 'SCAN ME');
  const [frameColor, setFrameColor] = useState<string>(initialConfig?.frame?.color || '#007AFF');
  const [frameTextColor, setFrameTextColor] = useState<string>(initialConfig?.frame?.textColor || '#FFFFFF');

  // Size & EC
  const [errorCorrection, setErrorCorrection] = useState<QRErrorCorrection>(
    logoUrl ? 'H' : initialConfig?.errorCorrection || 'Q'
  );

  // Reliability Result
  const [reliability, setReliability] = useState<QRScanVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  // Load logo element when logoUrl changes
  useEffect(() => {
    if (!logoUrl) {
      setLogoImgElement(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setLogoImgElement(img);
    img.src = logoUrl;
  }, [logoUrl]);

  // Current config
  const currentConfig: QRConfig = {
    payloadType: initialConfig?.payloadType || 'url',
    rawPayload: payload,
    fields: initialConfig?.fields || { url: payload },
    errorCorrection: logoUrl ? 'H' : errorCorrection,
    size: 450,
    margin: 2,
    dotStyle,
    eyeStyle,
    fgColor,
    bgColor,
    transparentBg,
    gradient: {
      enabled: gradientEnabled,
      type: gradientType,
      color2: gradientColor2,
      angle: gradientAngle,
    },
    logo: {
      url: logoUrl,
      sizeRatio: logoSizeRatio,
      padding: logoPadding,
      circular: logoCircular,
    },
    frame: {
      style: frameStyle,
      label: frameLabel,
      color: frameColor,
      textColor: frameTextColor,
    },
  };

  // Re-render and verify scan reliability
  useEffect(() => {
    let isCancelled = false;
    const run = async () => {
      if (!canvasRef.current) return;
      try {
        await renderQRToCanvas(canvasRef.current, currentConfig, logoImgElement);
        if (isCancelled) return;

        setIsVerifying(true);
        const result = await verifyCanvasScanReliability(canvasRef.current);
        if (!isCancelled) {
          setReliability(result);
          setIsVerifying(false);
        }
      } catch (err) {
        if (!isCancelled) setIsVerifying(false);
      }
    };
    run();
    return () => {
      isCancelled = true;
    };
  }, [
    payload,
    dotStyle,
    eyeStyle,
    fgColor,
    bgColor,
    transparentBg,
    gradientEnabled,
    gradientType,
    gradientColor2,
    gradientAngle,
    logoUrl,
    logoSizeRatio,
    logoPadding,
    logoCircular,
    logoImgElement,
    frameStyle,
    frameLabel,
    frameColor,
    frameTextColor,
    errorCorrection,
  ]);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setLogoUrl(url);
      setErrorCorrection('H'); // Auto elevate to High
      onShowToast('Logo uploaded. Error correction elevated to High (30%).', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setDotStyle('squares');
    setEyeStyle('square');
    setFgColor('#000000');
    setBgColor('#FFFFFF');
    setTransparentBg(false);
    setGradientEnabled(false);
    setLogoUrl(null);
    setFrameStyle('none');
    setFrameLabel('');
    onShowToast('Styles reset to standard.', 'info');
  };

  const handleDownloadPNG = (resolutionFactor: number = 2) => {
    if (!canvasRef.current) return;
    downloadCanvasAsPNG(canvasRef.current, {
      filename: `SFCode_Styled_QR_${Date.now()}`,
      resolutionFactor,
      title: 'SFCode Customized QR Code',
    });
    onShowToast(t.common.saved, 'success');
  };

  const handleDownloadPDF = () => {
    if (!canvasRef.current) return;
    downloadCanvasAsPDF(canvasRef.current, {
      filename: `SFCode_Styled_QR_${Date.now()}`,
      title: frameLabel || 'Customized QR Code',
      subtitle: `Payload: ${payload}`,
      includeBrandFooter: true,
    });
    onShowToast(t.common.saved, 'success');
  };

  const handleDownloadSVG = async () => {
    try {
      const svg = await renderQRToSVG(currentConfig);
      downloadSVG(svg, `SFCode_Styled_QR_${Date.now()}`);
      onShowToast(t.common.saved, 'success');
    } catch {
      onShowToast('Failed to export SVG', 'error');
    }
  };

  const handleSaveToHistory = async () => {
    if (!canvasRef.current) return;
    try {
      const item: HistoryItem = {
        id: 'qr-styled-' + Date.now(),
        createdAt: Date.now(),
        type: 'qr',
        format: 'custom-styled',
        title: frameLabel || 'Customized QR Code',
        payload,
        config: currentConfig,
        isFavorite: false,
        thumbnailDataUrl: canvasRef.current.toDataURL('image/png'),
      };
      await saveHistoryItem(item);
      setSaved(true);
      onShowToast(t.common.saved, 'success');
      setTimeout(() => setSaved(false), 2000);
    } catch {
      onShowToast('Error saving to history', 'error');
    }
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        onShowToast(t.common.copied, 'success');
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      onShowToast('Failed to copy', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#171719] dark:text-[#F5F5F7] tracking-tight">
            {t.designLab.title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            {t.designLab.subtitle}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.common.reset}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Customizer Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('pattern')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'pattern'
                  ? 'bg-white dark:bg-[#202022] text-[#171719] dark:text-[#F5F5F7] shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {t.designLab.tabs.pattern}
            </button>
            <button
              onClick={() => setActiveTab('colors')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'colors'
                  ? 'bg-white dark:bg-[#202022] text-[#171719] dark:text-[#F5F5F7] shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {t.designLab.tabs.colors}
            </button>
            <button
              onClick={() => setActiveTab('logo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'logo'
                  ? 'bg-white dark:bg-[#202022] text-[#171719] dark:text-[#F5F5F7] shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {t.designLab.tabs.logo}
            </button>
            <button
              onClick={() => setActiveTab('frame')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'frame'
                  ? 'bg-white dark:bg-[#202022] text-[#171719] dark:text-[#F5F5F7] shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {t.designLab.tabs.frame}
            </button>
            <button
              onClick={() => setActiveTab('reliability')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'reliability'
                  ? 'bg-white dark:bg-[#202022] text-[#171719] dark:text-[#F5F5F7] shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {t.designLab.tabs.reliability}
            </button>
          </div>

          {/* TAB 1: Patterns & Eyes */}
          {activeTab === 'pattern' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-6">
              {/* Dot Styles */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.designLab.patterns.dotStyle}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'squares', label: t.designLab.patterns.squares },
                    { id: 'dots', label: t.designLab.patterns.dots },
                    { id: 'rounded', label: t.designLab.patterns.rounded },
                    { id: 'classy', label: t.designLab.patterns.classy },
                    { id: 'fluid', label: t.designLab.patterns.fluid },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setDotStyle(s.id as QRDotStyle)}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                        dotStyle === s.id
                          ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] font-semibold'
                          : 'border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eye Styles */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-black/5 dark:border-white/5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.designLab.patterns.eyeStyle}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'square', label: t.designLab.patterns.eyeSquare },
                    { id: 'rounded', label: t.designLab.patterns.eyeRounded },
                    { id: 'circle', label: t.designLab.patterns.eyeCircle },
                    { id: 'leaf', label: t.designLab.patterns.eyeLeaf },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setEyeStyle(s.id as QREyeStyle)}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                        eyeStyle === s.id
                          ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] font-semibold'
                          : 'border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payload override */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Content to Encode
                </label>
                <input
                  type="text"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder="https://..."
                  className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Colors & Gradients */}
          {activeTab === 'colors' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-6">
              {/* Preset Palettes */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.designLab.colors.presets}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PALETTES.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        setFgColor(p.fg);
                        setBgColor(p.bg);
                        setTransparentBg(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-xs hover:border-[#007AFF]"
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: p.fg }} />
                      <span className="text-[11px] text-neutral-700 dark:text-neutral-300">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Solid Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-black/5 dark:border-white/5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t.designLab.colors.foreground}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.designLab.colors.background}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id="transBgCheck"
                        checked={transparentBg}
                        onChange={(e) => setTransparentBg(e.target.checked)}
                        className="rounded text-[#007AFF] accent-[#007AFF]"
                      />
                      <label htmlFor="transBgCheck" className="text-[11px] text-neutral-500 cursor-pointer">
                        {t.designLab.colors.transparent}
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      disabled={transparentBg}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0 disabled:opacity-30"
                    />
                    <input
                      type="text"
                      value={transparentBg ? 'Transparent' : bgColor}
                      disabled={transparentBg}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs uppercase disabled:opacity-30"
                    />
                  </div>
                </div>
              </div>

              {/* Gradients */}
              <div className="flex flex-col gap-3 pt-2 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableGrad"
                      checked={gradientEnabled}
                      onChange={(e) => setGradientEnabled(e.target.checked)}
                      className="rounded text-[#007AFF] accent-[#007AFF]"
                    />
                    <label htmlFor="enableGrad" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                      {t.designLab.colors.enableGradient}
                    </label>
                  </div>
                </div>

                {gradientEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                        {t.designLab.colors.gradientType}
                      </label>
                      <select
                        value={gradientType}
                        onChange={(e) => setGradientType(e.target.value as any)}
                        className="px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#202022] text-xs"
                      >
                        <option value="linear">{t.designLab.colors.linear}</option>
                        <option value="radial">{t.designLab.colors.radial}</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                        {t.designLab.colors.gradientColor2}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={gradientColor2}
                          onChange={(e) => setGradientColor2(e.target.value)}
                          className="w-7 h-7 rounded-md cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input
                          type="text"
                          value={gradientColor2}
                          onChange={(e) => setGradientColor2(e.target.value)}
                          className="w-full px-2 py-1 text-xs uppercase rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#202022]"
                        />
                      </div>
                    </div>

                    {gradientType === 'linear' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                          {t.designLab.colors.gradientAngle} ({gradientAngle}°)
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          value={gradientAngle}
                          onChange={(e) => setGradientAngle(Number(e.target.value))}
                          className="accent-[#007AFF] cursor-pointer mt-1"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Center Logo */}
          {activeTab === 'logo' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.designLab.logo.uploadLogo}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-[#171719] dark:text-[#F5F5F7] transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-[#007AFF]" />
                    <span>Upload Logo Image</span>
                  </button>
                  {logoUrl && (
                    <button
                      onClick={() => setLogoUrl(null)}
                      className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                    >
                      {t.designLab.logo.removeLogo}
                    </button>
                  )}
                </div>
              </div>

              {logoUrl && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-black/5 dark:border-white/5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.designLab.logo.size} ({Math.round(logoSizeRatio * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0.15}
                      max={0.28}
                      step={0.01}
                      value={logoSizeRatio}
                      onChange={(e) => setLogoSizeRatio(Number(e.target.value))}
                      className="accent-[#007AFF] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-3">
                    <input
                      type="checkbox"
                      id="logoCirc"
                      checked={logoCircular}
                      onChange={(e) => setLogoCircular(e.target.checked)}
                      className="rounded text-[#007AFF] accent-[#007AFF]"
                    />
                    <label htmlFor="logoCirc" className="text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                      {t.designLab.logo.circular}
                    </label>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-[#007AFF] leading-relaxed">
                {t.designLab.logo.caution}
              </div>
            </div>
          )}

          {/* TAB 4: Outer Frame */}
          {activeTab === 'frame' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.designLab.frame.style}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'none', label: t.designLab.frame.none },
                    { id: 'banner-bottom', label: t.designLab.frame.bannerBottom },
                    { id: 'banner-top', label: t.designLab.frame.bannerTop },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFrameStyle(s.id as any)}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                        frameStyle === s.id
                          ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] font-semibold'
                          : 'border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {frameStyle !== 'none' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.designLab.frame.labelText}
                    </label>
                    <input
                      type="text"
                      value={frameLabel}
                      onChange={(e) => setFrameLabel(e.target.value)}
                      placeholder="SCAN ME"
                      className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {t.designLab.frame.presets.map((txt) => (
                      <button
                        key={txt}
                        onClick={() => setFrameLabel(txt)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200"
                      >
                        {txt}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.designLab.frame.labelColor}</label>
                      <input
                        type="color"
                        value={frameColor}
                        onChange={(e) => setFrameColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.designLab.frame.textColor}</label>
                      <input
                        type="color"
                        value={frameTextColor}
                        onChange={(e) => setFrameTextColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 5: Reliability & Decoder Verification */}
          {activeTab === 'reliability' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-[#171719] dark:text-[#F5F5F7]">
                {t.designLab.reliability.title}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Our in-browser ZXing decoder tests the rendered canvas in real time to guarantee that camera optics can read the code cleanly in physical environments.
              </p>

              {isVerifying ? (
                <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center gap-2 text-xs text-neutral-500">
                  <div className="w-3 h-3 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
                  <span>{t.designLab.reliability.testing}</span>
                </div>
              ) : reliability ? (
                <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                  reliability.valid
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-xs">
                      {reliability.valid ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                      <span>{reliability.valid ? t.designLab.reliability.pass : t.designLab.reliability.fail}</span>
                    </div>
                    <span className="text-xs font-mono font-bold">
                      {reliability.score}/100
                    </span>
                  </div>
                  {reliability.decodedText && (
                    <p className="text-[11px] font-mono opacity-80 truncate">
                      Decoded Payload: {reliability.decodedText}
                    </p>
                  )}
                  {reliability.warning && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 pt-1">
                      {reliability.warning}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right Preview Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-20">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col items-center gap-5">
            <div className="w-full flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t.common.preview}
              </span>
              {reliability && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  reliability.valid
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {reliability.valid ? 'Verified Scan' : 'Needs Contrast'}
                </span>
              )}
            </div>

            {/* Canvas Viewport */}
            <div className="relative p-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5 flex items-center justify-center min-h-[300px] w-full max-w-[340px] aspect-square overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain rounded-xl shadow-xs"
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
                  onClick={handleCopy}
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
