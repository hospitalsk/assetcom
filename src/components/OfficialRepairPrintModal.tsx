import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { RepairRequest } from '../types';
import { Printer, X, Download, Lock, CheckCircle, ShieldCheck, UserCheck } from 'lucide-react';
import { exportA4ElementToPdf } from '../utils/pdfExport';

interface OfficialRepairPrintModalProps {
  repairRequest: RepairRequest;
  onClose: () => void;
}

export const OfficialRepairPrintModal: React.FC<OfficialRepairPrintModalProps> = ({
  repairRequest,
  onClose,
}) => {
  const { assets, departments, users, currentUser, updateRepairRequest } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  const asset = assets.find(a => a.id === repairRequest.assetId);
  const dept = departments.find(d => d.id === repairRequest.departmentId);
  const reporter = users.find(u => u.id === repairRequest.reporterId) || {
    name: 'นายสมชาย ใจดี',
    position: 'นักวิชาการคอมพิวเตอร์'
  };
  const technician = users.find(u => u.id === repairRequest.technicianId);
  const headUser = users.find(u => u.role === 'Department Head' || u.departmentId === repairRequest.departmentId);

  // Date formatting helpers
  const reqDate = new Date(repairRequest.createdAt);
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const thaiDateStr = `${reqDate.getDate()} ${thaiMonths[reqDate.getMonth()]} ${reqDate.getFullYear() + 543}`;

  // Interactive Form State for ALL input fields in the official document
  const [govAgency, setGovAgency] = useState('โรงพยาบาลสังขละบุรี ฝ่ายบริหารทั่วไป โทร. ๐๓๔-๕๙๕๐๓๐ ต่อ ๒๐๕');
  const [docNoSub, setDocNoSub] = useState(repairRequest.repairNo ? repairRequest.repairNo.replace('REP-', '') : '2568/01');
  const [docDate, setDocDate] = useState(thaiDateStr);
  const [deptName, setDeptName] = useState(dept?.name || 'กลุ่มงานทั่วไป');
  const [category, setCategory] = useState<'การแพทย์' | 'สำนักงาน' | 'ยานพาหนะ' | 'อาคาร' | 'สิ่งก่อสร้าง' | 'งานบ้านงานครัว' | 'อุปกรณ์และอื่นๆ'>('สำนักงาน');

  // Asset details
  const [assetName, setAssetName] = useState(asset?.name || '');
  const [assetModel, setAssetModel] = useState(asset?.model || '');
  const [issueDesc, setIssueDesc] = useState(repairRequest.issueDescription || '');
  const [assetCode, setAssetCode] = useState(asset?.assetCode || asset?.serialNumber || '');
  const [company, setCompany] = useState(asset?.vendorName || '');
  const [phone, setPhone] = useState(asset?.vendorPhone || '');
  const [quantity, setQuantity] = useState('1 เครื่อง');

  // Signatures Part 1: Reporter
  const [reporterSign, setReporterSign] = useState(reporter.name);
  const [reporterFullName, setReporterFullName] = useState(reporter.name);
  const [reporterPosition, setReporterPosition] = useState(reporter.position || 'เจ้าหน้าที่');

  // Real Workflow Step Approval Flags
  const isHeadApproved = repairRequest.departmentHeadApproved === true || 
    (repairRequest.status !== 'รอหัวหน้าอนุมัติ' && repairRequest.status !== 'รอรับเรื่อง' && repairRequest.status !== 'รอตรวจสอบ');

  const isSupplyApproved = repairRequest.supplyOfficerApproved === true || 
    (isHeadApproved && repairRequest.status !== 'รอพัสดุอนุมัติ' && repairRequest.status !== 'รอหัวหน้าอนุมัติ' && repairRequest.status !== 'รอรับเรื่อง' && repairRequest.status !== 'รอตรวจสอบ');

  const isDirectorApproved = repairRequest.directorApproved === true || 
    (isSupplyApproved && repairRequest.status !== 'รอผู้อำนวยการอนุมัติ' && repairRequest.status !== 'รอพัสดุอนุมัติ' && repairRequest.status !== 'รอหัวหน้าอนุมัติ' && repairRequest.status !== 'รอรับเรื่อง' && repairRequest.status !== 'รอตรวจสอบ');

  const isTechnicianDone = repairRequest.technicianApproved === true || 
    repairRequest.status === 'ซ่อมเสร็จ' || repairRequest.status === 'รอหน่วยงานรับของ' || repairRequest.status === 'รับของเรียบร้อย' || repairRequest.status === 'ดำเนินการเสร็จ' || repairRequest.status === 'ปิดงาน';

  const isItemReceived = repairRequest.itemReceived === true || repairRequest.status === 'รับของเรียบร้อย';
  const [headOpinion, setHeadOpinion] = useState('เห็นควรอนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ');
  const [headSign, setHeadSign] = useState(headUser?.name || 'ดร. สมชาย ใจดี');
  const [headFullName, setHeadFullName] = useState(headUser?.name || 'ดร. สมชาย ใจดี');
  const [headPosition, setHeadPosition] = useState(headUser?.position || 'หัวหน้าฝ่าย');

  // Maintenance Dept Options
  const [chkSelfFree, setChkSelfFree] = useState(false);
  const [chkSelfCost, setChkSelfCost] = useState(true);
  const [chkGovTech, setChkGovTech] = useState(false);
  const [repairDays, setRepairDays] = useState('3');
  const [repairCost, setRepairCost] = useState(repairRequest.totalCost ? String(repairRequest.totalCost) : '850');
  const [chkOutside, setChkOutside] = useState(false);
  const [outsideCompany, setOutsideCompany] = useState('');
  const [chkOther, setChkOther] = useState(false);
  const [otherDetails, setOtherDetails] = useState('');

  // Maintenance Signatures
  const [maintSign, setMaintSign] = useState(technician?.name || reporter.name);
  const [maintFullName, setMaintFullName] = useState(technician?.name || reporter.name);

  // Approval & Procurement Signatures
  const [procureSign, setProcureSign] = useState('ชุติญา จรัสกุลธาดา');

  // Delivery & Receive Signatures
  const [deliverSign, setDeliverSign] = useState(technician?.name || reporter.name);
  const [deliverFullName, setDeliverFullName] = useState(technician?.name || reporter.name);
  const [deliverDay, setDeliverDay] = useState(String(reqDate.getDate()));
  const [deliverMonth, setDeliverMonth] = useState(thaiMonths[reqDate.getMonth()]);
  const [deliverYear, setDeliverYear] = useState(String(reqDate.getFullYear() + 543));

  // Approver Comments & Signatures
  const [approverComments1, setApproverComments1] = useState('อนุมัติให้ดำเนินการซ่อมบำรุงได้');
  const [approverComments2, setApproverComments2] = useState('');
  const [approverSign, setApproverSign] = useState('จิรวัฒน์ วงษ์สวัสดิ์');

  // Receiver
  const [receiveSign, setReceiveSign] = useState(reporter.name);
  const [receiveFullName, setReceiveFullName] = useState(reporter.name);
  const [receivePosition, setReceivePosition] = useState(reporter.position || 'เจ้าหน้าที่ผู้รับของ');

  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);

  const handleSavePdf = async () => {
    if (!printRef.current) return;
    try {
      setIsSavingPdf(true);
      setPrintNotice(null);
      const filename = `บันทึกข้อความขออนุมัติซ่อมบำรุง_${docNoSub.replace(/[\/\\]/g, '-')}.pdf`;
      await exportA4ElementToPdf(printRef.current, filename);
    } catch (err) {
      console.error('Save PDF error:', err);
    } finally {
      setIsSavingPdf(false);
    }
  };

  const handlePrint = async () => {
    if (!printRef.current) return;
    setIsPrinting(true);
    setPrintNotice(null);

    try {
      const sourceEl = printRef.current;
      const clone = sourceEl.cloneNode(true) as HTMLElement;

      // Sync text inputs -> crisp baseline spans so printed dotted lines align perfectly
      const origInputs = Array.from(sourceEl.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
      const cloneInputs = Array.from(clone.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
      cloneInputs.forEach((cloneInput, idx) => {
        const origInput = origInputs[idx];
        const span = document.createElement('span');
        span.textContent = origInput?.value || '\u00A0';

        const computed = window.getComputedStyle(origInput || cloneInput);
        span.style.display = 'inline-block';
        span.style.border = 'none';
        span.style.borderBottom = '1px dotted #000000';
        span.style.color = '#000000';
        span.style.fontFamily = "'Sarabun', sans-serif";
        span.style.fontSize = computed?.fontSize || '13px';
        span.style.lineHeight = '1.2';
        span.style.height = '1.25em';
        span.style.padding = '0 4px 1px 4px';
        span.style.margin = '0';
        span.style.verticalAlign = 'baseline';
        span.style.boxSizing = 'border-box';
        span.style.textAlign = cloneInput.style.textAlign || computed?.textAlign || 'left';

        if (cloneInput.style.width) span.style.width = cloneInput.style.width;
        if (cloneInput.style.maxWidth) span.style.maxWidth = cloneInput.style.maxWidth;
        if (cloneInput.style.minWidth) span.style.minWidth = cloneInput.style.minWidth;
        if (cloneInput.classList.contains('flex-input')) {
          span.style.flexGrow = '1';
          span.style.margin = '0 5px';
        }

        cloneInput.parentNode?.replaceChild(span, cloneInput);
      });

      // Sync radio & checkbox checked states
      const origChecks = Array.from(sourceEl.querySelectorAll('input[type="radio"], input[type="checkbox"]')) as HTMLInputElement[];
      const cloneChecks = Array.from(clone.querySelectorAll('input[type="radio"], input[type="checkbox"]')) as HTMLInputElement[];
      cloneChecks.forEach((cloneChk, idx) => {
        const isChecked = origChecks[idx]?.checked;
        if (isChecked) {
          cloneChk.setAttribute('checked', 'checked');
        } else {
          cloneChk.removeAttribute('checked');
        }
      });

      // Resolve images to inline data URLs when possible or absolute URLs
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
  <title>บันทึกข้อความขออนุมัติซ่อมบำรุง_${docNoSub.replace(/[\/\\]/g, '-')}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    @page { size: 210mm 297mm; margin: 0; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Sarabun', sans-serif;
      font-size: 13px;
      color: #000000;
      width: 210mm;
      height: 297mm;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .a4-page {
      width: 210mm;
      max-width: 210mm;
      height: 296mm;
      max-height: 296mm;
      padding: 8mm 16mm 6mm 16mm;
      background: #ffffff;
      position: relative;
      line-height: 1.35;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Sarabun', sans-serif;
      font-size: 13px;
      color: #000000;
      margin: 0 auto;
    }
    .header-title {
      font-size: 15pt;
      font-weight: bold;
      margin-bottom: 3px;
      margin-top: 2px;
    }
    .row {
      display: flex;
      align-items: baseline;
      margin-bottom: 4px;
      width: 100%;
      max-width: 100%;
    }
    .bold { font-weight: bold; }
    .text-center { text-align: center; }
    .indent { padding-left: 2.5cm; }
    .flex-input { flex-grow: 1; margin: 0 5px; }
    .checkbox-label {
      display: inline-flex;
      align-items: center;
      margin-right: 5px;
    }
    .checkbox-label input { margin-right: 3px; }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 4px;
    }
    .signature-box {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    hr { border: 0.5px solid #000; margin: 4px 0; }
  </style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`;

      let printFrame = document.getElementById('official-memo-isolated-print-frame') as HTMLIFrameElement | null;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'official-memo-isolated-print-frame';
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

      if (!frameDoc || !frameWin) {
        window.focus();
        window.print();
        setIsPrinting(false);
        return;
      }

      frameDoc.open();
      frameDoc.write(printHtml);
      frameDoc.close();

      // Ensure checked states are synchronized in the iframe DOM
      const frameChecks = Array.from(frameDoc.querySelectorAll('input[type="radio"], input[type="checkbox"]')) as HTMLInputElement[];
      frameChecks.forEach((chk, idx) => {
        if (origChecks[idx]) {
          chk.checked = origChecks[idx].checked;
        }
      });

      // Wait briefly for web fonts & images inside iframe before printing
      await Promise.race([
        (frameDoc as any).fonts?.ready || Promise.resolve(),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ]);
      await new Promise((resolve) => setTimeout(resolve, 120));

      let iframePrintTriggered = false;
      const onIframeBeforePrint = () => {
        iframePrintTriggered = true;
      };
      frameWin.addEventListener('beforeprint', onIframeBeforePrint, { once: true });

      frameWin.focus();
      frameWin.print();

      setTimeout(() => {
        if (iframePrintTriggered) {
          setIsPrinting(false);
          return;
        }

        // Fallback 1: try main window.print() in case subframe printing was restricted
        let mainPrintTriggered = false;
        const onMainBeforePrint = () => {
          mainPrintTriggered = true;
        };
        window.addEventListener('beforeprint', onMainBeforePrint, { once: true });

        try {
          window.focus();
          window.print();
        } catch {
          // ignore
        }

        setTimeout(async () => {
          window.removeEventListener('beforeprint', onMainBeforePrint);
          if (!mainPrintTriggered) {
            // Fallback 2: sandbox completely blocks native print(); auto-download A4 PDF
            setPrintNotice('เบราว์เซอร์ในโหมด Preview นี้ปิดกั้นหน้าต่างสั่งพิมพ์โดยตรง ระบบได้บันทึกเป็นไฟล์ PDF 1 หน้า A4 ให้เรียบร้อยแล้ว สามารถเปิดไฟล์ PDF เพื่อสั่งพิมพ์ได้ทันที');
            await handleSavePdf();
          }
          setIsPrinting(false);
        }, 350);
      }, 350);
    } catch (err) {
      console.warn('Direct print failed, falling back to PDF export:', err);
      await handleSavePdf();
      setIsPrinting(false);
    }
  };

  return (
    <div className="official-memo-modal-container fixed inset-0 z-50 bg-[#525659] overflow-y-auto flex flex-col items-center justify-start py-4 sm:py-6 px-2 font-['Sarabun',sans-serif]">
      {/* Top Floating Control Bar (Hidden when printing) */}
      <div className="no-print w-full max-w-[210mm] flex flex-col gap-2 pb-3 mb-3 border-b border-slate-600 text-white">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                แบบฟอร์มบันทึกข้อความขออนุมัติซ่อมบำรุงพัสดุ-ครุภัณฑ์
              </h3>
              <p className="text-[11px] text-slate-300">
                ขนาดมาตรฐาน 1 หน้า A4 ไม่ล้นกระดาษ (บันทึกเป็น PDF หรือกดพิมพ์ได้ทันที)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isSavingPdf}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/50 cursor-pointer active:scale-95"
              title="บันทึกเป็นไฟล์ PDF ขนาด A4 1 หน้าเท่านั้น"
            >
              <Download className="w-4 h-4" />
              <span>{isSavingPdf ? 'กำลังบันทึก PDF...' : 'บันทึกเป็น PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/50 cursor-pointer active:scale-95"
              title="พิมพ์แบบฟอร์มนี้โดยตรง"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'กำลังสั่งพิมพ์...' : 'พิมพ์แบบฟอร์มนี้'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>ปิดหน้าต่าง</span>
            </button>
          </div>
        </div>
        {printNotice && (
          <div className="w-full px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-100 text-xs">
            {printNotice}
          </div>
        )}
        {currentUser.role === 'Department Head' || currentUser.role === 'Super Admin' || currentUser.role === 'Approver' ? (
          !isHeadApproved ? (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border border-blue-600/80 px-4 py-2.5 rounded-xl text-xs shadow-lg">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-blue-600 rounded-lg text-white font-bold">✍️</span>
                <div>
                  <div className="font-bold text-white text-xs">อนุมัติในฐานะหัวหน้ากลุ่มงาน ({currentUser.name})</div>
                  <div className="text-[11px] text-blue-200">กดยืนยันอนุมัติเพื่อบันทึกการลงนามอิเล็กทรอนิกส์ในระบบ</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  updateRepairRequest(repairRequest.id, {
                    departmentHeadApproved: true,
                    departmentHeadApprovedBy: currentUser.name,
                    departmentHeadApprovedAt: new Date().toISOString(),
                    status: repairRequest.status === 'รอรับเรื่อง' || repairRequest.status === 'รอตรวจสอบ' ? 'รอดำเนินการ' : repairRequest.status
                  });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <CheckCircle className="w-4 h-4" />
                <span>อนุมัติใบแจ้งซ่อมนี้</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between bg-emerald-950/80 border border-emerald-700/80 px-4 py-2 rounded-xl text-xs text-emerald-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>ผ่านการอนุมัติจากหัวหน้ากลุ่มงานแล้ว</strong>
                  {repairRequest.departmentHeadApprovedBy ? ` (${repairRequest.departmentHeadApprovedBy})` : ''}
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold">แสดงชื่อและลายเซ็นดิจิทัลในเอกสาร</span>
            </div>
          )
        ) : (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-800/90 border border-slate-700/80 px-4 py-2 rounded-xl text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                สถานะการอนุมัติหัวหน้ากลุ่มงาน: <strong className={isHeadApproved ? 'text-emerald-400' : 'text-amber-400'}>{isHeadApproved ? '✓ อนุมัติแล้ว (แสดงชื่อและลายเซ็นสมบูรณ์)' : '⏳ ยังไม่อนุมัติ (แสดงเส้นสำหรับเซ็นในกระดาษ)'}</strong>
              </span>
            </div>
            {!isHeadApproved && (
              <span className="text-[11px] text-amber-300 italic">
                ต้องได้รับการอนุมัติจากบัญชีหัวหน้ากลุ่มงาน (Department Head) ในระบบ
              </span>
            )}
          </div>
        )}
      </div>

      {/* Printable Official Government Form Layout */}
      <div className="official-print-wrapper">
        <style>{`
          .top-left-image {
              position: absolute;
              top: 12px;
              left: 70px;
              width: 1.5cm;
              height: 1.5cm;
              object-fit: contain;
          }
          .a4-page {
              width: 210mm;
              max-width: 210mm;
              height: 297mm; 
              max-height: 297mm;
              padding: 8mm 16mm 6mm 16mm;
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.5);
              position: relative;
              line-height: 1.35; 
              display: flex;
              flex-direction: column;
              overflow: hidden;
              box-sizing: border-box;
              font-family: 'Sarabun', sans-serif;
              font-size: 13px;
              color: #000;
              margin: 0 auto;
          }
          .header-title {
              font-size: 15pt;
              font-weight: bold;
              margin-bottom: 3px;
              margin-top: 2px;
          }
          .row {
              display: flex;
              align-items: baseline;
              margin-bottom: 4px;
              width: 100%;
              max-width: 100%;
              box-sizing: border-box;
          }
          .bold { font-weight: bold; }
          .text-center { text-align: center; }
          .indent { padding-left: 2.5cm; }
          
          .a4-page input[type="text"] {
              border: none;
              border-bottom: 1px dotted #000000;
              background: transparent;
              font-family: 'Sarabun', sans-serif;
              font-size: 13px;
              line-height: 1.2;
              height: 1.25em;
              vertical-align: baseline;
              outline: none;
              padding: 0 4px 1px 4px;
              margin: 0;
              color: #000080;
              box-sizing: border-box;
          }
          .flex-input { flex-grow: 1; margin: 0 5px; }
          
          .checkbox-label {
              display: inline-flex;
              align-items: center;
              cursor: pointer;
              margin-right: 5px;
          }
          .checkbox-label input { margin-right: 3px; }
          
          .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-top: 4px;
          }
          
          .signature-box {
              display: flex;
              flex-direction: column;
              align-items: center;
          }

          hr { border: 0.5px solid #000; margin: 4px 0; }
          
          .print-btn {
              position: fixed;
              bottom: 20px;
              right: 20px;
              padding: 10px 20px;
              font-size: 12pt;
              font-family: 'Sarabun', sans-serif;
              background-color: #007bff;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0,0,0,0.2);
              z-index: 1000;
          }
          
          @media print {
              html, body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: hidden !important;
                display: block !important;
                height: 297mm !important;
                max-height: 297mm !important;
                width: 210mm !important;
              }
              body * {
                visibility: hidden !important;
              }
              .official-memo-modal-container,
              .official-memo-modal-container .official-print-wrapper,
              .official-memo-modal-container .a4-page,
              .official-memo-modal-container .a4-page * {
                visibility: visible !important;
              }
              .official-memo-modal-container .no-print,
              .official-memo-modal-container .no-print *,
              .print-btn {
                display: none !important;
                visibility: hidden !important;
              }
              .official-memo-modal-container {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: hidden !important;
                display: block !important;
                width: 210mm !important;
                height: 297mm !important;
                max-height: 297mm !important;
                z-index: 99999 !important;
              }
              .official-print-wrapper {
                padding: 0 !important;
                margin: 0 auto !important;
                width: 210mm !important;
                max-width: 210mm !important;
                height: 297mm !important;
                max-height: 297mm !important;
                display: block !important;
                overflow: hidden !important;
              }
              .a4-page { 
                  box-shadow: none !important; 
                  border: none !important;
                  width: 210mm !important; 
                  max-width: 210mm !important; 
                  height: 296mm !important; 
                  max-height: 296mm !important; 
                  padding: 8mm 16mm 6mm 16mm !important; 
                  margin: 0 auto !important; 
                  page-break-after: avoid !important;
                  page-break-before: avoid !important;
                  page-break-inside: avoid !important;
                  display: flex !important;
                  flex-direction: column !important;
                  overflow: hidden !important;
                  box-sizing: border-box !important;
                  line-height: 1.35 !important;
                  font-size: 13px !important;
              }
              .a4-page input[type="text"] { 
                color: #000 !important; 
                border-bottom: 1px dotted #000000 !important; 
                line-height: 1.2 !important;
                font-size: 13px !important;
                height: 1.25em !important;
                vertical-align: baseline !important;
                padding: 0 4px 1px 4px !important;
                margin: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page { size: 210mm 297mm; margin: 0 !important; }
          }
        `}</style>

        <div className="a4-page" ref={printRef}>
          {/* ตราครุฑ */}
          <img 
            src="/assets/aistudio/________9ad4c321.png" 
            alt="ตราครุฑ" 
            style={{ position: 'absolute', top: '13px', left: '70px', width: '1.38cm', height: '1.5cm', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Garuda_Emblem_of_Thailand.svg/300px-Garuda_Emblem_of_Thailand.svg.png';
            }}
          />

          {/* ส่วนหัว */}
          <div>
            <div className="header-title" style={{ paddingLeft: '272px' }}>บันทึกข้อความ</div>
            
            <div className="row" style={{ marginTop: '9px', marginBottom: '4px' }}>
              <span className="bold" style={{ marginTop: '0px', marginBottom: '4px' }}>ส่วนราชการ</span>&nbsp;
              <input 
                type="text" 
                value={govAgency} 
                onChange={(e) => setGovAgency(e.target.value)} 
                style={{ width: '82%', lineHeight: '15.6667px', marginLeft: '0px', marginTop: '3px', height: '16.8594px' }} 
              />
            </div>
            
            <div className="row">
              <div style={{ display: 'flex', flex: 6, alignItems: 'baseline' }}>
                <span className="bold">ที่</span>&nbsp;กจ ๐๐๓.๓๐๘.๑/
                <input 
                  type="text" 
                  className="flex-input" 
                  value={docNoSub} 
                  onChange={(e) => setDocNoSub(e.target.value)} 
                  style={{ maxWidth: '80px', height: '16.8594px' }} 
                />
              </div>
              <div style={{ display: 'flex', flex: 6, alignItems: 'baseline' }}>
                <span className="bold">วันที่</span>
                <input 
                  type="text" 
                  className="flex-input" 
                  value={docDate} 
                  onChange={(e) => setDocDate(e.target.value)} 
                  style={{ height: '16.8594px' }}
                />
              </div>
            </div>

            <div className="row">
              <span className="bold">เรื่อง</span>&nbsp;ขออนุมัติซ่อมบำรุงพัสดุ-ครุภัณฑ์
            </div>
            
            <div className="row" style={{ marginBottom: '5px' }}>
              <span className="bold">เรียน</span>&nbsp;ผู้อำนวยการโรงพยาบาลสังขละบุรี
            </div>
          </div>

          {/* เนื้อหา */}
          <div>
            <div style={{ paddingLeft: '20px', marginTop: '5px' }}>
              ด้วยฝ่าย/งาน <input type="text" value={deptName} onChange={(e) => setDeptName(e.target.value)} style={{ width: '220px' }} /> มีความประสงค์จะทำการซ่อมบำรุงพัสดุ ครุภัณฑ์
            </div>
            
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <label className="checkbox-label">
                <input type="radio" name="cat" checked={category === 'การแพทย์'} onChange={() => setCategory('การแพทย์')} style={{ marginBottom: '-11px', paddingBottom: '0px' }} /> การแพทย์
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" checked={category === 'สำนักงาน'} onChange={() => setCategory('สำนักงาน')} style={{ marginBottom: '-11px', paddingLeft: '1px' }} /> สำนักงาน
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" checked={category === 'ยานพาหนะ'} onChange={() => setCategory('ยานพาหนะ')} style={{ marginBottom: '-11px' }} /> ยานพาหนะ
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" checked={category === 'อาคาร'} onChange={() => setCategory('อาคาร')} style={{ marginBottom: '-11px', paddingLeft: '1px' }} /> อาคาร
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" checked={category === 'สิ่งก่อสร้าง'} onChange={() => setCategory('สิ่งก่อสร้าง')} style={{ marginBottom: '-11px', paddingLeft: '1px' }} /> สิ่งก่อสร้าง
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" checked={category === 'งานบ้านงานครัว'} onChange={() => setCategory('งานบ้านงานครัว')} style={{ marginBottom: '-11px', paddingLeft: '1px' }} /> งานบ้านงานครัว
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" checked={category === 'อุปกรณ์และอื่นๆ'} onChange={() => setCategory('อุปกรณ์และอื่นๆ')} style={{ marginBottom: '-11px', paddingLeft: '1px' }} /> อุปกรณ์และอื่นๆ
              </label>
              ตามตารางดังต่อไปนี้
            </div>

            {/* รายการซ่อม */}
            <div style={{ paddingLeft: '20px', marginTop: '5px' }}>
              <div className="row">
                1.เครื่อง<input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} style={{ width: '418px' }} /> 
                รุ่น<input type="text" className="flex-input" value={assetModel} onChange={(e) => setAssetModel(e.target.value)} />
              </div>
              <div className="row">
                ลักษณะ/อาการชำรุด<input type="text" value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} style={{ width: '220px' }} /> 
                หมายเลขครุภัณฑ์<input type="text" className="flex-input" value={assetCode} onChange={(e) => setAssetCode(e.target.value)} />
              </div>
              <div className="row">
                บริษัท<input type="text" value={company} onChange={(e) => setCompany(e.target.value)} style={{ width: '200px' }} /> 
                เบอร์โทรศัพท์<input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100px' }} /> 
                จำนวน<input type="text" className="flex-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
            </div>
                 
            <div className="row" style={{ marginTop: '10px' }}>
              จึงเรียนมาเพื่อโปรดพิจารณา
            </div>
          </div>

          {/* ลายเซ็นส่วนที่ 1 */}
          <div className="grid-2" style={{ marginTop: '10px' }}>
            <div className="signature-box">
              <div className="row" style={{ justifyContent: 'center' }}>
                ลงชื่อ<input type="text" value={reporterSign} onChange={(e) => setReporterSign(e.target.value)} style={{ width: '160px', textAlign: 'center' }} />ผู้ส่งซ่อม
              </div>
              <div className="row" style={{ justifyContent: 'left' }}>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(
                <input type="text" value={reporterFullName} onChange={(e) => setReporterFullName(e.target.value)} style={{ width: '170px', textAlign: 'center' }} />)
              </div>
              <div className="row" style={{ justifyContent: 'center' }}>
                ตำแหน่ง<input type="text" value={reporterPosition} onChange={(e) => setReporterPosition(e.target.value)} style={{ width: '260px', textAlign: 'center' }} />
              </div>
            </div>

            <div className="signature-box">
              <div>ความเห็นของหัวหน้าฝ่าย/หัวหน้ากลุ่มงาน</div>
              {isHeadApproved ? (
                <>
                  <div className="row" style={{ justifyContent: 'center' }}>
                    <input type="text" value={headOpinion} onChange={(e) => setHeadOpinion(e.target.value)} style={{ width: '300px', textAlign: 'center' }} />
                  </div>
                  <div className="row" style={{ justifyContent: 'center' }}>
                    ลงชื่อ<input type="text" value={headSign} onChange={(e) => setHeadSign(e.target.value)} style={{ width: '160px', textAlign: 'center' }} />
                  </div>
                  <div className="row" style={{ justifyContent: 'left' }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(
                    <input type="text" value={headFullName} onChange={(e) => setHeadFullName(e.target.value)} style={{ width: '170px', textAlign: 'center' }} />)
                  </div>
                  <div className="row" style={{ justifyContent: 'center' }}>
                    ตำแหน่ง<input type="text" value={headPosition} onChange={(e) => setHeadPosition(e.target.value)} style={{ width: '270px', textAlign: 'center' }} />
                  </div>
                </>
              ) : (
                <>
                  <div className="row" style={{ justifyContent: 'center', color: '#94a3b8' }}>
                    .........................................................................................
                  </div>
                  <div className="row" style={{ justifyContent: 'center', marginTop: '4px' }}>
                    ลงชื่อ..................................................
                  </div>
                  <div className="row" style={{ justifyContent: 'center' }}>
                    (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
                  </div>
                  <div className="row" style={{ justifyContent: 'center' }}>
                    ตำแหน่ง..................................................
                  </div>
                  <div className="text-[10px] text-amber-600 font-bold no-print text-center pt-1">
                    ⚠️ แสดงเมื่อหัวหน้ากลุ่มงาน (Department Head) อนุมัติแล้วเท่านั้น
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ซ่อมบำรุง */}
          <div>
            <div style={{ paddingLeft: '0px', marginTop: '5px' }}>
              <div className="row">บันทึกหน่วยงานซ่อมบำรุง/ฝ่ายบริหารทั่วไป</div>
              <div className="row">เสนอ ผู้อำนวยการโรงพยาบาลสังขละบุรี</div>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input type="checkbox" checked={chkSelfFree} onChange={(e) => setChkSelfFree(e.target.checked)} />&nbsp;ซ่อมได้เองโดยช่างของโรงพยาบาล ไม่เสียค่าใช้จ่าย
              </label>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input type="checkbox" checked={chkSelfCost} onChange={(e) => setChkSelfCost(e.target.checked)} />&nbsp;ซ่อมได้เองโดยช่างของโรงพยาบาลโดยเสียค่าวัสดุเพิ่มเติม
              </label>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input type="checkbox" checked={chkGovTech} onChange={(e) => setChkGovTech(e.target.checked)} />&nbsp;ส่งซ่อมกองช่างบำรุง
              </label>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input type="checkbox" checked={chkSelfCost || chkSelfFree} onChange={(e) => setChkSelfCost(e.target.checked)} />&nbsp;ระยะเวลาการซ่อมประมาณ
                <input type="text" value={repairDays} onChange={(e) => setRepairDays(e.target.value)} style={{ width: '40px', textAlign: 'center' }} />วัน&nbsp;&nbsp;ค่าใช้จ่ายประมาณ
                <input type="text" value={repairCost} onChange={(e) => setRepairCost(e.target.value)} style={{ width: '70px', textAlign: 'center' }} />บาท
              </label>
            </div>
            <div style={{ paddingLeft: '0px', marginTop: '5px' }}>
              <div className="row">ไม่สามารถซ่อมเองได้ จำเป็นต้องส่งซ่อมภายนอกหน่วยงาน</div>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input type="checkbox" checked={chkOutside} onChange={(e) => setChkOutside(e.target.checked)} />&nbsp;ส่งซ่อมบริษัท
                <input type="text" value={outsideCompany} onChange={(e) => setOutsideCompany(e.target.value)} style={{ width: '180px', textAlign: 'center' }} />
              </label>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input type="checkbox" checked={chkOther} onChange={(e) => setChkOther(e.target.checked)} />&nbsp;อื่นๆ
                <input type="text" value={otherDetails} onChange={(e) => setOtherDetails(e.target.value)} style={{ width: '230px', textAlign: 'center' }} />
              </label>
            </div>
          </div>

          {/* ลายเซ็นส่วนที่ 2 */}
          <div className="grid-2" style={{ marginTop: '10px' }}>
            <div className="signature-box" style={{ alignItems: 'flex-start' }}>
              <div className="row" style={{ justifyContent: 'center' }}>
                ลงชื่อ<input type="text" value={maintSign} onChange={(e) => setMaintSign(e.target.value)} style={{ width: '160px', textAlign: 'center' }} />หน่วยงานซ่อมบำรุง
              </div>
              <div className="row" style={{ justifyContent: 'left', marginBottom: '5px' }}>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(
                <input type="text" value={maintFullName} onChange={(e) => setMaintFullName(e.target.value)} style={{ width: '170px', textAlign: 'center' }} />)
              </div>
            </div>
          </div>

          {/* รับของ/ส่งของ */}
          <div className="grid-2" style={{ marginTop: '10px' }}>
            <div>
              <span className="bold">จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</span><br />
              <br />
              {isSupplyApproved ? (
                <>
                  <div className="row" style={{ marginTop: '4px' }}>
                    (ลงชื่อ)<input type="text" value={repairRequest.supplyOfficerApprovedBy || procureSign} onChange={(e) => setProcureSign(e.target.value)} style={{ width: '150px', textAlign: 'center' }} />
                  </div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;({repairRequest.supplyOfficerApprovedBy || 'นางสาวชุติญา จรัสกุลธาดา'})</div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ตำแหน่ง&nbsp;หัวหน้าเจ้าหน้าที่</div>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="row" style={{ marginTop: '4px' }}>(ลงชื่อ)..................................................</div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ตำแหน่ง&nbsp;หัวหน้าเจ้าหน้าที่</div>
                  <div className="text-[10px] text-amber-600 font-bold no-print">⚠️ รอหัวหน้าเจ้าหน้าที่พัสดุอนุมัติ</div>
                </div>
              )}
            </div>

            <div>
              <span className="bold">บันทึกหน่วยงานรับซ่อมบำรุง/บันทึกผู้ส่งของ</span><br />
              ได้รับการซ่อมบำรุงตามรายการข้างต้นเรียบร้อยแล้ว<br />
              <br />
              {isTechnicianDone ? (
                <>
                  <div className="row" style={{ marginTop: '4px' }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;(ลงชื่อ)<input type="text" value={repairRequest.maintCompletedBy || deliverSign} onChange={(e) => setDeliverSign(e.target.value)} style={{ width: '150px', textAlign: 'center' }} />
                  </div>
                  <div className="row">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(
                    <input type="text" value={repairRequest.maintCompletedBy || deliverFullName} onChange={(e) => setDeliverFullName(e.target.value)} style={{ width: '170px', textAlign: 'center' }} />)
                  </div>
                  <div className="row">
                    วันที่<input type="text" value={deliverDay} onChange={(e) => setDeliverDay(e.target.value)} style={{ width: '40px', textAlign: 'center' }} />
                    เดือน<input type="text" value={deliverMonth} onChange={(e) => setDeliverMonth(e.target.value)} style={{ width: '90px', textAlign: 'center' }} />
                    พ.ศ.<input type="text" value={deliverYear} onChange={(e) => setDeliverYear(e.target.value)} style={{ width: '60px', textAlign: 'center' }} />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="row" style={{ marginTop: '4px' }}>&nbsp;&nbsp;&nbsp;&nbsp;(ลงชื่อ)..................................................</div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
                  <div className="row">วันที่............เดือน..........................พ.ศ..............</div>
                  <div className="text-[10px] text-amber-600 font-bold no-print">⚠️ รอช่างดำเนินการซ่อมเสร็จ</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid-2" style={{ marginTop: '10px' }}>
            <div>
              <span className="bold">ความคิดเห็นของผู้มีอำนาจอนุมัติ</span><br />
              {isDirectorApproved ? (
                <>
                  <input type="text" value={repairRequest.approverComments || approverComments1} onChange={(e) => setApproverComments1(e.target.value)} style={{ width: '200px', textAlign: 'center' }} /><br />
                  <input type="text" value={approverComments2} onChange={(e) => setApproverComments2(e.target.value)} style={{ width: '200px', textAlign: 'center' }} /><br />
                  <div className="row" style={{ marginTop: '4px' }}>
                    (ลงชื่อ)<input type="text" value={repairRequest.directorApprovedBy || approverSign} onChange={(e) => setApproverSign(e.target.value)} style={{ width: '150px', textAlign: 'center' }} />
                  </div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;({repairRequest.directorApprovedBy || 'นายจิรวัฒน์ วงษ์สวัสดิ์'})</div>
                  <div className="row">นายแพทย์ชำนาญการ (ด้านเวชกรรม)</div>
                  <div className="row">ตำแหน่ง&nbsp;ผู้อำนวยการโรงพยาบาลสังขละบุรี</div>
                </>
              ) : (
                <div className="space-y-1">
                  <div>ความคิดเห็น: .....................................................</div>
                  <div className="row" style={{ marginTop: '4px' }}>(ลงชื่อ)..................................................</div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
                  <div className="row">ตำแหน่ง&nbsp;ผู้อำนวยการโรงพยาบาลสังขละบุรี</div>
                  <div className="text-[10px] text-amber-600 font-bold no-print">⚠️ รอผู้อำนวยการพิจารณาอนุมัติ</div>
                </div>
              )}
            </div>

            <div>
              <span className="bold">บันทึกหน่วยงานรับซ่อมบำรุง/บันทึกผู้รับของ</span><br />
              ได้รับการซ่อมบำรุงตามรายการข้างต้นเรียบร้อยแล้ว<br />
              {isItemReceived ? (
                <>
                  <div className="row" style={{ marginTop: '5px' }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;(ลงชื่อ)<input type="text" value={repairRequest.itemReceivedBy || receiveSign} onChange={(e) => setReceiveSign(e.target.value)} style={{ width: '150px', textAlign: 'center' }} />
                  </div>
                  <div className="row">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(
                    <input type="text" value={repairRequest.itemReceivedBy || receiveFullName} onChange={(e) => setReceiveFullName(e.target.value)} style={{ width: '170px', textAlign: 'center' }} />)
                  </div>
                  <div className="row">
                    ตำแหน่ง<input type="text" value={receivePosition} onChange={(e) => setReceivePosition(e.target.value)} style={{ width: '270px', textAlign: 'center' }} />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="row" style={{ marginTop: '5px' }}>&nbsp;&nbsp;&nbsp;&nbsp;(ลงชื่อ)..................................................</div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
                  <div className="row">ตำแหน่ง..................................................</div>
                  <div className="text-[10px] text-amber-600 font-bold no-print">⚠️ รอหน่วยงานผู้แจ้งซ่อมกดรับของในระบบ</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
