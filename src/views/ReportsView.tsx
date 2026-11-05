import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Printer, CheckCircle } from 'lucide-react';
import { PrintDocumentModal } from '../components/PrintDocumentModal';

export const ReportsView: React.FC = () => {
  const { assets, inventoryItems, repairRequests, departments } = useApp();
  const [selectedReport, setSelectedReport] = useState('asset_registry');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const reportsList = [
    { id: 'asset_registry', title: '1. ทะเบียนคุมทรัพย์สิน (ตามระเบียบพัสดุฯ พ.ศ. 2560)', desc: 'แสดงรายการครุภัณฑ์ทั้งหมด พร้อมราคาทุน และสถานะปัจจุบัน' },
    { id: 'asset_dept', title: '2. รายงานครุภัณฑ์จำแนกตามหน่วยงาน', desc: 'สรุปรายการครุภัณฑ์แยกตามหน่วยงานที่รับผิดชอบอย่างครบถ้วน' },
    { id: 'asset_repair', title: '3. รายงานประวัติและสถานะการซ่อมบำรุง', desc: 'รายการแจ้งซ่อมครุภัณฑ์ ค่าใช้จ่ายอะไหล่ และผู้รับผิดชอบ' },
    { id: 'inventory_stock', title: '4. บัญชีวัสดุคงเหลือประจำปี', desc: 'แสดงรายการวัสดุคอมพิวเตอร์ จำนวนคงเหลือ และจุดสั่งซื้อ' },
    { id: 'depreciation_rep', title: '5. รายงานค่าเสื่อมราคาและมูลค่าสุทธิ', desc: 'บัญชีคำนวณค่าเสื่อมราคาตามวิธีเส้นตรง' },
  ];

  // Generate table rows based on selected report
  const getTableData = () => {
    if (selectedReport === 'asset_registry') {
      return {
        headers: ['ลำดับ', 'รหัสครุภัณฑ์', 'รายการ / ยี่ห้อ / รุ่น', 'หน่วยงาน', 'ราคาทุน (บาท)', 'สถานะ'],
        rows: assets.map((a, i) => [
          String(i + 1),
          a.assetCode,
          `${a.name} (${a.brand} ${a.model})`,
          departments.find(d => d.id === a.departmentId)?.name || '-',
          a.purchasePrice.toLocaleString(),
          a.status
        ])
      };
    } else if (selectedReport === 'asset_dept') {
      return {
        headers: ['ลำดับ', 'รหัสหน่วยงาน', 'ชื่อหน่วยงาน', 'จำนวนครุภัณฑ์ (รายการ)', 'มูลค่ารวม (บาท)'],
        rows: departments.map((d, i) => {
          const deptAssets = assets.filter(a => a.departmentId === d.id);
          const totalVal = deptAssets.reduce((sum, a) => sum + a.purchasePrice, 0);
          return [
            String(i + 1),
            d.code,
            d.name,
            String(deptAssets.length),
            totalVal.toLocaleString()
          ];
        })
      };
    } else if (selectedReport === 'asset_repair') {
      const usersList = (window as any).__USERS_CACHE__ || [];
      return {
        headers: ['ลำดับ', 'รหัสครุภัณฑ์', 'รายการครุภัณฑ์', 'วันที่ได้รับ (อายุใช้งาน)', 'ราคาทุน (บาท)', 'จำนวนครั้งซ่อม', 'ประวัติและรายละเอียดการซ่อมบำรุงทั้งหมด', 'ค่าใช้จ่ายซ่อมสะสมรวม (บาท)'],
        rows: assets.map((a, i) => {
          const assetRepairs = repairRequests.filter(r => r.assetId === a.id);
          const totalCost = assetRepairs.reduce((sum, r) => sum + (r.totalCost || 0), 0);
          const historyStr = assetRepairs.length > 0
            ? assetRepairs.map(r => {
                return `[${r.repairNo}] ${r.issueDescription} (วิธีแก้ไข: ${r.repairMethod || 'ซ่อมแซมบำรุง'}, ค่าใช้จ่าย: ฿${(r.totalCost || 0).toLocaleString()})`;
              }).join(' | ')
            : 'ไม่มีประวัติการซ่อม';

          return [
            String(i + 1),
            a.assetCode,
            `${a.name} (${a.brand || ''} ${a.model || ''})`.trim(),
            `${a.receivedDate || '-'} (${a.usefulLife || 5} ปี)`,
            (a.purchasePrice || 0).toLocaleString(),
            `${assetRepairs.length} ครั้ง`,
            historyStr,
            totalCost.toLocaleString()
          ];
        })
      };
    } else if (selectedReport === 'inventory_stock') {
      return {
        headers: ['ลำดับ', 'รหัสวัสดุ', 'ชื่อวัสดุ', 'คงเหลือ', 'หน่วยนับ', 'ราคาต่อหน่วย (บาท)'],
        rows: inventoryItems.map((item, i) => [
          String(i + 1),
          item.itemCode,
          item.name,
          String(item.stockQty),
          item.unit,
          item.unitPrice.toLocaleString()
        ])
      };
    } else {
      return {
        headers: ['ลำดับ', 'รหัส', 'ชื่อครุภัณฑ์', 'ราคาทุน', 'ค่าเสื่อมสะสม', 'มูลค่าสุทธิ'],
        rows: assets.map((a, i) => {
          const annualDep = (a.purchasePrice - a.salvageValue) / a.usefulLife;
          const acc = Math.min(a.purchasePrice - a.salvageValue, annualDep * 2);
          const bv = Math.max(a.salvageValue, a.purchasePrice - acc);
          return [
            String(i + 1),
            a.assetCode,
            a.name,
            a.purchasePrice.toLocaleString(),
            acc.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            bv.toLocaleString(undefined, { maximumFractionDigits: 0 })
          ];
        })
      };
    }
  };

  const currentTable = getTableData();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">รายงานและสถิติภาครัฐ</h2>
          <p className="text-xs text-slate-500 mt-1">
            รายงานตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 แสดงรายการครบถ้วน
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportsList.map(rep => (
          <div 
            key={rep.id}
            onClick={() => setSelectedReport(rep.id)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white flex flex-col justify-between ${
              selectedReport === rep.id ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FileText className={`w-5 h-5 ${selectedReport === rep.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {selectedReport === rep.id && <CheckCircle className="w-4 h-4 text-blue-600" />}
              </div>
              <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{rep.desc}</p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedReport(rep.id);
                  setShowPrintModal(true);
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์รายงานตามระเบียบพัสดุฯ</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showPrintModal && (
        <PrintDocumentModal
          title={reportsList.find(r => r.id === selectedReport)?.title || 'รายงานทางราชการ'}
          documentNo={`DOC-${Math.floor(1000 + Math.random() * 9000)}`}
          date={new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          departmentName="กลุ่มงานพัสดุและบริหารทรัพย์สิน"
          contentData={[
            { label: 'ประเภทรายงาน', value: reportsList.find(r => r.id === selectedReport)?.title || '' },
            { label: 'ระเบียบอ้างอิง', value: 'ระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560' },
            { label: 'วันที่จัดพิมพ์', value: new Date().toLocaleString('th-TH') }
          ]}
          tables={[currentTable]}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
