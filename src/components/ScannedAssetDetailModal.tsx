import React, { useState } from 'react';
import { Asset, Department, AssetCategory, RepairRequest, BorrowRequest } from '../types';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Monitor, 
  Building, 
  MapPin, 
  User, 
  Calendar, 
  Coins, 
  ShieldCheck, 
  Wrench, 
  ArrowLeftRight, 
  Printer, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Send,
  PlusCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { showSwalAlert } from '../utils/swal';

interface ScannedAssetDetailModalProps {
  asset: Asset;
  departments: Department[];
  assetCategories: AssetCategory[];
  repairRequests: RepairRequest[];
  borrowRequests: BorrowRequest[];
  organizationName: string;
  logoUrl: string;
  onClose: () => void;
  onNotifyRepair?: (assetId: string) => void;
  onPrintSticker?: (asset: Asset) => void;
}

export const ScannedAssetDetailModal: React.FC<ScannedAssetDetailModalProps> = ({
  asset,
  departments,
  assetCategories,
  repairRequests,
  borrowRequests,
  organizationName,
  logoUrl,
  onClose,
  onNotifyRepair,
  onPrintSticker,
}) => {
  const { addRepairRequest, currentUser, settings, getActiveRepairForAsset, users } = useApp();

  const [showQuickRepairForm, setShowQuickRepairForm] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [urgency, setUrgency] = useState<'ปกติ' | 'ด่วน' | 'ด่วนมาก / ฉุกเฉิน'>('ปกติ');
  const [repairDeptId, setRepairDeptId] = useState(currentUser.departmentId || departments[0]?.id || '');
  const [repairSuccessMessage, setRepairSuccessMessage] = useState<string | null>(null);

  const dept = departments.find((d) => d.id === asset.departmentId);
  const category = assetCategories.find((c) => c.id === asset.categoryId);

  // Active Repair Check (Duplicate Prevention)
  const activeRepair = getActiveRepairForAsset ? getActiveRepairForAsset(asset.id) : repairRequests.find((r) => r.assetId === asset.id && r.status !== 'ซ่อมเสร็จ' && r.status !== 'ปิดงาน' && r.status !== 'ดำเนินการเสร็จ');

  // Financial & Depreciation Calculations
  const purchasePrice = asset.purchasePrice || 0;
  const usefulLife = asset.usefulLife || category?.defaultUsefulLife || 5;
  const salvageValue = asset.salvageValue !== undefined ? asset.salvageValue : 1; // Default 1 Baht
  
  // Calculate Depreciation
  const acqDate = asset.receivedDate ? new Date(asset.receivedDate) : new Date();
  const currentDate = new Date();
  const yearsPassed = Math.max(0, (currentDate.getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  
  const depreciableAmount = Math.max(0, purchasePrice - salvageValue);
  const annualDepreciation = usefulLife > 0 ? depreciableAmount / usefulLife : 0;
  const accumulatedDepreciation = Math.min(depreciableAmount, annualDepreciation * yearsPassed);
  const currentNetValue = Math.max(salvageValue, purchasePrice - accumulatedDepreciation);

  // Warranty status
  const isWarrantyActive = asset.warrantyExpiryDate ? new Date(asset.warrantyExpiryDate) > new Date() : false;

  // History filtering
  const relatedRepairs = repairRequests.filter((r) => r.assetId === asset.id);
  const relatedBorrows = borrowRequests.filter((b) => b.assetIds && b.assetIds.includes(asset.id));

  const handleQuickSubmitRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRepair) {
      showSwalAlert(
        'warning',
        'ป้องกันการส่งซ่อมซ้ำ!',
        `ครุภัณฑ์ชิ้นนี้มีใบแจ้งซ่อมเลขที่ [${activeRepair.repairNo}] ที่กำลังดำเนินการอยู่แล้ว (สถานะ: ${activeRepair.status})`
      );
      return;
    }
    if (!issueDescription.trim()) {
      showSwalAlert('warning', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกอาการเสีย / รายละเอียดปัญหาที่พบ');
      return;
    }

    try {
      const createdRep = addRepairRequest({
        assetId: asset.id,
        reporterId: currentUser.id,
        departmentId: repairDeptId,
        issueDescription: issueDescription.trim(),
        urgency,
        repairMethod: '',
        laborCost: 0,
        partsCost: 0,
        spareParts: [],
        notes: 'แจ้งซ่อมด่วนจากการสแกน QR Code'
      });

      setRepairSuccessMessage(`สร้างใบแจ้งซ่อม ${createdRep.repairNo} และส่งการแจ้งเตือนไปยัง LINE OA เรียบร้อยแล้ว!`);
      setShowQuickRepairForm(false);
      setIssueDescription('');
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 font-['Sarabun',sans-serif]">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 border border-slate-100">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md shrink-0">
              <Monitor className="w-6 h-6 text-blue-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-blue-500/40 text-blue-100 px-2.5 py-0.5 rounded-full font-bold border border-blue-400/30">
                  สแกนสำเร็จ
                </span>
                <span className="text-xs text-blue-200 font-semibold">{organizationName}</span>
              </div>
              <h2 className="text-base sm:text-xl font-extrabold truncate mt-0.5">
                {asset.name} ({asset.assetCode})
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-2xl transition-colors shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content Scroll Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {activeRepair && (
            <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 rounded-2xl text-xs font-bold flex items-start space-x-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-extrabold text-amber-900 text-sm">⚠️ มีรายการแจ้งซ่อมค้างในระบบ (ป้องกันการแจ้งซ่อมซ้ำ)</div>
                <div>ครุภัณฑ์ชิ้นนี้มีใบแจ้งซ่อมเลขที่ <span className="font-bold underline">{activeRepair.repairNo}</span> ที่อยู่ระหว่างดำเนินการ (สถานะ: <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-extrabold">{activeRepair.status}</span>)</div>
                <div className="text-[11px] text-amber-800 font-normal">ระบบจะไม่อนุญาตให้เปิดใบแจ้งซ่อมใหม่สำหรับครุภัณฑ์ชิ้นนี้ จนกว่ารายการเดิมจะถูกซ่อมเสร็จสิ้นหรือปิดงาน</div>
              </div>
            </div>
          )}

          {repairSuccessMessage && (
            <div className="p-4 bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-bounce">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0" />
                <span>📲 {repairSuccessMessage}</span>
              </div>
              {onNotifyRepair && (
                <button
                  onClick={() => {
                    onNotifyRepair(asset.id);
                    onClose();
                  }}
                  className="px-3 py-1 bg-white text-emerald-800 rounded-xl text-[11px] font-black hover:bg-emerald-50"
                >
                  ไปยัง LINE OA
                </button>
              )}
            </div>
          )}

          {/* Main Quick Banner Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* QR Code preview box */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <QRCodeSVG value={`ASSET-${asset.assetCode}`} size={120} level="H" includeMargin />
              </div>
              <div className="text-xs font-black text-blue-600">{asset.assetCode}</div>
              <div className="text-[10px] text-slate-500">S/N: {asset.serialNumber || '-'}</div>
            </div>

            {/* General Highlights */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">สถานะครุภัณฑ์ปัจจุบัน:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                    asset.status === 'พร้อมใช้งาน'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : asset.status === 'กำลังซ่อม' || asset.status === 'ชำรุด'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : asset.status === 'ยืมใช้งาน'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {asset.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">ประเภทครุภัณฑ์:</span>
                  <span className="font-bold text-slate-800">{category?.name || 'ครุภัณฑ์คอมพิวเตอร์'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">หน่วยงานผู้ถือครอง:</span>
                  <span className="font-bold text-slate-800">{dept?.name || 'กลุ่มงานทั่วไป'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">สถานที่ติดตั้ง/จัดเก็บ:</span>
                  <span className="font-bold text-slate-800">{asset.location || 'อาคารอำนวยการ'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">ผู้รับผิดชอบ:</span>
                  <span className="font-bold text-slate-800">{asset.responsiblePerson || 'ไม่ระบุ'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Repair Form Section (Toggleable or Always Visible) */}
          <div className="bg-gradient-to-r from-rose-50 to-orange-50 p-5 rounded-3xl border border-rose-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-rose-600 text-white rounded-2xl shadow-md">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">แจ้งซ่อมครุภัณฑ์ชิ้นนี้ผ่าน LINE OA</h3>
                  <p className="text-[11px] text-slate-500">กรอกรายละเอียดปัญหาที่พบ เพื่อส่งใบแจ้งซ่อมและแจ้งเตือนเข้า LINE OA ของช่างทันที</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickRepairForm(!showQuickRepairForm)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 ${
                  activeRepair 
                    ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-200'
                    : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {showQuickRepairForm 
                    ? 'ซ่อนฟอร์ม' 
                    : activeRepair 
                    ? '⚠️ ตรวจสอบใบแจ้งซ่อมค้าง' 
                    : '🛠️ กรอกใบแจ้งซ่อมทันที'}
                </span>
              </button>
            </div>

            {showQuickRepairForm && (
              <form onSubmit={handleQuickSubmitRepair} className="bg-white p-4 rounded-2xl border border-rose-200 space-y-3 animate-in fade-in zoom-in-95">
                {activeRepair && (
                  <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold">
                    ⚠️ ไม่สามารถส่งใบแจ้งซ่อมซ้ำได้! มีใบแจ้งซ่อม {activeRepair.repairNo} อยู่ระหว่าง {activeRepair.status}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">หน่วยงานผู้ส่งซ่อม</label>
                    <select
                      disabled={!!activeRepair}
                      value={repairDeptId}
                      onChange={(e) => setRepairDeptId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-rose-500 bg-slate-50 font-medium disabled:opacity-60"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ระดับความเร่งด่วน</label>
                    <select
                      disabled={!!activeRepair}
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-rose-500 bg-slate-50 font-medium disabled:opacity-60"
                    >
                      <option value="ปกติ">ปกติ</option>
                      <option value="ด่วน">ด่วน</option>
                      <option value="ด่วนมาก / ฉุกเฉิน">ด่วนมาก / ฉุกเฉิน</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">อาการเสีย / รายละเอียดปัญหาที่พบ *</label>
                  <textarea
                    disabled={!!activeRepair}
                    rows={3}
                    required
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder={activeRepair ? `มีรายการแจ้งซ่อม ${activeRepair.repairNo} อยู่ในระบบแล้ว` : "อธิบายอาการเสีย ปัญหาที่เปิดไม่ติด หน้าจอดับ เสียงดัง หรือข้อผิดพลาดที่พบ..."}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-rose-500 bg-slate-50 disabled:opacity-60"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowQuickRepairForm(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    ปิด
                  </button>
                  <button
                    type="submit"
                    disabled={!!activeRepair}
                    className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${
                      activeRepair 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{activeRepair ? '⚠️ มีใบแจ้งซ่อมซ้ำในระบบ' : '🚀 ยืนยันส่งใบแจ้งซ่อม & แจ้ง LINE OA'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Details Section Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: ข้อมูลการจัดซื้อและมูลค่าปัจจุบัน */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 text-blue-600 border-b border-slate-100 pb-2">
                <Coins className="w-4 h-4" />
                <span>ข้อมูลทางบัญชี & มูลค่าปัจจุบัน (Net Book Value)</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">ราคาทุนจัดซื้อ:</span>
                  <span className="font-extrabold text-slate-900">฿{purchasePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">วันที่รับเข้าใช้งาน:</span>
                  <span className="font-bold text-slate-800">{asset.receivedDate || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">แหล่งงบประมาณ:</span>
                  <span className="font-bold text-slate-800">{asset.budgetSource || 'งบแผ่นดิน'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">วิธีการได้มา:</span>
                  <span className="font-bold text-slate-800">{asset.acquisitionMethod || 'จัดซื้อปกติ'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">อายุการใช้งานตามเกณฑ์:</span>
                  <span className="font-bold text-slate-800">{usefulLife} ปี</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">ค่าเสื่อมราคาสะสม:</span>
                  <span className="font-bold text-rose-600">฿{accumulatedDepreciation.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1.5 bg-blue-50/60 px-3 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900">มูลค่าสุทธิปัจจุบัน (Net Book Value):</span>
                  <span className="font-black text-blue-700 text-sm">฿{currentNetValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Box 2: ข้อมูลการรับประกัน & ผู้ขาย */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 text-indigo-600 border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>ข้อมูลการรับประกัน & ผู้จัดจำหน่าย</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">บริษัท/ผู้จัดจำหน่าย:</span>
                  <span className="font-bold text-slate-800">{asset.vendorName || 'บริษัท บิซคีย์ ไอที โซลูชั่น จำกัด'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">เบอร์ติดต่อผู้ขาย:</span>
                  <span className="font-bold text-slate-800">{asset.vendorPhone || '02-987-6543'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">วันหมดประกัน:</span>
                  <span className="font-bold text-slate-800">{asset.warrantyExpiryDate || '-'}</span>
                </div>
                <div className={`flex justify-between py-1.5 px-3 rounded-xl border items-center my-2 ${
                  isWarrantyActive ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  <span className="font-bold">สถานะประกันภัย/ซ่อมบำรุง:</span>
                  <span className="font-black">
                    {isWarrantyActive ? 'อยู่ในระยะเวลารับประกัน' : 'หมดระยะเวลารับประกันแล้ว'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">หมายเหตุ / คุณลักษณะเฉพาะ:</span>
                  <p className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-[11px]">
                    {asset.specifications || asset.notes || 'ไม่มีบันทึกเพิ่มเติม'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Related Repair History Section */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 text-rose-600 border-b border-slate-100 pb-2">
              <Wrench className="w-4 h-4" />
              <span>ประวัติการแจ้งซ่อมย้อนหลัง ({relatedRepairs.length} รายการ)</span>
            </h3>

            {relatedRepairs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">เลขที่ใบซ่อม</th>
                      <th className="p-2.5">วันที่แจ้ง</th>
                      <th className="p-2.5">ผู้รับซ่อม (ช่าง)</th>
                      <th className="p-2.5">อาการเสีย</th>
                      <th className="p-2.5 text-right">ค่าแรง / ค่าอะไหล่</th>
                      <th className="p-2.5 text-right">ค่าซ่อมรวม</th>
                      <th className="p-2.5 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {relatedRepairs.map((rep) => {
                      const tech = users.find(u => u.id === rep.technicianId);
                      return (
                        <tr key={rep.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-blue-600">{rep.repairNo}</td>
                          <td className="p-2.5 text-slate-600">{new Date(rep.createdAt).toLocaleDateString('th-TH')}</td>
                          <td className="p-2.5 font-medium text-slate-800">{tech ? tech.name : (rep.technicianId || 'ยังไม่มอบหมาย')}</td>
                          <td className="p-2.5 text-slate-800 max-w-[200px] truncate">{rep.issueDescription}</td>
                          <td className="p-2.5 text-right text-slate-600">
                            ฿{(rep.laborCost || 0).toLocaleString()} / ฿{(rep.partsCost || 0).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-bold text-rose-600">฿{(rep.totalCost || 0).toLocaleString()}</td>
                          <td className="p-2.5 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                              rep.status === 'ซ่อมเสร็จ' || rep.status === 'ปิดงาน' || rep.status === 'ดำเนินการเสร็จ' ? 'bg-emerald-100 text-emerald-800' :
                              rep.status === 'กำลังดำเนินการ' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {rep.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
                ไม่เคยมีประวัติการแจ้งซ่อมสำหรับครุภัณฑ์ชิ้นนี้
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setShowQuickRepairForm(!showQuickRepairForm)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-rose-200 flex items-center justify-center space-x-2"
            >
              <Wrench className="w-4 h-4" />
              <span>🛠️ แจ้งซ่อมครุภัณฑ์นี้ (LINE OA)</span>
            </button>

            {onPrintSticker && (
              <button
                onClick={() => onPrintSticker(asset)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์สติกเกอร์ชิ้นนี้</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
