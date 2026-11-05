import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileSpreadsheet, Plus, Printer, TrendingUp, AlertTriangle } from 'lucide-react';
import { PrintDocumentModal } from '../components/PrintDocumentModal';

export const BudgetPlanningView: React.FC = () => {
  const { budgetPlans, departments, addBudgetPlan, repairRequests, inventoryTransactions, assets, inventoryItems } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Print modal states
  const [showMonthlyPrint, setShowMonthlyPrint] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2025-03');

  const [showAnnualPrint, setShowAnnualPrint] = useState(false);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('2568');

  const [formData, setFormData] = useState({
    fiscalYear: '2569',
    departmentId: departments[0]?.id || '',
    category: 'ครุภัณฑ์คอมพิวเตอร์' as const,
    itemName: '',
    estimatedQty: 1,
    estimatedUnitPrice: 25000,
    totalBudget: 25000,
    priority: 'สูง' as const,
    justification: '',
    status: 'ร่างแผน' as const
  });

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    addBudgetPlan({
      ...formData,
      totalBudget: formData.estimatedQty * formData.estimatedUnitPrice
    });
    setShowAddModal(false);
  };

  // CALCULATED PROCUREMENT RECOMMENDATIONS FOR MONTHLY / ANNUAL REPORTS
  // 1. Assets needing replacement (repair status or old)
  const calculatedAssetsToReplace = assets.filter(a => a.status === 'กำลังซ่อม' || a.status === 'ชำรุด');
  
  // 2. Inventory items needing replenishment (stock <= minQty)
  const calculatedInventoryToBuy = inventoryItems.filter(i => i.stockQty <= i.minQty);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ระบบวางแผนงบประมาณและจัดหาพัสดุประจำปี</h2>
          <p className="text-xs text-slate-500 mt-1">
            วิเคราะห์และคำนวณความจำเป็นในการจัดซื้อจัดจ้างครุภัณฑ์และวัสดุ ตามระเบียบกระทรวงการคลัง พ.ศ. 2560
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMonthlyPrint(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงานวิเคราะห์ความต้องการพัสดุประจำเดือน</span>
          </button>
          <button
            onClick={() => setShowAnnualPrint(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์แผนจัดหาประจำปีงบประมาณ</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มแผนจัดซื้อพัสดุ</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">ปีงบประมาณ</th>
                <th className="p-4">รายการพัสดุ / ครุภัณฑ์ที่เสนอขอจัดซื้อ</th>
                <th className="p-4">หมวดหมู่</th>
                <th className="p-4 text-center">จำนวน</th>
                <th className="p-4 text-right">งบประมาณรวม (บาท)</th>
                <th className="p-4 text-center">ความเร่งด่วน</th>
                <th className="p-4 text-center">สถานะแผนพัสดุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budgetPlans.map(plan => (
                <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-blue-600">{plan.fiscalYear}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{plan.itemName}</div>
                    <div className="text-[11px] text-slate-500">{plan.justification}</div>
                  </td>
                  <td className="p-4 text-slate-700">{plan.category}</td>
                  <td className="p-4 text-center font-semibold">{plan.estimatedQty}</td>
                  <td className="p-4 text-right font-bold text-emerald-600">฿{plan.totalBudget.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      plan.priority === 'สูงมาก' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {plan.priority}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">
                      {plan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Report Print Modal (Calculated Items needed for next month) */}
      {showMonthlyPrint && (
        <PrintDocumentModal
          title={`รายงานการวิเคราะห์ความจำเป็นในการจัดหาพัสดุประจำเดือน (เดือน ${selectedMonth})`}
          documentNo={`MON-CALC-${selectedMonth}`}
          date={new Date().toLocaleDateString('th-TH')}
          departmentName="งานพัสดุและบริหารทรัพย์สิน"
          contentData={[
            { label: 'วัตถุประสงค์', value: 'รายงานวิเคราะห์คำนวณความจำเป็นต้องจัดซื้อจัดจ้างพัสดุและครุภัณฑ์ทดแทนสำหรับเดือนถัดไป ตามระเบียบกระทรวงการคลังฯ' },
            { label: 'ประจำเดือน', value: selectedMonth },
            { label: 'ครุภัณฑ์ที่คำนวณแล้วควรจัดซื้อทดแทน', value: `${calculatedAssetsToReplace.length} รายการ (ชำรุด/ซ่อมบำรุงสูง)` },
            { label: 'วัสดุที่คำนวณแล้วควรจัดซื้อเติมสต็อก', value: `${calculatedInventoryToBuy.length} รายการ (ต่ำกว่าจุดสั่งซื้อ Min Qty)` }
          ]}
          tables={[
            {
              headers: ['ลำดับ', 'รหัสครุภัณฑ์', 'รายการครุภัณฑ์ที่คำนวณว่าควรจัดซื้อทดแทน', 'สถานะปัจจุบัน', 'ความจำเป็นเร่งด่วน'],
              rows: calculatedAssetsToReplace.length > 0 ? calculatedAssetsToReplace.map((a, idx) => [
                String(idx + 1),
                a.assetCode,
                a.name,
                a.status,
                'สูง (ควรจัดซื้อทดแทนในเดือนถัดไป)'
              ]) : [['-', '-', 'ไม่มีครุภัณฑ์ที่ต้องจัดซื้อทดแทนในรอบเดือนนี้', '-', '-']]
            },
            {
              headers: ['ลำดับ', 'รหัสวัสดุ', 'รายการวัสดุที่คำนวณว่าควรจัดซื้อเติมสต็อก', 'คงเหลือปัจจุบัน', 'จุดสั่งซื้อ (Min)', 'จำนวนที่ควรจัดซื้อ'],
              rows: calculatedInventoryToBuy.length > 0 ? calculatedInventoryToBuy.map((i, idx) => [
                String(idx + 1),
                i.itemCode,
                i.name,
                `${i.stockQty} ${i.unit}`,
                `${i.minQty} ${i.unit}`,
                `ควรจัดซื้อเพิ่ม ${(i.minQty * 2) - i.stockQty} ${i.unit}`
              ]) : [['-', '-', 'วัสดุทุกรายการอยู่ในเกณฑ์ปกติ', '-', '-', '-']]
            }
          ]}
          onClose={() => setShowMonthlyPrint(false)}
        />
      )}

      {/* Annual Fiscal Year Report Print Modal (Calculated annual procurement plan) */}
      {showAnnualPrint && (
        <PrintDocumentModal
          title={`รายงานวิเคราะห์และแผนการจัดหาพัสดุประจำปีงบประมาณ พ.ศ. ${selectedFiscalYear}`}
          documentNo={`FY-CALC-${selectedFiscalYear}`}
          date={new Date().toLocaleDateString('th-TH')}
          departmentName="กองคลังและพัสดุ (ตามระเบียบกระทรวงการคลังฯ พ.ศ. 2560)"
          contentData={[
            { label: 'ปีงบประมาณ', value: `พ.ศ. ${selectedFiscalYear} (1 ตุลาคม - 30 กันยายน)` },
            { label: 'เกณฑ์การคำนวณ', value: 'วิเคราะห์จากอัตราการเสื่อมสภาพ, สถิติการซ่อมบำรุง, และอัตราการเบิกใช้วัสดุรายปี' },
            { label: 'โครงการจัดซื้อจัดจ้างตามแผนประจำปี', value: `${budgetPlans.length} โครงการ` }
          ]}
          tables={[
            {
              headers: ['ลำดับ', 'รายการพัสดุ/ครุภัณฑ์ตามแผนจัดหาประจำปี', 'หมวดหมู่', 'จำนวน', 'งบประมาณรวม (บาท)', 'ความจำเป็นในการจัดซื้อ'],
              rows: budgetPlans.map((b, idx) => [
                String(idx + 1),
                b.itemName,
                b.category,
                String(b.estimatedQty),
                b.totalBudget.toLocaleString(),
                b.justification
              ])
            }
          ]}
          onClose={() => setShowAnnualPrint(false)}
        />
      )}

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">เพิ่มแผนจัดซื้อพัสดุประจำปี</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ปีงบประมาณ</label>
                  <input
                    type="text"
                    required
                    value={formData.fiscalYear}
                    onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ระดับความเร่งด่วน</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="สูงมาก">สูงมาก</option>
                    <option value="สูง">สูง</option>
                    <option value="ปานกลาง">ปานกลาง</option>
                    <option value="ต่ำ">ต่ำ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อรายการพัสดุที่เสนอขอจัดซื้อ</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น จัดซื้อเครื่องคอมพิวเตอร์แม่ข่ายสำรอง"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวน</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.estimatedQty}
                    onChange={(e) => setFormData({ ...formData, estimatedQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ราคาประมาณการต่อหน่วย</label>
                  <input
                    type="number"
                    required
                    value={formData.estimatedUnitPrice}
                    onChange={(e) => setFormData({ ...formData, estimatedUnitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เหตุผลความจำเป็น</label>
                <textarea
                  rows={3}
                  required
                  placeholder="ระบุเหตุผลความจำเป็นในการจัดซื้อตามระเบียบพัสดุฯ..."
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
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
                  บันทึกแผนจัดซื้อพัสดุ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
