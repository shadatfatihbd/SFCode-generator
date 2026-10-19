import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { ScanResult } from '../types';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js';

export class ScannerAdapter {
  private reader: BrowserMultiFormatReader;
  private controls: IScannerControls | null = null;
  private currentStream: MediaStream | null = null;

  constructor() {
    this.reader = new BrowserMultiFormatReader();
  }

  /**
   * Retrieves available video input devices with permission check.
   */
  async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'videoinput');
    } catch {
      return [];
    }
  }

  /**
   * Starts camera decoding on a video element.
   */
  async startCamera(
    videoElement: HTMLVideoElement,
    deviceId: string | undefined,
    onResult: (result: ScanResult) => void,
    onError?: (err: Error) => void
  ): Promise<void> {
    this.stopCamera();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const err = new Error(
        'Camera API is not supported in this browser environment. Ensure you are accessing via HTTPS.'
      );
      if (onError) onError(err);
      throw err;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.currentStream;
      videoElement.setAttribute('playsinline', 'true');
      await videoElement.play();

      this.controls = await this.reader.decodeFromVideoElement(videoElement, (result, err) => {
        if (result && result.getText()) {
          const parsed = parseScannedPayload(result.getText());
          playScanChirp();
          onResult({
            id: 'scan-' + Date.now(),
            text: result.getText(),
            format: result.getBarcodeFormat() ? result.getBarcodeFormat().toString() : 'QR_CODE',
            timestamp: Date.now(),
            parsedType: parsed.type,
            parsedDetails: parsed.details,
          });
        }
      });
    } catch (err: any) {
      let friendlyMessage = 'Camera access failed.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyMessage = 'Camera permission was denied. Please allow camera permissions in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyMessage = 'No camera device found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        friendlyMessage = 'Camera is currently in use by another application.';
      } else if (err.message) {
        friendlyMessage = err.message;
      }

      const customErr = new Error(friendlyMessage);
      if (onError) onError(customErr);
      throw customErr;
    }
  }

  /**
   * Stops camera stream and decoder loop.
   */
  stopCamera(): void {
    if (this.controls) {
      this.controls.stop();
      this.controls = null;
    }
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }
  }

  /**
   * Toggles torch / flashlight if supported by active video track.
   */
  async toggleTorch(enabled: boolean): Promise<boolean> {
    if (!this.currentStream) return false;
    const track = this.currentStream.getVideoTracks()[0];
    if (!track) return false;

    const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
    if (!capabilities.torch) return false;

    try {
      await track.applyConstraints({
        advanced: [{ torch: enabled } as any],
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Decodes an uploaded image file (PNG, JPG, WebP, etc.) using dual-engine fallback:
   * 1. Native window.BarcodeDetector (if available)
   * 2. ZXing BrowserMultiFormatReader on ImageElement
   * 3. ZXing BrowserMultiFormatReader on Multi-Scale / Rotated Canvas
   */
  async decodeImageFile(file: File): Promise<ScanResult> {
    const imgUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image file.'));
        img.src = imgUrl;
      });

      // Pass 1: Native BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector();
          const barcodes = await detector.detect(img);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            playScanChirp();
            const text = barcodes[0].rawValue;
            const parsed = parseScannedPayload(text);
            return {
              id: 'scan-' + Date.now(),
              text,
              format: (barcodes[0].format || 'BARCODE').toUpperCase(),
              timestamp: Date.now(),
              parsedType: parsed.type,
              parsedDetails: parsed.details,
            };
          }
        } catch {
          // Fall through to ZXing
        }
      }

      // Pass 2: ZXing direct decodeFromImageElement
      try {
        const result = await this.reader.decodeFromImageElement(img);
        if (result && result.getText()) {
          playScanChirp();
          const parsed = parseScannedPayload(result.getText());
          return {
            id: 'scan-' + Date.now(),
            text: result.getText(),
            format: result.getBarcodeFormat() ? result.getBarcodeFormat().toString() : 'UNKNOWN',
            timestamp: Date.now(),
            parsedType: parsed.type,
            parsedDetails: parsed.details,
          };
        }
      } catch {
        // Fall through to canvas multi-scale pass
      }

      // Pass 3: Canvas multi-scale & orientation normalization pass
      const canvas = document.createElement('canvas');
      const maxDim = 1200;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        try {
          const res = await this.reader.decodeFromCanvas(canvas);
          if (res && res.getText()) {
            playScanChirp();
            const parsed = parseScannedPayload(res.getText());
            return {
              id: 'scan-' + Date.now(),
              text: res.getText(),
              format: res.getBarcodeFormat() ? res.getBarcodeFormat().toString() : 'UNKNOWN',
              timestamp: Date.now(),
              parsedType: parsed.type,
              parsedDetails: parsed.details,
            };
          }
        } catch {
          // Try 90-degree rotation (useful for vertical barcodes)
          const rotCanvas = document.createElement('canvas');
          rotCanvas.width = h;
          rotCanvas.height = w;
          const rotCtx = rotCanvas.getContext('2d');
          if (rotCtx) {
            rotCtx.translate(h / 2, w / 2);
            rotCtx.rotate((90 * Math.PI) / 180);
            rotCtx.drawImage(canvas, -w / 2, -h / 2);

            try {
              const rotRes = await this.reader.decodeFromCanvas(rotCanvas);
              if (rotRes && rotRes.getText()) {
                playScanChirp();
                const parsed = parseScannedPayload(rotRes.getText());
                return {
                  id: 'scan-' + Date.now(),
                  text: rotRes.getText(),
                  format: rotRes.getBarcodeFormat() ? rotRes.getBarcodeFormat().toString() : 'UNKNOWN',
                  timestamp: Date.now(),
                  parsedType: parsed.type,
                  parsedDetails: parsed.details,
                };
              }
            } catch {
              // Final fallback failed
            }
          }
        }
      }

      throw new Error('No barcode or QR code was detected in this image. Ensure the image is clear and adequately lit.');
    } finally {
      URL.revokeObjectURL(imgUrl);
    }
  }
}

/**
 * Parses scanned text into structured intent (URL, Wi-Fi, vCard, Phone, etc.).
 */
export function parseScannedPayload(raw: string): {
  type: 'url' | 'wifi' | 'vcard' | 'phone' | 'sms' | 'email' | 'geo' | 'text';
  details: Record<string, string>;
} {
  const text = raw.trim();

  // 1. Wi-Fi: WIFI:S:SSID;T:WPA;P:Pass;;
  if (text.startsWith('WIFI:') || text.startsWith('wifi:')) {
    const details: Record<string, string> = {};
    const parts = text.slice(5).split(';');
    for (const part of parts) {
      if (part.startsWith('S:')) details.ssid = part.slice(2);
      else if (part.startsWith('T:')) details.type = part.slice(2);
      else if (part.startsWith('P:')) details.password = part.slice(2);
      else if (part.startsWith('H:')) details.hidden = part.slice(2);
    }
    return { type: 'wifi', details };
  }

  // 2. vCard: BEGIN:VCARD ... END:VCARD
  if (text.includes('BEGIN:VCARD')) {
    const details: Record<string, string> = {};
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith('FN:')) details.name = line.slice(3);
      else if (line.startsWith('TEL')) {
        const parts = line.split(':');
        details.phone = parts.slice(1).join(':');
      } else if (line.startsWith('EMAIL')) {
        const parts = line.split(':');
        details.email = parts.slice(1).join(':');
      } else if (line.startsWith('ORG:')) details.org = line.slice(4);
      else if (line.startsWith('TITLE:')) details.title = line.slice(6);
      else if (line.startsWith('URL:')) details.url = line.slice(4);
      else if (line.startsWith('ADR')) {
        const parts = line.split(':');
        details.address = parts.slice(1).join(':').replace(/;+/g, ', ').trim();
      }
    }
    return { type: 'vcard', details };
  }

  // 3. URLs
  if (/^https?:\/\//i.test(text) || /^www\./i.test(text)) {
    const url = text.startsWith('www.') ? `https://${text}` : text;
    let isSuspicious = false;
    try {
      const u = new URL(url);
      if (u.protocol === 'http:') isSuspicious = true; // Unencrypted
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(u.hostname)) isSuspicious = true; // Raw IP
    } catch {
      isSuspicious = true;
    }
    return {
      type: 'url',
      details: {
        url,
        isSuspicious: isSuspicious ? 'true' : 'false',
      },
    };
  }

  // 4. Tel
  if (/^tel:/i.test(text)) {
    return { type: 'phone', details: { number: text.slice(4) } };
  }

  // 5. SMS
  if (/^sms:/i.test(text)) {
    const [numPart, query] = text.slice(4).split('?');
    const details: Record<string, string> = { number: numPart };
    if (query && query.includes('body=')) {
      details.message = decodeURIComponent(query.replace(/.*body=/, ''));
    }
    return { type: 'sms', details };
  }

  // 6. Mailto
  if (/^mailto:/i.test(text)) {
    const [toPart, query] = text.slice(7).split('?');
    const details: Record<string, string> = { to: toPart };
    if (query) {
      const params = new URLSearchParams(query);
      if (params.get('subject')) details.subject = params.get('subject')!;
      if (params.get('body')) details.body = params.get('body')!;
    }
    return { type: 'email', details };
  }

  // 7. Geo
  if (/^geo:/i.test(text)) {
    const [coords, query] = text.slice(4).split('?');
    const [lat, lng] = coords.split(',');
    return {
      type: 'geo',
      details: {
        latitude: lat,
        longitude: lng,
        query: query ? decodeURIComponent(query.replace('q=', '')) : '',
      },
    };
  }

  return { type: 'text', details: { text } };
}

/**
 * Downloads a vCard as a .vcf contact file.
 */
export function downloadVCard(name: string, vcardContent: string): void {
  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.replace(/\s+/g, '_') || 'contact'}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an in-memory sample code image file to test the scanner in 1 click.
 */
export async function createSampleScanFile(type: 'qr' | 'barcode'): Promise<File> {
  const canvas = document.createElement('canvas');

  if (type === 'qr') {
    canvas.width = 400;
    canvas.height = 400;
    await QRCode.toCanvas(canvas, 'https://sfcode.studio - Universal Suite by Shadat Fatih Code', {
      width: 400,
      margin: 3,
      errorCorrectionLevel: 'M',
    });
  } else {
    canvas.width = 500;
    canvas.height = 200;
    bwipjs.toCanvas(canvas, {
      bcid: 'code128',
      text: 'SFCODE-INV-2026',
      scale: 3,
      height: 18,
      includetext: true,
      textxalign: 'center',
      paddingwidth: 15,
      paddingheight: 15,
      backgroundcolor: 'ffffff',
    });
  }

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], `sample_${type}.png`, { type: 'image/png' }));
      } else {
        reject(new Error('Failed to create sample scan image'));
      }
    }, 'image/png');
  });
}

/**
 * Synthesizes an Apple-style scan confirmation chirp using Web Audio API.
 */
function playScanChirp() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6
    osc.frequency.exponentialRampToValueAtTime(2637, ctx.currentTime + 0.08); // E7

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {
    // Audio might be blocked if no user interaction
  }
}
