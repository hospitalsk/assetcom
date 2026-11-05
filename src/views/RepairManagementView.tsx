import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, Plus, AlertTriangle } from 'lucide-react';
import { LineOARepairNotifier } from '../components/LineOARepairNotifier';

export const RepairManagementView: React.FC = () => {
  const { repairRequests, assets, departments, addRepairRequest, currentUser, getActiveRepairForAsset } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [lastCreatedRepairId, setLastCreatedRepairId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    assetId: assets[0]?.id || '',
    reporterId: currentUser.id,
    departmentId: currentUser.departmentId,
    issueDescription: '',
    urgency: 'ปกติ' as const,
    repairMethod: '',
    laborCost: 0,
    partsCost: 0,
    spareParts: [] as { id: string; partName: string; qty: number; unitPrice: number }[],
    notes: '',
  });

  const selectedActiveRepair = getActiveRepairForAsset 
    ? getActiveRepairForAsset(formData.assetId) 
    : repairRequests.find(r => r.assetId === formData.assetId && r.status !== 'ซ่อมเสร็จ' && r.status !== 'ปิดงาน' && r.status !== 'ดำเนินการเสร็จ');

  const handleCreateRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedActiveRepair) {
      alert(`⚠️ ป้องกันการส่งซ่อมซ้ำ!\nครุภัณฑ์นี้มีใบแจ้งซ่อมเลขที่ [${selectedActiveRepair.repairNo}] อยู่แล้วในระบบ (สถานะ: ${selectedActiveRepair.status})`);
      return;
    }
    if (!formData.issueDescription) {
      alert('กรุณากรอกอาการเสีย');
      return;
    }
    try {
      const created = addRepairRequest(formData);
      setShowAddModal(false);
      setLastCreatedRepairId(created.id);
      setFormData({
        assetId: assets[0]?.id || '',
        reporterId: currentUser.id,
        departmentId: currentUser.departmentId,
        issueDescription: '',
        urgency: 'ปกติ',
        repairMethod: '',
        laborCost: 0,
        partsCost: 0,
        spareParts: [],
        notes: '',
      });
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
        <div className="flex items-center space-x-2">
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

      {/* Add Repair Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-['Sarabun',sans-serif]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">แจ้งซ่อมครุภัณฑ์</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleCreateRepair} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div><span className="font-semibold text-slate-500">ผู้แจ้งซ่อม:</span> <span className="font-bold text-slate-800">{currentUser.name} ({currentUser.role})</span></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยงานผู้ส่งซ่อม</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เลือกครุภัณฑ์ที่ต้องการแจ้งซ่อม</label>
                <select
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {assets.map(ast => {
                    const active = getActiveRepairForAsset 
                      ? getActiveRepairForAsset(ast.id) 
                      : repairRequests.find(r => r.assetId === ast.id && r.status !== 'ซ่อมเสร็จ' && r.status !== 'ปิดงาน' && r.status !== 'ดำเนินการเสร็จ');
                    return (
                      <option key={ast.id} value={ast.id}>
                        {ast.assetCode} - {ast.name} {active ? ` ⚠️ (มีใบซ่อมแล้ว: ${active.repairNo})` : ''}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ความเร่งด่วน</label>
                <select
                  disabled={!!selectedActiveRepair}
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  <option value="ปกติ">ปกติ</option>
                  <option value="ด่วน">ด่วน</option>
                  <option value="ด่วนมาก / ฉุกเฉิน">ด่วนมาก / ฉุกเฉิน</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">อาการเสีย / รายละเอียด</label>
                <textarea
                  disabled={!!selectedActiveRepair}
                  rows={3}
                  required
                  placeholder={selectedActiveRepair ? `ไม่สามารถส่งซ่อมซ้ำได้ (${selectedActiveRepair.repairNo})` : "อธิบายอาการเสียและปัญหาที่พบ..."}
                  value={formData.issueDescription}
                  onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
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
                  {selectedActiveRepair ? '⚠️ มีใบแจ้งซ่อมซ้ำ' : 'ส่งใบแจ้งซ่อม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
