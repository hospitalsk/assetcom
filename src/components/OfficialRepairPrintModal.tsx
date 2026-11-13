import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RepairRequest } from '../types';
import { Printer, X, Download, CheckCircle, ShieldCheck, Save } from 'lucide-react';
import { exportA4ElementToPdf } from '../utils/pdfExport';
import { getUserRoleFlags } from '../utils/permissions';
import { showSwalAlert, showSwalToast } from '../utils/swal';

interface OfficialRepairPrintModalProps {
  repairRequest: RepairRequest;
  onClose: () => void;
}

export const OfficialRepairPrintModal: React.FC<OfficialRepairPrintModalProps> = ({
  repairRequest,
  onClose,
}) => {
  const { assets, departments, users, currentUser, updateRepairRequest, settings } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  const roleFlags = getUserRoleFlags(currentUser);
  const isReporter = currentUser.id === repairRequest.reporterId;

  // Fine-grained edit permissions per hospital official memo policy
  const canEditReporterFields = isReporter || roleFlags.isAdmin;
  const canEditHeadFields = roleFlags.isDepartmentHead || roleFlags.isAdmin;
  const canEditMaintFields = roleFlags.isGeneralMechanic || roleFlags.isAdmin;
  const canEditSupplyFields = roleFlags.isSupplyOfficer || roleFlags.isAdmin;
  const canEditOtherFields = roleFlags.isAdmin;

  const asset = assets.find(a => a.id === repairRequest.assetId);
  const dept = departments.find(d => d.id === repairRequest.departmentId);
  const reporter = users.find(u => u.id === repairRequest.reporterId) || {
    name: currentUser.name,
    position: currentUser.position || 'เจ้าหน้าที่'
  };
  const technician = users.find(u => u.id === repairRequest.technicianId);
  const headUser =
    users.find(u => getUserRoleFlags(u).isDepartmentHead && u.departmentId === repairRequest.departmentId) ||
    users.find(u => getUserRoleFlags(u).isDepartmentHead);
  const supplyUser = users.find(u => getUserRoleFlags(u).isSupplyOfficer);
  const approverUser = users.find(u => getUserRoleFlags(u).isApprover);

  const savedMemo = repairRequest.memoData || {};

  // Date formatting helpers (Date when the repair request was reported)
  const reportDateRaw = repairRequest.sentDate || repairRequest.createdAt;
  const reqDate = new Date(reportDateRaw);
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const thaiDateStr = !isNaN(reqDate.getTime())
    ? `${reqDate.getDate()} ${thaiMonths[reqDate.getMonth()]} ${reqDate.getFullYear() + 543}`
    : (repairRequest.sentDate || repairRequest.createdAt || '');

  const defaultAgency = `${settings.organizationName || 'โรงพยาบาลสังขละบุรี'} ฝ่ายบริหารทั่วไป ${settings.orgPhone ? `โทร. ${settings.orgPhone}` : 'โทร. ๐๓๔-๕๙๕๐๓๐ ต่อ ๒๐๕'}`;

  // Interactive Form State for ALL input fields in the official document
  const [govAgency, setGovAgency] = useState(savedMemo.agency || defaultAgency);
  const [docNoSub, setDocNoSub] = useState(savedMemo.docNumber || (repairRequest.repairNo ? repairRequest.repairNo.replace('REP-', '') : '2568/01'));
  const [docDate, setDocDate] = useState(savedMemo.docDate || thaiDateStr);

  useEffect(() => {
    setDocDate(repairRequest.memoData?.docDate || thaiDateStr);
  }, [repairRequest.id, repairRequest.sentDate, repairRequest.createdAt, thaiDateStr]);

  const [deptName, setDeptName] = useState(savedMemo.deptName || dept?.name || 'กลุ่มงานทั่วไป');
  const [category, setCategory] = useState<'การแพทย์' | 'สำนักงาน' | 'ยานพาหนะ' | 'อาคาร' | 'สิ่งก่อสร้าง' | 'งานบ้านงานครัว' | 'อุปกรณ์และอื่นๆ'>(
    savedMemo.category || 'สำนักงาน'
  );

  // Asset details
  const [assetName, setAssetName] = useState(savedMemo.machineName || asset?.name || '');
  const [assetModel, setAssetModel] = useState(savedMemo.machineModel || asset?.model || '');
  const [issueDesc, setIssueDesc] = useState(repairRequest.issueDescription || '');
  const [assetCode, setAssetCode] = useState(savedMemo.assetNumber || asset?.assetCode || asset?.serialNumber || '');
  const [company, setCompany] = useState(savedMemo.vendorCompany || asset?.vendorName || '');
  const [phone, setPhone] = useState(savedMemo.vendorPhone || asset?.vendorPhone || '');
  const [quantity, setQuantity] = useState(savedMemo.quantity || '1 เครื่อง');

  // Signatures Part 1: Reporter
  const [reporterSign, setReporterSign] = useState(savedMemo.senderSign || reporter.name);
  const [reporterFullName, setReporterFullName] = useState(savedMemo.senderName || reporter.name);
  const [reporterPosition, setReporterPosition] = useState(savedMemo.senderPosition || reporter.position || 'เจ้าหน้าที่');

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

  // Department Head fields (dynamically resolves logged-in Department Head when unapproved or approved)
  const resolvedHeadName =
    repairRequest.departmentHeadApprovedBy ||
    savedMemo.headSign ||
    (roleFlags.isDepartmentHead ? currentUser.name : headUser?.name || '');
  const resolvedHeadPosition =
    repairRequest.headPosition ||
    savedMemo.headPosition ||
    (roleFlags.isDepartmentHead ? (currentUser.position || 'หัวหน้าฝ่าย/หัวหน้ากลุ่มงาน') : (headUser?.position || 'หัวหน้าฝ่าย/หัวหน้ากลุ่มงาน'));

  const [headOpinion, setHeadOpinion] = useState(
    repairRequest.headOpinion || savedMemo.headOpinion || 'เห็นควรอนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ'
  );
  const [headSign, setHeadSign] = useState(resolvedHeadName);
  const [headFullName, setHeadFullName] = useState(resolvedHeadName);
  const [headPosition, setHeadPosition] = useState(resolvedHeadPosition);

  // Maintenance Dept Options (Editable ONLY by General Mechanic, Admin, Super Admin)
  const [chkSelfFree, setChkSelfFree] = useState(Boolean(savedMemo.canSelfRepairFree));
  const [chkSelfCost, setChkSelfCost] = useState(
    savedMemo.canSelfRepairWithCost !== undefined ? Boolean(savedMemo.canSelfRepairWithCost) : false
  );
  const [chkGovTech, setChkGovTech] = useState(Boolean(savedMemo.sendToGovTech));
  const [repairDays, setRepairDays] = useState(savedMemo.repairDays || '');
  const [repairCost, setRepairCost] = useState(
    savedMemo.repairCost || (repairRequest.totalCost ? String(repairRequest.totalCost) : '')
  );
  const [chkOutside, setChkOutside] = useState(Boolean(savedMemo.sendToOutsideCompany));
  const [outsideCompany, setOutsideCompany] = useState(savedMemo.outsideCompanyName || '');
  const [chkOther, setChkOther] = useState(Boolean(savedMemo.otherOption));
  const [otherDetails, setOtherDetails] = useState(savedMemo.otherOptionDetails || '');

  // Maintenance Signatures
  const resolvedMaintName =
    repairRequest.maintCompletedBy ||
    repairRequest.technicianApprovedBy ||
    savedMemo.maintenanceSign ||
    technician?.name ||
    (canEditMaintFields ? currentUser.name : '');
  const [maintSign, setMaintSign] = useState(resolvedMaintName);
  const [maintFullName, setMaintFullName] = useState(savedMemo.maintenanceName || resolvedMaintName);

  // Supply Officer Signatures (dynamically resolves Supply Officer user)
  const resolvedSupplyName =
    repairRequest.supplyOfficerApprovedBy ||
    savedMemo.procureSign ||
    (roleFlags.isSupplyOfficer ? currentUser.name : supplyUser?.name || '');
  const [procureSign, setProcureSign] = useState(resolvedSupplyName);

  // Delivery & Receive Signatures (Admin manual override / workflow stamps)
  const validReqDate = !isNaN(reqDate.getTime()) ? reqDate : new Date();
  const [deliverSign, setDeliverSign] = useState(
    savedMemo.deliverySign || repairRequest.maintCompletedBy || technician?.name || ''
  );
  const [deliverFullName, setDeliverFullName] = useState(
    savedMemo.deliveryName || repairRequest.maintCompletedBy || technician?.name || ''
  );
  const [deliverDay, setDeliverDay] = useState(savedMemo.deliveryDay || String(validReqDate.getDate()));
  const [deliverMonth, setDeliverMonth] = useState(savedMemo.deliveryMonth || thaiMonths[validReqDate.getMonth()]);
  const [deliverYear, setDeliverYear] = useState(savedMemo.deliveryYear || String(validReqDate.getFullYear() + 543));

  // Approver Comments & Signatures
  const resolvedApproverName =
    repairRequest.directorApprovedBy ||
    savedMemo.approverSign ||
    approverUser?.name ||
    settings.approverName ||
    '';
  const [approverComments1, setApproverComments1] = useState(
    repairRequest.approverComments || savedMemo.approverComment1 || 'อนุมัติให้ดำเนินการซ่อมบำรุงได้'
  );
  const [approverComments2, setApproverComments2] = useState(savedMemo.approverComment2 || '');
  const [approverSign, setApproverSign] = useState(resolvedApproverName);

  // Receiver
  const [receiveSign, setReceiveSign] = useState(savedMemo.receiveSign || repairRequest.itemReceivedBy || reporter.name);
  const [receiveFullName, setReceiveFullName] = useState(savedMemo.receiveName || repairRequest.itemReceivedBy || reporter.name);
  const [receivePosition, setReceivePosition] = useState(savedMemo.receivePosition || reporter.position || 'เจ้าหน้าที่ผู้รับของ');

  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const buildAuthorizedMemoUpdates = (): Partial<RepairRequest> => {
    const nextMemo: Record<string, any> = { ...(repairRequest.memoData || {}) };
    const reqUpdates: Partial<RepairRequest> = {};

    if (canEditReporterFields) {
      nextMemo.agency = govAgency;
      nextMemo.docNumber = docNoSub;
      nextMemo.docDate = docDate;
      nextMemo.deptName = deptName;
      nextMemo.category = category;
      nextMemo.machineName = assetName;
      nextMemo.machineModel = assetModel;
      nextMemo.assetNumber = assetCode;
      nextMemo.vendorCompany = company;
      nextMemo.vendorPhone = phone;
      nextMemo.quantity = quantity;
      nextMemo.senderSign = reporterSign;
      nextMemo.senderName = reporterFullName;
      nextMemo.senderPosition = reporterPosition;
      reqUpdates.issueDescription = issueDesc;
    }

    if (canEditHeadFields) {
      nextMemo.headOpinion = headOpinion;
      nextMemo.headSign = headSign;
      nextMemo.headName = headFullName;
      nextMemo.headPosition = headPosition;
      reqUpdates.headOpinion = headOpinion;
      reqUpdates.headPosition = headPosition;
    }

    if (canEditMaintFields) {
      nextMemo.canSelfRepairFree = chkSelfFree;
      nextMemo.canSelfRepairWithCost = chkSelfCost;
      nextMemo.sendToGovTech = chkGovTech;
      nextMemo.repairDays = repairDays;
      nextMemo.repairCost = repairCost;
      nextMemo.sendToOutsideCompany = chkOutside;
      nextMemo.outsideCompanyName = outsideCompany;
      nextMemo.otherOption = chkOther;
      nextMemo.otherOptionDetails = otherDetails;
      nextMemo.maintenanceSign = maintSign;
      nextMemo.maintenanceName = maintFullName;
      const numericCost = parseFloat(repairCost);
      if (!isNaN(numericCost)) {
        reqUpdates.partsCost = numericCost;
      }
    }

    if (canEditSupplyFields) {
      nextMemo.procureSign = procureSign;
      nextMemo.procureName = procureSign;
    }

    if (canEditOtherFields) {
      nextMemo.deliverySign = deliverSign;
      nextMemo.deliveryName = deliverFullName;
      nextMemo.deliveryDay = deliverDay;
      nextMemo.deliveryMonth = deliverMonth;
      nextMemo.deliveryYear = deliverYear;
      nextMemo.approverComment1 = approverComments1;
      nextMemo.approverComment2 = approverComments2;
      nextMemo.approverSign = approverSign;
      nextMemo.receiveSign = receiveSign;
      nextMemo.receiveName = receiveFullName;
      nextMemo.receivePosition = receivePosition;
      reqUpdates.approverComments = approverComments1;
    }

    reqUpdates.memoData = nextMemo;
    return reqUpdates;
  };

  const handleSaveMemoForm = (showFeedback = true) => {
    const updates = buildAuthorizedMemoUpdates();
    updateRepairRequest(repairRequest.id, updates);
    if (showFeedback) {
      showSwalToast('success', 'บันทึกข้อมูลแบบฟอร์มเรียบร้อยแล้ว');
    }
  };

  const handleSavePdf = async () => {
    if (!printRef.current) return;
    try {
      setIsSavingPdf(true);
      handleSaveMemoForm(false);
      const filename = `บันทึกข้อความขออนุมัติซ่อมบำรุง_${docNoSub.replace(/[\/\\]/g, '-')}.pdf`;
      await exportA4ElementToPdf(printRef.current, filename);
      showSwalToast('success', 'บันทึกไฟล์ PDF 1 หน้า A4 สำเร็จ');
    } catch (err) {
      console.error('Save PDF error:', err);
      showSwalAlert('error', 'ไม่สามารถบันทึก PDF ได้', 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSavingPdf(false);
    }
  };

  const handlePrint = async () => {
    if (!printRef.current) return;
    setIsPrinting(true);
    handleSaveMemoForm(false);

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
            showSwalAlert(
              'info',
              'บันทึกเป็นไฟล์ PDF 1 หน้า A4 แล้ว',
              'เบราว์เซอร์ในโหมด Preview นี้ปิดกั้นหน้าต่างสั่งพิมพ์โดยตรง ระบบได้บันทึกเป็นไฟล์ PDF 1 หน้า A4 ให้เรียบร้อยแล้ว สามารถเปิดไฟล์ PDF เพื่อสั่งพิมพ์ได้ทันที'
            );
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
          <div className="flex flex-wrap items-center gap-2">
            {(canEditReporterFields || canEditHeadFields || canEditMaintFields || canEditSupplyFields || canEditOtherFields) && (
              <button
                type="button"
                onClick={() => handleSaveMemoForm(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
                title="บันทึกการแก้ไขแบบฟอร์มลงระบบ"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกข้อมูล</span>
              </button>
            )}
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
        {roleFlags.isDepartmentHead || roleFlags.isAdmin ? (
          !isHeadApproved ? (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border border-blue-600/80 px-4 py-2.5 rounded-xl text-xs shadow-lg">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-blue-600 rounded-lg text-white font-bold">✍️</span>
                <div>
                  <div className="font-bold text-white text-xs">อนุมัติในฐานะหัวหน้ากลุ่มงาน ({currentUser.name} - {currentUser.position || 'หัวหน้าฝ่าย/กลุ่มงาน'})</div>
                  <div className="text-[11px] text-blue-200">กดยืนยันอนุมัติเพื่อบันทึกชื่อ-นามสกุลและตำแหน่งของคุณลงแบบฟอร์มราชการ</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const signerName = roleFlags.isDepartmentHead ? currentUser.name : (headSign || currentUser.name);
                  const signerPos = roleFlags.isDepartmentHead ? (currentUser.position || headPosition || 'หัวหน้าฝ่าย/หัวหน้ากลุ่มงาน') : headPosition;
                  setHeadSign(signerName);
                  setHeadFullName(signerName);
                  setHeadPosition(signerPos);
                  const memoUpdates = buildAuthorizedMemoUpdates();
                  updateRepairRequest(repairRequest.id, {
                    ...memoUpdates,
                    departmentHeadApproved: true,
                    departmentHeadApprovedBy: signerName,
                    departmentHeadApprovedAt: new Date().toISOString(),
                    headOpinion,
                    headPosition: signerPos,
                    memoData: {
                      ...(memoUpdates.memoData || {}),
                      headOpinion,
                      headSign: signerName,
                      headName: signerName,
                      headPosition: signerPos
                    },
                    status: (repairRequest.status === 'รอหัวหน้าอนุมัติ' || repairRequest.status === 'รอรับเรื่อง' || repairRequest.status === 'รอตรวจสอบ') ? 'รอพัสดุอนุมัติ' : repairRequest.status
                  });
                  showSwalAlert('success', 'อนุมัติใบแจ้งซ่อมเรียบร้อยแล้ว', `ลงนามโดย ${signerName} (${signerPos})`);
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
                สถานะการอนุมัติหัวหน้ากลุ่มงาน: <strong className={isHeadApproved ? 'text-emerald-400' : 'text-amber-400'}>{isHeadApproved ? `✓ อนุมัติแล้ว (${repairRequest.departmentHeadApprovedBy || headSign})` : '⏳ ยังไม่อนุมัติ (แสดงเส้นสำหรับเซ็นในกระดาษ)'}</strong>
              </span>
            </div>
            {!isHeadApproved && (
              <span className="text-[11px] text-amber-300 italic">
                สิทธิ์แก้ไข: ผู้แจ้งซ่อมแก้ไขหัวเรื่อง/รายการ/ผู้ส่งซ่อม • ส่วนอื่นตาม Role หรือ Admin
              </span>
            )}
          </div>
        )}
        {(roleFlags.isSupplyOfficer || roleFlags.isAdmin) && isHeadApproved && !isSupplyApproved && (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-indigo-950/90 border border-indigo-600/80 px-4 py-2 rounded-xl text-xs text-indigo-100">
            <div>
              <strong>อนุมัติในฐานะหัวหน้าเจ้าหน้าที่พัสดุ ({currentUser.name})</strong>
            </div>
            <button
              type="button"
              onClick={() => {
                const signerName = roleFlags.isSupplyOfficer ? currentUser.name : (procureSign || currentUser.name);
                setProcureSign(signerName);
                const memoUpdates = buildAuthorizedMemoUpdates();
                updateRepairRequest(repairRequest.id, {
                  ...memoUpdates,
                  supplyOfficerApproved: true,
                  supplyOfficerApprovedBy: signerName,
                  supplyOfficerApprovedAt: new Date().toISOString(),
                  memoData: {
                    ...(memoUpdates.memoData || {}),
                    procureSign: signerName,
                    procureName: signerName
                  },
                  status: 'รอผู้อำนวยการอนุมัติ'
                });
                showSwalAlert('success', 'อนุมัติในฐานะหัวหน้าเจ้าหน้าที่พัสดุสำเร็จ', `ลงนามโดย ${signerName}`);
              }}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <CheckCircle className="w-4 h-4" />
              <span>อนุมัติ (หัวหน้าเจ้าหน้าที่พัสดุ)</span>
            </button>
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
          {/* ตราครุฑ 3 ซม. (ดึงจากตั้งค่าระบบ หรือรูปตราครุฑมาตรฐาน) */}
          <img 
            src={settings.emblemUrl || './assets/aistudio/________3cm_fbf2f514.png'} 
            alt="ตราครุฑ" 
            style={{ position: 'absolute', top: '13px', left: '70px', width: '1.38cm', height: '1.5cm', objectFit: 'contain' }}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.src.includes('garuda_3cm.png')) {
                img.src = './assets/garuda_3cm.png';
              }
            }}
          />

          {/* ส่วนหัว */}
          <div>
            <div className="header-title" style={{ paddingLeft: '272px' }}>บันทึกข้อความ</div>
            
            <div className="row" style={{ marginTop: '9px', marginBottom: '4px' }}>
              <span className="bold" style={{ marginTop: '0px', marginBottom: '4px' }}>ส่วนราชการ</span>&nbsp;
              <input 
                type="text" 
                readOnly={!canEditReporterFields}
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
                  readOnly={!canEditReporterFields}
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
                  readOnly={!canEditReporterFields}
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
              ด้วยฝ่าย/งาน <input type="text" readOnly={!canEditReporterFields} value={deptName} onChange={(e) => setDeptName(e.target.value)} style={{ width: '220px' }} /> มีความประสงค์จะทำการซ่อมบำรุงพัสดุ ครุภัณฑ์
            </div>
            
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'การแพทย์'} onChange={() => setCategory('การแพทย์')} style={{ marginBottom: '-11px', paddingBottom: '0px' }} /> การแพทย์
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'สำนักงาน'} onChange={() => setCategory('สำนักงาน')} style={{ marginBottom: '-11px', paddingLeft: '1px' }} /> สำนักงาน
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'ยานพาหนะ'} onChange={() => setCategory('ยานพาหนะ')} style={{ marginBottom: '-11px' }} /> ยานพาหนะ
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'อาคาร'} onChange={() => setCategory('อาคาร')} style={{ marginBottom: '-11px', paddingLeft: '1px' }} /> อาคาร
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'สิ่งก่อสร้าง'} onChange={() => setCategory('สิ่งก่อสร้าง')} style={{ marginBottom: '-11px', paddingLeft: '1px' }} /> สิ่งก่อสร้าง
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'งานบ้านงานครัว'} onChange={() => setCategory('งานบ้านงานครัว')} style={{ marginBottom: '-11px', paddingLeft: '1px' }} /> งานบ้านงานครัว
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'อุปกรณ์และอื่นๆ'} onChange={() => setCategory('อุปกรณ์และอื่นๆ')} style={{ marginBottom: '-11px', paddingLeft: '1px' }} /> อุปกรณ์และอื่นๆ
              </label>
              ตามตารางดังต่อไปนี้
            </div>

            {/* รายการซ่อม */}
            <div style={{ paddingLeft: '20px', marginTop: '5px' }}>
              <div className="row">
                1.เครื่อง<input type="text" readOnly={!canEditReporterFields} value={assetName} onChange={(e) => setAssetName(e.target.value)} style={{ width: '418px' }} /> 
                รุ่น<input type="text" readOnly={!canEditReporterFields} className="flex-input" value={assetModel} onChange={(e) => setAssetModel(e.target.value)} />
              </div>
              <div className="row">
                ลักษณะ/อาการชำรุด<input type="text" readOnly={!canEditReporterFields} value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} style={{ width: '220px' }} /> 
                หมายเลขครุภัณฑ์<input type="text" readOnly={!canEditReporterFields} className="flex-input" value={assetCode} onChange={(e) => setAssetCode(e.target.value)} />
              </div>
              <div className="row">
                บริษัท<input type="text" readOnly={!canEditReporterFields} value={company} onChange={(e) => setCompany(e.target.value)} style={{ width: '200px' }} /> 
                เบอร์โทรศัพท์<input type="text" readOnly={!canEditReporterFields} value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100px' }} /> 
                จำนวน<input type="text" readOnly={!canEditReporterFields} className="flex-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
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
                ลงชื่อ<input type="text" readOnly={!canEditReporterFields} value={reporterSign} onChange={(e) => setReporterSign(e.target.value)} style={{ width: '160px', textAlign: 'center' }} />ผู้ส่งซ่อม
              </div>
              <div className="row" style={{ justifyContent: 'left' }}>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(
                <input type="text" readOnly={!canEditReporterFields} value={reporterFullName} onChange={(e) => setReporterFullName(e.target.value)} style={{ width: '170px', textAlign: 'center' }} />)
              </div>
              <div className="row" style={{ justifyContent: 'center' }}>
                ตำแหน่ง<input type="text" readOnly={!canEditReporterFields} value={reporterPosition} onChange={(e) => setReporterPosition(e.target.value)} style={{ width: '260px', textAlign: 'center' }} />
              </div>
            </div>

            <div className="signature-box">
              <div>ความเห็นของหัวหน้าฝ่าย/หัวหน้ากลุ่มงาน</div>
              {isHeadApproved || canEditHeadFields ? (
                <>
                  <div className="row" style={{ justifyContent: 'center' }}>
                    <input type="text" readOnly={!canEditHeadFields} value={headOpinion} onChange={(e) => setHeadOpinion(e.target.value)} style={{ width: '300px', textAlign: 'center' }} />
                  </div>
                  <div className="row" style={{ justifyContent: 'center' }}>
                    ลงชื่อ<input type="text" readOnly={!canEditHeadFields} value={headSign} onChange={(e) => setHeadSign(e.target.value)} style={{ width: '160px', textAlign: 'center' }} />
                  </div>
                  <div className="row" style={{ justifyContent: 'left' }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(
                    <input type="text" readOnly={!canEditHeadFields} value={headFullName} onChange={(e) => setHeadFullName(e.target.value)} style={{ width: '170px', textAlign: 'center' }} />)
                  </div>
                  <div className="row" style={{ justifyContent: 'center' }}>
                    ตำแหน่ง<input type="text" readOnly={!canEditHeadFields} value={headPosition} onChange={(e) => setHeadPosition(e.target.value)} style={{ width: '270px', textAlign: 'center' }} />
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
                </>
              )}
            </div>
          </div>

          {/* ซ่อมบำรุง (General Mechanic / Admin / Super Admin) */}
          <div>
            <div style={{ paddingLeft: '0px', marginTop: '5px' }}>
              <div className="row">บันทึกหน่วยงานซ่อมบำรุง/ฝ่ายบริหารทั่วไป</div>
              <div className="row">เสนอ ผู้อำนวยการโรงพยาบาลสังขละบุรี</div>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input type="checkbox" disabled={!canEditMaintFields} checked={chkSelfFree} onChange={(e) => setChkSelfFree(e.target.checked)} />&nbsp;ซ่อมได้เองโดยช่างของโรงพยาบาล ไม่เสียค่าใช้จ่าย
              </label>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input type="checkbox" disabled={!canEditMaintFields} checked={chkSelfCost} onChange={(e) => setChkSelfCost(e.target.checked)} />&nbsp;ซ่อมได้เองโดยช่างของโรงพยาบาลโดยเสียค่าวัสดุเพิ่มเติม
              </label>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input type="checkbox" disabled={!canEditMaintFields} checked={chkGovTech} onChange={(e) => setChkGovTech(e.target.checked)} />&nbsp;ส่งซ่อมกองช่างบำรุง
              </label>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input type="checkbox" disabled={!canEditMaintFields} checked={chkSelfCost || chkSelfFree} onChange={(e) => setChkSelfCost(e.target.checked)} />&nbsp;ระยะเวลาการซ่อมประมาณ
                <input type="text" readOnly={!canEditMaintFields} value={repairDays} onChange={(e) => setRepairDays(e.target.value)} style={{ width: '40px', textAlign: 'center' }} />วัน&nbsp;&nbsp;ค่าใช้จ่ายประมาณ
                <input type="text" readOnly={!canEditMaintFields} value={repairCost} onChange={(e) => setRepairCost(e.target.value)} style={{ width: '70px', textAlign: 'center' }} />บาท
              </label>
            </div>
            <div style={{ paddingLeft: '0px', marginTop: '5px' }}>
              <div className="row">ไม่สามารถซ่อมเองได้ จำเป็นต้องส่งซ่อมภายนอกหน่วยงาน</div>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input type="checkbox" disabled={!canEditMaintFields} checked={chkOutside} onChange={(e) => setChkOutside(e.target.checked)} />&nbsp;ส่งซ่อมบริษัท
                <input type="text" readOnly={!canEditMaintFields} value={outsideCompany} onChange={(e) => setOutsideCompany(e.target.value)} style={{ width: '180px', textAlign: 'center' }} />
              </label>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input type="checkbox" disabled={!canEditMaintFields} checked={chkOther} onChange={(e) => setChkOther(e.target.checked)} />&nbsp;อื่นๆ
                <input type="text" readOnly={!canEditMaintFields} value={otherDetails} onChange={(e) => setOtherDetails(e.target.value)} style={{ width: '230px', textAlign: 'center' }} />
              </label>
            </div>
          </div>

          {/* ลายเซ็นส่วนที่ 2 */}
          <div className="grid-2" style={{ marginTop: '10px' }}>
            <div className="signature-box" style={{ alignItems: 'flex-start' }}>
              <div className="row" style={{ justifyContent: 'center' }}>
                ลงชื่อ<input type="text" readOnly={!canEditMaintFields} value={maintSign} onChange={(e) => setMaintSign(e.target.value)} style={{ width: '160px', textAlign: 'center' }} />หน่วยงานซ่อมบำรุง
              </div>
              <div className="row" style={{ justifyContent: 'left', marginBottom: '5px' }}>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(
                <input type="text" readOnly={!canEditMaintFields} value={maintFullName} onChange={(e) => setMaintFullName(e.target.value)} style={{ width: '170px', textAlign: 'center' }} />)
              </div>
            </div>
          </div>

          {/* รับของ/ส่งของ */}
          <div className="grid-2" style={{ marginTop: '10px' }}>
            <div>
              <span className="bold">จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</span><br />
              <br />
              {isSupplyApproved || canEditSupplyFields ? (
                <>
                  <div className="row" style={{ marginTop: '4px' }}>
                    (ลงชื่อ)<input type="text" readOnly={!canEditSupplyFields} value={procureSign} onChange={(e) => setProcureSign(e.target.value)} style={{ width: '150px', textAlign: 'center' }} />
                  </div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;({procureSign || '......................................'})</div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ตำแหน่ง&nbsp;หัวหน้าเจ้าหน้าที่พัสดุ</div>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="row" style={{ marginTop: '4px' }}>(ลงชื่อ)..................................................</div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ตำแหน่ง&nbsp;หัวหน้าเจ้าหน้าที่พัสดุ</div>
                </div>
              )}
            </div>

            <div>
              <span className="bold">บันทึกหน่วยงานรับซ่อมบำรุง/บันทึกผู้ส่งของ</span><br />
              ได้รับการซ่อมบำรุงตามรายการข้างต้นเรียบร้อยแล้ว<br />
              <br />
              {isTechnicianDone || canEditOtherFields ? (
                <>
                  <div className="row" style={{ marginTop: '4px' }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;(ลงชื่อ)<input type="text" readOnly={!canEditOtherFields} value={repairRequest.maintCompletedBy || deliverSign} onChange={(e) => setDeliverSign(e.target.value)} style={{ width: '150px', textAlign: 'center' }} />
                  </div>
                  <div className="row">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(
                    <input type="text" readOnly={!canEditOtherFields} value={repairRequest.maintCompletedBy || deliverFullName} onChange={(e) => setDeliverFullName(e.target.value)} style={{ width: '170px', textAlign: 'center' }} />)
                  </div>
                  <div className="row">
                    วันที่<input type="text" readOnly={!canEditOtherFields} value={deliverDay} onChange={(e) => setDeliverDay(e.target.value)} style={{ width: '40px', textAlign: 'center' }} />
                    เดือน<input type="text" readOnly={!canEditOtherFields} value={deliverMonth} onChange={(e) => setDeliverMonth(e.target.value)} style={{ width: '90px', textAlign: 'center' }} />
                    พ.ศ.<input type="text" readOnly={!canEditOtherFields} value={deliverYear} onChange={(e) => setDeliverYear(e.target.value)} style={{ width: '60px', textAlign: 'center' }} />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="row" style={{ marginTop: '4px' }}>&nbsp;&nbsp;&nbsp;&nbsp;(ลงชื่อ)..................................................</div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
                  <div className="row">วันที่............เดือน..........................พ.ศ..............</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid-2" style={{ marginTop: '10px' }}>
            <div>
              <span className="bold">ความคิดเห็นของผู้มีอำนาจอนุมัติ</span><br />
              {isDirectorApproved || canEditOtherFields ? (
                <>
                  <input type="text" readOnly={!canEditOtherFields} value={repairRequest.approverComments || approverComments1} onChange={(e) => setApproverComments1(e.target.value)} style={{ width: '200px', textAlign: 'center' }} /><br />
                  <input type="text" readOnly={!canEditOtherFields} value={approverComments2} onChange={(e) => setApproverComments2(e.target.value)} style={{ width: '200px', textAlign: 'center' }} /><br />
                  <div className="row" style={{ marginTop: '4px' }}>
                    (ลงชื่อ)<input type="text" readOnly={!canEditOtherFields} value={repairRequest.directorApprovedBy || approverSign} onChange={(e) => setApproverSign(e.target.value)} style={{ width: '150px', textAlign: 'center' }} />
                  </div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;({repairRequest.directorApprovedBy || approverSign || '......................................'})</div>
                  <div className="row">นายแพทย์ชำนาญการ (ด้านเวชกรรม)</div>
                  <div className="row">ตำแหน่ง&nbsp;ผู้อำนวยการโรงพยาบาลสังขละบุรี</div>
                </>
              ) : (
                <div className="space-y-1">
                  <div>ความคิดเห็น: .....................................................</div>
                  <div className="row" style={{ marginTop: '4px' }}>(ลงชื่อ)..................................................</div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
                  <div className="row">ตำแหน่ง&nbsp;ผู้อำนวยการโรงพยาบาลสังขละบุรี</div>
                </div>
              )}
            </div>

            <div>
              <span className="bold">บันทึกหน่วยงานรับซ่อมบำรุง/บันทึกผู้รับของ</span><br />
              ได้รับการซ่อมบำรุงตามรายการข้างต้นเรียบร้อยแล้ว<br />
              {isItemReceived || canEditOtherFields ? (
                <>
                  <div className="row" style={{ marginTop: '5px' }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;(ลงชื่อ)<input type="text" readOnly={!canEditOtherFields} value={repairRequest.itemReceivedBy || receiveSign} onChange={(e) => setReceiveSign(e.target.value)} style={{ width: '150px', textAlign: 'center' }} />
                  </div>
                  <div className="row">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(
                    <input type="text" readOnly={!canEditOtherFields} value={repairRequest.itemReceivedBy || receiveFullName} onChange={(e) => setReceiveFullName(e.target.value)} style={{ width: '170px', textAlign: 'center' }} />)
                  </div>
                  <div className="row">
                    ตำแหน่ง<input type="text" readOnly={!canEditOtherFields} value={receivePosition} onChange={(e) => setReceivePosition(e.target.value)} style={{ width: '270px', textAlign: 'center' }} />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="row" style={{ marginTop: '5px' }}>&nbsp;&nbsp;&nbsp;&nbsp;(ลงชื่อ)..................................................</div>
                  <div className="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
                  <div className="row">ตำแหน่ง..................................................</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
