import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Package, Plus, Search, CheckCircle, AlertTriangle } from 'lucide-react';

export const InventoryManagementView: React.FC = () => {
  const { inventoryItems, inventoryCategories, inventoryTransactions, addInventoryItem, processInventoryTransaction, departments, currentUser } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrxModal, setShowTrxModal] = useState<{ item: any; type: 'รับเข้าสต็อก' | 'เบิกวัสดุ' | 'ปรับปรุงยอด' } | null>(null);

  // New item form
  const [newItem, setNewItem] = useState({
    itemCode: `INV-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    categoryId: inventoryCategories[0]?.id || '',
    unit: 'ชิ้น',
    unitPrice: 100,
    stockQty: 10,
    minQty: 5,
    location: 'คลังพัสดุ IT',
    supplier: '',
    notes: ''
  });

  // Transaction form state
  const [trxQty, setTrxQty] = useState(1);
  const [trxUnitPrice, setTrxUnitPrice] = useState(100);
  const [trxMinQty, setTrxMinQty] = useState(5);
  const [trxDeptId, setTrxDeptId] = useState(currentUser.departmentId);
  const [trxNotes, setTrxNotes] = useState('');

  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    addInventoryItem({
      ...newItem,
      lastReceivedDate: new Date().toISOString().split('T')[0]
    });
    setShowAddModal(false);
    setNewItem({
      itemCode: `INV-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      categoryId: inventoryCategories[0]?.id || '',
      unit: 'ชิ้น',
      unitPrice: 100,
      stockQty: 10,
      minQty: 5,
      location: 'คลังพัสดุ IT',
      supplier: '',
      notes: ''
    });
  };

  const handleProcessTrx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTrxModal) return;
    
    processInventoryTransaction(
      showTrxModal.item.id, 
      showTrxModal.type, 
      trxQty, 
      showTrxModal.type === 'รับเข้าสต็อก' ? trxUnitPrice : undefined, 
      showTrxModal.type === 'เบิกวัสดุ' ? trxDeptId : undefined, 
      trxNotes,
      showTrxModal.type === 'รับเข้าสต็อก' ? trxMinQty : undefined
    );
    
    setShowTrxModal(null);
    setTrxQty(1);
    setTrxNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ระบบจัดการวัสดุคอมพิวเตอร์และอะไหล่</h2>
          <p className="text-xs text-slate-500 mt-1">
            ควบคุมสต็อกพัสดุ หมึกพิมพ์ เมาส์ สาย LAN และอะไหล่ พร้อมระบบ Transaction ตรวจสอบย้อนหลัง
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มรายการวัสดุใหม่</span>
        </button>
      </div>

      {/* Search & Low Stock Warning */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ค้นหารหัส, ชื่อวัสดุ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>รายการวัสดุทั้งหมด: {inventoryItems.length} รายการ</span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">รหัสวัสดุ</th>
                <th className="p-4">ชื่อวัสดุ / รายละเอียด</th>
                <th className="p-4 text-center">คงเหลือ</th>
                <th className="p-4 text-center">จุดสั่งซื้อ (Min)</th>
                <th className="p-4">ราคาต่อหน่วย</th>
                <th className="p-4">สถานที่จัดเก็บ</th>
                <th className="p-4 text-center">ทำรายการ (Transaction)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const isLow = item.stockQty <= item.minQty;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-blue-600">{item.itemCode}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500">หน่วยนับ: {item.unit} • ผู้จำหน่าย: {item.supplier || '-'}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isLow ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {item.stockQty} {item.unit}
                      </span>
                    </td>
                    <td className="p-4 text-center font-medium text-slate-600">{item.minQty} {item.unit}</td>
                    <td className="p-4 font-semibold">฿{item.unitPrice.toLocaleString()}</td>
                    <td className="p-4 text-slate-600">{item.location}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => {
                            setShowTrxModal({ item, type: 'รับเข้าสต็อก' });
                            setTrxUnitPrice(item.unitPrice);
                            setTrxMinQty(item.minQty);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          รับเข้า
                        </button>
                        <button
                          onClick={() => setShowTrxModal({ item, type: 'เบิกวัสดุ' })}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          เบิกวัสดุ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">เพิ่มรายการวัสดุใหม่</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสวัสดุ</label>
                <input
                  type="text"
                  required
                  value={newItem.itemCode}
                  onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อวัสดุ</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ตลับหมึก HP LaserJet"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ตลับ, กล่อง, ชิ้น"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ราคาต่อหน่วย (บาท)</label>
                  <input
                    type="number"
                    required
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวนเริ่มต้น</label>
                  <input
                    type="number"
                    required
                    value={newItem.stockQty}
                    onChange={(e) => setNewItem({ ...newItem, stockQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">จุดสั่งซื้อขั้นต่ำ (Min Qty)</label>
                  <input
                    type="number"
                    required
                    value={newItem.minQty}
                    onChange={(e) => setNewItem({ ...newItem, minQty: Number(e.target.value) })}
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
                  บันทึกวัสดุ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal (Receive: no ref, add unit price & total price. Dispense: select department, no ref) */}
      {showTrxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">{showTrxModal.type}: {showTrxModal.item.name}</h3>
              <button onClick={() => setShowTrxModal(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleProcessTrx} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวน ({showTrxModal.item.unit})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={trxQty}
                  onChange={(e) => setTrxQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {showTrxModal.type === 'รับเข้าสต็อก' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">ราคาต่อหน่วย (บาท)</label>
                      <input
                        type="number"
                        required
                        value={trxUnitPrice}
                        onChange={(e) => setTrxUnitPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">จุดสั่งซื้อขั้นต่ำ (Min Qty)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={trxMinQty}
                        onChange={(e) => setTrxMinQty(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-blue-800"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-semibold">ราคารวมทั้งสิ้น:</span>
                    <span className="text-sm font-bold text-emerald-600">฿{(trxQty * trxUnitPrice).toLocaleString()}</span>
                  </div>
                </>
              )}

              {showTrxModal.type === 'เบิกวัสดุ' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยงานที่เบิก</label>
                  <select
                    value={trxDeptId}
                    onChange={(e) => setTrxDeptId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุ / วัตถุประสงค์</label>
                <textarea
                  rows={2}
                  value={trxNotes}
                  onChange={(e) => setTrxNotes(e.target.value)}
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTrxModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  ยืนยันทำรายการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
