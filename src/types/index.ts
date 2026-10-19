export type AppTab =
  | 'home'
  | 'create-qr'
  | 'create-barcode'
  | 'scan'
  | 'design-lab'
  | 'batch'
  | 'history'
  | 'favorites'
  | 'settings'
  | 'about';

export type QRPayloadType =
  | 'text'
  | 'url'
  | 'email'
  | 'phone'
  | 'sms'
  | 'wifi'
  | 'vcard'
  | 'social'
  | 'geo'
  | 'event'
  | 'payment'
  | 'image_link';

export type QRErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export type QRDotStyle = 'squares' | 'dots' | 'rounded' | 'classy' | 'fluid';

export type QREyeStyle = 'square' | 'rounded' | 'circle' | 'leaf';

export interface QRConfig {
  payloadType: QRPayloadType;
  rawPayload: string;
  fields: Record<string, string>;
  errorCorrection: QRErrorCorrection;
  size: number;
  margin: number;
  dotStyle: QRDotStyle;
  eyeStyle: QREyeStyle;
  fgColor: string;
  bgColor: string;
  transparentBg: boolean;
  gradient: {
    enabled: boolean;
    type: 'linear' | 'radial';
    color2: string;
    angle: number;
  };
  logo: {
    url: string | null;
    sizeRatio: number; // 0.15 to 0.28
    padding: number;
    circular: boolean;
  };
  frame: {
    style: 'none' | 'simple' | 'banner-bottom' | 'banner-top';
    label: string;
    color: string;
    textColor: string;
  };
}

export type BarcodeFormat =
  | 'code128'
  | 'code39'
  | 'ean13'
  | 'ean8'
  | 'upca'
  | 'upce'
  | 'itf14'
  | 'codabar'
  | 'datamatrix'
  | 'pdf417'
  | 'gs1-128';

export interface BarcodeConfig {
  format: BarcodeFormat;
  text: string;
  includeText: boolean;
  height: number;
  scale: number;
  barColor: string;
  bgColor: string;
  transparentBg: boolean;
  caption: string;
  sku: string;
  price: string;
  currency: string;
}

export interface HistoryItem {
  id: string;
  createdAt: number;
  type: 'qr' | 'barcode';
  format: string;
  title: string;
  payload: string;
  config: QRConfig | BarcodeConfig;
  isFavorite: boolean;
  thumbnailDataUrl?: string;
}

export interface BatchItem {
  id: string;
  rowNumber: number;
  input: string;
  format: string;
  title?: string;
  sku?: string;
  price?: string;
  status: 'pending' | 'valid' | 'invalid';
  errorMessage?: string;
  renderedDataUrl?: string;
}

export interface ScanResult {
  id: string;
  text: string;
  format: string;
  timestamp: number;
  parsedType: 'url' | 'wifi' | 'vcard' | 'phone' | 'sms' | 'email' | 'geo' | 'text';
  parsedDetails: Record<string, string>;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'bn';
  exportResolution: 1 | 2 | 4;
  includeBrandFooter: boolean;
  defaultExportFormat: 'png' | 'pdf' | 'svg';
  scannerBeep: boolean;
}
