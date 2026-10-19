import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

export interface ExportOptions {
  filename: string;
  resolutionFactor?: number; // 1, 2, or 4
  includeBrandFooter?: boolean;
  title?: string;
  subtitle?: string;
  sku?: string;
  price?: string;
}

/**
 * Downloads a canvas element as high-resolution PNG.
 */
export function downloadCanvasAsPNG(
  canvas: HTMLCanvasElement,
  options: ExportOptions
): void {
  const { filename, resolutionFactor = 1 } = options;
  let targetCanvas = canvas;

  if (resolutionFactor > 1) {
    const highRes = document.createElement('canvas');
    highRes.width = canvas.width * resolutionFactor;
    highRes.height = canvas.height * resolutionFactor;
    const ctx = highRes.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false; // preserve crisp barcodes and QR dots
      ctx.drawImage(canvas, 0, 0, highRes.width, highRes.height);
      targetCanvas = highRes;
    }
  }

  const dataUrl = targetCanvas.toDataURL('image/png');
  triggerDownload(dataUrl, `${filename}.png`);
}

/**
 * Downloads raw SVG markup as an .svg file.
 */
export function downloadSVG(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${filename}.svg`);
  URL.revokeObjectURL(url);
}

/**
 * Exports code to a printable PDF document using jsPDF.
 */
export function downloadCanvasAsPDF(
  canvas: HTMLCanvasElement,
  options: ExportOptions
): void {
  const { filename, includeBrandFooter = true, title, subtitle, sku, price } = options;

  // Single-label format or standard A4 / Letter
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Document Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(23, 23, 25);
  doc.text(title || 'SFCode Generated Code', pageWidth / 2, 28, { align: 'center' });

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(110, 110, 115);
    doc.text(subtitle, pageWidth / 2, 36, { align: 'center' });
  }

  // Draw Code Image centered
  const imgData = canvas.toDataURL('image/png');
  const maxImgWidth = 120; // mm
  const aspectRatio = canvas.height / canvas.width;
  const imgWidth = maxImgWidth;
  const imgHeight = maxImgWidth * aspectRatio;
  const imgX = (pageWidth - imgWidth) / 2;
  const imgY = 48;

  // Draw a subtle border frame around the code
  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(imgX - 6, imgY - 6, imgWidth + 12, imgHeight + 12, 4, 4);

  doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);

  // Meta details below code
  let metaY = imgY + imgHeight + 18;
  if (sku || price) {
    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    const line = [sku ? `SKU: ${sku}` : '', price ? `PRICE: ${price}` : ''].filter(Boolean).join('   |   ');
    doc.text(line, pageWidth / 2, metaY, { align: 'center' });
    metaY += 10;
  }

  // Optional Brand Signature Footer
  if (includeBrandFooter) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 145);
    doc.text(
      'Generated with SFCode Studio · by SFCode - Shadat Fatih Code · Create. Customize. Connect.',
      pageWidth / 2,
      pageHeight - 16,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
}

/**
 * Creates and downloads a ZIP archive containing multiple generated codes and a CSV manifest.
 */
export async function createBatchZip(
  items: Array<{
    filename: string;
    canvas: HTMLCanvasElement;
    rowNumber: number;
    payload: string;
    format: string;
    title?: string;
  }>,
  zipFilename: string = 'sfcode_studio_batch.zip'
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('codes') || zip;

  // Manifest header
  const manifestRows: string[] = [
    'Row,File Name,Format,Title,Payload,Status',
  ];

  for (const item of items) {
    const pngBase64 = item.canvas.toDataURL('image/png').split(',')[1];
    folder.file(item.filename, pngBase64, { base64: true });

    // Escape CSV fields
    const escapedPayload = `"${item.payload.replace(/"/g, '""')}"`;
    const escapedTitle = `"${(item.title || '').replace(/"/g, '""')}"`;
    manifestRows.push(
      `${item.rowNumber},${item.filename},${item.format},${escapedTitle},${escapedPayload},Valid`
    );
  }

  // Add manifest.csv to root of zip
  zip.file('manifest.csv', manifestRows.join('\r\n'));

  // Add README.txt
  zip.file(
    'README.txt',
    `SFCode Studio Batch Export\r\nBrand: by SFCode - Shadat Fatih Code\r\nTagline: Create. Customize. Connect.\r\nTotal codes generated: ${items.length}\r\nExported at: ${new Date().toISOString()}\r\n`
  );

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  triggerDownload(downloadUrl, zipFilename);
  URL.revokeObjectURL(downloadUrl);
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
