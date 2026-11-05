import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Asset, AssetStatus } from '../types';
import { 
  Plus, 
  Search, 
  QrCode, 
  ArrowRightLeft, 
  Trash2, 
  Eye, 
  Printer, 
  CheckCircle,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const AssetManagementView: React.FC = () => {
  const { 
    assets, 
    departments, 
    assetCategories, 
    addAsset, 
    updateAsset, 
    deleteAsset, 
    currentUser,
    addAssetCategory
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Asset | null>(null);
  const [showQRModal, setShowQRModal] = useState<Asset | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<Asset | null>(null);

  // Transfer form state
  const [targetDeptId, setTargetDeptId] = useState(departments[0]?.id || '');
  const [transferReason, setTransferReason] = useState('');

  // New category state for admin
  const [newCatName, setNewCatName] = useState('');
  const [showNewCatInput, setShowNewCatInput] = useState(false);

  // New asset form state
  const [formData, setFormData] = useState({
    assetCode: `AST-2568-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    categoryId: assetCategories[0]?.id || '',
    brand: '',
    model: '',
    serialNumber: '',
    receivedDate: new Date().toISOString().split('T')[0],
    inspectionDate: new Date().toISOString().split('T')[0],
    purchasePrice: 25000,
    poNumber: 'PO-68/',
    inspectionNo: 'INS-68/',
    budgetSource: 'งบแผ่นดิน' as const,
    usefulLife: 5,
    acquisitionMethod: 'จัดซื้อปกติ' as const,
    location: '',
    departmentId: departments[0]?.id || '',
    status: 'พร้อมใช้งาน' as AssetStatus,
    notes: '',
  });

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.serialNumber) {
      alert('กรุณากรอกชื่อครุภัณฑ์และ Serial Number ให้ครบถ้วน');
      return;
    }
    const salvageValue = formData.purchasePrice * 0.1;
    addAsset({
      ...formData,
      salvageValue,
    });
    setShowAddModal(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTransferModal) return;
    updateAsset(showTransferModal.id, { 
      departmentId: targetDeptId,
      notes: `${showTransferModal.notes || ''} [โอนย้ายไปยังหน่วยงาน ${departments.find(d => d.id === targetDeptId)?.name} เมื่อ ${new Date().toLocaleDateString('th-TH')}]`
    });
    alert('โอนย้ายหน่วยงานครุภัณฑ์สำเร็จเรียบร้อย');
    setShowTransferModal(null);
    setTransferReason('');
  };

  const handleAddCategory = () => {
    if (!newCatName) return;
    addAssetCategory({
      code: `CAT-${Math.floor(10 + Math.random() * 90)}`,
      name: newCatName,
      defaultUsefulLife: 5,
      salvageValuePercent: 10,
      prefix: 'AST'
    });
    setNewCatName('');
    setShowNewCatInput(false);
  };

  // Filtered Assets
  const filteredAssets = assets.filter(asset => {
    const matchSearch = 
      asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCat = filterCategory === 'ALL' || asset.categoryId === filterCategory;
    const matchStatus = filterStatus === 'ALL' || asset.status === filterStatus;
    const matchDept = filterDept === 'ALL' || asset.departmentId === filterDept;

    return matchSearch && matchCat && matchStatus && matchDept;
  });

  const isAdminOrSuper = currentUser.role === 'Super Admin' || currentUser.role === 'Admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ระบบทะเบียนครุภัณฑ์</h2>
          <p className="text-xs text-slate-500 mt-1">
            บันทึกและบริหารจัดการครุภัณฑ์คอมพิวเตอร์และอุปกรณ์ไอทีทั้งหมดในหน่วยงาน
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มครุภัณฑ์ใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัส, ชื่อ, Serial No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          >
            <option value="ALL">ทุกประเภทครุภัณฑ์</option>
            {assetCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
            <option value="กำลังใช้งาน">กำลังใช้งาน</option>
            <option value="ว่าง">ว่าง</option>
            <option value="ยืมใช้งาน">ยืมใช้งาน</option>
            <option value="กำลังซ่อม">กำลังซ่อม</option>
            <option value="ชำรุด">ชำรุด</option>
            <option value="จำหน่าย">จำหน่าย</option>
          </select>
        </div>

        <div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          >
            <option value="ALL">ทุกหน่วยงาน</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">รหัสครุภัณฑ์</th>
                <th className="p-4">ชื่อครุภัณฑ์ / ยี่ห้อ / รุ่น</th>
                <th className="p-4">Serial Number</th>
                <th className="p-4">หน่วยงานรับผิดชอบ</th>
                <th className="p-4">ราคาซื้อ (บาท)</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    ไม่พบรายการครุภัณฑ์ที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const dept = departments.find(d => d.id === asset.departmentId);
                  const cat = assetCategories.find(c => c.id === asset.categoryId);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-blue-600">{asset.assetCode}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{asset.name}</div>
                        <div className="text-[11px] text-slate-500">{asset.brand} {asset.model} • <span className="text-slate-400">{cat?.name}</span></div>
                      </td>
                      <td className="p-4 font-mono text-slate-600">{asset.serialNumber}</td>
                      <td className="p-4 text-slate-700">{dept?.name || '-'}</td>
                      <td className="p-4 font-semibold">฿{asset.purchasePrice.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          asset.status === 'พร้อมใช้งาน' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          asset.status === 'กำลังใช้งาน' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          asset.status === 'กำลังซ่อม' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setShowDetailModal(asset)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowQRModal(asset)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                            title="QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowTransferModal(asset)}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                            title="โอนย้ายหน่วยงาน"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          {isAdminOrSuper && (
                            <button
                              onClick={() => deleteAsset(asset.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              title="ลบ/จำหน่าย"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal (Admin can edit / add categories) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">เพิ่มรายการครุภัณฑ์ใหม่</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสครุภัณฑ์</label>
                  <input
                    type="text"
                    required
                    value={formData.assetCode}
                    onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อครุภัณฑ์</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น เครื่องคอมพิวเตอร์แม่ข่าย"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">ประเภทครุภัณฑ์</label>
                    {isAdminOrSuper && (
                      <button 
                        type="button" 
                        onClick={() => setShowNewCatInput(!showNewCatInput)}
                        className="text-[10px] text-blue-600 font-bold hover:underline"
                      >
                        {showNewCatInput ? 'ซ่อน' : '+ เพิ่มประเภทใหม่'}
                      </button>
                    )}
                  </div>
                  {showNewCatInput && isAdminOrSuper ? (
                    <div className="flex space-x-2 mb-2">
                      <input 
                        type="text" 
                        placeholder="ชื่อประเภทใหม่..." 
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-blue-300"
                      />
                      <button 
                        type="button" 
                        onClick={handleAddCategory}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                      >
                        บันทึก
                      </button>
                    </div>
                  ) : null}
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {assetCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ยี่ห้อ (Brand)</label>
                  <input
                    type="text"
                    placeholder="เช่น Dell, HP, Lenovo"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รุ่น (Model)</label>
                  <input
                    type="text"
                    placeholder="เช่น OptiPlex 7010"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    required
                    placeholder="S/N 123456789"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ราคาซื้อ (บาท)</label>
                  <input
                    type="number"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">แหล่งงบประมาณ</label>
                  <select
                    value={formData.budgetSource}
                    onChange={(e) => setFormData({ ...formData, budgetSource: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="งบแผ่นดิน">งบแผ่นดิน</option>
                    <option value="งบรายได้">งบรายได้</option>
                    <option value="งบเงินอุดหนุน">งบเงินอุดหนุน</option>
                    <option value="บริจาค">บริจาค</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยงานรับผิดชอบ</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">สถานที่ติดตั้ง / จัดเก็บ</label>
                  <input
                    type="text"
                    placeholder="เช่น อาคารอำนวยการ ชั้น 3"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  บันทึกทะเบียนครุภัณฑ์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal (Functional) */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">รายละเอียดครุภัณฑ์: {showDetailModal.assetCode}</h3>
              <button onClick={() => setShowDetailModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-500 font-semibold">ชื่อครุภัณฑ์:</span> <span className="font-bold text-slate-800">{showDetailModal.name}</span></div>
                <div><span className="text-slate-500 font-semibold">ยี่ห้อ/รุ่น:</span> {showDetailModal.brand} {showDetailModal.model}</div>
                <div><span className="text-slate-500 font-semibold">Serial Number:</span> <span className="font-mono text-blue-600">{showDetailModal.serialNumber}</span></div>
                <div><span className="text-slate-500 font-semibold">ราคาซื้อ:</span> ฿{showDetailModal.purchasePrice.toLocaleString()}</div>
                <div><span className="text-slate-500 font-semibold">วันที่ได้รับ:</span> {showDetailModal.receivedDate}</div>
                <div><span className="text-slate-500 font-semibold">แหล่งงบประมาณ:</span> {showDetailModal.budgetSource}</div>
                <div><span className="text-slate-500 font-semibold">หน่วยงาน:</span> {departments.find(d => d.id === showDetailModal.departmentId)?.name}</div>
                <div><span className="text-slate-500 font-semibold">สถานที่ติดตั้ง:</span> {showDetailModal.location}</div>
                <div><span className="text-slate-500 font-semibold">สถานะ:</span> <span className="font-bold text-emerald-600">{showDetailModal.status}</span></div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDetailModal(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal (Functional) */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">โอนย้ายหน่วยงานครุภัณฑ์</h3>
              <button onClick={() => setShowTransferModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-800 space-y-1">
                <div><span className="font-bold">ครุภัณฑ์:</span> {showTransferModal.name}</div>
                <div><span className="font-bold">รหัส:</span> {showTransferModal.assetCode}</div>
                <div><span className="font-bold">หน่วยงานเดิม:</span> {departments.find(d => d.id === showTransferModal.departmentId)?.name}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">โอนย้ายไปที่หน่วยงานใหม่</label>
                <select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เหตุผลในการโอนย้าย</label>
                <textarea
                  rows={2}
                  required
                  placeholder="ระบุเหตุผล..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  ยืนยันโอนย้าย
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">QR Code ครุภัณฑ์</h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-center">
              <QRCodeSVG value={`ASSET-${showQRModal.assetCode}`} size={160} level="H" includeMargin />
            </div>
            <div>
              <div className="font-bold text-blue-600 text-sm">{showQRModal.assetCode}</div>
              <div className="text-xs text-slate-700 mt-1">{showQRModal.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">S/N: {showQRModal.serialNumber}</div>
            </div>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์สติกเกอร์</span>
              </button>
              <button
                onClick={() => setShowQRModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
