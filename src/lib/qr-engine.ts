import QRCode from 'qrcode';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { QRConfig, QRPayloadType } from '../types';

/**
 * Format-specific payload builders complying with official standards.
 */
export function buildQRPayload(type: QRPayloadType, fields: Record<string, string>, rawPayload?: string): string {
  switch (type) {
    case 'text':
      return fields.text || rawPayload || '';

    case 'url': {
      const url = fields.url || rawPayload || '';
      if (!url) return '';
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    }

    case 'email': {
      const to = fields.emailTo || '';
      const subject = encodeURIComponent(fields.emailSubject || '');
      const body = encodeURIComponent(fields.emailBody || '');
      let mailto = `mailto:${to}`;
      const params = [];
      if (subject) params.push(`subject=${subject}`);
      if (body) params.push(`body=${body}`);
      if (params.length > 0) mailto += `?${params.join('&')}`;
      return mailto;
    }

    case 'phone': {
      const num = fields.phoneNumber || '';
      return num ? `tel:${num.replace(/\s+/g, '')}` : '';
    }

    case 'sms': {
      const num = fields.smsNumber || '';
      const msg = encodeURIComponent(fields.smsMessage || '');
      return num ? `sms:${num}?body=${msg}` : '';
    }

    case 'wifi': {
      const ssid = fields.wifiSsid || '';
      const type = fields.wifiEncryption || 'WPA';
      const pass = fields.wifiPassword || '';
      const hidden = fields.wifiHidden === 'true' ? 'true' : 'false';
      // Standard: WIFI:S:MySSID;T:WPA;P:MyPass;H:false;;
      return `WIFI:S:${ssid};T:${type};P:${pass};H:${hidden};;`;
    }

    case 'vcard': {
      const fn = `${fields.firstName || ''} ${fields.lastName || ''}`.trim();
      const n = `${fields.lastName || ''};${fields.firstName || ''};;;`;
      const org = fields.org || '';
      const title = fields.jobTitle || '';
      const tel = fields.vcardPhone || '';
      const email = fields.vcardEmail || '';
      const url = fields.vcardUrl || '';
      const adr = fields.vcardAddress || '';

      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${n}`,
        `FN:${fn || 'Contact'}`,
      ];
      if (org) lines.push(`ORG:${org}`);
      if (title) lines.push(`TITLE:${title}`);
      if (tel) lines.push(`TEL;TYPE=CELL:${tel}`);
      if (email) lines.push(`EMAIL;TYPE=INTERNET:${email}`);
      if (url) lines.push(`URL:${url}`);
      if (adr) lines.push(`ADR;TYPE=HOME:;;${adr};;;;`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }

    case 'social': {
      const platform = fields.socialPlatform || 'other';
      const handle = (fields.socialHandle || '').trim().replace(/^@/, '');
      if (!handle) return '';
      switch (platform) {
        case 'twitter':
          return `https://x.com/${handle}`;
        case 'instagram':
          return `https://instagram.com/${handle}`;
        case 'linkedin':
          return handle.startsWith('http') ? handle : `https://linkedin.com/in/${handle}`;
        case 'github':
          return `https://github.com/${handle}`;
        case 'youtube':
          return handle.startsWith('http') ? handle : `https://youtube.com/@${handle}`;
        case 'facebook':
          return handle.startsWith('http') ? handle : `https://facebook.com/${handle}`;
        case 'telegram':
          return `https://t.me/${handle}`;
        default:
          return handle.startsWith('http') ? handle : `https://${handle}`;
      }
    }

    case 'geo': {
      const lat = fields.geoLat || '';
      const lng = fields.geoLng || '';
      const q = encodeURIComponent(fields.geoQuery || '');
      if (!lat || !lng) return '';
      return q ? `geo:${lat},${lng}?q=${q}` : `geo:${lat},${lng}`;
    }

    case 'event': {
      const title = fields.eventTitle || 'Event';
      const location = fields.eventLocation || '';
      const desc = fields.eventDescription || '';
      const start = (fields.eventStart || '').replace(/[-:]/g, '');
      const end = (fields.eventEnd || '').replace(/[-:]/g, '');

      const lines = [
        'BEGIN:VEVENT',
        `SUMMARY:${title}`,
      ];
      if (start) lines.push(`DTSTART:${start}`);
      if (end) lines.push(`DTEND:${end}`);
      if (location) lines.push(`LOCATION:${location}`);
      if (desc) lines.push(`DESCRIPTION:${desc}`);
      lines.push('END:VEVENT');
      return lines.join('\n');
    }

    case 'payment': {
      const payType = fields.paymentType || 'upi';
      const payee = fields.payee || '';
      const amount = fields.amount || '';
      const currency = fields.currency || 'USD';
      const note = fields.paymentNote || '';

      if (payType === 'upi') {
        let uri = `upi://pay?pa=${payee}&pn=${encodeURIComponent(note || 'SFCode Pay')}`;
        if (amount) uri += `&am=${amount}`;
        uri += `&cu=${currency || 'INR'}`;
        return uri;
      }
      if (payType === 'paypal') {
        const user = payee.replace(/^https?:\/\/paypal\.me\//, '');
        return amount ? `https://paypal.me/${user}/${amount}` : `https://paypal.me/${user}`;
      }
      return payee.startsWith('http') ? payee : `https://${payee}`;
    }

    case 'image_link': {
      const url = fields.imageUrl || rawPayload || '';
      return url.startsWith('http') ? url : `https://${url}`;
    }

    default:
      return rawPayload || '';
  }
}

/**
 * Checks if a cell at (r, c) falls inside one of the three 7x7 Finder Patterns.
 */
function isFinderPattern(r: number, c: number, size: number): boolean {
  if (r < 7 && c < 7) return true; // Top-Left
  if (r < 7 && c >= size - 7) return true; // Top-Right
  if (r >= size - 7 && c < 7) return true; // Bottom-Left
  return false;
}

/**
 * Checks if a cell is in the outer ring (7x7 border) or inner center (3x3) of an eye.
 */
function getFinderPart(r: number, c: number, size: number): 'outer' | 'inner' | 'space' | 'none' {
  let er = r;
  let ec = c;

  if (r < 7 && c < 7) {
    // Top-left
  } else if (r < 7 && c >= size - 7) {
    ec = c - (size - 7);
  } else if (r >= size - 7 && c < 7) {
    er = r - (size - 7);
  } else {
    return 'none';
  }

  // 7x7 box:
  // Outer frame is er===0 || er===6 || ec===0 || ec===6
  if (er === 0 || er === 6 || ec === 0 || ec === 6) {
    return 'outer';
  }
  // Space is er===1 || er===5 || ec===1 || ec===5
  if (er === 1 || er === 5 || ec === 1 || ec === 5) {
    return 'space';
  }
  // Inner center is 2 <= er <= 4 and 2 <= ec <= 4
  if (er >= 2 && er <= 4 && ec >= 2 && ec <= 4) {
    return 'inner';
  }
  return 'space';
}

/**
 * Renders custom QR code onto an HTML canvas with module styles, gradients, finder eyes, center logo, and optional frame.
 */
export async function renderQRToCanvas(
  targetCanvas: HTMLCanvasElement,
  config: QRConfig,
  logoImageElement?: HTMLImageElement | null
): Promise<void> {
  const payload = config.rawPayload || buildQRPayload(config.payloadType, config.fields);
  if (!payload) {
    throw new Error('Payload cannot be empty');
  }

  // Force higher error correction if logo is present
  const ecLevel = (config.logo.url || logoImageElement) ? 'H' : config.errorCorrection;

  const qrData = QRCode.create(payload, {
    errorCorrectionLevel: ecLevel,
  });

  const matrix = qrData.modules;
  const modCount = matrix.size;

  // Margin modules (quiet zone)
  const marginMods = Math.max(config.margin || 2, 2);
  const totalModCount = modCount + marginMods * 2;

  // Cell size calculation based on target dimension
  const baseSize = config.size || 400;
  const cellSize = Math.floor(baseSize / totalModCount);
  const qrAreaSize = cellSize * totalModCount;

  // Frame dimension calculation
  const hasFrame = config.frame && config.frame.style !== 'none' && Boolean(config.frame.label);
  const frameHeight = hasFrame ? 56 : 0;
  const framePadding = hasFrame ? 16 : 0;

  const canvasWidth = qrAreaSize + framePadding * 2;
  const canvasHeight = qrAreaSize + framePadding * 2 + frameHeight;

  targetCanvas.width = canvasWidth;
  targetCanvas.height = canvasHeight;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  // 1. Fill Canvas Background
  if (!config.transparentBg) {
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  // Calculate QR grid offset (if top frame, push down)
  const isTopBanner = hasFrame && config.frame.style === 'banner-top';
  const qrOffsetX = framePadding + marginMods * cellSize;
  const qrOffsetY = framePadding + (isTopBanner ? frameHeight : 0) + marginMods * cellSize;

  // Create gradient style if enabled
  let moduleFillStyle: string | CanvasGradient = config.fgColor;
  if (config.gradient.enabled) {
    if (config.gradient.type === 'radial') {
      const centerX = qrOffsetX + (modCount * cellSize) / 2;
      const centerY = qrOffsetY + (modCount * cellSize) / 2;
      const radius = (modCount * cellSize) / 2;
      const radGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      radGrad.addColorStop(0, config.fgColor);
      radGrad.addColorStop(1, config.gradient.color2);
      moduleFillStyle = radGrad;
    } else {
      const angleRad = ((config.gradient.angle || 45) * Math.PI) / 180;
      const x1 = qrOffsetX;
      const y1 = qrOffsetY;
      const x2 = qrOffsetX + Math.cos(angleRad) * (modCount * cellSize);
      const y2 = qrOffsetY + Math.sin(angleRad) * (modCount * cellSize);
      const linGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      linGrad.addColorStop(0, config.fgColor);
      linGrad.addColorStop(1, config.gradient.color2);
      moduleFillStyle = linGrad;
    }
  }

  // Calculate Logo Exclusion Box if logo is present
  const hasLogo = Boolean(config.logo.url || logoImageElement);
  let logoStartMod = -1;
  let logoEndMod = -1;

  if (hasLogo) {
    const ratio = Math.min(Math.max(config.logo.sizeRatio || 0.22, 0.15), 0.28);
    const logoMods = Math.ceil(modCount * ratio);
    const padMods = config.logo.padding || 1;
    const centerMod = Math.floor(modCount / 2);
    const halfBox = Math.ceil(logoMods / 2) + padMods;
    logoStartMod = centerMod - halfBox;
    logoEndMod = centerMod + halfBox;
  }

  // 2. Render Data Modules (Excluding Eye Patterns and Center Logo area)
  ctx.fillStyle = moduleFillStyle;

  for (let r = 0; r < modCount; r++) {
    for (let c = 0; c < modCount; c++) {
      // Check if in Finder eye
      if (isFinderPattern(r, c, modCount)) continue;

      // Check if in Logo Exclusion area
      if (hasLogo && r >= logoStartMod && r <= logoEndMod && c >= logoStartMod && c <= logoEndMod) {
        continue;
      }

      // Check if module is active
      const isDark = matrix.get(c, r);
      if (!isDark) continue;

      const px = qrOffsetX + c * cellSize;
      const py = qrOffsetY + r * cellSize;

      drawModule(ctx, px, py, cellSize, config.dotStyle);
    }
  }

  // 3. Render Custom Finder Eyes (3 Corners)
  renderFinderEye(ctx, qrOffsetX, qrOffsetY, cellSize, config.eyeStyle, moduleFillStyle, config.bgColor, config.transparentBg);
  renderFinderEye(ctx, qrOffsetX + (modCount - 7) * cellSize, qrOffsetY, cellSize, config.eyeStyle, moduleFillStyle, config.bgColor, config.transparentBg);
  renderFinderEye(ctx, qrOffsetX, qrOffsetY + (modCount - 7) * cellSize, cellSize, config.eyeStyle, moduleFillStyle, config.bgColor, config.transparentBg);

  // 4. Render Center Logo
  if (hasLogo && logoImageElement) {
    const qrPixelWidth = modCount * cellSize;
    const logoPixelWidth = qrPixelWidth * (config.logo.sizeRatio || 0.22);
    const logoX = qrOffsetX + (qrPixelWidth - logoPixelWidth) / 2;
    const logoY = qrOffsetY + (qrPixelWidth - logoPixelWidth) / 2;
    const logoPad = 6;

    // Draw clean background pill/square under logo
    ctx.save();
    if (!config.transparentBg) {
      ctx.fillStyle = config.bgColor;
    } else {
      ctx.fillStyle = '#FFFFFF';
    }

    if (config.logo.circular) {
      ctx.beginPath();
      ctx.arc(logoX + logoPixelWidth / 2, logoY + logoPixelWidth / 2, logoPixelWidth / 2 + logoPad, 0, Math.PI * 2);
      ctx.fill();

      // Clip logo to circle
      ctx.beginPath();
      ctx.arc(logoX + logoPixelWidth / 2, logoY + logoPixelWidth / 2, logoPixelWidth / 2, 0, Math.PI * 2);
      ctx.clip();
    } else {
      const radius = 12;
      drawRoundedRect(ctx, logoX - logoPad, logoY - logoPad, logoPixelWidth + logoPad * 2, logoPixelWidth + logoPad * 2, radius);
      ctx.fill();

      // Clip logo to rounded rect
      ctx.beginPath();
      drawRoundedRect(ctx, logoX, logoY, logoPixelWidth, logoPixelWidth, radius - 2);
      ctx.clip();
    }

    ctx.drawImage(logoImageElement, logoX, logoY, logoPixelWidth, logoPixelWidth);
    ctx.restore();
  }

  // 5. Render Outer Frame / Banner if configured
  if (hasFrame) {
    const bannerColor = config.frame.color || config.fgColor;
    const textColor = config.frame.textColor || '#FFFFFF';
    const bannerY = isTopBanner ? framePadding : canvasHeight - framePadding - frameHeight;

    ctx.save();
    ctx.fillStyle = bannerColor;
    drawRoundedRect(ctx, framePadding, bannerY, canvasWidth - framePadding * 2, frameHeight, 14);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.fillText(config.frame.label, canvasWidth / 2, bannerY + frameHeight / 2);
    ctx.restore();
  }
}

function drawModule(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, style: string) {
  switch (style) {
    case 'dots': {
      ctx.beginPath();
      const r = size / 2;
      ctx.arc(x + r, y + r, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'rounded': {
      const r = size * 0.35;
      drawRoundedRect(ctx, x + 0.5, y + 0.5, size - 1, size - 1, r);
      ctx.fill();
      break;
    }
    case 'classy': {
      // Diamond shape
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y);
      ctx.lineTo(x + size, y + size / 2);
      ctx.lineTo(x + size / 2, y + size);
      ctx.lineTo(x, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'fluid': {
      // Organic rounded circle with small scale
      ctx.beginPath();
      const r = size * 0.44;
      ctx.arc(x + size / 2, y + size / 2, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'squares':
    default:
      ctx.fillRect(x, y, size, size);
      break;
  }
}

function renderFinderEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  style: string,
  fillColor: string | CanvasGradient,
  bgColor: string,
  transparent: boolean
) {
  const outerSize = 7 * cellSize;
  const innerSize = 3 * cellSize;
  const innerOffset = 2 * cellSize;

  ctx.save();
  ctx.fillStyle = fillColor;

  switch (style) {
    case 'circle': {
      // Circular outer ring
      ctx.beginPath();
      ctx.arc(x + outerSize / 2, y + outerSize / 2, outerSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Clear space
      ctx.fillStyle = transparent ? '#FFFFFF' : bgColor;
      ctx.beginPath();
      ctx.arc(x + outerSize / 2, y + outerSize / 2, (5 * cellSize) / 2, 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(x + outerSize / 2, y + outerSize / 2, innerSize / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'rounded': {
      const radius = cellSize * 2;
      drawRoundedRect(ctx, x, y, outerSize, outerSize, radius);
      ctx.fill();

      // Clear space
      ctx.fillStyle = transparent ? '#FFFFFF' : bgColor;
      drawRoundedRect(ctx, x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize, radius * 0.7);
      ctx.fill();

      // Inner pupil
      ctx.fillStyle = fillColor;
      drawRoundedRect(ctx, x + innerOffset, y + innerOffset, innerSize, innerSize, radius * 0.5);
      ctx.fill();
      break;
    }

    case 'leaf': {
      // Leaf style: top-left & bottom-right rounded, others sharp
      ctx.beginPath();
      ctx.moveTo(x + cellSize * 2.5, y);
      ctx.arcTo(x + outerSize, y, x + outerSize, y + outerSize, cellSize * 2.5);
      ctx.lineTo(x + outerSize, y + outerSize);
      ctx.arcTo(x, y + outerSize, x, y, cellSize * 2.5);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fill();

      // Clear space
      ctx.fillStyle = transparent ? '#FFFFFF' : bgColor;
      drawRoundedRect(ctx, x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize, cellSize);
      ctx.fill();

      // Inner pupil
      ctx.fillStyle = fillColor;
      drawRoundedRect(ctx, x + innerOffset, y + innerOffset, innerSize, innerSize, cellSize);
      ctx.fill();
      break;
    }

    case 'square':
    default: {
      // Classic square frame
      ctx.fillRect(x, y, outerSize, outerSize);

      // Clear space
      ctx.fillStyle = transparent ? '#FFFFFF' : bgColor;
      ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);

      // Inner pupil
      ctx.fillStyle = fillColor;
      ctx.fillRect(x + innerOffset, y + innerOffset, innerSize, innerSize);
      break;
    }
  }

  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export interface QRScanVerificationResult {
  valid: boolean;
  score: number; // 0 to 100
  decodedText?: string;
  warning?: string;
}

/**
 * Validates the generated QR canvas using an in-browser ZXing decoder.
 * Composites onto a clean solid white backing canvas first to avoid false-negatives on transparent PNGs.
 */
export async function verifyCanvasScanReliability(canvas: HTMLCanvasElement): Promise<QRScanVerificationResult> {
  try {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = canvas.width;
    testCanvas.height = canvas.height;
    const ctx = testCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');

    // Fill white backing so transparent backgrounds can still decode
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, testCanvas.width, testCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const reader = new BrowserMultiFormatReader();
    const result = await reader.decodeFromCanvas(testCanvas);
    if (result && result.getText()) {
      return {
        valid: true,
        score: 98,
        decodedText: result.getText(),
      };
    }
  } catch (err: any) {
    return {
      valid: false,
      score: 35,
      warning: 'Decoder could not read the stylized QR code. Increase foreground contrast or decrease center logo size.',
    };
  }

  return {
    valid: false,
    score: 40,
    warning: 'Unverified scan state.',
  };
}

/**
 * Renders QR code as standard vector SVG markup.
 */
export async function renderQRToSVG(config: QRConfig): Promise<string> {
  const payload = config.rawPayload || buildQRPayload(config.payloadType, config.fields);
  if (!payload) {
    throw new Error('Payload cannot be empty');
  }

  const svgString = await QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: config.errorCorrection,
    margin: config.margin || 2,
    color: {
      dark: config.fgColor,
      light: config.transparentBg ? '#00000000' : config.bgColor,
    },
  });

  return svgString;
}


