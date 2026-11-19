import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Printer, CheckCircle } from 'lucide-react';
import { PrintDocumentModal, PrintableTable } from '../components/PrintDocumentModal';

export const ReportsView: React.FC = () => {
  const { assets, inventoryItems, repairRequests, departments } = useApp();
  const [selectedReport, setSelectedReport] = useState('asset_registry');
  const [printScope, setPrintScope] = useState<'single' | 'all'>('single');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const reportsList = [
    { id: 'asset_registry', title: '1. ทะเบียนคุมทรัพย์สิน (ตามระเบียบพัสดุฯ พ.ศ. 2560)', desc: 'แสดงรายการครุภัณฑ์ทั้งหมด พร้อมราคาทุน และสถานะปัจจุบัน' },
    { id: 'asset_dept', title: '2. รายงานครุภัณฑ์จำแนกตามหน่วยงาน', desc: 'สรุปรายการครุภัณฑ์แยกตามหน่วยงานที่รับผิดชอบอย่างครบถ้วน' },
    { id: 'asset_repair', title: '3. รายงานประวัติและสถานะการซ่อมบำรุง', desc: 'รายการแจ้งซ่อมครุภัณฑ์ ค่าใช้จ่ายอะไหล่ และผู้รับผิดชอบ' },
    { id: 'inventory_stock', title: '4. บัญชีวัสดุคงเหลือประจำปี', desc: 'แสดงรายการวัสดุคอมพิวเตอร์ จำนวนคงเหลือ และจุดสั่งซื้อ' },
    { id: 'depreciation_rep', title: '5. รายงานค่าเสื่อมราคาและมูลค่าสุทธิ', desc: 'บัญชีคำนวณค่าเสื่อมราคาตามวิธีเส้นตรง' },
  ];

  // Generate table rows based on report ID
  const getReportTableById = (reportId: string): PrintableTable => {
    const repMeta = reportsList.find((r) => r.id === reportId);
    if (reportId === 'asset_registry') {
      return {
        title: repMeta?.title,
        headers: ['ลำดับ', 'รหัสครุภัณฑ์', 'รายการ / ยี่ห้อ / รุ่น', 'หน่วยงาน', 'ราคาทุน (บาท)', 'สถานะ'],
        rows: assets.map((a, i) => [
          String(i + 1),
          a.assetCode,
          `${a.name} (${a.brand} ${a.model})`,
          departments.find((d) => d.id === a.departmentId)?.name || '-',
          a.purchasePrice.toLocaleString(),
          a.status
        ])
      };
    } else if (reportId === 'asset_dept') {
      return {
        title: repMeta?.title,
        headers: ['ลำดับ', 'รหัสหน่วยงาน', 'ชื่อหน่วยงาน', 'จำนวนครุภัณฑ์ (รายการ)', 'มูลค่ารวม (บาท)'],
        rows: departments.map((d, i) => {
          const deptAssets = assets.filter((a) => a.departmentId === d.id);
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
    } else if (reportId === 'asset_repair') {
      return {
        title: repMeta?.title,
        headers: ['ลำดับ', 'รหัสครุภัณฑ์', 'รายการครุภัณฑ์', 'วันที่ได้รับ (อายุใช้งาน)', 'ราคาทุน (บาท)', 'จำนวนครั้งซ่อม', 'ประวัติและรายละเอียดการซ่อมบำรุงทั้งหมด', 'ค่าใช้จ่ายซ่อมสะสมรวม (บาท)'],
        rows: assets.map((a, i) => {
          const assetRepairs = repairRequests.filter((r) => r.assetId === a.id);
          const totalCost = assetRepairs.reduce((sum, r) => sum + (r.totalCost || 0), 0);
          const historyStr =
            assetRepairs.length > 0
              ? assetRepairs
                  .map((r) => `[${r.repairNo}] ${r.issueDescription} (วิธีแก้ไข: ${r.repairMethod || 'ซ่อมแซมบำรุง'}, ค่าใช้จ่าย: ฿${(r.totalCost || 0).toLocaleString()})`)
                  .join(' | ')
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
    } else if (reportId === 'inventory_stock') {
      return {
        title: repMeta?.title,
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
        title: repMeta?.title,
        headers: ['ลำดับ', 'รหัส', 'ชื่อครุภัณฑ์', 'ราคาทุน', 'ค่าเสื่อมสะสม', 'มูลค่าสุทธิ'],
        rows: assets.map((a, i) => {
          const annualDep = (a.purchasePrice - a.salvageValue) / (a.usefulLife || 1);
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

  const modalTitle =
    printScope === 'all'
      ? 'รายงานและสถิติพัสดุภาครัฐ (รวมทุกรายงาน)'
      : reportsList.find((r) => r.id === selectedReport)?.title || 'รายงานทางราชการ';

  const modalTables: PrintableTable[] =
    printScope === 'all'
      ? reportsList.map((r) => getReportTableById(r.id))
      : [{ ...getReportTableById(selectedReport), title: undefined }];

  return (
    <>
      <div className={`space-y-6 ${showPrintModal ? 'print:hidden' : ''}`}>
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">รายงานและสถิติภาครัฐ</h2>
            <p className="text-xs text-slate-500 mt-1">
              รายงานตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 • ใช้ HTML + CSS Print / Print to PDF ข้อความคมชัดแบบ Vector
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPrintScope('all');
              setShowPrintModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200 cursor-pointer shrink-0 self-start md:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงานทั้งหมด ({reportsList.length} รายงาน)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportsList.map((rep) => (
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReport(rep.id);
                    setPrintScope('single');
                    setShowPrintModal(true);
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์เอกสาร / Print to PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPrintModal && (
        <PrintDocumentModal
          title={modalTitle}
          documentNo={`DOC-${new Date().getFullYear() + 543}-${printScope === 'all' ? 'ALL' : '01'}`}
          date={new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          departmentName="กลุ่มงานพัสดุและบริหารทรัพย์สิน"
          contentData={[
            { label: 'ประเภทรายงาน', value: modalTitle },
            { label: 'ระเบียบอ้างอิง', value: 'ระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560' },
            { label: 'รูปแบบเอกสาร', value: 'HTML + CSS Print / Browser Print to PDF (Vector A4)' },
            { label: 'วันที่จัดพิมพ์', value: new Date().toLocaleString('th-TH') }
          ]}
          tables={modalTables}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </>
  );
};

