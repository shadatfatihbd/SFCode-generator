import React, { useState, useRef } from 'react';
import {
  Layers,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { BatchItem, BarcodeFormat } from '../../types';
import { BARCODE_FORMATS, validateAndNormalizeBarcode, renderBarcodeToCanvas } from '../../lib/barcode-engine';
import { renderQRToCanvas } from '../../lib/qr-engine';
import { createBatchZip, downloadCanvasAsPNG } from '../../lib/export-engine';
import { useTranslation } from '../../i18n';

interface BatchViewProps {
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const BatchView: React.FC<BatchViewProps> = ({ onShowToast }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [inputMode, setInputMode] = useState<'paste' | 'csv'>('paste');
  const [pastedText, setPastedText] = useState<string>(
    'https://sfcode.studio/product/1, Pro Headset, SKU-101, 99.00\nhttps://sfcode.studio/product/2, Ultra Camera, SKU-102, 499.00\nhttps://sfcode.studio/product/3, Smart Watch, SKU-103, 199.00\nhttps://sfcode.studio/product/4, Studio Mic, SKU-104, 79.00'
  );

  const [selectedFormat, setSelectedFormat] = useState<string>('qr');
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [renderedCanvases, setRenderedCanvases] = useState<Map<string, HTMLCanvasElement>>(new Map());

  // Handle Parse & Process Batch
  const handleProcessBatch = async () => {
    setIsProcessing(true);
    const lines = pastedText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      onShowToast('Please provide lines or upload a CSV file.', 'error');
      setIsProcessing(false);
      return;
    }

    const processedItems: BatchItem[] = [];
    const canvasMap = new Map<string, HTMLCanvasElement>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if line is CSV comma separated: payload, title, sku, price
      const parts = line.split(',').map((p) => p.trim());
      const rawPayload = parts[0] || '';
      const title = parts[1] || '';
      const sku = parts[2] || '';
      const price = parts[3] || '';

      const id = `batch-${i + 1}-${Date.now()}`;
      const item: BatchItem = {
        id,
        rowNumber: i + 1,
        input: rawPayload,
        format: selectedFormat,
        title,
        sku,
        price,
        status: 'pending',
      };

      if (!rawPayload) {
        item.status = 'invalid';
        item.errorMessage = 'Empty payload';
        processedItems.push(item);
        continue;
      }

      // Render based on selected format
      const canvas = document.createElement('canvas');

      try {
        if (selectedFormat === 'qr') {
          await renderQRToCanvas(canvas, {
            payloadType: 'url',
            rawPayload,
            fields: { url: rawPayload },
            errorCorrection: 'M',
            size: 380,
            margin: 2,
            dotStyle: 'squares',
            eyeStyle: 'square',
            fgColor: '#000000',
            bgColor: '#FFFFFF',
            transparentBg: false,
            gradient: { enabled: false, type: 'linear', color2: '#007AFF', angle: 45 },
            logo: { url: null, sizeRatio: 0.2, padding: 1, circular: true },
            frame: { style: 'none', label: '', color: '#000000', textColor: '#FFFFFF' },
          });
          item.status = 'valid';
          item.renderedDataUrl = canvas.toDataURL('image/png');
          canvasMap.set(id, canvas);
        } else {
          // Barcode format
          const valResult = validateAndNormalizeBarcode(selectedFormat as BarcodeFormat, rawPayload);
          if (!valResult.valid) {
            item.status = 'invalid';
            item.errorMessage = valResult.errorMessage || 'Invalid barcode value';
          } else {
            await renderBarcodeToCanvas(canvas, {
              format: selectedFormat as BarcodeFormat,
              text: valResult.normalizedValue,
              includeText: true,
              height: 16,
              scale: 3,
              barColor: '#000000',
              bgColor: '#FFFFFF',
              transparentBg: false,
              caption: title,
              sku,
              price,
              currency: '$',
            });
            item.status = 'valid';
            item.renderedDataUrl = canvas.toDataURL('image/png');
            canvasMap.set(id, canvas);
          }
        }
      } catch (err: any) {
        item.status = 'invalid';
        item.errorMessage = err.message || 'Generation failed';
      }

      processedItems.push(item);
    }

    setItems(processedItems);
    setRenderedCanvases(canvasMap);
    setIsProcessing(false);
    onShowToast(`Processed ${processedItems.length} records.`, 'success');
  };

  // CSV File Upload
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      // Filter out header line if starts with payload / code / data
      const rawLines = content.split(/\r?\n/).filter(Boolean);
      if (rawLines.length > 0 && /payload|url|code|data/i.test(rawLines[0])) {
        rawLines.shift(); // Remove CSV header
      }
      setPastedText(rawLines.join('\n'));
      onShowToast(`Loaded ${rawLines.length} rows from CSV.`, 'info');
    };
    reader.readAsText(file);
  };

  // Download Sample CSV
  const handleDownloadSampleCSV = () => {
    const sample = 'payload,title,sku,price\r\nhttps://sfcode.studio/item1,Wireless Earbuds,SKU-EAR-101,49.99\r\nhttps://sfcode.studio/item2,Noise Canceling Pro,SKU-EAR-102,129.99\r\nhttps://sfcode.studio/item3,Charging Case,SKU-EAR-103,29.99';
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sfcode_batch_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download All as ZIP
  const handleDownloadAllZip = async () => {
    const validItems = items.filter((it) => it.status === 'valid');
    if (validItems.length === 0) {
      onShowToast('No valid records to export.', 'error');
      return;
    }

    const zipItems = validItems.map((it) => {
      const canvas = renderedCanvases.get(it.id)!;
      const cleanName = `${String(it.rowNumber).padStart(3, '0')}_${it.format}_${it.sku || 'code'}`;
      return {
        filename: `${cleanName}.png`,
        canvas,
        rowNumber: it.rowNumber,
        payload: it.input,
        format: it.format,
        title: it.title,
      };
    });

    try {
      onShowToast('Compressing batch files into ZIP...', 'info');
      await createBatchZip(zipItems, `SFCode_Batch_${selectedFormat}_${Date.now()}.zip`);
      onShowToast('Batch ZIP exported successfully!', 'success');
    } catch {
      onShowToast('Failed to create ZIP', 'error');
    }
  };

  const validCount = items.filter((i) => i.status === 'valid').length;
  const invalidCount = items.filter((i) => i.status === 'invalid').length;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-8">
      {/* Header bar */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl sm:text-2xl font-bold text-[#171719] dark:text-[#F5F5F7] tracking-tight">
          {t.batch.title}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          {t.batch.subtitle}
        </p>
      </div>

      {/* Input Configuration Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Format selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {t.batch.selectFormat}
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm text-[#171719] dark:text-[#F5F5F7] outline-none"
            >
              <option value="qr">QR Code (Standard 2D)</option>
              {BARCODE_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.category})
                </option>
              ))}
            </select>
          </div>

          {/* Input Method Toggle */}
          <div className="flex items-center gap-2 self-start sm:self-end">
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                inputMode === 'paste'
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {t.batch.pasteMode}
            </button>
            <button
              onClick={() => setInputMode('csv')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                inputMode === 'csv'
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {t.batch.csvMode}
            </button>
            <button
              onClick={handleDownloadSampleCSV}
              className="px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-[#007AFF] transition-colors"
              title="Download CSV Template"
            >
              Sample CSV
            </button>
          </div>
        </div>

        {/* Input Text Area or File Selector */}
        {inputMode === 'paste' ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Enter Payloads (One per line, optional comma: payload, title, sku, price)
            </label>
            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={t.batch.pastePlaceholder}
              className="w-full px-3.5 py-2.5 font-mono rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-[#171719] dark:text-[#F5F5F7] outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer p-8 rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 hover:border-[#007AFF] text-center flex flex-col items-center gap-2"
            >
              <Upload className="w-6 h-6 text-[#007AFF]" />
              <span className="text-xs font-semibold text-[#171719] dark:text-[#F5F5F7]">
                Click to browse CSV spreadsheet file
              </span>
              <span className="text-[11px] text-neutral-400">
                {t.batch.csvNotice}
              </span>
            </div>
            {pastedText && (
              <span className="text-xs text-neutral-500 font-mono">
                {pastedText.split('\n').filter(Boolean).length} rows loaded from CSV.
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
          <span className="text-xs text-neutral-400">
            Validation check runs individually per row.
          </span>
          <button
            onClick={handleProcessBatch}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isProcessing ? t.common.loading : t.batch.processBatch}</span>
          </button>
        </div>
      </div>

      {/* Batch Results Table */}
      {items.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-black/8 dark:border-white/10 shadow-xs flex flex-col gap-4">
          {/* Summary Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {t.batch.totalItems}: <strong className="font-mono">{items.length}</strong>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {t.batch.validItems}: <strong className="font-mono">{validCount}</strong>
              </span>
              {invalidCount > 0 && (
                <span className="text-red-500 font-medium">
                  {t.batch.invalidItems}: <strong className="font-mono">{invalidCount}</strong>
                </span>
              )}
            </div>

            {validCount > 0 && (
              <button
                onClick={handleDownloadAllZip}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.batch.downloadZip}</span>
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-neutral-400">
                  <th className="py-2.5 px-3 font-semibold w-12">{t.batch.row}</th>
                  <th className="py-2.5 px-3 font-semibold">{t.batch.payload}</th>
                  <th className="py-2.5 px-3 font-semibold">Title / SKU</th>
                  <th className="py-2.5 px-3 font-semibold">{t.common.status}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-neutral-400">
                      {item.rowNumber}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-800 dark:text-neutral-200 max-w-xs truncate">
                      {item.input}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-300">
                      {item.title || item.sku ? `${item.title || ''} ${item.sku ? `(${item.sku})` : ''}` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.status === 'valid' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.common.valid}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 font-medium text-[11px]" title={item.errorMessage}>
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[150px]">{item.errorMessage || t.common.invalid}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {item.status === 'valid' && item.renderedDataUrl && (
                        <a
                          href={item.renderedDataUrl}
                          download={`batch_${item.rowNumber}_${item.format}.png`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>PNG</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
