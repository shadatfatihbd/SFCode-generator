import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  Zap,
  ZapOff,
  SwitchCamera,
  StopCircle,
  Copy,
  Share2,
  ExternalLink,
  ShieldAlert,
  Check,
  AlertCircle,
  Wifi,
  Contact,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ScanResult, HistoryItem } from '../../types';
import { ScannerAdapter } from '../../lib/scanner-adapter';
import { saveHistoryItem } from '../../lib/db';
import { useTranslation } from '../../i18n';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

interface ScannerViewProps {
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onShowToast }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [scannerAdapter] = useState(() => new ScannerAdapter());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Active scan result
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // Safe Link Open confirmation dialog
  const [urlToOpen, setUrlToOpen] = useState<string | null>(null);

  // Fetch camera devices on mount
  useEffect(() => {
    scannerAdapter.getVideoDevices().then((devices) => {
      setVideoDevices(devices);
      // Prefer rear/environment camera if found
      const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
      if (backCam) {
        setSelectedDeviceId(backCam.deviceId);
      } else if (devices.length > 0) {
        setSelectedDeviceId(devices[0].deviceId);
      }
    });

    return () => {
      scannerAdapter.stopCamera();
    };
  }, [scannerAdapter]);

  // Start Camera
  const handleStartCamera = async () => {
    if (!videoRef.current) return;
    setCameraError(null);
    try {
      setIsScanning(true);
      await scannerAdapter.startCamera(
        videoRef.current,
        selectedDeviceId,
        (result) => {
          handleScanSuccess(result);
        },
        (err) => {
          setCameraError(t.scanner.cameraDenied);
          setIsScanning(false);
        }
      );
    } catch (err: any) {
      setCameraError(err.message || t.scanner.cameraDenied);
      setIsScanning(false);
    }
  };

  // Stop Camera
  const handleStopCamera = () => {
    scannerAdapter.stopCamera();
    setIsScanning(false);
    setTorchEnabled(false);
  };

  // Switch Camera Device
  const handleSwitchCamera = async () => {
    if (videoDevices.length <= 1) return;
    const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    const nextDevice = videoDevices[nextIndex];
    setSelectedDeviceId(nextDevice.deviceId);

    if (isScanning && videoRef.current) {
      handleStopCamera();
      setTimeout(() => {
        handleStartCamera();
      }, 200);
    }
  };

  // Toggle Torch
  const handleToggleTorch = async () => {
    const next = !torchEnabled;
    const ok = await scannerAdapter.toggleTorch(next);
    if (ok) {
      setTorchEnabled(next);
    } else {
      onShowToast('Flashlight / torch not supported on this device/camera.', 'info');
    }
  };

  // Handle Successful Scan
  const handleScanSuccess = async (result: ScanResult) => {
    setScanResult(result);
    setScanHistory((prev) => [result, ...prev.slice(0, 9)]);
    onShowToast(`Scanned ${result.format}!`, 'success');

    // Automatically record into local IndexedDB
    try {
      const item: HistoryItem = {
        id: result.id,
        createdAt: result.timestamp,
        type: result.format.includes('QR') ? 'qr' : 'barcode',
        format: result.format,
        title: `Scan: ${result.text.slice(0, 30)}`,
        payload: result.text,
        config: {} as any,
        isFavorite: false,
      };
      await saveHistoryItem(item);
    } catch {
      // Ignore background save error
    }
  };

  // Handle Upload Image File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCameraError(null);
    try {
      const result = await scannerAdapter.decodeImageFile(file);
      handleScanSuccess(result);
    } catch (err: any) {
      onShowToast(err.message || 'No barcode found in image', 'error');
    }
  };

  // Handle Drag & Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      const result = await scannerAdapter.decodeImageFile(file);
      handleScanSuccess(result);
    } catch (err: any) {
      onShowToast(err.message || 'No barcode found in image', 'error');
    }
  };

  // Copy Content
  const handleCopy = () => {
    if (!scanResult) return;
    navigator.clipboard.writeText(scanResult.text);
    setCopied(true);
    onShowToast(t.common.copied, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Share Content
  const handleShare = () => {
    if (!scanResult) return;
    if (navigator.share) {
      navigator.share({
        title: 'SFCode Scan Result',
        text: scanResult.text,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-8">
      {/* Header bar */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl sm:text-2xl font-bold text-[#171719] dark:text-[#F5F5F7] tracking-tight">
          {t.scanner.title}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          {t.scanner.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scanner Viewport & Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Camera Viewport Container */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="relative rounded-3xl bg-neutral-900 overflow-hidden border border-black/10 dark:border-white/10 aspect-[4/3] flex flex-col items-center justify-center text-white"
          >
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
            />

            {/* Viewfinder Target Reticle when scanning */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="relative w-64 h-64 border-2 border-white/60 rounded-3xl">
                  {/* Glowing corners */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#007AFF] rounded-tl-2xl -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#007AFF] rounded-tr-2xl -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#007AFF] rounded-bl-2xl -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#007AFF] rounded-br-2xl -mb-1 -mr-1" />

                  {/* Scanning sweep line */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#007AFF] to-transparent animate-pulse" />
                </div>
              </div>
            )}

            {/* Inactive Standby Screen */}
            {!isScanning && (
              <div className="flex flex-col items-center gap-3 p-6 text-center max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-[#007AFF]">
                  <Camera className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-white">Camera Viewfinder Ready</h3>
                <p className="text-xs text-neutral-400">
                  {t.scanner.scanning}
                </p>
                <button
                  onClick={handleStartCamera}
                  className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.scanner.startCamera}</span>
                </button>
              </div>
            )}

            {/* Scanning Controls Toolbar (Float inside camera) */}
            {isScanning && (
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-center gap-3 z-10">
                <button
                  onClick={handleStopCamera}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-lg transition-colors"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>{t.scanner.stopCamera}</span>
                </button>

                {videoDevices.length > 1 && (
                  <button
                    onClick={handleSwitchCamera}
                    className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
                    title={t.scanner.switchCamera}
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleToggleTorch}
                  className={`p-2.5 rounded-xl backdrop-blur-md transition-colors ${
                    torchEnabled ? 'bg-amber-500 text-white' : 'bg-black/60 text-white hover:bg-black/80'
                  }`}
                  title={torchEnabled ? t.scanner.flashlightOff : t.scanner.flashlightOn}
                >
                  {torchEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Drag & Drop File Selector Fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="cursor-pointer p-6 rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 hover:border-[#007AFF] dark:hover:border-[#007AFF] bg-white dark:bg-[#202022] transition-colors flex flex-col items-center justify-center gap-2 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
              <Upload className="w-5 h-5 text-[#007AFF]" />
            </div>
            <span className="text-xs font-semibold text-[#171719] dark:text-[#F5F5F7]">
              {t.scanner.dropImage}
            </span>
            <span className="text-[11px] text-neutral-400">
              {t.scanner.dropImageSub}
            </span>
          </div>
        </div>

        {/* Scan Results Inspector (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t.scanner.resultTitle}
              </h3>
              {scanResult && (
                <span className="text-xs font-mono font-medium text-[#007AFF]">
                  {scanResult.format}
                </span>
              )}
            </div>

            {scanResult ? (
              <div className="flex flex-col gap-4">
                {/* Detected Payload Box */}
                <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase">
                      Detected Type: {scanResult.parsedType.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(scanResult.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#171719] dark:text-[#F5F5F7] break-all whitespace-pre-wrap select-all">
                    {scanResult.text}
                  </p>
                </div>

                {/* Safety Warning for external URLs */}
                {scanResult.parsedType === 'url' && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      {t.scanner.safetyWarning}
                    </p>
                  </div>
                )}

                {/* Specific Action Buttons based on parsed payload */}
                <div className="flex flex-col gap-2">
                  {scanResult.parsedType === 'url' && (
                    <button
                      onClick={() => setUrlToOpen(scanResult.parsedDetails.url || scanResult.text)}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t.scanner.actions.openLink}</span>
                    </button>
                  )}

                  {scanResult.parsedType === 'wifi' && (
                    <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-[#007AFF]">
                        <Wifi className="w-3.5 h-3.5" />
                        <span>Wi-Fi Credentials</span>
                      </div>
                      <p>SSID: <strong className="font-mono">{scanResult.parsedDetails.ssid}</strong></p>
                      <p>Password: <strong className="font-mono">{scanResult.parsedDetails.password || 'None'}</strong></p>
                      <p>Security: {scanResult.parsedDetails.type}</p>
                    </div>
                  )}

                  {scanResult.parsedType === 'vcard' && (
                    <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-[#007AFF]">
                        <Contact className="w-3.5 h-3.5" />
                        <span>vCard Contact Card</span>
                      </div>
                      <p>Name: <strong>{scanResult.parsedDetails.name}</strong></p>
                      {scanResult.parsedDetails.phone && <p>Phone: {scanResult.parsedDetails.phone}</p>}
                      {scanResult.parsedDetails.email && <p>Email: {scanResult.parsedDetails.email}</p>}
                      {scanResult.parsedDetails.org && <p>Org: {scanResult.parsedDetails.org}</p>}
                    </div>
                  )}

                  {scanResult.parsedType === 'phone' && (
                    <a
                      href={`tel:${scanResult.parsedDetails.number}`}
                      className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-xs font-semibold text-[#171719] dark:text-neutral-200"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{t.scanner.actions.dialPhone} ({scanResult.parsedDetails.number})</span>
                    </a>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleCopy}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-black/10 dark:border-white/10 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? t.common.copied : t.scanner.copyContent}</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-black/10 dark:border-white/10 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{t.scanner.shareContent}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2 text-neutral-400">
                <Clock className="w-8 h-8 opacity-40" />
                <p className="text-xs">
                  Scan a code with your camera or select an image file to inspect decoded content here.
                </p>
              </div>
            )}
          </div>

          {/* Recent Scans Strip */}
          {scanHistory.length > 1 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 flex flex-col gap-2.5">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase">
                Recent Scans (Session)
              </span>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {scanHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setScanResult(item)}
                    className="cursor-pointer p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono truncate max-w-[200px] text-neutral-800 dark:text-neutral-200">
                      {item.text}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {item.format}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Safe URL Opening Dialog */}
      <ConfirmDialog
        isOpen={Boolean(urlToOpen)}
        title="Open External URL?"
        description={`You are about to visit an external website: \n\n${urlToOpen}\n\nEnsure this address is trustworthy before proceeding.`}
        confirmLabel="Proceed to Website"
        cancelLabel="Stay Safe"
        onConfirm={() => {
          if (urlToOpen) {
            window.open(urlToOpen, '_blank', 'noopener,noreferrer');
          }
          setUrlToOpen(null);
        }}
        onCancel={() => setUrlToOpen(null)}
      />
    </div>
  );
};
