import bwipjs from 'bwip-js';
import { BarcodeConfig, BarcodeFormat } from '../types';

export interface BarcodeFormatMeta {
  id: BarcodeFormat;
  name: string;
  bcid: string;
  category: 'retail' | 'logistics' | 'industrial' | '2d';
  description: string;
  placeholder: string;
  checksumType?: 'mod10' | 'built-in';
  sampleValue: string;
}

export const BARCODE_FORMATS: BarcodeFormatMeta[] = [
  {
    id: 'code128',
    name: 'Code 128',
    bcid: 'code128',
    category: 'logistics',
    description: 'High-density universal alphanumeric barcode for shipping, packaging, and internal tracking.',
    placeholder: 'SFCODE-INV-2026',
    sampleValue: 'SFCODE-LOG-84920',
  },
  {
    id: 'ean13',
    name: 'EAN-13 (GTIN-13)',
    bcid: 'ean13',
    category: 'retail',
    description: 'Global standard for consumer retail products outside North America (12 or 13 digits).',
    placeholder: '890123456789',
    checksumType: 'mod10',
    sampleValue: '5901234123457',
  },
  {
    id: 'upca',
    name: 'UPC-A (GTIN-12)',
    bcid: 'upca',
    category: 'retail',
    description: 'Standard retail product barcode widely used across North America (11 or 12 digits).',
    placeholder: '01234567890',
    checksumType: 'mod10',
    sampleValue: '012345678905',
  },
  {
    id: 'ean8',
    name: 'EAN-8 (GTIN-8)',
    bcid: 'ean8',
    category: 'retail',
    description: 'Compact retail barcode for small packaging where EAN-13 is too wide (7 or 8 digits).',
    placeholder: '9638507',
    checksumType: 'mod10',
    sampleValue: '96385074',
  },
  {
    id: 'upce',
    name: 'UPC-E',
    bcid: 'upce',
    category: 'retail',
    description: 'Zero-suppressed compact version of UPC-A for small retail items (6, 7, or 8 digits).',
    placeholder: '0123456',
    sampleValue: '01234565',
  },
  {
    id: 'code39',
    name: 'Code 39',
    bcid: 'code39',
    category: 'industrial',
    description: 'Widely used in automotive, electronics, inventory, and government applications.',
    placeholder: 'PROD-4098-X',
    sampleValue: 'SF-PROD-2026',
  },
  {
    id: 'itf14',
    name: 'ITF-14 (Interleaved 2 of 5)',
    bcid: 'itf14',
    category: 'logistics',
    description: 'Heavyweight shipping carton and pallet barcode printed directly on corrugated cardboard (13 or 14 digits).',
    placeholder: '1001234567890',
    checksumType: 'mod10',
    sampleValue: '10012345678902',
  },
  {
    id: 'codabar',
    name: 'Codabar (USD-4)',
    bcid: 'rationalizedCodabar',
    category: 'industrial',
    description: 'Classic format utilized in library lending systems, blood banks, and air freight bills.',
    placeholder: 'A12345678B',
    sampleValue: 'A12345678B',
  },
  {
    id: 'gs1-128',
    name: 'GS1-128',
    bcid: 'gs1-128',
    category: 'logistics',
    description: 'Structured enterprise logistics barcode with Application Identifiers like (01) GTIN, (10) Batch, (17) Expiry.',
    placeholder: '(01)05901234123457(10)BATCH26',
    sampleValue: '(01)05901234123457(10)LOT998',
  },
  {
    id: 'datamatrix',
    name: 'Data Matrix (2D)',
    bcid: 'datamatrix',
    category: '2d',
    description: 'High-capacity 2D matrix standard for tiny electronics, pharmaceuticals, and GS1 healthcare.',
    placeholder: 'SFCODE-DM-994821',
    sampleValue: 'SFCODE-DM-994821',
  },
  {
    id: 'pdf417',
    name: 'PDF417 (2D)',
    bcid: 'pdf417',
    category: '2d',
    description: 'Stacked 2D barcode format for transport boarding passes, commercial shipping, and ID badges.',
    placeholder: 'SFCODE-PASSENGER-BOARDING-894',
    sampleValue: 'SFCODE-PASSENGER-BOARDING-894',
  },
];

/**
 * Calculates standard Modulo-10 checksum for EAN/UPC/ITF.
 */
export function calculateMod10(digitsWithoutCheck: string, isEan13OrUpcA: boolean = true): number {
  let sum = 0;
  const len = digitsWithoutCheck.length;
  for (let i = 0; i < len; i++) {
    const digit = parseInt(digitsWithoutCheck[len - 1 - i], 10);
    const weight = i % 2 === 0 ? 3 : 1;
    sum += digit * weight;
  }
  return (10 - (sum % 10)) % 10;
}

export interface BarcodeValidationResult {
  valid: boolean;
  normalizedValue: string;
  errorMessage?: string;
  checksumNote?: string;
}

export function validateAndNormalizeBarcode(format: BarcodeFormat, input: string): BarcodeValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, normalizedValue: '', errorMessage: 'Value cannot be empty' };
  }

  const digitsOnly = trimmed.replace(/\D/g, '');

  switch (format) {
    case 'ean13': {
      if (digitsOnly.length === 12) {
        const check = calculateMod10(digitsOnly);
        return {
          valid: true,
          normalizedValue: digitsOnly + check,
          checksumNote: `Computed Mod-10 Checksum: ${check}`,
        };
      }
      if (digitsOnly.length === 13) {
        const expected = calculateMod10(digitsOnly.slice(0, 12));
        const actual = parseInt(digitsOnly[12], 10);
        if (expected !== actual) {
          return {
            valid: false,
            normalizedValue: digitsOnly,
            errorMessage: `Invalid EAN-13 checksum! Expected ${expected}, got ${actual}.`,
          };
        }
        return { valid: true, normalizedValue: digitsOnly };
      }
      return {
        valid: false,
        normalizedValue: trimmed,
        errorMessage: 'EAN-13 requires exactly 12 or 13 numeric digits.',
      };
    }

    case 'ean8': {
      if (digitsOnly.length === 7) {
        const check = calculateMod10(digitsOnly);
        return {
          valid: true,
          normalizedValue: digitsOnly + check,
          checksumNote: `Computed Mod-10 Checksum: ${check}`,
        };
      }
      if (digitsOnly.length === 8) {
        const expected = calculateMod10(digitsOnly.slice(0, 7));
        const actual = parseInt(digitsOnly[7], 10);
        if (expected !== actual) {
          return {
            valid: false,
            normalizedValue: digitsOnly,
            errorMessage: `Invalid EAN-8 checksum! Expected ${expected}, got ${actual}.`,
          };
        }
        return { valid: true, normalizedValue: digitsOnly };
      }
      return {
        valid: false,
        normalizedValue: trimmed,
        errorMessage: 'EAN-8 requires exactly 7 or 8 numeric digits.',
      };
    }

    case 'upca': {
      if (digitsOnly.length === 11) {
        const check = calculateMod10(digitsOnly);
        return {
          valid: true,
          normalizedValue: digitsOnly + check,
          checksumNote: `Computed Mod-10 Checksum: ${check}`,
        };
      }
      if (digitsOnly.length === 12) {
        const expected = calculateMod10(digitsOnly.slice(0, 11));
        const actual = parseInt(digitsOnly[11], 10);
        if (expected !== actual) {
          return {
            valid: false,
            normalizedValue: digitsOnly,
            errorMessage: `Invalid UPC-A checksum! Expected ${expected}, got ${actual}.`,
          };
        }
        return { valid: true, normalizedValue: digitsOnly };
      }
      return {
        valid: false,
        normalizedValue: trimmed,
        errorMessage: 'UPC-A requires exactly 11 or 12 numeric digits.',
      };
    }

    case 'upce': {
      if (/^\d{6,8}$/.test(digitsOnly)) {
        return { valid: true, normalizedValue: digitsOnly };
      }
      return {
        valid: false,
        normalizedValue: trimmed,
        errorMessage: 'UPC-E requires 6, 7, or 8 numeric digits.',
      };
    }

    case 'itf14': {
      if (digitsOnly.length === 13) {
        const check = calculateMod10(digitsOnly);
        return {
          valid: true,
          normalizedValue: digitsOnly + check,
          checksumNote: `Computed Mod-10 Checksum: ${check}`,
        };
      }
      if (digitsOnly.length === 14) {
        const expected = calculateMod10(digitsOnly.slice(0, 13));
        const actual = parseInt(digitsOnly[13], 10);
        if (expected !== actual) {
          return {
            valid: false,
            normalizedValue: digitsOnly,
            errorMessage: `Invalid ITF-14 checksum! Expected ${expected}, got ${actual}.`,
          };
        }
        return { valid: true, normalizedValue: digitsOnly };
      }
      return {
        valid: false,
        normalizedValue: trimmed,
        errorMessage: 'ITF-14 requires 13 or 14 numeric digits.',
      };
    }

    case 'code39': {
      const upper = trimmed.toUpperCase();
      if (!/^[0-9A-Z\-\.\ \$\/\+\%]+$/.test(upper)) {
        return {
          valid: false,
          normalizedValue: upper,
          errorMessage: 'Code 39 only allows A-Z, 0-9, and - . $ / + % [space]',
        };
      }
      return { valid: true, normalizedValue: upper };
    }

    case 'codabar': {
      let upper = trimmed.toUpperCase();
      if (!/^[ABCD]/.test(upper)) upper = 'A' + upper;
      if (!/[ABCD]$/.test(upper)) upper = upper + 'B';
      if (!/^[ABCD][0-9\-\$\:\/\.\+]+[ABCD]$/.test(upper)) {
        return {
          valid: false,
          normalizedValue: upper,
          errorMessage: 'Codabar only accepts digits, - $ : / . + with start/stop A, B, C, D.',
        };
      }
      return { valid: true, normalizedValue: upper };
    }

    case 'gs1-128': {
      return { valid: true, normalizedValue: trimmed };
    }

    case 'code128':
    case 'datamatrix':
    case 'pdf417':
    default:
      return { valid: true, normalizedValue: trimmed };
  }
}

/**
 * Render barcode onto an HTML Canvas using bwip-js with high-DPI and custom styling.
 */
export async function renderBarcodeToCanvas(
  targetCanvas: HTMLCanvasElement,
  config: BarcodeConfig
): Promise<void> {
  const formatMeta = BARCODE_FORMATS.find((f) => f.id === config.format) || BARCODE_FORMATS[0];
  const validation = validateAndNormalizeBarcode(config.format, config.text);
  if (!validation.valid) {
    throw new Error(validation.errorMessage || 'Invalid barcode value');
  }

  // Create temporary off-screen canvas for bwip-js rendering
  const offscreen = document.createElement('canvas');

  // Convert hex color to bwip hex (strip '#')
  const barColorClean = config.barColor.replace('#', '');
  const bgColorClean = config.bgColor.replace('#', '');

  await new Promise<void>((resolve, reject) => {
    try {
      bwipjs.toCanvas(offscreen, {
        bcid: formatMeta.bcid,
        text: validation.normalizedValue,
        scale: config.scale || 3,
        height: config.height || 15,
        includetext: config.includeText,
        textxalign: 'center',
        barcolor: barColorClean,
        backgroundcolor: config.transparentBg ? undefined : bgColorClean,
        paddingwidth: 10,
        paddingheight: 10,
      });
      resolve();
    } catch (err: any) {
      reject(err);
    }
  });

  // Calculate dimensions including optional header caption, SKU, price, footer
  const hasHeader = Boolean(config.caption || config.sku);
  const hasPrice = Boolean(config.price);
  const headerHeight = hasHeader ? 46 : 0;
  const priceHeight = hasPrice ? 36 : 0;
  const padding = 20;

  const totalWidth = Math.max(offscreen.width + padding * 2, 280);
  const totalHeight = offscreen.height + headerHeight + priceHeight + padding * 2;

  targetCanvas.width = totalWidth;
  targetCanvas.height = totalHeight;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  // Fill background
  if (!config.transparentBg) {
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, totalWidth, totalHeight);
  } else {
    ctx.clearRect(0, 0, totalWidth, totalHeight);
  }

  let currentY = padding;

  // Draw Header Caption & SKU
  if (hasHeader) {
    ctx.fillStyle = config.barColor;
    ctx.textAlign = 'center';
    if (config.caption) {
      ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
      ctx.fillText(config.caption, totalWidth / 2, currentY + 16);
    }
    if (config.sku) {
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#6E6E73';
      ctx.fillText(`SKU: ${config.sku}`, totalWidth / 2, currentY + 32);
    }
    currentY += headerHeight;
  }

  // Draw bwip-js barcode canvas centered
  const barcodeX = (totalWidth - offscreen.width) / 2;
  ctx.drawImage(offscreen, barcodeX, currentY);
  currentY += offscreen.height;

  // Draw Price
  if (hasPrice) {
    ctx.fillStyle = config.barColor;
    ctx.textAlign = 'center';
    ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.fillText(`${config.currency || '$'}${config.price}`, totalWidth / 2, currentY + 18);
  }
}

/**
 * Renders barcode as standard vector SVG markup.
 */
export function renderBarcodeToSVG(config: BarcodeConfig): string {
  const formatMeta = BARCODE_FORMATS.find((f) => f.id === config.format) || BARCODE_FORMATS[0];
  const validation = validateAndNormalizeBarcode(config.format, config.text);
  if (!validation.valid) {
    throw new Error(validation.errorMessage || 'Invalid barcode value');
  }

  const barColorClean = config.barColor.replace('#', '');
  const bgColorClean = config.bgColor.replace('#', '');

  return bwipjs.toSVG({
    bcid: formatMeta.bcid,
    text: validation.normalizedValue,
    scale: config.scale || 3,
    height: config.height || 15,
    includetext: config.includeText,
    textxalign: 'center',
    barcolor: barColorClean,
    backgroundcolor: config.transparentBg ? undefined : bgColorClean,
    paddingwidth: 10,
    paddingheight: 10,
  });
}

