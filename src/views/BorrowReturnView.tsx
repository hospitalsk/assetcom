import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeftRight, Plus, CheckCircle, Clock } from 'lucide-react';

export const BorrowReturnView: React.FC = () => {
  const { borrowRequests, assets, departments, addBorrowRequest, updateBorrowStatus, currentUser } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    userId: currentUser.id,
    departmentId: currentUser.departmentId,
    assetIds: [assets[0]?.id || ''],
    borrowDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    purpose: '',
  });

  const handleCreateBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.purpose) {
      alert('กรุณาระบุวัตถุประสงค์การยืม');
      return;
    }
    addBorrowRequest({
      ...formData,
      userId: currentUser.id
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ระบบยืม - คืนครุภัณฑ์</h2>
          <p className="text-xs text-slate-500 mt-1">
            Workflow การยืมครุภัณฑ์ ตรวจสอบ อนุมัติ และบันทึกการส่งคืนพร้อมตรวจสอบสภาพ
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างคำขอยืมครุภัณฑ์</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">เลขที่ใบยืม</th>
                <th className="p-4">ผู้ยืม / เจ้าหน้าที่บันทึก</th>
                <th className="p-4">รายการครุภัณฑ์</th>
                <th className="p-4">วันที่ยืม - กำหนดคืน</th>
                <th className="p-4">วัตถุประสงค์</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {borrowRequests.map(req => {
                const dept = departments.find(d => d.id === req.departmentId);
                const asset = assets.find(a => a.id === req.assetIds[0]);
                return (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-blue-600">{req.requestNo}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500">{dept?.name}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{asset?.name || 'ครุภัณฑ์'}</td>
                    <td className="p-4 text-slate-600">
                      {req.borrowDate} ถึง {req.dueDate}
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">{req.purpose}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        req.status === 'ยืมใช้งาน' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        req.status === 'คืนแล้ว' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {req.status === 'รอตรวจสอบ' && (
                          <button
                            onClick={() => updateBorrowStatus(req.id, 'ยืมใช้งาน')}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            อนุมัติ/จ่ายพัสดุ
                          </button>
                        )}
                        {req.status === 'ยืมใช้งาน' && (
                          <button
                            onClick={() => updateBorrowStatus(req.id, 'คืนแล้ว')}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            รับคืน
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Borrow Modal with logged-in officer name displayed */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">สร้างคำขอยืมครุภัณฑ์</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreateBorrow} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div><span className="font-semibold text-slate-500">เจ้าหน้าที่ผู้บันทึก/ผู้ขอ:</span> <span className="font-bold text-slate-800">{currentUser.name} ({currentUser.role})</span></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยงานที่ยืม</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">เลือกครุภัณฑ์ที่ต้องการยืม</label>
                <select
                  value={formData.assetIds[0]}
                  onChange={(e) => setFormData({ ...formData, assetIds: [e.target.value] })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {assets.filter(a => a.status === 'พร้อมใช้งาน' || a.status === 'ว่าง').map(ast => (
                    <option key={ast.id} value={ast.id}>{ast.assetCode} - {ast.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่ยืม</label>
                  <input
                    type="date"
                    value={formData.borrowDate}
                    onChange={(e) => setFormData({ ...formData, borrowDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">กำหนดคืน</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">วัตถุประสงค์การยืม</label>
                <textarea
                  rows={3}
                  required
                  placeholder="ระบุเหตุผลและสถานที่นำไปใช้งาน..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  ส่งคำขอยืม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
