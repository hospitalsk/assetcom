import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RepairRequest } from '../types';
import { Printer, X, Download, CheckCircle, ShieldCheck, Save } from 'lucide-react';
import { getUserRoleFlags } from '../utils/permissions';
import { showSwalAlert, showSwalToast } from '../utils/swal';

interface OfficialRepairPrintModalProps {
  repairRequest: RepairRequest;
  onClose: () => void;
}

interface MemoFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  width?: string;
  maxWidth?: string;
  minWidth?: string;
  flexGrow?: boolean;
  align?: 'left' | 'center' | 'right';
  inputStyle?: React.CSSProperties;
}

const MemoField: React.FC<MemoFieldProps> = ({
  value = '',
  onChange,
  readOnly = false,
  width,
  maxWidth,
  minWidth,
  flexGrow = false,
  align = 'left',
  inputStyle
}) => {
  return (
    <span
      className={`memo-field${flexGrow ? ' memo-field-flex' : ''}`}
      style={{
        ...(width ? { width } : {}),
        ...(maxWidth ? { maxWidth } : {}),
        ...(minWidth ? { minWidth } : {})
      }}
    >
      <span className="memo-field-text-area">
        {readOnly ? (
          <span className="memo-static-text" style={{ textAlign: align }}>
            {value || '\u00A0'}
          </span>
        ) : (
          <>
            <input
              type="text"
              className="memo-input screen-only-input"
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              style={{ textAlign: align, ...inputStyle }}
            />
            <span className="memo-static-text print-only-text" style={{ textAlign: align }}>
              {value || '\u00A0'}
            </span>
          </>
        )}
      </span>
      <span className="memo-field-line" aria-hidden="true" />
    </span>
  );
};

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

  const orgName = settings.organizationName || 'โรงพยาบาลสังขละบุรี';
  const orgPhoneText = settings.orgPhone ? `โทร. ${settings.orgPhone}` : 'โทร. ๐๓๔-๕๙๕๐๓๐ ต่อ ๒๐๕';
  const initialDeptName = savedMemo.deptName || dept?.name || 'กลุ่มงานทั่วไป';

  const buildAgencyText = (deptText: string) =>
    `${orgName} ${deptText.trim() || 'ฝ่ายบริหารทั่วไป'} ${orgPhoneText}`.replace(/\s{2,}/g, ' ').trim();

  const syncAgencyWithDept = (
    prevAgency: string,
    prevDept: string,
    nextDept: string
  ): string => {
    const prevTrimmed = prevDept.trim();
    const nextTrimmed = nextDept.trim();
    const searchStart = prevAgency.startsWith(orgName) ? orgName.length : 0;
    const phoneIdx = prevAgency.indexOf('โทร.', searchStart);
    const searchEnd = phoneIdx !== -1 ? phoneIdx : prevAgency.length;
    const headSegment = prevAgency.slice(0, searchStart);
    const middleSegment = prevAgency.slice(searchStart, searchEnd);
    const tailSegment = prevAgency.slice(searchEnd);

    let updatedMiddle = middleSegment;
    if (prevTrimmed && middleSegment.includes(prevTrimmed)) {
      updatedMiddle = middleSegment.replace(prevTrimmed, nextTrimmed);
    } else if (middleSegment.includes('ฝ่ายบริหารทั่วไป')) {
      updatedMiddle = middleSegment.replace('ฝ่ายบริหารทั่วไป', nextTrimmed);
    } else if (prevTrimmed === '' && nextTrimmed) {
      updatedMiddle = middleSegment.trim()
        ? `${middleSegment.trim()} ${nextTrimmed}`
        : nextTrimmed;
    } else {
      return prevAgency;
    }

    return [headSegment.trim(), updatedMiddle.trim(), tailSegment.trim()]
      .filter(Boolean)
      .join(' ');
  };

  const initialAgency: string = (() => {
    if (!savedMemo.agency) {
      return buildAgencyText(initialDeptName);
    }
    if (
      savedMemo.agency.includes('ฝ่ายบริหารทั่วไป') &&
      initialDeptName.trim() &&
      initialDeptName.trim() !== 'ฝ่ายบริหารทั่วไป'
    ) {
      return syncAgencyWithDept(savedMemo.agency, 'ฝ่ายบริหารทั่วไป', initialDeptName);
    }
    return String(savedMemo.agency);
  })();

  // Interactive Form State for ALL input fields in the official document
  const [govAgency, setGovAgency] = useState<string>(initialAgency);
  const [docNoSub, setDocNoSub] = useState(savedMemo.docNumber || (repairRequest.repairNo ? repairRequest.repairNo.replace('REP-', '') : '2568/01'));
  const [docDate, setDocDate] = useState(savedMemo.docDate || thaiDateStr);

  useEffect(() => {
    setDocDate(repairRequest.memoData?.docDate || thaiDateStr);
  }, [repairRequest.id, repairRequest.sentDate, repairRequest.createdAt, thaiDateStr]);

  const [deptName, setDeptName] = useState<string>(initialDeptName);

  const handleDeptNameChange = (nextDept: string) => {
    const prevDept = deptName;
    setDeptName(nextDept);
    setGovAgency((prevAgency: string) => syncAgencyWithDept(prevAgency, prevDept, nextDept));
  };
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

  const [printModeActive, setPrintModeActive] = useState<'pdf' | 'print' | null>(null);

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

  const triggerHtmlCssPrint = async (mode: 'pdf' | 'print') => {
    if (!printRef.current) return;
    setPrintModeActive(mode);
    handleSaveMemoForm(false);

    const safeDocTitle = `บันทึกข้อความขออนุมัติซ่อมบำรุง_${docNoSub.replace(/[\/\\]/g, '-')}`;
    const originalTitle = document.title;

    try {
      const sourceEl = printRef.current;
      const clone = sourceEl.cloneNode(true) as HTMLElement;

      // Remove interactive screen-only <input type="text"> from print clone so only .memo-static-text renders cleanly
      const cloneScreenInputs = Array.from(clone.querySelectorAll('.screen-only-input'));
      cloneScreenInputs.forEach((inputEl) => {
        inputEl.parentNode?.removeChild(inputEl);
      });

      const clonePrintOnlyTexts = Array.from(clone.querySelectorAll('.print-only-text')) as HTMLElement[];
      clonePrintOnlyTexts.forEach((el) => {
        el.classList.remove('print-only-text');
        el.style.display = 'block';
        el.style.color = '#000000';
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
  <title>${safeDocTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    @page { size: 210mm 297mm; margin: 0; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Sarabun', sans-serif;
      font-size: 12.5px;
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
      line-height: 1.55;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Sarabun', sans-serif;
      font-size: 12.5px;
      color: #000000;
      margin: 0 auto;
    }
    .header-title {
      font-size: 15pt;
      font-weight: bold;
      margin-bottom: 2px;
      margin-top: 2px;
      line-height: 1.4;
    }
    .row, .memo-row {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      margin-bottom: 2px;
      width: 100%;
      max-width: 100%;
      line-height: 1.55;
    }
    .memo-label {
      flex-shrink: 0;
      line-height: 1.55;
      padding-bottom: 2px;
    }
    .memo-field {
      display: inline-flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 21px;
      flex-shrink: 0;
      box-sizing: border-box;
    }
    .memo-field-flex {
      flex: 1 1 0%;
      min-width: 36px;
    }
    .memo-field-text-area {
      display: block;
      width: 100%;
      min-height: 19px;
      line-height: 1.55;
      padding: 0 4px 2px 4px;
      box-sizing: border-box;
    }
    .memo-static-text {
      display: block;
      width: 100%;
      min-height: 19px;
      border: none !important;
      font-family: 'Sarabun', sans-serif;
      font-size: 12.5px;
      line-height: 1.55;
      color: #000000;
      white-space: normal;
      word-break: break-word;
      overflow-wrap: break-word;
      padding: 0;
      margin: 0;
    }
    .memo-field-line {
      display: block;
      width: 100%;
      height: 1px;
      border-bottom: 1px dotted #000000;
      flex-shrink: 0;
    }
    .memo-grid-2-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      width: 100%;
    }
    .memo-grid-item-1 {
      display: grid;
      grid-template-columns: 1.75fr 1fr;
      gap: 8px;
      width: 100%;
    }
    .memo-grid-item-2 {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 8px;
      width: 100%;
    }
    .memo-grid-item-3 {
      display: grid;
      grid-template-columns: 1.35fr 1fr 0.8fr;
      gap: 8px;
      width: 100%;
    }
    .bold { font-weight: bold; }
    .text-center { text-align: center; }
    .indent { padding-left: 2.5cm; }
    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-right: 5px;
      line-height: 1.55;
    }
    .checkbox-label input { margin: 0; }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 3px;
      width: 100%;
    }
    .signature-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
    }
    .memo-sign-col {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1px;
    }
    .memo-sign-row {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      width: 100%;
      margin-bottom: 2px;
      line-height: 1.55;
    }
    .memo-sign-row-center {
      justify-content: center;
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

      const triggerMainWindowPrint = () => {
        document.title = safeDocTitle;
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
              'เบราว์เซอร์ในโหมด Preview นี้ปิดกั้นการเรียกหน้าต่างพิมพ์อัตโนมัติ กรุณากด Ctrl+P (หรือ Cmd+P บน Mac) แล้วเลือกปลายทางเป็น "Save as PDF / บันทึกเป็น PDF" เพื่อบันทึกเอกสาร 1 หน้า A4 แบบ Vector คมชัด'
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

      // Ensure checked states are synchronized in the iframe DOM
      const frameChecks = Array.from(frameDoc.querySelectorAll('input[type="radio"], input[type="checkbox"]')) as HTMLInputElement[];
      frameChecks.forEach((chk, idx) => {
        if (origChecks[idx]) {
          chk.checked = origChecks[idx].checked;
        }
      });

      // Wait briefly for web fonts & images inside iframe before printing
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
        // Fallback: use main document @media print (HTML + CSS Print)
        triggerMainWindowPrint();
      }, 350);
    } catch (err) {
      console.warn('Browser print error:', err);
      document.title = originalTitle;
      setPrintModeActive(null);
      showSwalAlert(
        'info',
        'กรุณาสั่งพิมพ์หรือบันทึก PDF ด้วยเบราว์เซอร์',
        'กด Ctrl+P (หรือ Cmd+P บน Mac) แล้วเลือก "Save as PDF / บันทึกเป็น PDF" เพื่อบันทึกเอกสารขนาด 1 หน้า A4'
      );
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
                มาตรฐาน HTML + CSS Print ขนาด 1 หน้า A4 (รองรับ Browser Print to PDF ข้อความคมชัดแบบ Vector)
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
              onClick={() => triggerHtmlCssPrint('pdf')}
              disabled={printModeActive !== null}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/50 cursor-pointer active:scale-95"
              title="บันทึกเป็นไฟล์ PDF ผ่าน Browser Print to PDF (เลือกปลายทาง Save as PDF)"
            >
              <Download className="w-4 h-4" />
              <span>{printModeActive === 'pdf' ? 'กำลังเปิด Print to PDF...' : 'บันทึกเป็น PDF (Print to PDF)'}</span>
            </button>
            <button
              type="button"
              onClick={() => triggerHtmlCssPrint('print')}
              disabled={printModeActive !== null}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/50 cursor-pointer active:scale-95"
              title="พิมพ์แบบฟอร์มนี้โดยตรงด้วย HTML + CSS Print"
            >
              <Printer className="w-4 h-4" />
              <span>{printModeActive === 'print' ? 'กำลังเตรียมหน้าพิมพ์...' : 'พิมพ์แบบฟอร์มนี้'}</span>
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
              line-height: 1.55; 
              display: flex;
              flex-direction: column;
              overflow: hidden;
              box-sizing: border-box;
              font-family: 'Sarabun', sans-serif;
              font-size: 12.5px;
              color: #000;
              margin: 0 auto;
          }
          .header-title {
              font-size: 15pt;
              font-weight: bold;
              margin-bottom: 2px;
              margin-top: 2px;
              line-height: 1.4;
          }
          .row, .memo-row {
              display: flex;
              align-items: flex-end;
              gap: 4px;
              margin-bottom: 2px;
              width: 100%;
              max-width: 100%;
              box-sizing: border-box;
              line-height: 1.55;
          }
          .memo-label {
              flex-shrink: 0;
              line-height: 1.55;
              padding-bottom: 2px;
          }
          .memo-field {
              display: inline-flex;
              flex-direction: column;
              justify-content: flex-end;
              min-height: 21px;
              flex-shrink: 0;
              box-sizing: border-box;
          }
          .memo-field-flex {
              flex: 1 1 0%;
              min-width: 36px;
          }
          .memo-field-text-area {
              display: block;
              width: 100%;
              min-height: 19px;
              line-height: 1.55;
              padding: 0 4px 2px 4px;
              box-sizing: border-box;
          }
          .memo-input {
              display: block;
              width: 100%;
              height: 20px;
              border: none !important;
              outline: none;
              background: transparent;
              font-family: 'Sarabun', sans-serif;
              font-size: 12.5px;
              line-height: 1.55;
              padding: 0;
              margin: 0;
              color: #000080;
              box-sizing: border-box;
          }
          .memo-static-text {
              display: block;
              width: 100%;
              min-height: 19px;
              border: none !important;
              font-family: 'Sarabun', sans-serif;
              font-size: 12.5px;
              line-height: 1.55;
              color: #000080;
              white-space: normal;
              word-break: break-word;
              overflow-wrap: break-word;
              padding: 0;
              margin: 0;
          }
          .print-only-text {
              display: none;
          }
          .memo-field-line {
              display: block;
              width: 100%;
              height: 1px;
              border-bottom: 1px dotted #000000;
              flex-shrink: 0;
          }
          .memo-grid-2-header {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              width: 100%;
          }
          .memo-grid-item-1 {
              display: grid;
              grid-template-columns: 1.75fr 1fr;
              gap: 8px;
              width: 100%;
          }
          .memo-grid-item-2 {
              display: grid;
              grid-template-columns: 1.25fr 1fr;
              gap: 8px;
              width: 100%;
          }
          .memo-grid-item-3 {
              display: grid;
              grid-template-columns: 1.35fr 1fr 0.8fr;
              gap: 8px;
              width: 100%;
          }
          .bold { font-weight: bold; }
          .text-center { text-align: center; }
          .indent { padding-left: 2.5cm; }
          
          .checkbox-label {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;
              margin-right: 5px;
              line-height: 1.55;
          }
          .checkbox-label input { margin: 0; }
          
          .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              margin-top: 3px;
              width: 100%;
          }
          
          .signature-box {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1px;
          }
          .memo-sign-col {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              gap: 1px;
          }
          .memo-sign-row {
              display: flex;
              align-items: flex-end;
              gap: 4px;
              width: 100%;
              margin-bottom: 2px;
              line-height: 1.55;
          }
          .memo-sign-row-center {
              justify-content: center;
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
              html, body, #root {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: hidden !important;
                display: block !important;
                height: 297mm !important;
                max-height: 297mm !important;
                width: 210mm !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
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
                  line-height: 1.55 !important;
                  font-size: 12.5px !important;
                  color: #000000 !important;
              }
              .a4-page .screen-only-input {
                display: none !important;
              }
              .a4-page .print-only-text {
                display: block !important;
                color: #000000 !important;
              }
              .a4-page .memo-input,
              .a4-page .memo-static-text {
                color: #000000 !important;
                border: none !important;
              }
              .a4-page .memo-field-line {
                border-bottom: 1px dotted #000000 !important;
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
            
            <div className="memo-row" style={{ marginTop: '6px' }}>
              <span className="bold memo-label">ส่วนราชการ</span>
              <MemoField
                readOnly={!canEditReporterFields}
                value={govAgency}
                onChange={setGovAgency}
                flexGrow
              />
            </div>
            
            <div className="memo-grid-2-header">
              <div className="memo-row">
                <span className="bold memo-label">ที่</span>
                <span className="memo-label">กจ ๐๐๓.๓๐๘.๑/</span>
                <MemoField
                  readOnly={!canEditReporterFields}
                  value={docNoSub}
                  onChange={setDocNoSub}
                  flexGrow
                  maxWidth="100px"
                />
              </div>
              <div className="memo-row">
                <span className="bold memo-label">วันที่</span>
                <MemoField
                  readOnly={!canEditReporterFields}
                  value={docDate}
                  onChange={setDocDate}
                  flexGrow
                />
              </div>
            </div>

            <div className="memo-row">
              <span className="bold memo-label">เรื่อง</span>
              <span className="memo-label">ขออนุมัติซ่อมบำรุงพัสดุ-ครุภัณฑ์</span>
            </div>
            
            <div className="memo-row" style={{ marginBottom: '4px' }}>
              <span className="bold memo-label">เรียน</span>
              <span className="memo-label">ผู้อำนวยการโรงพยาบาลสังขละบุรี</span>
            </div>
          </div>

          {/* เนื้อหา */}
          <div>
            <div className="memo-row" style={{ paddingLeft: '20px', marginTop: '2px' }}>
              <span className="memo-label">ด้วยฝ่าย/งาน</span>
              <MemoField
                readOnly={!canEditReporterFields}
                value={deptName}
                onChange={handleDeptNameChange}
                width="220px"
              />
              <span className="memo-label">มีความประสงค์จะทำการซ่อมบำรุงพัสดุ ครุภัณฑ์</span>
            </div>
            
            <div className="memo-row" style={{ flexWrap: 'wrap', alignItems: 'center', marginTop: '2px' }}>
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'การแพทย์'} onChange={() => setCategory('การแพทย์')} /> การแพทย์
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'สำนักงาน'} onChange={() => setCategory('สำนักงาน')} /> สำนักงาน
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'ยานพาหนะ'} onChange={() => setCategory('ยานพาหนะ')} /> ยานพาหนะ
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'อาคาร'} onChange={() => setCategory('อาคาร')} /> อาคาร
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'สิ่งก่อสร้าง'} onChange={() => setCategory('สิ่งก่อสร้าง')} /> สิ่งก่อสร้าง
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'งานบ้านงานครัว'} onChange={() => setCategory('งานบ้านงานครัว')} /> งานบ้านงานครัว
              </label> /
              <label className="checkbox-label">
                <input type="radio" name="cat" disabled={!canEditReporterFields} checked={category === 'อุปกรณ์และอื่นๆ'} onChange={() => setCategory('อุปกรณ์และอื่นๆ')} /> อุปกรณ์และอื่นๆ
              </label>
              <span>ตามตารางดังต่อไปนี้</span>
            </div>

            {/* รายการซ่อม */}
            <div style={{ paddingLeft: '20px', marginTop: '3px' }}>
              <div className="memo-grid-item-1">
                <div className="memo-row">
                  <span className="memo-label">1.เครื่อง</span>
                  <MemoField
                    readOnly={!canEditReporterFields}
                    value={assetName}
                    onChange={setAssetName}
                    flexGrow
                  />
                </div>
                <div className="memo-row">
                  <span className="memo-label">รุ่น</span>
                  <MemoField
                    readOnly={!canEditReporterFields}
                    value={assetModel}
                    onChange={setAssetModel}
                    flexGrow
                  />
                </div>
              </div>
              <div className="memo-grid-item-2">
                <div className="memo-row">
                  <span className="memo-label">ลักษณะ/อาการชำรุด</span>
                  <MemoField
                    readOnly={!canEditReporterFields}
                    value={issueDesc}
                    onChange={setIssueDesc}
                    flexGrow
                  />
                </div>
                <div className="memo-row">
                  <span className="memo-label">หมายเลขครุภัณฑ์</span>
                  <MemoField
                    readOnly={!canEditReporterFields}
                    value={assetCode}
                    onChange={setAssetCode}
                    flexGrow
                  />
                </div>
              </div>
              <div className="memo-grid-item-3">
                <div className="memo-row">
                  <span className="memo-label">บริษัท</span>
                  <MemoField
                    readOnly={!canEditReporterFields}
                    value={company}
                    onChange={setCompany}
                    flexGrow
                  />
                </div>
                <div className="memo-row">
                  <span className="memo-label">เบอร์โทรศัพท์</span>
                  <MemoField
                    readOnly={!canEditReporterFields}
                    value={phone}
                    onChange={setPhone}
                    flexGrow
                  />
                </div>
                <div className="memo-row">
                  <span className="memo-label">จำนวน</span>
                  <MemoField
                    readOnly={!canEditReporterFields}
                    value={quantity}
                    onChange={setQuantity}
                    flexGrow
                  />
                </div>
              </div>
            </div>
                 
            <div className="memo-row" style={{ marginTop: '6px' }}>
              <span className="memo-label">จึงเรียนมาเพื่อโปรดพิจารณา</span>
            </div>
          </div>

          {/* ลายเซ็นส่วนที่ 1 */}
          <div className="grid-2" style={{ marginTop: '6px' }}>
            <div className="signature-box">
              <div className="memo-sign-row memo-sign-row-center">
                <span className="memo-label">ลงชื่อ</span>
                <MemoField
                  readOnly={!canEditReporterFields}
                  value={reporterSign}
                  onChange={setReporterSign}
                  width="155px"
                  align="center"
                />
                <span className="memo-label">ผู้ส่งซ่อม</span>
              </div>
              <div className="memo-sign-row memo-sign-row-center" style={{ paddingRight: '16px' }}>
                <span className="memo-label">(</span>
                <MemoField
                  readOnly={!canEditReporterFields}
                  value={reporterFullName}
                  onChange={setReporterFullName}
                  width="170px"
                  align="center"
                />
                <span className="memo-label">)</span>
              </div>
              <div className="memo-sign-row memo-sign-row-center">
                <span className="memo-label">ตำแหน่ง</span>
                <MemoField
                  readOnly={!canEditReporterFields}
                  value={reporterPosition}
                  onChange={setReporterPosition}
                  width="220px"
                  align="center"
                  inputStyle={{ paddingRight: '91px' }}
                />
              </div>
            </div>

            <div className="signature-box">
              <div style={{ lineHeight: 1.55 }}>ความเห็นของหัวหน้าฝ่าย/หัวหน้ากลุ่มงาน</div>
              {isHeadApproved || canEditHeadFields ? (
                <>
                  <div className="memo-sign-row memo-sign-row-center">
                    <MemoField
                      readOnly={!canEditHeadFields}
                      value={headOpinion}
                      onChange={setHeadOpinion}
                      width="275px"
                      align="center"
                    />
                  </div>
                  <div className="memo-sign-row memo-sign-row-center">
                    <span className="memo-label">ลงชื่อ</span>
                    <MemoField
                      readOnly={!canEditHeadFields}
                      value={headSign}
                      onChange={setHeadSign}
                      width="160px"
                      align="center"
                    />
                  </div>
                  <div className="memo-sign-row memo-sign-row-center" style={{ paddingLeft: '35px' }}>
                    <span className="memo-label">(</span>
                    <MemoField
                      readOnly={!canEditHeadFields}
                      value={headFullName}
                      onChange={setHeadFullName}
                      width="170px"
                      align="center"
                    />
                    <span className="memo-label">)</span>
                  </div>
                  <div className="memo-sign-row memo-sign-row-center">
                    <span className="memo-label">ตำแหน่ง</span>
                    <MemoField
                      readOnly={!canEditHeadFields}
                      value={headPosition}
                      onChange={setHeadPosition}
                      width="225px"
                      align="center"
                      inputStyle={{ paddingRight: '71px' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="memo-sign-row memo-sign-row-center">
                    <MemoField readOnly value="" width="275px" align="center" />
                  </div>
                  <div className="memo-sign-row memo-sign-row-center">
                    <span className="memo-label">ลงชื่อ</span>
                    <MemoField readOnly value="" width="160px" align="center" />
                  </div>
                  <div className="memo-sign-row memo-sign-row-center">
                    <span className="memo-label">(</span>
                    <MemoField readOnly value="" width="170px" align="center" />
                    <span className="memo-label">)</span>
                  </div>
                  <div className="memo-sign-row memo-sign-row-center">
                    <span className="memo-label">ตำแหน่ง</span>
                    <MemoField readOnly value="" width="225px" align="center" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ซ่อมบำรุง (General Mechanic / Admin / Super Admin) */}
          <div style={{ marginTop: '4px' }}>
            <div>
              <div className="memo-row"><span className="memo-label">บันทึกหน่วยงานซ่อมบำรุง/ฝ่ายบริหารทั่วไป</span></div>
              <div className="memo-row"><span className="memo-label">เสนอ ผู้อำนวยการโรงพยาบาลสังขละบุรี</span></div>
            </div>
            <div className="memo-row" style={{ alignItems: 'center' }}>
              <label className="checkbox-label">
                <input type="checkbox" disabled={!canEditMaintFields} checked={chkSelfFree} onChange={(e) => setChkSelfFree(e.target.checked)} />
                <span>ซ่อมได้เองโดยช่างของโรงพยาบาล ไม่เสียค่าใช้จ่าย</span>
              </label>
            </div>
            <div className="memo-row" style={{ alignItems: 'center' }}>
              <label className="checkbox-label">
                <input type="checkbox" disabled={!canEditMaintFields} checked={chkSelfCost} onChange={(e) => setChkSelfCost(e.target.checked)} />
                <span>ซ่อมได้เองโดยช่างของโรงพยาบาลโดยเสียค่าวัสดุเพิ่มเติม</span>
              </label>
            </div>
            <div className="memo-row" style={{ alignItems: 'center' }}>
              <label className="checkbox-label">
                <input type="checkbox" disabled={!canEditMaintFields} checked={chkGovTech} onChange={(e) => setChkGovTech(e.target.checked)} />
                <span>ส่งซ่อมกองช่างบำรุง</span>
              </label>
            </div>
            <div className="memo-row">
              <label className="checkbox-label" style={{ paddingBottom: '2px' }}>
                <input type="checkbox" disabled={!canEditMaintFields} checked={chkSelfCost || chkSelfFree} onChange={(e) => setChkSelfCost(e.target.checked)} />
                <span>ระยะเวลาการซ่อมประมาณ</span>
              </label>
              <MemoField
                readOnly={!canEditMaintFields}
                value={repairDays}
                onChange={setRepairDays}
                width="45px"
                align="center"
              />
              <span className="memo-label">วัน</span>
              <span className="memo-label" style={{ marginLeft: '6px' }}>ค่าใช้จ่ายประมาณ</span>
              <MemoField
                readOnly={!canEditMaintFields}
                value={repairCost}
                onChange={setRepairCost}
                width="75px"
                align="center"
              />
              <span className="memo-label">บาท</span>
            </div>
            <div style={{ marginTop: '3px' }}>
              <div className="memo-row"><span className="memo-label">ไม่สามารถซ่อมเองได้ จำเป็นต้องส่งซ่อมภายนอกหน่วยงาน</span></div>
            </div>
            <div className="memo-row">
              <label className="checkbox-label" style={{ paddingBottom: '2px' }}>
                <input type="checkbox" disabled={!canEditMaintFields} checked={chkOutside} onChange={(e) => setChkOutside(e.target.checked)} />
                <span>ส่งซ่อมบริษัท</span>
              </label>
              <MemoField
                readOnly={!canEditMaintFields}
                value={outsideCompany}
                onChange={setOutsideCompany}
                width="190px"
                align="center"
              />
            </div>
            <div className="memo-row">
              <label className="checkbox-label" style={{ paddingBottom: '2px' }}>
                <input type="checkbox" disabled={!canEditMaintFields} checked={chkOther} onChange={(e) => setChkOther(e.target.checked)} />
                <span>อื่นๆ</span>
              </label>
              <MemoField
                readOnly={!canEditMaintFields}
                value={otherDetails}
                onChange={setOtherDetails}
                width="240px"
                align="center"
              />
            </div>
          </div>

          {/* ลายเซ็นส่วนที่ 2 */}
          <div className="grid-2" style={{ marginTop: '6px' }}>
            <div className="signature-box">
              <div className="memo-sign-row memo-sign-row-center">
                <span className="memo-label">ลงชื่อ</span>
                <MemoField
                  readOnly={!canEditMaintFields}
                  value={maintSign}
                  onChange={setMaintSign}
                  width="150px"
                  align="center"
                />
                <span className="memo-label">หน่วยงานซ่อมบำรุง</span>
              </div>
              <div className="memo-sign-row memo-sign-row-center" style={{ paddingRight: '70px' }}>
                <span className="memo-label">(</span>
                <MemoField
                  readOnly={!canEditMaintFields}
                  value={maintFullName}
                  onChange={setMaintFullName}
                  width="170px"
                  align="center"
                />
                <span className="memo-label">)</span>
              </div>
            </div>
          </div>

          {/* รับของ/ส่งของ */}
          <div className="grid-2" style={{ marginTop: '6px' }}>
            <div className="memo-sign-col">
              <span className="bold" style={{ lineHeight: 1.55 }}>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</span>
              <div style={{ height: '8px' }} />
              {isSupplyApproved || canEditSupplyFields ? (
                <>
                  <div className="memo-sign-row">
                    <span className="memo-label">(ลงชื่อ)</span>
                    <MemoField
                      readOnly={!canEditSupplyFields}
                      value={procureSign}
                      onChange={setProcureSign}
                      width="165px"
                      align="center"
                    />
                  </div>
                  <div className="memo-sign-row" style={{ paddingLeft: '32px' }}>
                    <span className="memo-label">(</span>
                    <MemoField
                      readOnly
                      value={procureSign}
                      width="165px"
                      align="center"
                    />
                    <span className="memo-label">)</span>
                  </div>
                  <div className="memo-sign-row" style={{ paddingLeft: '36px' }}>
                    <span className="memo-label">ตำแหน่ง หัวหน้าเจ้าหน้าที่พัสดุ</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="memo-sign-row">
                    <span className="memo-label">(ลงชื่อ)</span>
                    <MemoField readOnly value="" width="165px" align="center" />
                  </div>
                  <div className="memo-sign-row" style={{ paddingLeft: '32px' }}>
                    <span className="memo-label">(</span>
                    <MemoField readOnly value="" width="165px" align="center" />
                    <span className="memo-label">)</span>
                  </div>
                  <div className="memo-sign-row" style={{ paddingLeft: '36px' }}>
                    <span className="memo-label">ตำแหน่ง หัวหน้าเจ้าหน้าที่พัสดุ</span>
                  </div>
                </>
              )}
            </div>

            <div className="memo-sign-col">
              <span className="bold" style={{ lineHeight: 1.55 }}>บันทึกหน่วยงานรับซ่อมบำรุง/บันทึกผู้ส่งของ</span>
              <span style={{ lineHeight: 1.55 }}>ได้รับการซ่อมบำรุงตามรายการข้างต้นเรียบร้อยแล้ว</span>
              <div style={{ height: '4px' }} />
              {isTechnicianDone || canEditOtherFields ? (
                <>
                  <div className="memo-sign-row" style={{ paddingLeft: '14px' }}>
                    <span className="memo-label">(ลงชื่อ)</span>
                    <MemoField
                      readOnly={!canEditOtherFields}
                      value={repairRequest.maintCompletedBy || deliverSign}
                      onChange={setDeliverSign}
                      width="165px"
                      align="center"
                    />
                  </div>
                  <div className="memo-sign-row" style={{ paddingLeft: '46px' }}>
                    <span className="memo-label">(</span>
                    <MemoField
                      readOnly={!canEditOtherFields}
                      value={repairRequest.maintCompletedBy || deliverFullName}
                      onChange={setDeliverFullName}
                      width="165px"
                      align="center"
                    />
                    <span className="memo-label">)</span>
                  </div>
                  <div className="memo-sign-row">
                    <span className="memo-label">วันที่</span>
                    <MemoField
                      readOnly={!canEditOtherFields}
                      value={deliverDay}
                      onChange={setDeliverDay}
                      width="40px"
                      align="center"
                    />
                    <span className="memo-label">เดือน</span>
                    <MemoField
                      readOnly={!canEditOtherFields}
                      value={deliverMonth}
                      onChange={setDeliverMonth}
                      width="85px"
                      align="center"
                    />
                    <span className="memo-label">พ.ศ.</span>
                    <MemoField
                      readOnly={!canEditOtherFields}
                      value={deliverYear}
                      onChange={setDeliverYear}
                      width="55px"
                      align="center"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="memo-sign-row" style={{ paddingLeft: '14px' }}>
                    <span className="memo-label">(ลงชื่อ)</span>
                    <MemoField readOnly value="" width="165px" align="center" />
                  </div>
                  <div className="memo-sign-row" style={{ paddingLeft: '46px' }}>
                    <span className="memo-label">(</span>
                    <MemoField readOnly value="" width="165px" align="center" />
                    <span className="memo-label">)</span>
                  </div>
                  <div className="memo-sign-row">
                    <span className="memo-label">วันที่</span>
                    <MemoField readOnly value="" width="40px" align="center" />
                    <span className="memo-label">เดือน</span>
                    <MemoField readOnly value="" width="85px" align="center" />
                    <span className="memo-label">พ.ศ.</span>
                    <MemoField readOnly value="" width="55px" align="center" />
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="grid-2" style={{ marginTop: '6px' }}>
            <div className="memo-sign-col">
              <span className="bold" style={{ lineHeight: 1.55 }}>ความคิดเห็นของผู้มีอำนาจอนุมัติ</span>
              {isDirectorApproved || canEditOtherFields ? (
                <>
                  <div className="memo-sign-row">
                    <MemoField
                      readOnly={!canEditOtherFields}
                      value={repairRequest.approverComments || approverComments1}
                      onChange={setApproverComments1}
                      width="230px"
                      align="center"
                    />
                  </div>
                  <div className="memo-sign-row">
                    <MemoField
                      readOnly={!canEditOtherFields}
                      value={approverComments2}
                      onChange={setApproverComments2}
                      width="230px"
                      align="center"
                    />
                  </div>
                  <div className="memo-sign-row">
                    <span className="memo-label">(ลงชื่อ)</span>
                    <MemoField
                      readOnly={!canEditOtherFields}
                      value={repairRequest.directorApprovedBy || approverSign}
                      onChange={setApproverSign}
                      width="165px"
                      align="center"
                      inputStyle={{ width: '200px', marginLeft: '-4px' }}
                    />
                  </div>
                  <div className="memo-sign-row" style={{ paddingLeft: '32px' }}>
                    <span className="memo-label">(</span>
                    <MemoField
                      readOnly
                      value={repairRequest.directorApprovedBy || approverSign}
                      width="165px"
                      align="center"
                    />
                    <span className="memo-label">)</span>
                  </div>
                  <div className="memo-sign-row"><span className="memo-label" style={{ paddingRight: '0px', paddingLeft: '27px' }}>นายแพทย์ชำนาญการ (ด้านเวชกรรม)</span></div>
                  <div className="memo-sign-row"><span className="memo-label">ตำแหน่ง ผู้อำนวยการโรงพยาบาลสังขละบุรี</span></div>
                </>
              ) : (
                <>
                  <div className="memo-sign-row">
                    <span className="memo-label">ความคิดเห็น:</span>
                    <MemoField readOnly value="" width="180px" align="center" />
                  </div>
                  <div className="memo-sign-row">
                    <MemoField readOnly value="" width="235px" align="center" />
                  </div>
                  <div className="memo-sign-row">
                    <span className="memo-label">(ลงชื่อ)</span>
                    <MemoField readOnly value="" width="165px" align="center" />
                  </div>
                  <div className="memo-sign-row" style={{ paddingLeft: '32px' }}>
                    <span className="memo-label">(</span>
                    <MemoField readOnly value="" width="165px" align="center" />
                    <span className="memo-label">)</span>
                  </div>
                  <div className="memo-sign-row"><span className="memo-label">ตำแหน่ง ผู้อำนวยการโรงพยาบาลสังขละบุรี</span></div>
                </>
              )}
            </div>

            <div className="memo-sign-col">
              <span className="bold" style={{ lineHeight: 1.55 }}>บันทึกหน่วยงานรับซ่อมบำรุง/บันทึกผู้รับของ</span>
              <span style={{ lineHeight: 1.55 }}>ได้รับการซ่อมบำรุงตามรายการข้างต้นเรียบร้อยแล้ว</span>
              {isItemReceived || canEditOtherFields ? (
                <>
                  <div className="memo-sign-row" style={{ paddingLeft: '14px', marginTop: '2px' }}>
                    <span className="memo-label">(ลงชื่อ)</span>
                    <MemoField
                      readOnly={!canEditOtherFields}
                      value={repairRequest.itemReceivedBy || receiveSign}
                      onChange={setReceiveSign}
                      width="165px"
                      align="center"
                    />
                  </div>
                  <div className="memo-sign-row" style={{ paddingLeft: '46px' }}>
                    <span className="memo-label">(</span>
                    <MemoField
                      readOnly={!canEditOtherFields}
                      value={repairRequest.itemReceivedBy || receiveFullName}
                      onChange={setReceiveFullName}
                      width="165px"
                      align="center"
                    />
                    <span className="memo-label">)</span>
                  </div>
                  <div className="memo-sign-row">
                    <span className="memo-label">ตำแหน่ง</span>
                    <MemoField
                      readOnly={!canEditOtherFields}
                      value={receivePosition}
                      onChange={setReceivePosition}
                      width="210px"
                      align="center"
                      inputStyle={{ paddingRight: '75px' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="memo-sign-row" style={{ paddingLeft: '14px', marginTop: '2px' }}>
                    <span className="memo-label">(ลงชื่อ)</span>
                    <MemoField readOnly value="" width="165px" align="center" />
                  </div>
                  <div className="memo-sign-row" style={{ paddingLeft: '46px' }}>
                    <span className="memo-label">(</span>
                    <MemoField readOnly value="" width="165px" align="center" />
                    <span className="memo-label">)</span>
                  </div>
                  <div className="memo-sign-row">
                    <span className="memo-label">ตำแหน่ง</span>
                    <MemoField readOnly value="" width="210px" align="center" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
