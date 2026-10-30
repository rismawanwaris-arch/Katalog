import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Download, FileDown, CheckCircle2, 
  AlertTriangle, AlertCircle, RefreshCw, X, ArrowRight, Check, FileText
} from 'lucide-react';

export default function ImportExcelModal({ isOpen, onClose, adminToken, onSuccess }) {
  const [file, setFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [updateExisting, setUpdateExisting] = useState(true);

  const [step, setStep] = useState('select'); // 'select', 'preview', 'result'
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState('');

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    try {
      const res = await fetch('/api/admin/template-excel', {
        headers: { 'Authorization': adminToken }
      });
      if (!res.ok) throw new Error('Gagal mengunduh template');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Import_Katalog_Aksesoris.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error saat mengunduh template: ' + err.message);
    } finally {
      setDownloadingTemplate(false);
    }
  }

  function handleFileSelected(e) {
    const selectedFile = e.target.files && e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      alert('Harap pilih file spreadsheet Excel (.xlsx atau .xls)');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setPreviewError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result.split(',')[1];
      setFileBase64(base64);
      // Auto fetch preview
      await fetchPreview(base64);
    };
    reader.readAsDataURL(selectedFile);
  }

  async function fetchPreview(base64) {
    setLoadingPreview(true);
    setPreviewError('');
    try {
      const res = await fetch('/api/admin/preview-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({ fileBase64: base64 })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewData(data);
        setStep('preview');
      } else {
        setPreviewError(data.message || 'Gagal memproses file Excel');
      }
    } catch (err) {
      setPreviewError('Kesalahan jaringan: ' + err.message);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleExecuteImport() {
    if (!fileBase64) return;
    setImporting(true);
    setImportError('');
    try {
      const res = await fetch('/api/admin/import-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({
          fileBase64,
          fileName,
          updateExisting
        })
      });
      const data = await res.json();
      if (data.success) {
        setImportResult(data);
        setStep('result');
        if (onSuccess) onSuccess();
      } else {
        setImportError(data.message || 'Gagal mengimport data Excel');
      }
    } catch (err) {
      setImportError('Kesalahan koneksi saat import: ' + err.message);
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setFile(null);
    setFileBase64('');
    setFileName('');
    setPreviewData(null);
    setPreviewError('');
    setImportResult(null);
    setImportError('');
    setStep('select');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleCloseModal() {
    handleReset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Import Item dari Excel</h3>
              <p className="text-xs text-slate-400">
                Tambah massal atau perbarui data master spesifikasi 17 kolom aksesoris
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-700 text-xs sm:text-sm">
          
          {/* STEP 1: SELECT FILE & DOWNLOAD TEMPLATE */}
          {step === 'select' && (
            <div className="space-y-6">
              
              {/* Template Download Card */}
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Unduh Template Resmi (.xlsx)</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Format standar yang sudah disesuaikan dengan 17 kolom katalog (Kode Item, Nama Resmi, Merk, Kategori, Spek Utama, dsb) lengkap dengan baris contoh &amp; panduan merk.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  <Download className={`w-4 h-4 ${downloadingTemplate ? 'animate-bounce' : ''}`} />
                  <span>{downloadingTemplate ? 'Mengunduh...' : 'Download Template Excel'}</span>
                </button>
              </div>

              {/* Upload Drop Area */}
              <div 
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-8 sm:p-12 text-center bg-slate-50/50 hover:bg-emerald-50/20 cursor-pointer transition flex flex-col items-center justify-center group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  accept=".xlsx, .xls"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:scale-105 transition mb-3">
                  <Upload className="w-8 h-8" />
                </div>

                <h4 className="font-bold text-slate-800 text-base mb-1">
                  Pilih file Excel yang telah diisi
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Klik untuk menelusuri file dari komputer Anda (Format didukung: <strong>.xlsx</strong> atau <strong>.xls</strong>)
                </p>

                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs group-hover:border-emerald-400 group-hover:text-emerald-700">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Pilih File Excel</span>
                </span>
              </div>

              {loadingPreview && (
                <div className="flex items-center justify-center gap-3 p-4 bg-slate-100 rounded-2xl text-slate-600 font-semibold text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Membaca dan memvalidasi baris data Excel...</span>
                </div>
              )}

              {previewError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{previewError}</span>
                </div>
              )}

            </div>
          )}

          {/* STEP 2: PREVIEW & VERIFY DATA */}
          {step === 'preview' && previewData && (
            <div className="space-y-5">
              
              {/* File Info & Options Bar */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm truncate max-w-xs sm:max-w-md">
                      {fileName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Terbaca {previewData.validCount} produk valid dari total {previewData.totalRows} baris
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline self-start sm:self-auto"
                >
                  Ganti File
                </button>
              </div>

              {/* Summary Stats Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Produk</div>
                  <div className="text-xl font-black text-slate-900 mt-1">{previewData.validCount}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                  <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Produk Baru</div>
                  <div className="text-xl font-black text-emerald-800 mt-1">+{previewData.newCount}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80">
                  <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Akan Diperbarui</div>
                  <div className="text-xl font-black text-amber-800 mt-1">{previewData.existingCount}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80">
                  <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Baris Error</div>
                  <div className="text-xl font-black text-rose-800 mt-1">{previewData.errorCount}</div>
                </div>
              </div>

              {/* Mode Setting: Upsert Checkbox */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={e => setUpdateExisting(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                    Perbarui data jika Kode Item sudah terdaftar di katalog (Rekomendasi)
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6.5">
                  {updateExisting 
                    ? `Item yang sudah terdaftar (${previewData.existingCount} item) akan ditimpa/diperbarui dengan data terbaru di Excel.`
                    : `Item yang sudah terdaftar (${previewData.existingCount} item) akan dilewati dan tidak diubah.`
                  }
                </p>
              </div>

              {/* Error messages if any */}
              {previewData.errors && previewData.errors.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Peringatan Pada Beberapa Baris ({previewData.errors.length}):</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-amber-900 space-y-0.5 max-h-24 overflow-y-auto">
                    {previewData.errors.map((err, idx) => (
                      <li key={idx}>{err.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Table Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700 text-xs">
                    Pratinjau Data (Menampilkan {previewData.previewItems.length} item pertama):
                  </span>
                  <span className="text-[11px] text-slate-400">17 Kolom Katalog</span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5">Kode Item</th>
                        <th className="px-3 py-2.5">Nama Produk Resmi</th>
                        <th className="px-3 py-2.5">Merk</th>
                        <th className="px-3 py-2.5">Kategori</th>
                        <th className="px-3 py-2.5">Spek Utama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {previewData.previewItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="px-3 py-2 whitespace-nowrap">
                            {item.isExisting ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Update
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Baru
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {item.item_code}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-800 max-w-xs truncate" title={item.official_name}>
                            {item.official_name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-bold text-slate-700">
                            {item.brand}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                            {item.category}
                          </td>
                          <td className="px-3 py-2 text-slate-500 max-w-xs truncate" title={item.main_spec}>
                            {item.main_spec || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {importError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

            </div>
          )}

          {/* STEP 3: RESULT REPORT */}
          {step === 'result' && importResult && (
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900">Import Berhasil Diselesaikan!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {importResult.message}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] font-semibold text-emerald-700 uppercase">Ditambahkan Baru</div>
                  <div className="text-2xl font-black text-emerald-900 mt-1">+{importResult.inserted}</div>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
                  <div className="text-[11px] font-semibold text-sky-700 uppercase">Diperbarui</div>
                  <div className="text-2xl font-black text-sky-900 mt-1">{importResult.updated}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase">Dilewati</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{importResult.skipped}</div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
                >
                  Import File Lainnya
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/30"
                >
                  Selesai &amp; Lihat Katalog
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {step !== 'result' && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold transition"
            >
              Batal
            </button>

            {step === 'preview' && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing || previewData?.validCount === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengimport {previewData?.validCount} Item ke Katalog...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Mulai Import ({previewData?.validCount} Item)</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
