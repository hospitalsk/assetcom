import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileSpreadsheet, Printer, Calendar } from 'lucide-react';
import { PrintDocumentModal } from '../components/PrintDocumentModal';

export const BudgetPlanningView: React.FC = () => {
  const { repairRequests, assets, inventoryItems } = useApp();
  
  // Calculate current and previous Thai fiscal year dynamically
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  const currentFiscalYearInt = currentMonth >= 10 ? currentYear + 1 + 543 : currentYear + 543;
  const prevFiscalYearInt = currentFiscalYearInt - 1;

  // Fiscal year dropdown options: ONLY previous fiscal year and current fiscal year
  const fiscalYearOptions = [String(prevFiscalYearInt), String(currentFiscalYearInt)];

  // Helper to get 12 months (Oct to Sep) for a given Thai Fiscal Year
  const getFYMonths = (fyThai: number) => {
    const endYearCE = fyThai - 543;
    const startYearCE = endYearCE - 1;
    const months: string[] = [];
    // Oct, Nov, Dec of startYearCE
    for (let m = 10; m <= 12; m++) {
      months.push(`${startYearCE}-${String(m).padStart(2, '0')}`);
    }
    // Jan to Sep of endYearCE
    for (let m = 1; m <= 9; m++) {
      months.push(`${endYearCE}-${String(m).padStart(2, '0')}`);
    }
    return months;
  };

  // Month options strictly for previous fiscal year and current fiscal year
  const monthOptions = [...getFYMonths(prevFiscalYearInt), ...getFYMonths(currentFiscalYearInt)];

  // Print modal states
  const [showMonthlyPrint, setShowMonthlyPrint] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[monthOptions.length - 1] || '2025-03');

  const [showAnnualPrint, setShowAnnualPrint] = useState(false);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(String(currentFiscalYearInt));

  const formatThaiMonthYear = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const monthsThai = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthIdx = parseInt(month, 10) - 1;
    const thaiMonthName = monthsThai[monthIdx] || '';
    const thaiYear = parseInt(year, 10) + 543;
    return `${thaiMonthName} ${thaiYear}`;
  };

  // CALCULATED AUTOMATIC PROCUREMENT NECESSITY ANALYSIS BASED ON COST-EFFECTIVENESS
  const analyzedAssets = assets.map(asset => {
    const assetRepairs = repairRequests.filter(r => r.assetId === asset.id);
    const accumulatedRepairCost = assetRepairs.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const purchasePrice = asset.purchasePrice || 0;
    const repairRatio = purchasePrice > 0 ? (accumulatedRepairCost / purchasePrice) * 100 : 0;
    
    const acqDate = asset.receivedDate ? new Date(asset.receivedDate) : new Date();
    const currentDate = new Date();
    const ageYears = Math.max(0, Math.floor((currentDate.getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
    const usefulLife = asset.usefulLife || 5;
    
    const isHighRepairCost = repairRatio >= 50;
    const isExceededUsefulLife = ageYears >= usefulLife;
    const isDamaged = asset.status === 'ชำรุด' || asset.status === 'กำลังซ่อม';

    let recommendation = 'อยู่ในเกณฑ์คุ้มค่าที่จะใช้งานต่อ';
    let isNecessary = false;

    if (isHighRepairCost) {
      recommendation = `ค่าซ่อมสะสมสูงเกิน 50% ของราคาทุน (${repairRatio.toFixed(1)}%) - ควรจัดซื้อทดแทน`;
      isNecessary = true;
    } else if (isExceededUsefulLife) {
      recommendation = `อายุใช้งาน ${ageYears} ปี เกินเกณฑ์ (${usefulLife} ปี) - สภาพเสื่อมราคา ควรจัดซื้อทดแทน`;
      isNecessary = true;
    } else if (isDamaged) {
      recommendation = `ชำรุดบ่อย/ไม่อยู่ในสภาพพร้อมใช้งาน - ควรจัดหาทดแทน`;
      isNecessary = true;
    }

    return {
      asset,
      accumulatedRepairCost,
      purchasePrice,
      repairRatio,
      ageYears,
      usefulLife,
      recommendation,
      isNecessary
    };
  });

  // Assets that calculated as necessary for replacement
  const assetsNeedingReplacement = analyzedAssets.filter(item => item.isNecessary);

  // Inventory materials that calculated as needing replenishment
  const inventoryNeedingReplenishment = inventoryItems.filter(item => item.stockQty <= item.minQty);

  // AUTOMATIC PROCUREMENTS TABLE ITEMS: DERIVED 100% FROM REAL COST-EFFECTIVENESS CALCULATIONS
  const calculatedProcurementItems = [
    ...assetsNeedingReplacement.map(item => ({
      id: `ast-need-${item.asset.id}`,
      type: 'ครุภัณฑ์' as const,
      code: item.asset.assetCode,
      name: item.asset.name,
      category: 'ครุภัณฑ์',
      qty: 1,
      unitPrice: item.purchasePrice || 0,
      totalCost: item.purchasePrice || 0,
      reason: item.recommendation,
      priority: item.repairRatio >= 50 ? 'สูงมาก' : 'สูง'
    })),
    ...inventoryNeedingReplenishment.map(item => ({
      id: `inv-need-${item.id}`,
      type: 'วัสดุ' as const,
      code: item.itemCode,
      name: item.name,
      category: 'วัสดุสำรองคลัง',
      qty: Math.max(1, (item.minQty * 2) - item.stockQty),
      unitPrice: item.unitPrice || 0,
      totalCost: Math.max(1, (item.minQty * 2) - item.stockQty) * (item.unitPrice || 0),
      reason: `สต็อกคงเหลือ (${item.stockQty} ${item.unit}) ต่ำกว่าจุดสั่งซื้อ Min (${item.minQty} ${item.unit})`,
      priority: 'สูง'
    }))
  ];

  return (
    <div className="space-y-6 font-['Sarabun',sans-serif]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ระบบวางแผนงบประมาณและจัดหาพัสดุประจำปี</h2>
          <p className="text-xs text-slate-500 mt-1">
            วิเคราะห์และคำนวณความจำเป็นในการจัดซื้อจัดจ้างครุภัณฑ์และวัสดุจากความคุ้มค่าจริง ตามระเบียบกระทรวงการคลัง พ.ศ. 2560
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector for Monthly Necessity Report */}
          <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 ml-1" />
            <span className="text-xs font-bold text-slate-700">เลือกเดือน:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-2 py-1 outline-none text-slate-800"
            >
              {monthOptions.map(m => (
                <option key={m} value={m}>{formatThaiMonthYear(m)}</option>
              ))}
            </select>
            <button
              onClick={() => setShowMonthlyPrint(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์รายงานความจำเป็นประจำเดือน</span>
            </button>
          </div>

          {/* Year Selector for Annual Necessity Report */}
          <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 ml-1">เลือกปีงบ:</span>
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-2 py-1 outline-none text-slate-800"
            >
              {fiscalYearOptions.map(y => (
                <option key={y} value={y}>พ.ศ. {y}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAnnualPrint(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์แผนจัดหาประจำปี</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>รายการแผนการจัดซื้อครุภัณฑ์และวัสดุประจำปี</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">คำนวณจากความคุ้มค่าจริง ทั้งหมด {calculatedProcurementItems.length} รายการ</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">ปีงบประมาณ</th>
                <th className="p-4">รหัส / รายการครุภัณฑ์และวัสดุที่ต้องจัดซื้อ</th>
                <th className="p-4">ประเภท</th>
                <th className="p-4 text-center">จำนวน</th>
                <th className="p-4 text-right">งบประมาณประมาณการ (บาท)</th>
                <th className="p-4 text-center">ความเร่งด่วน</th>
                <th className="p-4">ผลการวิเคราะห์ความคุ้มค่า & เหตุผลจำเป็น</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculatedProcurementItems.length > 0 ? calculatedProcurementItems.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-blue-600">{selectedFiscalYear}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-500">รหัส: {item.code}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.type === 'ครุภัณฑ์' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-slate-800">{item.qty}</td>
                  <td className="p-4 text-right font-bold text-emerald-600">฿{item.totalCost.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.priority === 'สูงมาก' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700 max-w-xs text-[11px] leading-relaxed">
                    {item.reason}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    ไม่พบพัสดุหรือครุภัณฑ์ที่เข้าเกณฑ์ต้องจัดซื้อทดแทน (ทรัพย์สินทุกรายการอยู่ในเกณฑ์คุ้มค่า)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Procurement Necessity Analysis Report Print Modal */}
      {showMonthlyPrint && (
        <PrintDocumentModal
          title={`รายงานการวิเคราะห์ความจำเป็นในการจัดหาครุภัณฑ์และวัสดุประจำเดือน ${formatThaiMonthYear(selectedMonth)}`}
          documentNo={`NECESS-ANALYSIS-${selectedMonth}`}
          date={new Date().toLocaleDateString('th-TH')}
          departmentName="งานพัสดุและบริหารทรัพย์สิน (วิเคราะห์ตามความคุ้มค่าจริง)"
          contentData={[
            { label: 'วัตถุประสงค์', value: 'วิเคราะห์ความจำเป็นในการจัดซื้อจัดจ้างครุภัณฑ์และวัสดุ จากอัตราการเสื่อมสภาพ ค่าใช้จ่ายในการซ่อมบำรุงสะสม และอายุการใช้งานจริง' },
            { label: 'ประจำเดือน', value: formatThaiMonthYear(selectedMonth) },
            { label: 'ครุภัณฑ์ที่มีความจำเป็นต้องจัดหาทดแทน', value: `${assetsNeedingReplacement.length} รายการ (พิจารณาจากค่าซ่อมสะสม > 50% หรือเกินอายุการใช้งาน)` },
            { label: 'วัสดุที่จำเป็นต้องจัดหาเติมสต็อก', value: `${inventoryNeedingReplenishment.length} รายการ (ต่ำกว่าระดับสำรอง Min Qty)` }
          ]}
          tables={[
            {
              headers: ['ลำดับ', 'รหัสครุภัณฑ์', 'รายการครุภัณฑ์', 'ราคาทุน (บาท)', 'อายุใช้งาน (ปี / เกณฑ์)', 'ค่าซ่อมสะสม (บาท)', 'สัดส่วนค่าซ่อม (%)', 'ผลการวิเคราะห์ความคุ้มค่า & ข้อเสนอแนะ'],
              rows: assetsNeedingReplacement.length > 0 ? assetsNeedingReplacement.map((item, idx) => [
                String(idx + 1),
                item.asset.assetCode,
                item.asset.name,
                `฿${item.purchasePrice.toLocaleString()}`,
                `${item.ageYears} ปี / เกณฑ์ ${item.usefulLife} ปี`,
                `฿${item.accumulatedRepairCost.toLocaleString()}`,
                `${item.repairRatio.toFixed(1)}%`,
                item.recommendation
              ]) : [['-', '-', 'ไม่มีครุภัณฑ์ที่ต้องจัดซื้อทดแทนในรอบเดือนนี้ (อยู่ในเกณฑ์คุ้มค่าทั้งหมด)', '-', '-', '-', '-', '-']]
            },
            {
              headers: ['ลำดับ', 'รหัสวัสดุ', 'รายการวัสดุสำรองคลัง', 'คงเหลือปัจจุบัน', 'ระดับสำรองขั้นต่ำ (Min)', 'ปริมาณที่เสนอจัดหาเพิ่ม'],
              rows: inventoryNeedingReplenishment.length > 0 ? inventoryNeedingReplenishment.map((i, idx) => [
                String(idx + 1),
                i.itemCode,
                i.name,
                `${i.stockQty} ${i.unit}`,
                `${i.minQty} ${i.unit}`,
                `เสนอจัดหาเพิ่ม ${Math.max(1, (i.minQty * 2) - i.stockQty)} ${i.unit}`
              ]) : [['-', '-', 'วัสดุทุกรายการมีปริมาณคงเหลือเพียงพอ', '-', '-', '-']]
            }
          ]}
          onClose={() => setShowMonthlyPrint(false)}
        />
      )}

      {/* Annual Fiscal Year Report Print Modal */}
      {showAnnualPrint && (
        <PrintDocumentModal
          title={`รายงานวิเคราะห์และแผนการจัดหาครุภัณฑ์และวัสดุประจำปีงบประมาณ พ.ศ. ${selectedFiscalYear}`}
          documentNo={`FY-CALC-${selectedFiscalYear}`}
          date={new Date().toLocaleDateString('th-TH')}
          departmentName="กองคลังและพัสดุ (ตามระเบียบกระทรวงการคลังฯ พ.ศ. 2560)"
          contentData={[
            { label: 'ปีงบประมาณ', value: `พ.ศ. ${selectedFiscalYear} (1 ตุลาคม - 30 กันยายน)` },
            { label: 'เกณฑ์การคำนวณ', value: 'วิเคราะห์จากอัตราการเสื่อมสภาพ, สถิติการซ่อมบำรุง, และอัตราการเบิกใช้วัสดุรายปีตามความคุ้มค่าจริง' },
            { label: 'รายการจัดหาตามผลวิเคราะห์ความคุ้มค่า', value: `${calculatedProcurementItems.length} รายการ` }
          ]}
          tables={[
            {
              headers: ['ลำดับ', 'รายการครุภัณฑ์และวัสดุตามแผนจัดหาประจำปี', 'ประเภท', 'จำนวน', 'งบประมาณประมาณการ (บาท)', 'ผลการวิเคราะห์ความจำเป็น & เหตุผล'],
              rows: calculatedProcurementItems.map((b, idx) => [
                String(idx + 1),
                b.name,
                b.category,
                String(b.qty),
                `฿${b.totalCost.toLocaleString()}`,
                b.reason
              ])
            }
          ]}
          onClose={() => setShowAnnualPrint(false)}
        />
      )}
    </div>
  );
};
