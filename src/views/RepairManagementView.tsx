import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, Plus, AlertTriangle, Printer, FileText, Lock } from 'lucide-react';
import { LineOARepairNotifier } from '../components/LineOARepairNotifier';
import { OfficialRepairPrintModal } from '../components/OfficialRepairPrintModal';
import { getUserRoleFlags } from '../utils/permissions';
import { showSwalAlert, showSwalToast } from '../utils/swal';

export const RepairManagementView: React.FC = () => {
  const { repairRequests, assets, departments, users, addRepairRequest, currentUser, getActiveRepairForAsset, settings } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [repairForPrint, setRepairForPrint] = useState<any>(null);
  const [lastCreatedRepairId, setLastCreatedRepairId] = useState<string | null>(null);
  const [activeTabSection, setActiveTabSection] = useState<'main' | 'official_memo'>('main');

  const now = new Date();
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const defaultDateStr = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}`;

  const defaultAsset = assets[0];
  const defaultDept = departments.find(d => d.id === currentUser.departmentId) || departments[0];

  const roleFlags = getUserRoleFlags(currentUser);
  const canEditHeadSection = roleFlags.isDepartmentHead || roleFlags.isAdmin;
  const canEditMaintenanceSection = roleFlags.isGeneralMechanic || roleFlags.isAdmin;
  const canEditSupplySection = roleFlags.isSupplyOfficer || roleFlags.isAdmin;
  const canEditOtherOfficialSections = roleFlags.isAdmin;

  const findDeptHeadForDept = (deptId: string) =>
    users.find(u => getUserRoleFlags(u).isDepartmentHead && u.departmentId === deptId) ||
    users.find(u => getUserRoleFlags(u).isDepartmentHead);

  const findSupplyUser = () =>
    users.find(u => getUserRoleFlags(u).isSupplyOfficer);

  const findApproverUser = () =>
    users.find(u => getUserRoleFlags(u).isApprover);

  const buildInitialFormData = () => {
    const curNow = new Date();
    const curDateStr = `${curNow.getDate()} ${thaiMonths[curNow.getMonth()]} ${curNow.getFullYear() + 543}`;
    const curAsset = assets[0];
    const curDept = departments.find(d => d.id === currentUser.departmentId) || departments[0];
    const deptHeadMatch = roleFlags.isDepartmentHead ? currentUser : findDeptHeadForDept(curDept?.id || '');
    const supplyMatch = roleFlags.isSupplyOfficer ? currentUser : findSupplyUser();
    const approverMatch = roleFlags.isApprover ? currentUser : findApproverUser();

    return {
      // Standard repair fields
      assetId: curAsset?.id || '',
      reporterId: currentUser.id,
      departmentId: currentUser.departmentId || curDept?.id || '',
      issueDescription: '',
      urgency: 'ปกติ' as 'ปกติ' | 'ด่วน' | 'ด่วนมาก / ฉุกเฉิน',
      repairMethod: '',
      laborCost: 0,
      partsCost: 0,
      spareParts: [] as { id: string; partName: string; qty: number; unitPrice: number }[],
      notes: '',

      // Official Memo Header (Editable by Reporter & Admin)
      agency: `${settings.organizationName || 'โรงพยาบาลสังขละบุรี'} ${curDept?.name || 'กลุ่มงานบริหารทั่วไป'} ${settings.orgPhone ? `โทร. ${settings.orgPhone}` : 'โทร. ๐๓๔-๕๙๕๐๓๐ ต่อ ๒๐๕'}`,
      docNumber: `${curNow.getFullYear() + 543}/01`,
      docDate: curDateStr,
      deptName: curDept?.name || 'กลุ่มงานบริหารทั่วไป',

      // Category Radio (Editable by Reporter & Admin)
      category: 'สำนักงาน',

      // Item Details (Editable by Reporter & Admin)
      machineName: curAsset?.name || '',
      machineModel: curAsset?.model || '',
      assetNumber: curAsset?.assetCode || curAsset?.serialNumber || '',
      vendorCompany: curAsset?.vendorName || '',
      vendorPhone: curAsset?.vendorPhone || '',
      quantity: '1 เครื่อง',

      // Signatures Part 1: Reporter (Editable by Reporter & Admin)
      senderSign: currentUser.name,
      senderName: currentUser.name,
      senderPosition: currentUser.position || 'เจ้าหน้าที่',

      // Department Head (Editable by Department Head & Admin)
      headOpinion: 'เห็นควรอนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ',
      headSign: roleFlags.isDepartmentHead ? currentUser.name : (deptHeadMatch?.name || ''),
      headName: roleFlags.isDepartmentHead ? currentUser.name : (deptHeadMatch?.name || ''),
      headPosition: roleFlags.isDepartmentHead ? (currentUser.position || 'หัวหน้าฝ่าย/หัวหน้ากลุ่มงาน') : (deptHeadMatch?.position || 'หัวหน้าฝ่าย/หัวหน้ากลุ่มงาน'),

      // Maintenance Dept (Editable ONLY by General Mechanic, Admin, Super Admin)
      canSelfRepairFree: false,
      canSelfRepairWithCost: false,
      sendToGovTech: false,
      repairDays: '',
      repairCost: '',
      sendToOutsideCompany: false,
      outsideCompanyName: '',
      otherOption: false,
      otherOptionDetails: '',
      maintenanceSign: canEditMaintenanceSection ? currentUser.name : '',
      maintenanceName: canEditMaintenanceSection ? currentUser.name : '',

      // Supply Officer (Editable by Supply Officer & Admin)
      procureSign: roleFlags.isSupplyOfficer ? currentUser.name : (supplyMatch?.name || ''),
      procureName: roleFlags.isSupplyOfficer ? currentUser.name : (supplyMatch?.name || ''),

      // Other Official Sections (Editable ONLY by Admin / Super Admin)
      deliverySign: '',
      deliveryName: '',
      deliveryDay: String(curNow.getDate()),
      deliveryMonth: thaiMonths[curNow.getMonth()],
      deliveryYear: String(curNow.getFullYear() + 543),
      approverComment1: 'อนุมัติให้ดำเนินการซ่อมบำรุงได้',
      approverComment2: '',
      approverSign: approverMatch?.name || settings.approverName || '',
      receiveSign: '',
      receiveName: '',
      receivePosition: 'เจ้าหน้าที่ผู้รับของ',
    };
  };

  // Comprehensive Form State encompassing all fields in the Official Memorandum
  const [formData, setFormData] = useState(buildInitialFormData);

  // Re-sync logged-in user and defaults when modal opens or logged-in user changes
  useEffect(() => {
    if (showAddModal) {
      setFormData(buildInitialFormData());
      setActiveTabSection('main');
    }
  }, [showAddModal, currentUser.id, currentUser.role]);

  const selectedActiveRepair = getActiveRepairForAsset 
    ? getActiveRepairForAsset(formData.assetId) 
    : repairRequests.find(r => r.assetId === formData.assetId && r.status !== 'ซ่อมเสร็จ' && r.status !== 'ปิดงาน' && r.status !== 'ดำเนินการเสร็จ');

  // When asset selection changes, update asset details automatically
  const handleAssetChange = (newAssetId: string) => {
    const found = assets.find(a => a.id === newAssetId);
    setFormData(prev => ({
      ...prev,
      assetId: newAssetId,
      machineName: found?.name || prev.machineName,
      machineModel: found?.model || prev.machineModel,
      assetNumber: found?.assetCode || found?.serialNumber || prev.assetNumber,
      vendorCompany: found?.vendorName || prev.vendorCompany,
      vendorPhone: found?.vendorPhone || prev.vendorPhone,
    }));
  };

  const handleCreateRepair = (e?: React.FormEvent, printDirectly: boolean = false) => {
    if (e) e.preventDefault();
    if (!formData.assetId) {
      showSwalAlert('warning', 'ไม่พบข้อมูลครุภัณฑ์', 'กรุณาเลือกครุภัณฑ์ที่ต้องการแจ้งซ่อม');
      return;
    }
    if (selectedActiveRepair) {
      showSwalAlert(
        'warning',
        'ป้องกันการส่งซ่อมซ้ำ!',
        `ครุภัณฑ์นี้มีใบแจ้งซ่อมเลขที่ [${selectedActiveRepair.repairNo}] อยู่แล้วในระบบ (สถานะ: ${selectedActiveRepair.status})`
      );
      return;
    }
    if (!formData.issueDescription.trim()) {
      showSwalAlert('warning', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกลักษณะ/อาการชำรุด');
      return;
    }
    try {
      const parsedCost = canEditMaintenanceSection ? (parseFloat(formData.repairCost) || 0) : 0;

      // Persist reporter-editable fields plus any authorized role section fields
      const memoPayload: Record<string, any> = {
        agency: formData.agency,
        docNumber: formData.docNumber,
        docDate: formData.docDate,
        deptName: formData.deptName,
        category: formData.category,
        machineName: formData.machineName,
        machineModel: formData.machineModel,
        assetNumber: formData.assetNumber,
        vendorCompany: formData.vendorCompany,
        vendorPhone: formData.vendorPhone,
        quantity: formData.quantity,
        senderSign: formData.senderSign,
        senderName: formData.senderName,
        senderPosition: formData.senderPosition,
      };

      if (canEditHeadSection) {
        memoPayload.headOpinion = formData.headOpinion;
        memoPayload.headSign = formData.headSign;
        memoPayload.headName = formData.headName;
        memoPayload.headPosition = formData.headPosition;
      }

      if (canEditMaintenanceSection) {
        memoPayload.canSelfRepairFree = formData.canSelfRepairFree;
        memoPayload.canSelfRepairWithCost = formData.canSelfRepairWithCost;
        memoPayload.sendToGovTech = formData.sendToGovTech;
        memoPayload.repairDays = formData.repairDays;
        memoPayload.repairCost = formData.repairCost;
        memoPayload.sendToOutsideCompany = formData.sendToOutsideCompany;
        memoPayload.outsideCompanyName = formData.outsideCompanyName;
        memoPayload.otherOption = formData.otherOption;
        memoPayload.otherOptionDetails = formData.otherOptionDetails;
        memoPayload.maintenanceSign = formData.maintenanceSign;
        memoPayload.maintenanceName = formData.maintenanceName;
      }

      if (canEditSupplySection) {
        memoPayload.procureSign = formData.procureSign;
        memoPayload.procureName = formData.procureName;
      }

      if (canEditOtherOfficialSections) {
        memoPayload.deliverySign = formData.deliverySign;
        memoPayload.deliveryName = formData.deliveryName;
        memoPayload.deliveryDay = formData.deliveryDay;
        memoPayload.deliveryMonth = formData.deliveryMonth;
        memoPayload.deliveryYear = formData.deliveryYear;
        memoPayload.approverComment1 = formData.approverComment1;
        memoPayload.approverComment2 = formData.approverComment2;
        memoPayload.approverSign = formData.approverSign;
        memoPayload.receiveSign = formData.receiveSign;
        memoPayload.receiveName = formData.receiveName;
        memoPayload.receivePosition = formData.receivePosition;
      }

      const created = addRepairRequest({
        assetId: formData.assetId,
        reporterId: currentUser.id,
        departmentId: formData.departmentId,
        issueDescription: formData.issueDescription.trim(),
        urgency: formData.urgency,
        repairMethod: canEditMaintenanceSection
          ? (formData.repairMethod || (formData.canSelfRepairFree ? 'ซ่อมเองไม่เสียค่าใช้จ่าย' : formData.canSelfRepairWithCost ? 'ซ่อมเองโดยซื้ออะไหล่' : ''))
          : '',
        laborCost: 0,
        partsCost: parsedCost,
        spareParts: formData.spareParts,
        sentDate: new Date().toISOString(),
        headOpinion: canEditHeadSection ? formData.headOpinion : undefined,
        headPosition: canEditHeadSection ? formData.headPosition : undefined,
        notes: `บันทึกข้อความ ที่ กจ ๐๐๓.๓๐๘.๑/${formData.docNumber} | หมวด: ${formData.category}`,
        memoData: memoPayload
      });

      setShowAddModal(false);
      setLastCreatedRepairId(created.id);

      if (printDirectly) {
        setRepairForPrint(created);
        setShowPrintModal(true);
        showSwalToast('success', `บันทึกใบแจ้งซ่อม ${created.repairNo} สำเร็จ`);
      } else {
        showSwalAlert(
          'success',
          'บันทึกใบแจ้งซ่อมเรียบร้อยแล้ว',
          `เลขที่ใบแจ้งซ่อม ${created.repairNo} ถูกส่งเข้าระบบเพื่อรอหัวหน้ากลุ่มงานอนุมัติแล้ว`
        );
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-['Sarabun',sans-serif]">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ระบบแจ้งซ่อมและบริหารจัดการงานซ่อม</h2>
          <p className="text-xs text-slate-500 mt-1">
            ติดตามรายการแจ้งซ่อม (รายการล่าสุดอยู่ข้างบนเสมอ) ค่าใช้จ่ายซ่อมบำรุง และระบบแจ้งเตือน LINE OA
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setRepairForPrint(repairRequests[0] || null);
              setShowPrintModal(true);
            }}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-200 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์แบบฟอร์มขออนุมัติซ่อม (A4)</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>แจ้งซ่อมครุภัณฑ์</span>
          </button>
        </div>
      </div>

      {/* Main Repair Cards Feed (With Stats, Sorting, Admin Restrictions, & User Filters) */}
      <LineOARepairNotifier highlightRepairId={lastCreatedRepairId} />

      {/* Standalone Official Government Memo Print Modal (Rendered in Direct Print Format) */}
      {showPrintModal && (
        <OfficialRepairPrintModal
          repairRequest={repairForPrint || repairRequests[0] || {
            id: 'rep-default',
            repairNo: 'REP-2568-001',
            assetId: assets[0]?.id || '',
            reporterId: currentUser.id,
            departmentId: currentUser.departmentId,
            issueDescription: 'ขออนุมัติซ่อมบำรุงตามรายการพัสดุครุภัณฑ์',
            urgency: 'ปกติ',
            status: 'รอตรวจสอบ',
            laborCost: 0,
            partsCost: 850,
            totalCost: 850,
            spareParts: [],
            createdAt: new Date().toISOString()
          }}
          onClose={() => {
            setShowPrintModal(false);
            setRepairForPrint(null);
          }}
        />
      )}

      {/* Comprehensive Add Repair Request Modal (with ALL Official Memo Inputs) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto font-['Sarabun',sans-serif]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-5 sm:p-6 my-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  <span>แจ้งซ่อมครุภัณฑ์ & แบบฟอร์มขออนุมัติซ่อมบำรุง</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  กรอกข้อมูลเพื่อส่งแจ้งซ่อมและสร้างแบบฟอร์มบันทึกข้อความตามระเบียบพัสดุราชการ (A4) ได้ครบทุกช่อง
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Form Section Selector */}
            <div className="flex border-b border-slate-200 mb-4">
              <button
                type="button"
                onClick={() => setActiveTabSection('main')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTabSection === 'main'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. ข้อมูลแจ้งซ่อม & รายการครุภัณฑ์
              </button>
              <button
                type="button"
                onClick={() => setActiveTabSection('official_memo')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTabSection === 'official_memo'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>2. ข้อมูลบันทึกข้อความราชการ & ลายเซ็นต์ (A4)</span>
              </button>
            </div>

            <form onSubmit={(e) => handleCreateRepair(e, false)} className="space-y-4">
              
              {/* SECTION 1: MAIN REPAIR & ASSET DETAILS */}
              {activeTabSection === 'main' && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Reporter Notice */}
                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-500">ผู้แจ้งซ่อม:</span>{' '}
                      <span className="font-bold text-slate-900">{currentUser.name}</span>{' '}
                      <span className="text-slate-500">({currentUser.role})</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">ตำแหน่ง:</span>{' '}
                      <span className="font-medium text-slate-800">{currentUser.position || 'เจ้าหน้าที่'}</span>
                    </div>
                  </div>

                  {/* Asset Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      เลือกครุภัณฑ์ที่ต้องการแจ้งซ่อม <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.assetId}
                      onChange={(e) => handleAssetChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-blue-500 font-medium bg-slate-50/50"
                    >
                      {assets.length === 0 && <option value="">-- ยังไม่มีข้อมูลครุภัณฑ์ในระบบ --</option>}
                      {assets.map(ast => {
                        const active = getActiveRepairForAsset 
                          ? getActiveRepairForAsset(ast.id) 
                          : repairRequests.find(r => r.assetId === ast.id && r.status !== 'ซ่อมเสร็จ' && r.status !== 'ปิดงาน' && r.status !== 'ดำเนินการเสร็จ');
                        return (
                          <option key={ast.id} value={ast.id}>
                            {ast.assetCode} - {ast.name} {ast.model ? `(${ast.model})` : ''} {active ? ` ⚠️ (มีใบซ่อมแล้ว: ${active.repairNo})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedActiveRepair && (
                    <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold space-y-1">
                      <div className="flex items-center space-x-1 text-amber-800 font-black">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>⚠️ ป้องกันการส่งซ่อมซ้ำ</span>
                      </div>
                      <div>ครุภัณฑ์นี้มีใบแจ้งซ่อมเลขที่ <span className="font-extrabold underline">{selectedActiveRepair.repairNo}</span> ที่กำลังดำเนินการอยู่แล้ว (สถานะ: {selectedActiveRepair.status})</div>
                      <div className="text-[11px] font-normal text-amber-800">โปรดรอให้ใบแจ้งซ่อมเดิมถูกดำเนินการเสร็จก่อนสร้างใบใหม่</div>
                    </div>
                  )}

                  {/* Category Radio */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-2">
                      หมวดหมู่พัสดุ-ครุภัณฑ์ (ตามแบบฟอร์มราชการ)
                    </label>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {['การแพทย์', 'สำนักงาน', 'ยานพาหนะ', 'อาคาร', 'สิ่งก่อสร้าง', 'งานบ้านงานครัว', 'อุปกรณ์และอื่นๆ'].map((cat) => (
                        <label key={cat} className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="radio"
                            name="categoryRadio"
                            value={cat}
                            checked={formData.category === cat}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="text-blue-600"
                          />
                          <span className="text-slate-800">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Asset Details Preview / Edit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">1. ชื่อเครื่อง</label>
                      <input
                        type="text"
                        value={formData.machineName}
                        onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                        placeholder="เช่น เครื่องคอมพิวเตอร์ประมวลผล"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">รุ่น</label>
                      <input
                        type="text"
                        value={formData.machineModel}
                        onChange={(e) => setFormData({ ...formData, machineModel: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                        placeholder="เช่น Core i7"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเลขครุภัณฑ์</label>
                      <input
                        type="text"
                        value={formData.assetNumber}
                        onChange={(e) => setFormData({ ...formData, assetNumber: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                        placeholder="เช่น กจ-COM-2568-001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">บริษัทผู้จำหน่าย</label>
                      <input
                        type="text"
                        value={formData.vendorCompany}
                        onChange={(e) => setFormData({ ...formData, vendorCompany: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                        placeholder="บริษัทผู้ขาย/ผู้แทนจำหน่าย"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์บริษัท</label>
                      <input
                        type="text"
                        value={formData.vendorPhone}
                        onChange={(e) => setFormData({ ...formData, vendorPhone: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                        placeholder="02-xxx-xxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวน</label>
                      <input
                        type="text"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                        placeholder="1 เครื่อง"
                      />
                    </div>
                  </div>

                  {/* Issue Description & Urgency */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        ลักษณะ/อาการชำรุด <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        disabled={!!selectedActiveRepair}
                        value={formData.issueDescription}
                        onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                        placeholder="อธิบายอาการเสียและปัญหาที่พบ เช่น เปิดไม่ติด พัดลมเสียงดัง..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">ระดับความเร่งด่วน</label>
                      <select
                        disabled={!!selectedActiveRepair}
                        value={formData.urgency}
                        onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ปกติ">ปกติ</option>
                        <option value="ด่วน">ด่วน</option>
                        <option value="ด่วนมาก / ฉุกเฉิน">ด่วนมาก / ฉุกเฉิน</option>
                      </select>
                      <div className="mt-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยงานผู้ส่งซ่อม</label>
                        <select
                          value={formData.departmentId}
                          onChange={(e) => {
                            const dId = e.target.value;
                            const dObj = departments.find(d => d.id === dId);
                            const nextHead = roleFlags.isDepartmentHead ? currentUser : findDeptHeadForDept(dId);
                            setFormData({
                              ...formData,
                              departmentId: dId,
                              deptName: dObj?.name || formData.deptName,
                              headSign: nextHead?.name || formData.headSign,
                              headName: nextHead?.name || formData.headName,
                              headPosition: nextHead?.position || formData.headPosition,
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                        >
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: OFFICIAL MEMORANDUM & SIGNATURES (ROLE-LOCKED) */}
              {activeTabSection === 'official_memo' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start space-x-2">
                    <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">สิทธิ์การกรอกแบบฟอร์มมาตรฐานโรงพยาบาล ({currentUser.role}):</span>{' '}
                      ผู้แจ้งซ่อมสามารถแก้ไข <span className="font-bold">ส่วนหัวบันทึกข้อความราชการ</span> และ <span className="font-bold">ผู้ส่งซ่อม</span> ส่วนอื่นๆ ระบบจำกัดสิทธิ์ตามตำแหน่งหน้าที่ (หัวหน้าฝ่ายฯ, หน่วยงานซ่อมบำรุง/ช่าง, หัวหน้าเจ้าหน้าที่พัสดุ และ Admin/Super Admin) เพื่อคงรูปแบบมาตรฐานเดียวกันทั้งโรงพยาบาล
                    </div>
                  </div>

                  {/* Header Section: Reporter & Admin editable */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800">ส่วนหัวบันทึกข้อความราชการ</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✏️ ผู้แจ้งซ่อมแก้ไขได้</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">ส่วนราชการ</label>
                        <input
                          type="text"
                          value={formData.agency}
                          onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">วันที่ในบันทึกข้อความ</label>
                        <input
                          type="text"
                          value={formData.docDate}
                          onChange={(e) => setFormData({ ...formData, docDate: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">ที่ กจ ๐๐๓.๓๐๘.๑/</label>
                        <input
                          type="text"
                          value={formData.docNumber}
                          onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                          placeholder="2568/01"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">ฝ่าย/งาน ผู้ขอซ่อม</label>
                        <input
                          type="text"
                          value={formData.deptName}
                          onChange={(e) => {
                            const nextDept = e.target.value;
                            const orgName = settings.organizationName || 'โรงพยาบาลสังขละบุรี';
                            const prevTrimmed = formData.deptName.trim();
                            const nextTrimmed = nextDept.trim();
                            setFormData((prev) => {
                              const prevAgency = prev.agency;
                              const searchStart = prevAgency.startsWith(orgName) ? orgName.length : 0;
                              const phoneIdx = prevAgency.indexOf('โทร.', searchStart);
                              const searchEnd = phoneIdx !== -1 ? phoneIdx : prevAgency.length;
                              const headSeg = prevAgency.slice(0, searchStart);
                              const midSeg = prevAgency.slice(searchStart, searchEnd);
                              const tailSeg = prevAgency.slice(searchEnd);
                              let updatedMid = midSeg;
                              if (prevTrimmed && midSeg.includes(prevTrimmed)) {
                                updatedMid = midSeg.replace(prevTrimmed, nextTrimmed);
                              } else if (midSeg.includes('ฝ่ายบริหารทั่วไป')) {
                                updatedMid = midSeg.replace('ฝ่ายบริหารทั่วไป', nextTrimmed);
                              } else if (prevTrimmed === '' && nextTrimmed) {
                                updatedMid = midSeg.trim() ? `${midSeg.trim()} ${nextTrimmed}` : nextTrimmed;
                              } else {
                                return { ...prev, deptName: nextDept };
                              }
                              const syncedAgency = [headSeg.trim(), updatedMid.trim(), tailSeg.trim()]
                                .filter(Boolean)
                                .join(' ');
                              return { ...prev, deptName: nextDept, agency: syncedAgency };
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Signatures Part 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Reporter: Editable */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800">ผู้ส่งซ่อม</div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✏️ ผู้แจ้งซ่อมแก้ไขได้</span>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ลงชื่อผู้ส่งซ่อม</label>
                        <input
                          type="text"
                          value={formData.senderSign}
                          onChange={(e) => setFormData({ ...formData, senderSign: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ชื่อ-นามสกุล (วงเล็บ)</label>
                        <input
                          type="text"
                          value={formData.senderName}
                          onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ตำแหน่ง</label>
                        <input
                          type="text"
                          value={formData.senderPosition}
                          onChange={(e) => setFormData({ ...formData, senderPosition: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    {/* Department Head: Editable by Department Head & Admin */}
                    <div className={`p-3 rounded-xl border space-y-2 ${canEditHeadSection ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/80 border-slate-200 opacity-85'}`}>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800">ความเห็นหัวหน้าฝ่าย/กลุ่มงาน</div>
                        {canEditHeadSection ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">✏️ Department Head / Admin</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 flex items-center space-x-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>เฉพาะ Department Head / Admin</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ความเห็น</label>
                        <input
                          type="text"
                          readOnly={!canEditHeadSection}
                          value={formData.headOpinion}
                          onChange={(e) => setFormData({ ...formData, headOpinion: e.target.value })}
                          className={`w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 ${canEditHeadSection ? 'bg-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ลงชื่อหัวหน้าฝ่าย</label>
                        <input
                          type="text"
                          readOnly={!canEditHeadSection}
                          value={formData.headSign}
                          placeholder="ดึงจากบัญชี Department Head ที่อนุมัติ"
                          onChange={(e) => setFormData({ ...formData, headSign: e.target.value, headName: e.target.value })}
                          className={`w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 ${canEditHeadSection ? 'bg-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ตำแหน่งหัวหน้าฝ่าย</label>
                        <input
                          type="text"
                          readOnly={!canEditHeadSection}
                          value={formData.headPosition}
                          onChange={(e) => setFormData({ ...formData, headPosition: e.target.value })}
                          className={`w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 ${canEditHeadSection ? 'bg-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Assessment: General Mechanic, Admin, Super Admin ONLY */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${canEditMaintenanceSection ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/80 border-slate-200 opacity-85'}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-800">บันทึกหน่วยงานซ่อมบำรุง / ฝ่ายบริหารทั่วไป</div>
                      {canEditMaintenanceSection ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">✏️ General Mechanic / Admin</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 flex items-center space-x-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>เฉพาะ General Mechanic / Admin / Super Admin</span>
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className={`flex items-center space-x-2 ${!canEditMaintenanceSection ? 'cursor-not-allowed text-slate-500' : ''}`}>
                        <input
                          type="checkbox"
                          disabled={!canEditMaintenanceSection}
                          checked={formData.canSelfRepairFree}
                          onChange={(e) => setFormData({ ...formData, canSelfRepairFree: e.target.checked })}
                        />
                        <span>ซ่อมได้เองโดยช่างของโรงพยาบาล ไม่เสียค่าใช้จ่าย</span>
                      </label>
                      <label className={`flex items-center space-x-2 ${!canEditMaintenanceSection ? 'cursor-not-allowed text-slate-500' : ''}`}>
                        <input
                          type="checkbox"
                          disabled={!canEditMaintenanceSection}
                          checked={formData.canSelfRepairWithCost}
                          onChange={(e) => setFormData({ ...formData, canSelfRepairWithCost: e.target.checked })}
                        />
                        <span>ซ่อมได้เองโดยช่างของโรงพยาบาลโดยเสียค่าวัสดุเพิ่มเติม</span>
                      </label>
                      <label className={`flex items-center space-x-2 ${!canEditMaintenanceSection ? 'cursor-not-allowed text-slate-500' : ''}`}>
                        <input
                          type="checkbox"
                          disabled={!canEditMaintenanceSection}
                          checked={formData.sendToGovTech}
                          onChange={(e) => setFormData({ ...formData, sendToGovTech: e.target.checked })}
                        />
                        <span>ส่งซ่อมกองช่างบำรุง</span>
                      </label>
                      <label className={`flex items-center space-x-2 ${!canEditMaintenanceSection ? 'cursor-not-allowed text-slate-500' : ''}`}>
                        <input
                          type="checkbox"
                          disabled={!canEditMaintenanceSection}
                          checked={formData.sendToOutsideCompany}
                          onChange={(e) => setFormData({ ...formData, sendToOutsideCompany: e.target.checked })}
                        />
                        <span>ส่งซ่อมบริษัท</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      <div>
                        <label className="block text-[11px] text-slate-600">ระยะเวลาประมาณ (วัน)</label>
                        <input
                          type="text"
                          readOnly={!canEditMaintenanceSection}
                          value={formData.repairDays}
                          onChange={(e) => setFormData({ ...formData, repairDays: e.target.value })}
                          className={`w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 ${canEditMaintenanceSection ? 'bg-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ค่าใช้จ่ายประมาณ (บาท)</label>
                        <input
                          type="text"
                          readOnly={!canEditMaintenanceSection}
                          value={formData.repairCost}
                          onChange={(e) => setFormData({ ...formData, repairCost: e.target.value })}
                          className={`w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 ${canEditMaintenanceSection ? 'bg-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ชื่อบริษัทส่งซ่อมภายนอก</label>
                        <input
                          type="text"
                          readOnly={!canEditMaintenanceSection}
                          value={formData.outsideCompanyName}
                          onChange={(e) => setFormData({ ...formData, outsideCompanyName: e.target.value })}
                          className={`w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 ${canEditMaintenanceSection ? 'bg-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ลงชื่อช่าง/หน่วยซ่อม</label>
                        <input
                          type="text"
                          readOnly={!canEditMaintenanceSection}
                          value={formData.maintenanceSign}
                          onChange={(e) => setFormData({ ...formData, maintenanceSign: e.target.value, maintenanceName: e.target.value })}
                          className={`w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 ${canEditMaintenanceSection ? 'bg-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Procurement & Approver Comments */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl border space-y-2 ${canEditSupplySection || canEditOtherOfficialSections ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/80 border-slate-200 opacity-85'}`}>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800">หัวหน้าเจ้าหน้าที่พัสดุ & ผู้ส่งของ</div>
                        {!canEditSupplySection && !canEditOtherOfficialSections && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 flex items-center space-x-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Supply Officer / Admin</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ลงชื่อหัวหน้าเจ้าหน้าที่พัสดุ (Supply Officer)</label>
                        <input
                          type="text"
                          readOnly={!canEditSupplySection}
                          value={formData.procureSign}
                          placeholder="ดึงจากบัญชี Supply Officer"
                          onChange={(e) => setFormData({ ...formData, procureSign: e.target.value, procureName: e.target.value })}
                          className={`w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 ${canEditSupplySection ? 'bg-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ลงชื่อผู้ส่งของ (เฉพาะ Admin)</label>
                        <input
                          type="text"
                          readOnly={!canEditOtherOfficialSections}
                          value={formData.deliverySign}
                          onChange={(e) => setFormData({ ...formData, deliverySign: e.target.value, deliveryName: e.target.value })}
                          className={`w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 ${canEditOtherOfficialSections ? 'bg-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                        />
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border space-y-2 ${canEditOtherOfficialSections ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/80 border-slate-200 opacity-85'}`}>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800">ความคิดเห็นผู้อนุมัติ & ผู้รับของ</div>
                        {canEditOtherOfficialSections ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">✏️ Admin</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 flex items-center space-x-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>เฉพาะ Admin</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ความเห็นอนุมัติ</label>
                        <input
                          type="text"
                          readOnly={!canEditOtherOfficialSections}
                          value={formData.approverComment1}
                          onChange={(e) => setFormData({ ...formData, approverComment1: e.target.value })}
                          className={`w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 ${canEditOtherOfficialSections ? 'bg-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ลงชื่อผู้มีอำนาจอนุมัติ</label>
                        <input
                          type="text"
                          readOnly={!canEditOtherOfficialSections}
                          value={formData.approverSign}
                          onChange={(e) => setFormData({ ...formData, approverSign: e.target.value })}
                          className={`w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 ${canEditOtherOfficialSections ? 'bg-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  {activeTabSection === 'main' ? (
                    <button
                      type="button"
                      onClick={() => setActiveTabSection('official_memo')}
                      className="text-blue-600 hover:underline font-bold"
                    >
                      ต้องการดู/แก้ไขส่วนหัวบันทึกข้อความราชการ & ลายเซ็นต์ คลิกที่นี่ &rarr;
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTabSection('main')}
                      className="text-blue-600 hover:underline font-bold"
                    >
                      &larr; กลับไปหน้ารายการครุภัณฑ์
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="button"
                    disabled={!!selectedActiveRepair}
                    onClick={() => handleCreateRepair(undefined, true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-200 cursor-pointer disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>🖨️ บันทึก & พิมพ์แบบฟอร์ม A4 ทันที</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!!selectedActiveRepair}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedActiveRepair
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200'
                    }`}
                  >
                    {selectedActiveRepair ? '⚠️ มีใบแจ้งซ่อมซ้ำ' : '💾 บันทึกใบแจ้งซ่อม'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
