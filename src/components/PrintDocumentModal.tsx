import React from 'react';
import { useApp } from '../context/AppContext';
import { Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PrintDocumentModalProps {
  title: string;
  documentNo: string;
  date: string;
  departmentName: string;
  contentData: { label: string; value: string }[];
  tables?: { headers: string[]; rows: string[][] }[];
  onClose: () => void;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  title,
  documentNo,
  date,
  departmentName,
  contentData,
  tables,
  onClose,
}) => {
  const { settings, currentUser, users } = useApp();

  // Find user with role 'IT Officer' (or fallback to current user if IT Officer / fallback user)
  const itOfficerUser = users.find(u => u.role === 'IT Officer') 
    || users.find(u => u.position.toLowerCase().includes('คอมพิวเตอร์') || u.position.toLowerCase().includes('it'))
    || currentUser;

  // Find user with role 'Supply Officer'
  const supplyOfficerUser = users.find(u => u.role === 'Supply Officer')
    || users.find(u => u.position.toLowerCase().includes('พัสดุ'))
    || { name: 'นายวิชัย พัสดุดี', position: 'เจ้าพนักงานพัสดุชำนาญงาน' };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-4 sm:p-8 relative animate-in fade-in zoom-in-95 my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
        {/* Control Buttons (No Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 mb-6 gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0"></span>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
              รายงานตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560
            </h3>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document A4 Layout (Strict Official Government Format) */}
        <div className="printable-document bg-white p-4 sm:p-8 border border-slate-200 shadow-xs print:border-none print:shadow-none print:p-0 font-['Sarabun',sans-serif] text-slate-900 leading-relaxed">
          {/* Organization Logo & Official Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="flex justify-center">
              <img 
                src={settings.logoUrl || './assets/aistudio/Logo_SK_26693d5e.png'} 
                alt="Hospital Logo" 
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain mx-auto"
              />
            </div>
            <div className="text-sm sm:text-base font-bold tracking-wide text-slate-800">{settings.organizationName}</div>
            <div className="text-base sm:text-lg font-bold text-slate-900 underline underline-offset-4 pt-1 break-words">{title}</div>
          </div>

          {/* Document Meta Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start text-xs font-medium mb-6 px-1 gap-2">
            <div className="space-y-1">
              <div><span className="font-bold">หน่วยงาน:</span> {departmentName}</div>
              <div><span className="font-bold">วันที่:</span> {date}</div>
            </div>
            <div className="space-y-1 sm:text-right">
              <div><span className="font-bold">เลขที่เอกสาร:</span> {documentNo}</div>
              <div><span className="font-bold">ปีงบประมาณ:</span> {settings.fiscalYear}</div>
            </div>
          </div>

          {/* Content Summary Grid */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {contentData.map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-slate-500 font-semibold">{item.label}</span>
                <span className="text-slate-900 font-bold mt-0.5 break-words">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Complete Itemized Tables */}
          {tables && tables.map((tbl, tIdx) => (
            <div key={tIdx} className="mb-6 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-800">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold">
                    {tbl.headers.map((h, hIdx) => (
                      <th key={hIdx} className="border border-slate-800 p-2 text-center break-words">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tbl.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className={`border border-slate-800 p-2 break-words ${cIdx === 0 ? 'text-center' : ''}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Official Signatures according to Procurement Regulation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 mt-8 border-t border-slate-400 text-center text-xs page-break-inside-avoid">
            <div className="flex flex-col items-center justify-center space-y-2">
              <QRCodeSVG value={`DOC-${documentNo}`} size={56} level="M" />
              <span className="text-[10px] text-slate-500">ตรวจสอบความถูกต้อง</span>
            </div>
            <div className="space-y-12">
              <div className="font-semibold text-slate-800">ลงชื่อ......................................................ผู้จัดทำ</div>
              <div>({itOfficerUser.name})<br/><span className="text-[11px] text-slate-600">{itOfficerUser.position}</span></div>
            </div>
            <div className="space-y-12">
              <div className="font-semibold text-slate-800">ลงชื่อ......................................................เจ้าหน้าที่พัสดุ</div>
              <div>({supplyOfficerUser.name})<br/><span className="text-[11px] text-slate-600">{supplyOfficerUser.position}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
