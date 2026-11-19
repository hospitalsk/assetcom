import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Printer, X, Download } from 'lucide-react';
import { showSwalAlert, showSwalToast } from '../utils/swal';

export interface PrintableTable {
  title?: string;
  headers: string[];
  rows: string[][];
}

interface PrintDocumentModalProps {
  title: string;
  documentNo: string;
  date: string;
  departmentName: string;
  contentData: { label: string; value: string }[];
  tables?: PrintableTable[];
  onClose: () => void;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  title,
  documentNo,
  date,
  departmentName,
  contentData,
  tables,
  onClose,
}) => {
  const { settings, currentUser, users } = useApp();
  const printableRef = useRef<HTMLDivElement>(null);
  const [printModeActive, setPrintModeActive] = useState<'pdf' | 'print' | null>(null);

  // Find user with role 'IT Officer' (or fallback to current user if IT Officer / fallback user)
  const itOfficerUser =
    users.find((u) => u.role === 'IT Officer') ||
    users.find((u) => u.position.toLowerCase().includes('คอมพิวเตอร์') || u.position.toLowerCase().includes('it')) ||
    currentUser;

  // Find user with role 'Supply Officer'
  const supplyOfficerUser =
    users.find((u) => u.role === 'Supply Officer') ||
    users.find((u) => u.position.toLowerCase().includes('พัสดุ')) ||
    { name: 'นายวิชัย พัสดุดี', position: 'เจ้าพนักงานพัสดุชำนาญงาน' };

  const triggerHtmlCssPrint = async (mode: 'pdf' | 'print') => {
    if (!printableRef.current) return;
    setPrintModeActive(mode);

    const safeTitle = `${title}_${documentNo}`.replace(/[\/\\:*?"<>|]/g, '-');
    const originalTitle = document.title;

    try {
      const sourceEl = printableRef.current;
      const clone = sourceEl.cloneNode(true) as HTMLElement;

      // Resolve images to inline data URLs when possible so isolated iframe renders reliably
      const origImgs = Array.from(sourceEl.querySelectorAll('img')) as HTMLImageElement[];
      const cloneImgs = Array.from(clone.querySelectorAll('img')) as HTMLImageElement[];
      cloneImgs.forEach((cloneImg, idx) => {
        const origImg = origImgs[idx];
        if (!origImg) return;
        let resolvedSrc = origImg.src;
        if (origImg.complete && origImg.naturalWidth > 0) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = origImg.naturalWidth;
            canvas.height = origImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(origImg, 0, 0);
              resolvedSrc = canvas.toDataURL('image/png');
            }
          } catch {
            resolvedSrc = origImg.src;
          }
        }
        cloneImg.setAttribute('src', resolvedSrc);
      });

      const printHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Sarabun', sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .printable-document {
      width: 100%;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Sarabun', sans-serif;
      font-size: 11pt;
      line-height: 1.45;
    }
    .doc-header {
      text-align: center;
      margin-bottom: 14px;
    }
    .doc-logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
      display: block;
      margin: 0 auto 6px auto;
    }
    .doc-org {
      font-size: 13pt;
      font-weight: 700;
      color: #1e293b;
    }
    .doc-title {
      font-size: 14pt;
      font-weight: 700;
      color: #0f172a;
      text-decoration: underline;
      text-underline-offset: 4px;
      margin-top: 4px;
      word-break: break-word;
    }
    .doc-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      font-size: 10pt;
      margin-bottom: 12px;
      padding: 0 2px;
    }
    .doc-meta-col {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .doc-meta-col-right {
      text-align: right;
    }
    .doc-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 10pt;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .doc-summary-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .doc-summary-label {
      color: #64748b;
      font-weight: 600;
      font-size: 9.5pt;
    }
    .doc-summary-value {
      color: #0f172a;
      font-weight: 700;
      word-break: break-word;
    }
    .doc-table-section {
      margin-bottom: 18px;
    }
    .doc-table-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
      break-after: avoid;
      page-break-after: avoid;
    }
    .doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      table-layout: auto;
    }
    .doc-table thead {
      display: table-header-group;
    }
    .doc-table tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .doc-table th,
    .doc-table td {
      border: 1px solid #1e293b;
      padding: 6px 8px;
      vertical-align: top;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    .doc-table thead th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: center;
    }
    .doc-cell-center {
      text-align: center;
    }
    .doc-empty-row {
      text-align: center;
      color: #64748b;
      padding: 12px;
    }
    .doc-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #94a3b8;
      text-align: center;
      font-size: 10pt;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .doc-sign-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 38px;
    }
    .doc-sign-row {
      display: inline-flex;
      align-items: flex-end;
      justify-content: center;
      gap: 4px;
      font-weight: 600;
      color: #1e293b;
    }
    .doc-sign-line {
      display: inline-block;
      width: 140px;
      height: 14px;
      border-bottom: 1px dotted #0f172a;
    }
    .doc-sign-pos {
      font-size: 9.5pt;
      color: #475569;
    }
  </style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`;

      let printFrame = document.getElementById('official-report-isolated-print-frame') as HTMLIFrameElement | null;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'official-report-isolated-print-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '210mm';
        printFrame.style.height = '297mm';
        printFrame.style.border = '0';
        printFrame.style.opacity = '0.001';
        printFrame.style.pointerEvents = 'none';
        printFrame.style.zIndex = '-9999';
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      const frameWin = printFrame.contentWindow;

      const triggerMainWindowPrint = () => {
        document.title = safeTitle;
        let mainPrintTriggered = false;
        const onMainBeforePrint = () => {
          mainPrintTriggered = true;
        };
        const restoreTitle = () => {
          document.title = originalTitle;
        };
        window.addEventListener('beforeprint', onMainBeforePrint, { once: true });
        window.addEventListener('afterprint', restoreTitle, { once: true });

        try {
          window.focus();
          window.print();
        } catch {
          // ignore
        }

        setTimeout(() => {
          window.removeEventListener('beforeprint', onMainBeforePrint);
          if (!mainPrintTriggered) {
            restoreTitle();
            showSwalAlert(
              'info',
              'ใช้การพิมพ์ของเบราว์เซอร์ (Print to PDF)',
              'เบราว์เซอร์ในโหมด Preview นี้ปิดกั้นการเรียกหน้าต่างพิมพ์อัตโนมัติ กรุณากด Ctrl+P (หรือ Cmd+P บน Mac) แล้วเลือกปลายทางเป็น "Save as PDF / บันทึกเป็น PDF" เพื่อบันทึกเอกสารแบบ Vector คมชัด'
            );
          } else if (mode === 'pdf') {
            showSwalToast('info', 'เลือกปลายทาง "Save as PDF / บันทึกเป็น PDF" ในหน้าต่างพิมพ์');
          }
          setPrintModeActive(null);
        }, 350);
      };

      if (!frameDoc || !frameWin) {
        triggerMainWindowPrint();
        return;
      }

      frameDoc.open();
      frameDoc.write(printHtml);
      frameDoc.close();

      await Promise.race([
        (frameDoc as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready || Promise.resolve(),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ]);
      await new Promise((resolve) => setTimeout(resolve, 120));

      let iframePrintTriggered = false;
      const onIframeBeforePrint = () => {
        iframePrintTriggered = true;
      };
      frameWin.addEventListener('beforeprint', onIframeBeforePrint, { once: true });

      if (mode === 'pdf') {
        showSwalToast('info', 'เลือกปลายทาง "Save as PDF / บันทึกเป็น PDF" เพื่อบันทึกเป็นไฟล์ PDF');
      }

      frameWin.focus();
      frameWin.print();

      setTimeout(() => {
        frameWin.removeEventListener('beforeprint', onIframeBeforePrint);
        if (iframePrintTriggered) {
          setPrintModeActive(null);
          return;
        }
        triggerMainWindowPrint();
      }, 350);
    } catch (err) {
      console.warn('Report print error:', err);
      document.title = originalTitle;
      setPrintModeActive(null);
      showSwalAlert(
        'info',
        'กรุณาสั่งพิมพ์หรือบันทึก PDF ด้วยเบราว์เซอร์',
        'กด Ctrl+P (หรือ Cmd+P บน Mac) แล้วเลือก "Save as PDF / บันทึกเป็น PDF"'
      );
    }
  };

  return (
    <div className="print-document-modal-root fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto print:static print:bg-white print:p-0 print:overflow-visible">
      <style>{`
        @media print {
          .print-document-modal-root,
          .print-document-modal-root .printable-document,
          .print-document-modal-root .printable-document * {
            visibility: visible !important;
          }
          .print-document-modal-root {
            position: static !important;
            inset: auto !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }
          .print-document-modal-card {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <div className="print-document-modal-card bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-4 sm:p-8 relative animate-in fade-in zoom-in-95 my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
        {/* Control Buttons (No Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 mb-6 gap-3">
          <div className="flex items-start space-x-2.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                รายงานตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                มาตรฐาน HTML + CSS Print ขนาด A4 (รองรับ Browser Print to PDF ข้อความคมชัดแบบ Vector)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => triggerHtmlCssPrint('pdf')}
              disabled={printModeActive !== null}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
              title="บันทึกเป็นไฟล์ PDF ผ่าน Browser Print to PDF (เลือก Save as PDF)"
            >
              <Download className="w-4 h-4" />
              <span>{printModeActive === 'pdf' ? 'กำลังเปิด Print to PDF...' : 'บันทึกเป็น PDF (Print to PDF)'}</span>
            </button>
            <button
              type="button"
              onClick={() => triggerHtmlCssPrint('print')}
              disabled={printModeActive !== null}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
              title="พิมพ์เอกสารด้วย HTML + CSS Print"
            >
              <Printer className="w-4 h-4" />
              <span>{printModeActive === 'print' ? 'กำลังเตรียมหน้าพิมพ์...' : 'พิมพ์เอกสาร (Print)'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document A4 Layout (Strict Official Government Format) */}
        <div
          ref={printableRef}
          className="printable-document bg-white p-4 sm:p-8 border border-slate-200 shadow-xs print:border-none print:shadow-none print:p-0 font-['Sarabun',sans-serif] text-slate-900 leading-relaxed"
        >
          {/* Organization Logo & Official Header */}
          <div className="doc-header text-center space-y-2 mb-6">
            <div className="flex justify-center">
              <img
                src={settings.logoUrl || './assets/aistudio/Logo_SK_26693d5e.png'}
                alt="Hospital Logo"
                className="doc-logo w-20 h-20 sm:w-24 sm:h-24 object-contain mx-auto"
              />
            </div>
            <div className="doc-org text-sm sm:text-base font-bold tracking-wide text-slate-800">{settings.organizationName}</div>
            <div className="doc-title text-base sm:text-lg font-bold text-slate-900 underline underline-offset-4 pt-1 break-words">
              {title}
            </div>
          </div>

          {/* Document Meta Info */}
          <div className="doc-meta flex flex-col sm:flex-row justify-between items-start text-xs font-medium mb-6 px-1 gap-2">
            <div className="doc-meta-col space-y-1">
              <div>
                <span className="font-bold">หน่วยงาน:</span> {departmentName}
              </div>
              <div>
                <span className="font-bold">วันที่:</span> {date}
              </div>
            </div>
            <div className="doc-meta-col doc-meta-col-right space-y-1 sm:text-right">
              <div>
                <span className="font-bold">เลขที่เอกสาร:</span> {documentNo}
              </div>
              <div>
                <span className="font-bold">ปีงบประมาณ:</span> {settings.fiscalYear}
              </div>
            </div>
          </div>

          {/* Content Summary Grid */}
          <div className="doc-summary bg-slate-50 border border-slate-300 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {contentData.map((item, idx) => (
              <div key={idx} className="doc-summary-item flex flex-col">
                <span className="doc-summary-label text-slate-500 font-semibold">{item.label}</span>
                <span className="doc-summary-value text-slate-900 font-bold mt-0.5 break-words">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Complete Itemized Tables */}
          {tables &&
            tables.map((tbl, tIdx) => (
              <div key={tIdx} className="doc-table-section mb-6 overflow-x-auto">
                {tbl.title && <div className="doc-table-title text-sm font-bold text-slate-900 mb-2">{tbl.title}</div>}
                <table className="doc-table w-full text-xs text-left border-collapse border border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold">
                      {tbl.headers.map((h, hIdx) => (
                        <th key={hIdx} className="border border-slate-800 p-2 text-center break-words">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tbl.rows.length > 0 ? (
                      tbl.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className={`border border-slate-800 p-2 break-words ${cIdx === 0 ? 'doc-cell-center text-center' : ''}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={tbl.headers.length} className="doc-empty-row border border-slate-800 p-4 text-center text-slate-400">
                          ไม่มีข้อมูลรายการ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}

          {/* Official Signatures according to Procurement Regulation */}
          <div className="doc-signatures grid grid-cols-2 gap-8 pt-10 mt-8 border-t border-slate-400 text-center text-xs page-break-inside-avoid">
            <div className="doc-sign-box space-y-12">
              <div className="doc-sign-row font-semibold text-slate-800 inline-flex items-end justify-center gap-1">
                <span>ลงชื่อ</span>
                <span className="doc-sign-line inline-block w-36 h-3.5 border-b border-dotted border-slate-700" aria-hidden="true" />
                <span>ผู้จัดทำ</span>
              </div>
              <div>
                ({itOfficerUser.name})
                <br />
                <span className="doc-sign-pos text-[11px] text-slate-600">{itOfficerUser.position}</span>
              </div>
            </div>
            <div className="doc-sign-box space-y-12">
              <div className="doc-sign-row font-semibold text-slate-800 inline-flex items-end justify-center gap-1">
                <span>ลงชื่อ</span>
                <span className="doc-sign-line inline-block w-36 h-3.5 border-b border-dotted border-slate-700" aria-hidden="true" />
                <span>เจ้าหน้าที่พัสดุ</span>
              </div>
              <div>
                ({supplyOfficerUser.name})
                <br />
                <span className="doc-sign-pos text-[11px] text-slate-600">{supplyOfficerUser.position}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

