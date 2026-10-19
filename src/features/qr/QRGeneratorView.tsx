import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  Contact,
  Share2,
  MapPin,
  Calendar,
  CreditCard,
  Image as ImageIcon,
  Download,
  Copy,
  Sliders,
  BookmarkPlus,
  Check,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import { QRConfig, QRPayloadType, QRErrorCorrection, AppTab, HistoryItem } from '../../types';
import { buildQRPayload, renderQRToCanvas, renderQRToSVG } from '../../lib/qr-engine';
import { downloadCanvasAsPNG, downloadCanvasAsPDF, downloadSVG } from '../../lib/export-engine';
import { saveHistoryItem } from '../../lib/db';
import { useTranslation } from '../../i18n';

interface QRGeneratorViewProps {
  onNavigateToDesignLab: (config: QRConfig) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialConfig?: QRConfig;
}

export const QRGeneratorView: React.FC<QRGeneratorViewProps> = ({
  onNavigateToDesignLab,
  onShowToast,
  initialConfig,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [payloadType, setPayloadType] = useState<QRPayloadType>(initialConfig?.payloadType || 'url');
  const [fields, setFields] = useState<Record<string, string>>(initialConfig?.fields || {
    url: 'https://sfcode.studio',
    text: 'SFCode Studio - Universal QR & Barcode Suite by Shadat Fatih Code',
    emailTo: 'contact@sfcode.studio',
    emailSubject: 'Project Collaboration',
    emailBody: 'Hello Shadat Fatih,\n\nI would like to inquire about your software architecture services.',
    phoneNumber: '+14155552671',
    smsNumber: '+14155552671',
    smsMessage: 'Hi, connecting from SFCode Studio!',
    wifiSsid: 'SFCode_HighSpeed_5G',
    wifiPassword: 'StudioSecure2026',
    wifiEncryption: 'WPA',
    wifiHidden: 'false',
    firstName: 'Shadat',
    lastName: 'Fatih',
    org: 'SFCode Innovations',
    jobTitle: 'Principal Software Engineer',
    vcardPhone: '+14155552671',
    vcardEmail: 'shadat@sfcode.studio',
    vcardUrl: 'https://sfcode.studio',
    vcardAddress: 'San Francisco, CA, USA',
    socialPlatform: 'twitter',
    socialHandle: 'shadatfatih',
    geoLat: '23.8103',
    geoLng: '90.4125',
    geoQuery: 'Dhaka, Bangladesh',
    eventTitle: 'SFCode Tech Keynote 2026',
    eventLocation: 'Moscone Convention Center, San Francisco',
    eventStart: '20261101T100000',
    eventEnd: '20261101T120000',
    eventDescription: 'Annual architecture, barcode standards, and high-performance computing summit.',
    paymentType: 'upi',
    payee: 'sfcode@upi',
    amount: '500',
    currency: 'INR',
    paymentNote: 'SFCode Studio License',
    imageUrl: 'https://sfcode.studio/assets/sample-badge.png',
    imageDescription: 'Official Product Verification Badge',
  });

  const [errorCorrection, setErrorCorrection] = useState<QRErrorCorrection>(initialConfig?.errorCorrection || 'M');
  const [qrSize, setQrSize] = useState<number>(initialConfig?.size || 400);
  const [fgColor, setFgColor] = useState<string>(initialConfig?.fgColor || '#000000');
  const [bgColor, setBgColor] = useState<string>(initialConfig?.bgColor || '#FFFFFF');
  const [transparentBg, setTransparentBg] = useState<boolean>(initialConfig?.transparentBg || false);

  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Payload types list with icons
  const typeTabs: Array<{ id: QRPayloadType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'url', label: t.qr.types.url, icon: Globe },
    { id: 'text', label: t.qr.types.text, icon: FileText },
    { id: 'wifi', label: t.qr.types.wifi, icon: Wifi },
    { id: 'vcard', label: t.qr.types.vcard, icon: Contact },
    { id: 'email', label: t.qr.types.email, icon: Mail },
    { id: 'phone', label: t.qr.types.phone, icon: Phone },
    { id: 'sms', label: t.qr.types.sms, icon: MessageSquare },
    { id: 'social', label: t.qr.types.social, icon: Share2 },
    { id: 'geo', label: t.qr.types.geo, icon: MapPin },
    { id: 'event', label: t.qr.types.event, icon: Calendar },
    { id: 'payment', label: t.qr.types.payment, icon: CreditCard },
    { id: 'image_link', label: t.qr.types.image_link, icon: ImageIcon },
  ];

  // Helper to update specific field
  const updateField = (key: string, val: string) => {
    setFields((prev) => ({ ...prev, [key]: val }));
  };

  // Compile active QRConfig
  const currentConfig: QRConfig = {
    payloadType,
    rawPayload: buildQRPayload(payloadType, fields),
    fields,
    errorCorrection,
    size: qrSize,
    margin: 2,
    dotStyle: initialConfig?.dotStyle || 'squares',
    eyeStyle: initialConfig?.eyeStyle || 'square',
    fgColor,
    bgColor,
    transparentBg,
    gradient: initialConfig?.gradient || {
      enabled: false,
      type: 'linear',
      color2: '#007AFF',
      angle: 45,
    },
    logo: initialConfig?.logo || {
      url: null,
      sizeRatio: 0.22,
      padding: 1,
      circular: true,
    },
    frame: initialConfig?.frame || {
      style: 'none',
      label: '',
      color: '#007AFF',
      textColor: '#FFFFFF',
    },
  };

  // Re-render QR code whenever inputs change
  useEffect(() => {
    let isMounted = true;
    const render = async () => {
      if (!canvasRef.current) return;
      try {
        setValidationError(null);
        await renderQRToCanvas(canvasRef.current, currentConfig);
      } catch (err: any) {
        if (isMounted) {
          setValidationError(err.message || 'Failed to generate QR code');
        }
      }
    };
    render();
    return () => {
      isMounted = false;
    };
  }, [payloadType, fields, errorCorrection, qrSize, fgColor, bgColor, transparentBg]);

  // Handle Export PNG
  const handleDownloadPNG = (resolutionFactor: number = 2) => {
    if (!canvasRef.current) return;
    downloadCanvasAsPNG(canvasRef.current, {
      filename: `SFCode_QR_${payloadType}_${Date.now()}`,
      resolutionFactor,
      title: `${payloadType.toUpperCase()} QR Code`,
    });
    onShowToast(t.common.saved, 'success');
  };

  // Handle Export PDF
  const handleDownloadPDF = () => {
    if (!canvasRef.current) return;
    downloadCanvasAsPDF(canvasRef.current, {
      filename: `SFCode_QR_${payloadType}_${Date.now()}`,
      title: 'SFCode QR Code',
      subtitle: `Payload: ${currentConfig.rawPayload.slice(0, 60)}`,
      includeBrandFooter: true,
    });
    onShowToast(t.common.saved, 'success');
  };

  // Handle Export SVG
  const handleDownloadSVG = async () => {
    try {
      const svg = await renderQRToSVG(currentConfig);
      downloadSVG(svg, `SFCode_QR_${payloadType}_${Date.now()}`);
      onShowToast(t.common.saved, 'success');
    } catch {
      onShowToast('Failed to export SVG', 'error');
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
          // Fallback to text copy
          await navigator.clipboard.writeText(currentConfig.rawPayload);
          setCopied(true);
          onShowToast('Raw payload copied to clipboard!', 'info');
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
        id: 'qr-' + Date.now(),
        createdAt: Date.now(),
        type: 'qr',
        format: payloadType,
        title: fields.url || fields.eventTitle || fields.firstName || fields.wifiSsid || `${payloadType.toUpperCase()} Code`,
        payload: currentConfig.rawPayload,
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
          {t.qr.title}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          {t.qr.subtitle}
        </p>
      </div>

      {/* Main Generator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Payload Type Selector */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Payload Format
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {typeTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = payloadType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPayloadType(tab.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium transition-all text-left truncate ${
                      isActive
                        ? 'bg-[#007AFF] text-white shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Form Inputs based on PayloadType */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-4">
            {/* URL Form */}
            {payloadType === 'url' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.qr.fields.url}
                </label>
                <input
                  type="url"
                  value={fields.url || ''}
                  onChange={(e) => updateField('url', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>
            )}

            {/* Plain Text Form */}
            {payloadType === 'text' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.qr.fields.text}
                </label>
                <textarea
                  rows={4}
                  value={fields.text || ''}
                  onChange={(e) => updateField('text', e.target.value)}
                  placeholder="Enter arbitrary text or notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>
            )}

            {/* Wi-Fi Form */}
            {payloadType === 'wifi' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t.qr.fields.wifiSsid}
                  </label>
                  <input
                    type="text"
                    value={fields.wifiSsid || ''}
                    onChange={(e) => updateField('wifiSsid', e.target.value)}
                    placeholder="e.g. SFCode_Office_5G"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t.qr.fields.wifiPassword}
                  </label>
                  <input
                    type="text"
                    value={fields.wifiPassword || ''}
                    onChange={(e) => updateField('wifiPassword', e.target.value)}
                    placeholder="Network password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t.qr.fields.wifiEncryption}
                  </label>
                  <select
                    value={fields.wifiEncryption || 'WPA'}
                    onChange={(e) => updateField('wifiEncryption', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">No Encryption (Open)</option>
                  </select>
                </div>
              </div>
            )}

            {/* vCard Form */}
            {payloadType === 'vcard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.firstName}</label>
                  <input
                    type="text"
                    value={fields.firstName || ''}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] focus:ring-2 focus:ring-[#007AFF] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.lastName}</label>
                  <input
                    type="text"
                    value={fields.lastName || ''}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] focus:ring-2 focus:ring-[#007AFF] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.org}</label>
                  <input
                    type="text"
                    value={fields.org || ''}
                    onChange={(e) => updateField('org', e.target.value)}
                    className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] focus:ring-2 focus:ring-[#007AFF] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.jobTitle}</label>
                  <input
                    type="text"
                    value={fields.jobTitle || ''}
                    onChange={(e) => updateField('jobTitle', e.target.value)}
                    className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] focus:ring-2 focus:ring-[#007AFF] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.vcardPhone}</label>
                  <input
                    type="tel"
                    value={fields.vcardPhone || ''}
                    onChange={(e) => updateField('vcardPhone', e.target.value)}
                    className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] focus:ring-2 focus:ring-[#007AFF] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.vcardEmail}</label>
                  <input
                    type="email"
                    value={fields.vcardEmail || ''}
                    onChange={(e) => updateField('vcardEmail', e.target.value)}
                    className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] focus:ring-2 focus:ring-[#007AFF] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.vcardAddress}</label>
                  <input
                    type="text"
                    value={fields.vcardAddress || ''}
                    onChange={(e) => updateField('vcardAddress', e.target.value)}
                    className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] focus:ring-2 focus:ring-[#007AFF] outline-none"
                  />
                </div>
              </div>
            )}

            {/* Email Form */}
            {payloadType === 'email' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.emailTo}</label>
                  <input
                    type="email"
                    value={fields.emailTo || ''}
                    onChange={(e) => updateField('emailTo', e.target.value)}
                    placeholder="contact@example.com"
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.emailSubject}</label>
                  <input
                    type="text"
                    value={fields.emailSubject || ''}
                    onChange={(e) => updateField('emailSubject', e.target.value)}
                    placeholder="Inquiry or Feedback"
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.emailBody}</label>
                  <textarea
                    rows={3}
                    value={fields.emailBody || ''}
                    onChange={(e) => updateField('emailBody', e.target.value)}
                    placeholder="Pre-filled email message body..."
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>
            )}

            {/* Phone Form */}
            {payloadType === 'phone' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.phoneNumber}</label>
                <input
                  type="tel"
                  value={fields.phoneNumber || ''}
                  onChange={(e) => updateField('phoneNumber', e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>
            )}

            {/* SMS Form */}
            {payloadType === 'sms' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.smsNumber}</label>
                  <input
                    type="tel"
                    value={fields.smsNumber || ''}
                    onChange={(e) => updateField('smsNumber', e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.smsMessage}</label>
                  <textarea
                    rows={3}
                    value={fields.smsMessage || ''}
                    onChange={(e) => updateField('smsMessage', e.target.value)}
                    placeholder="Pre-filled SMS text..."
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>
            )}

            {/* Social Form */}
            {payloadType === 'social' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.socialPlatform}</label>
                  <select
                    value={fields.socialPlatform || 'twitter'}
                    onChange={(e) => updateField('socialPlatform', e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  >
                    <option value="twitter">X (Twitter)</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="github">GitHub</option>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.socialHandle}</label>
                  <input
                    type="text"
                    value={fields.socialHandle || ''}
                    onChange={(e) => updateField('socialHandle', e.target.value)}
                    placeholder="username or profile link"
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>
            )}

            {/* Geo Form */}
            {payloadType === 'geo' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.geoLat}</label>
                  <input
                    type="text"
                    value={fields.geoLat || ''}
                    onChange={(e) => updateField('geoLat', e.target.value)}
                    placeholder="23.8103"
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.geoLng}</label>
                  <input
                    type="text"
                    value={fields.geoLng || ''}
                    onChange={(e) => updateField('geoLng', e.target.value)}
                    placeholder="90.4125"
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.geoQuery}</label>
                  <input
                    type="text"
                    value={fields.geoQuery || ''}
                    onChange={(e) => updateField('geoQuery', e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>
            )}

            {/* Event Form */}
            {payloadType === 'event' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.eventTitle}</label>
                  <input
                    type="text"
                    value={fields.eventTitle || ''}
                    onChange={(e) => updateField('eventTitle', e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.eventLocation}</label>
                    <input
                      type="text"
                      value={fields.eventLocation || ''}
                      onChange={(e) => updateField('eventLocation', e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.eventStart}</label>
                    <input
                      type="text"
                      value={fields.eventStart || ''}
                      onChange={(e) => updateField('eventStart', e.target.value)}
                      placeholder="YYYYMMDDTHHMMSS"
                      className="px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Form */}
            {payloadType === 'payment' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.paymentType}</label>
                  <select
                    value={fields.paymentType || 'upi'}
                    onChange={(e) => updateField('paymentType', e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  >
                    <option value="upi">UPI (India)</option>
                    <option value="paypal">PayPal.me</option>
                    <option value="custom">Direct URL / Gateway</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.payee}</label>
                  <input
                    type="text"
                    value={fields.payee || ''}
                    onChange={(e) => updateField('payee', e.target.value)}
                    placeholder="user@upi or username"
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.amount}</label>
                  <input
                    type="number"
                    value={fields.amount || ''}
                    onChange={(e) => updateField('amount', e.target.value)}
                    placeholder="Optional amount"
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.currency}</label>
                  <input
                    type="text"
                    value={fields.currency || 'INR'}
                    onChange={(e) => updateField('currency', e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>
            )}

            {/* Image Link Form */}
            {payloadType === 'image_link' && (
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-[#007AFF] leading-relaxed">
                  {t.qr.fields.imageNotice}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.fields.imageUrl}</label>
                  <input
                    type="url"
                    value={fields.imageUrl || ''}
                    onChange={(e) => updateField('imageUrl', e.target.value)}
                    placeholder="https://drive.google.com/... or https://..."
                    className="px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>
            )}

            {/* Basic Color and Error Correction Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-black/5 dark:border-white/5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{t.qr.errorCorrection}</label>
                <select
                  value={errorCorrection}
                  onChange={(e) => setErrorCorrection(e.target.value as QRErrorCorrection)}
                  className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none"
                >
                  <option value="L">L (7% Recovery)</option>
                  <option value="M">M (15% Recovery - Standard)</option>
                  <option value="Q">Q (25% Recovery)</option>
                  <option value="H">H (30% Recovery - High)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Foreground Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs uppercase"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Background Color</label>
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

            {/* Error message */}
            {validationError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-20">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col items-center gap-5">
            <div className="w-full flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t.common.preview}
              </span>
              <button
                onClick={() => onNavigateToDesignLab(currentConfig)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#007AFF] hover:underline"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{t.common.edit}</span>
              </button>
            </div>

            {/* Canvas Viewport */}
            <div className="relative p-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5 flex items-center justify-center min-h-[300px] w-full max-w-[340px] aspect-square overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain rounded-xl shadow-xs"
              />
            </div>

            {/* Raw Payload display */}
            <div className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-black/5 dark:border-white/5">
              <span className="text-[10px] font-medium text-neutral-400 uppercase">Payload Encoded</span>
              <p className="text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate">
                {currentConfig.rawPayload || 'None'}
              </p>
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
