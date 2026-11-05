import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calculator, Printer, Download } from 'lucide-react';
import { PrintDocumentModal } from '../components/PrintDocumentModal';

export const DepreciationView: React.FC = () => {
  const { assets, departments } = useApp();
  const [showPrintModal, setShowPrintModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ระบบคำนวณค่าเสื่อมราคาครุภัณฑ์</h2>
          <p className="text-xs text-slate-500 mt-1">
            คำนวณค่าเสื่อมราคาตามวิธีเส้นตรง (Straight-Line Method) พร้อมมูลค่าตามบัญชีคงเหลือ (Book Value)
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ / ส่งออก PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">รหัสครุภัณฑ์</th>
                <th className="p-4">ชื่อครุภัณฑ์</th>
                <th className="p-4">วันที่ได้รับ</th>
                <th className="p-4 text-right">ราคาทุน (บาท)</th>
                <th className="p-4 text-center">อายุการใช้งาน (ปี)</th>
                <th className="p-4 text-right">ค่าเสื่อมต่อปี</th>
                <th className="p-4 text-right">ค่าเสื่อมสะสม</th>
                <th className="p-4 text-right">มูลค่าสุทธิ (Book Value)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map(asset => {
                const annualDep = (asset.purchasePrice - asset.salvageValue) / asset.usefulLife;
                const ageYears = 2; // simulated elapsed years
                const accumulatedDep = Math.min(asset.purchasePrice - asset.salvageValue, annualDep * ageYears);
                const bookValue = Math.max(asset.salvageValue, asset.purchasePrice - accumulatedDep);

                return (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-blue-600">{asset.assetCode}</td>
                    <td className="p-4 font-bold text-slate-900">{asset.name}</td>
                    <td className="p-4 text-slate-600">{asset.receivedDate}</td>
                    <td className="p-4 text-right font-semibold">฿{asset.purchasePrice.toLocaleString()}</td>
                    <td className="p-4 text-center">{asset.usefulLife} ปี</td>
                    <td className="p-4 text-right text-slate-600">฿{annualDep.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right text-amber-600 font-semibold">฿{accumulatedDep.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right text-emerald-600 font-bold">฿{bookValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showPrintModal && (
        <PrintDocumentModal
          title="รายงานบัญชีค่าเสื่อมราคาครุภัณฑ์"
          documentNo={`DEP-${Math.floor(1000 + Math.random() * 9000)}`}
          date={new Date().toLocaleDateString('th-TH')}
          departmentName="กลุ่มงานการเงินและบัญชี"
          contentData={[
            { label: 'ประเภทบัญชี', value: 'ค่าเสื่อมราคาครุภัณฑ์ (Straight-Line Method)' },
            { label: 'จำนวนรายการครุภัณฑ์', value: `${assets.length} รายการ` },
            { label: 'ราคาทุนรวม', value: `฿${assets.reduce((s, a) => s + a.purchasePrice, 0).toLocaleString()} บาท` }
          ]}
          tables={[
            {
              headers: ['รหัส', 'ชื่อครุภัณฑ์', 'ราคาทุน', 'ค่าเสื่อมสะสม', 'มูลค่าสุทธิ'],
              rows: assets.map(a => {
                const annualDep = (a.purchasePrice - a.salvageValue) / a.usefulLife;
                const acc = Math.min(a.purchasePrice - a.salvageValue, annualDep * 2);
                const bv = Math.max(a.salvageValue, a.purchasePrice - acc);
                return [
                  a.assetCode,
                  a.name,
                  `฿${a.purchasePrice.toLocaleString()}`,
                  `฿${acc.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  `฿${bv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                ];
              })
            }
          ]}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
