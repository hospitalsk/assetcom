import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, Plus, AlertTriangle, Printer, ExternalLink, FileText, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { LineOARepairNotifier } from '../components/LineOARepairNotifier';
import { OfficialRepairPrintModal } from '../components/OfficialRepairPrintModal';
import { MemoFormData, printOfficialMemoDocument, openOfficialMemoInNewWindow } from '../utils/printMemoHelper';

export const RepairManagementView: React.FC = () => {
  const { repairRequests, assets, departments, users, addRepairRequest, currentUser, getActiveRepairForAsset } = useApp();
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

  // Comprehensive Form State encompassing all fields in the Official Memorandum
  const [formData, setFormData] = useState({
    // Standard repair fields
    assetId: defaultAsset?.id || '',
    reporterId: currentUser.id,
    departmentId: currentUser.departmentId || defaultDept?.id || '',
    issueDescription: '',
    urgency: 'ปกติ' as const,
    repairMethod: '',
    laborCost: 0,
    partsCost: 0,
    spareParts: [] as { id: string; partName: string; qty: number; unitPrice: number }[],
    notes: '',

    // Official Memo Header
    agency: 'โรงพยาบาลสังขละบุรี ฝ่ายบริหารทั่วไป โทร. ๐๓๔-๕๙๕๐๓๐ ต่อ ๒๐๕',
    docNumber: '2568/01',
    docDate: defaultDateStr,
    deptName: defaultDept?.name || 'กลุ่มงานบริหารทั่วไป',

    // Category Radio
    category: 'สำนักงาน',

    // Item Details
    machineName: defaultAsset?.name || '',
    machineModel: defaultAsset?.model || '',
    assetNumber: defaultAsset?.assetCode || defaultAsset?.serialNumber || '',
    vendorCompany: defaultAsset?.vendorName || '',
    vendorPhone: defaultAsset?.vendorPhone || '',
    quantity: '1 เครื่อง',

    // Signatures Part 1: Reporter
    senderSign: currentUser.name,
    senderName: currentUser.name,
    senderPosition: currentUser.position || 'เจ้าหน้าที่',

    // Department Head
    headOpinion: 'เห็นควรอนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ',
    headSign: 'ดร. สมชาย ใจดี',
    headName: 'ดร. สมชาย ใจดี',
    headPosition: 'หัวหน้าฝ่ายบริหารทั่วไป',

    // Maintenance Dept
    canSelfRepairFree: false,
    canSelfRepairWithCost: true,
    sendToGovTech: false,
    repairDays: '3',
    repairCost: '850',
    sendToOutsideCompany: false,
    outsideCompanyName: '',
    otherOption: false,
    otherOptionDetails: '',
    maintenanceSign: currentUser.name,
    maintenanceName: currentUser.name,

    // Approval & Delivery
    procureSign: 'ชุติญา จรัสกุลธาดา',
    deliverySign: currentUser.name,
    deliveryName: currentUser.name,
    deliveryDay: String(now.getDate()),
    deliveryMonth: thaiMonths[now.getMonth()],
    deliveryYear: String(now.getFullYear() + 543),
    approverComment1: 'อนุมัติให้ดำเนินการซ่อมบำรุงได้',
    approverComment2: '',
    approverSign: 'จิรวัฒน์ วงษ์สวัสดิ์',
    receiveSign: currentUser.name,
    receiveName: currentUser.name,
    receivePosition: currentUser.position || 'เจ้าหน้าที่ผู้รับของ',
  });

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

  const getMemoDataFromForm = (repairNo?: string): MemoFormData => ({
    agency: formData.agency,
    docNumber: repairNo ? repairNo.replace('REP-', '') : formData.docNumber,
    docDate: formData.docDate,
    deptName: formData.deptName,
    category: formData.category,
    machineName: formData.machineName,
    machineModel: formData.machineModel,
    issueDescription: formData.issueDescription,
    assetNumber: formData.assetNumber,
    vendorCompany: formData.vendorCompany,
    vendorPhone: formData.vendorPhone,
    quantity: formData.quantity,
    senderSign: formData.senderSign,
    senderName: formData.senderName,
    senderPosition: formData.senderPosition,
    headOpinion: formData.headOpinion,
    headSign: formData.headSign,
    headName: formData.headName,
    headPosition: formData.headPosition,
    canSelfRepairFree: formData.canSelfRepairFree,
    canSelfRepairWithCost: formData.canSelfRepairWithCost,
    sendToGovTech: formData.sendToGovTech,
    repairDays: formData.repairDays,
    repairCost: formData.repairCost,
    sendToOutsideCompany: formData.sendToOutsideCompany,
    outsideCompanyName: formData.outsideCompanyName,
    otherOption: formData.otherOption,
    otherOptionDetails: formData.otherOptionDetails,
    maintenanceSign: formData.maintenanceSign,
    maintenanceName: formData.maintenanceName,
    procureSign: formData.procureSign,
    deliverySign: formData.deliverySign,
    deliveryName: formData.deliveryName,
    deliveryDay: formData.deliveryDay,
    deliveryMonth: formData.deliveryMonth,
    deliveryYear: formData.deliveryYear,
    approverComment1: formData.approverComment1,
    approverComment2: formData.approverComment2,
    approverSign: formData.approverSign,
    approverName: 'นายจิรวัฒน์ วงษ์สวัสดิ์',
    receiveSign: formData.receiveSign,
    receiveName: formData.receiveName,
    receivePosition: formData.receivePosition,
  });

  const handleCreateRepair = (e?: React.FormEvent, printDirectly: boolean = false, openNewTab: boolean = false) => {
    if (e) e.preventDefault();
    if (selectedActiveRepair) {
      alert(`⚠️ ป้องกันการส่งซ่อมซ้ำ!\nครุภัณฑ์นี้มีใบแจ้งซ่อมเลขที่ [${selectedActiveRepair.repairNo}] อยู่แล้วในระบบ (สถานะ: ${selectedActiveRepair.status})`);
      return;
    }
    if (!formData.issueDescription) {
      alert('กรุณากรอกลักษณะ/อาการชำรุด');
      return;
    }
    try {
      const parsedCost = parseFloat(formData.repairCost) || 0;
      const created = addRepairRequest({
        assetId: formData.assetId,
        reporterId: currentUser.id,
        departmentId: formData.departmentId,
        issueDescription: formData.issueDescription,
        urgency: formData.urgency,
        repairMethod: formData.repairMethod || (formData.canSelfRepairFree ? 'ซ่อมเองไม่เสียค่าใช้จ่าย' : 'ซ่อมเองโดยซื้ออะไหล่'),
        laborCost: 0,
        partsCost: parsedCost,
        spareParts: formData.spareParts,
        notes: `บันทึกข้อความ ที่ กจ ${formData.docNumber} | หมวด: ${formData.category}`,
      });

      setShowAddModal(false);
      setLastCreatedRepairId(created.id);

      if (printDirectly) {
        setRepairForPrint(created);
        setShowPrintModal(true);
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

            <form onSubmit={(e) => handleCreateRepair(e, false, false)} className="space-y-4">
              
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

                  {/* Category Radio from User's HTML */}
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
                            setFormData({ ...formData, departmentId: dId, deptName: dObj?.name || formData.deptName });
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

              {/* SECTION 2: OFFICIAL MEMORANDUM & SIGNATURES */}
              {activeTabSection === 'official_memo' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 mb-2">ส่วนหัวบันทึกข้อความราชการ</h4>
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
                          onChange={(e) => setFormData({ ...formData, deptName: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Signatures Part 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-xs font-bold text-slate-800">ผู้ส่งซ่อม</div>
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

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-xs font-bold text-slate-800">ความเห็นหัวหน้าฝ่าย/กลุ่มงาน</div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ความเห็น</label>
                        <input
                          type="text"
                          value={formData.headOpinion}
                          onChange={(e) => setFormData({ ...formData, headOpinion: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ลงชื่อหัวหน้าฝ่าย</label>
                        <input
                          type="text"
                          value={formData.headSign}
                          onChange={(e) => setFormData({ ...formData, headSign: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ตำแหน่งหัวหน้าฝ่าย</label>
                        <input
                          type="text"
                          value={formData.headPosition}
                          onChange={(e) => setFormData({ ...formData, headPosition: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Assessment */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-800">บันทึกหน่วยงานซ่อมบำรุง / ฝ่ายบริหารทั่วไป</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.canSelfRepairFree}
                          onChange={(e) => setFormData({ ...formData, canSelfRepairFree: e.target.checked })}
                        />
                        <span>ซ่อมได้เองโดยช่างของโรงพยาบาล ไม่เสียค่าใช้จ่าย</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.canSelfRepairWithCost}
                          onChange={(e) => setFormData({ ...formData, canSelfRepairWithCost: e.target.checked })}
                        />
                        <span>ซ่อมได้เองโดยช่างของโรงพยาบาลโดยเสียค่าวัสดุเพิ่มเติม</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.sendToGovTech}
                          onChange={(e) => setFormData({ ...formData, sendToGovTech: e.target.checked })}
                        />
                        <span>ส่งซ่อมกองช่างบำรุง</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
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
                          value={formData.repairDays}
                          onChange={(e) => setFormData({ ...formData, repairDays: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ค่าใช้จ่ายประมาณ (บาท)</label>
                        <input
                          type="text"
                          value={formData.repairCost}
                          onChange={(e) => setFormData({ ...formData, repairCost: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ชื่อบริษัทส่งซ่อมภายนอก</label>
                        <input
                          type="text"
                          value={formData.outsideCompanyName}
                          onChange={(e) => setFormData({ ...formData, outsideCompanyName: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ลงชื่อช่าง/หน่วยซ่อม</label>
                        <input
                          type="text"
                          value={formData.maintenanceSign}
                          onChange={(e) => setFormData({ ...formData, maintenanceSign: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Procurement & Approver Comments */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-xs font-bold text-slate-800">หัวหน้าเจ้าหน้าที่พัสดุ & ผู้ส่งของ</div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ลงชื่อหัวหน้าเจ้าหน้าที่</label>
                        <input
                          type="text"
                          value={formData.procureSign}
                          onChange={(e) => setFormData({ ...formData, procureSign: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ลงชื่อผู้ส่งของ</label>
                        <input
                          type="text"
                          value={formData.deliverySign}
                          onChange={(e) => setFormData({ ...formData, deliverySign: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-xs font-bold text-slate-800">ความคิดเห็นผู้อนุมัติ & ผู้รับของ</div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ความเห็นอนุมัติ</label>
                        <input
                          type="text"
                          value={formData.approverComment1}
                          onChange={(e) => setFormData({ ...formData, approverComment1: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">ลงชื่อผู้มีอำนาจอนุมัติ</label>
                        <input
                          type="text"
                          value={formData.approverSign}
                          onChange={(e) => setFormData({ ...formData, approverSign: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
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
                      ต้องการดู/แก้ไขลายเซ็นและหัวบันทึกข้อความราชการ คลิกที่นี่ &rarr;
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
                    onClick={() => handleCreateRepair(undefined, true, false)}
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
