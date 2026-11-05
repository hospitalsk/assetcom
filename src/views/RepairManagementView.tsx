import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, Plus, CheckCircle, Clock, AlertTriangle, Smartphone, ListFilter } from 'lucide-react';
import { RepairStatus } from '../types';
import { canManageRepairStatus } from '../utils/permissions';
import { LineOARepairNotifier } from '../components/LineOARepairNotifier';

export const RepairManagementView: React.FC = () => {
  const { repairRequests, assets, departments, addRepairRequest, updateRepairRequest, currentUser, getActiveRepairForAsset, users } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'table' | 'line_oa'>('table');
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
      setActiveSubTab('line_oa');
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

  const canManage = canManageRepairStatus(currentUser.role);

  return (
    <div className="space-y-6 font-['Sarabun',sans-serif]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ระบบแจ้งซ่อมและบริหารจัดการงานซ่อม</h2>
          <p className="text-xs text-slate-500 mt-1">
            ติดตามสถานะการแจ้งซ่อม ค่าใช้จ่ายอะไหล่ และระบบแจ้งเตือน/รับงานผ่าน LINE OA
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            <span>แจ้งซ่อมครุภัณฑ์</span>
          </button>
        </div>
      </div>

      {/* Subtab Switcher */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-xs w-fit">
        <button
          onClick={() => setActiveSubTab('table')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>ตารางรายการแจ้งซ่อม</span>
        </button>
        <button
          onClick={() => setActiveSubTab('line_oa')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'line_oa' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-500" />
          <span>📲 LINE OA แจ้งเตือนและรับงานช่าง</span>
        </button>
      </div>

      {activeSubTab === 'line_oa' ? (
        <LineOARepairNotifier highlightRepairId={lastCreatedRepairId} />
      ) : (

      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">เลขที่ใบแจ้งซ่อม</th>
                <th className="p-4">ครุภัณฑ์ / รหัส</th>
                <th className="p-4">ผู้แจ้ง / หน่วยงาน</th>
                <th className="p-4">ช่างผู้รับงาน</th>
                <th className="p-4">อาการเสีย / วิธีซ่อม</th>
                <th className="p-4 text-right">ค่าใช้จ่ายรวม (บาท)</th>
                <th className="p-4 text-center">สถานะ</th>
                {canManage && <th className="p-4 text-center">การจัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repairRequests.map(rep => {
                const asset = assets.find(a => a.id === rep.assetId);
                const reporter = users.find(u => u.id === rep.reporterId) || { name: currentUser.name };
                const technician = users.find(u => u.id === rep.technicianId);
                const dept = departments.find(d => d.id === rep.departmentId);
                return (
                  <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-blue-600">{rep.repairNo}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{asset?.name || 'ครุภัณฑ์'}</div>
                      <div className="text-[11px] text-slate-500">{asset?.assetCode}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{reporter.name}</div>
                      <div className="text-[11px] text-slate-500">{dept?.name}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {technician ? technician.name : 'ยังไม่ระบุช่าง'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 max-w-xs">
                      <div className="font-medium text-slate-900 truncate">{rep.issueDescription}</div>
                      {rep.repairMethod && (
                        <div className="text-[10px] text-blue-600 truncate mt-0.5">วิธีซ่อม: {rep.repairMethod}</div>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-700 font-mono">
                      ฿{(rep.totalCost || 0).toLocaleString()}
                      {rep.laborCost > 0 && (
                        <div className="text-[10px] text-slate-400 font-normal">ค่าแรง ฿{rep.laborCost.toLocaleString()} + อะไหล่ ฿{(rep.partsCost || 0).toLocaleString()}</div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        rep.status === 'ซ่อมเสร็จ' || rep.status === 'ปิดงาน' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        rep.status === 'กำลังดำเนินการ' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {rep.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setActiveSubTab('line_oa');
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          ✏️ แก้ไข/ใส่ค่าซ่อม
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Add Repair Modal with logged-in user and department selection */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">แจ้งซ่อมครุภัณฑ์</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
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
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!!selectedActiveRepair}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
