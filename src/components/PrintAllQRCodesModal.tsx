import React, { useState } from 'react';
import { Asset, Department } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, CheckSquare, Square, Filter, LayoutGrid, RefreshCw } from 'lucide-react';
import { showSwalAlert } from '../utils/swal';

interface PrintAllQRCodesModalProps {
  assets: Asset[];
  departments: Department[];
  organizationName: string;
  logoUrl: string;
  onClose: () => void;
  onSelectAsset?: (asset: Asset) => void;
}

export const PrintAllQRCodesModal: React.FC<PrintAllQRCodesModalProps> = ({
  assets,
  departments,
  organizationName,
  logoUrl,
  onClose,
}) => {
  // State for filtering & selection
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(3);
  const [qrSize, setQrSize] = useState<number>(90);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(
    () => new Set(assets.map((a) => a.id))
  );

  // Filtered assets by department
  const departmentFilteredAssets = assets.filter((ast) => {
    if (selectedDeptId === 'ALL') return true;
    return ast.departmentId === selectedDeptId;
  });

  // Assets that are both filtered by dept and selected by user for printing
  const printableAssets = departmentFilteredAssets.filter((ast) =>
    selectedAssetIds.has(ast.id)
  );

  // Toggle single asset selection
  const toggleSelectAsset = (id: string) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all in current filter
  const handleSelectAll = () => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      departmentFilteredAssets.forEach((ast) => next.add(ast.id));
      return next;
    });
  };

  // Deselect all in current filter
  const handleDeselectAll = () => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      departmentFilteredAssets.forEach((ast) => next.delete(ast.id));
      return next;
    });
  };

  const handlePrint = () => {
    if (printableAssets.length === 0) {
      showSwalAlert('warning', 'ยังไม่ได้เลือกรายการ', 'กรุณาเลือกอย่างน้อย 1 รายการเพื่อพิมพ์สติกเกอร์');
      return;
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 font-['Sarabun',sans-serif]">
      {/* Print Specific CSS Rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-sheet, #printable-qr-sheet * {
            visibility: visible !important;
          }
          #printable-qr-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .no-print, .print\\:hidden {
            display: none !important;
          }
          .page-break-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 border border-slate-100">
        {/* Modal Top Control Toolbar - Hidden on Print */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 space-y-3 shrink-0 no-print">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-600 text-white">
                  A4 Sticker Sheet
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  แผ่นพิมพ์สติกเกอร์ QR Code ครุภัณฑ์ ({printableAssets.length}/{departmentFilteredAssets.length} ชิ้น)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ปรับแต่งจำนวนคอลัมน์ กรองหน่วยงาน และเลือกสติกเกอร์ที่ต้องการพิมพ์ลงกระดาษ A4 ได้ทันที
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                disabled={printableAssets.length === 0}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-200 flex items-center space-x-2 active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ พิมพ์สติกเกอร์ที่เลือก ({printableAssets.length})</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                title="ปิดหน้าต่าง"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Interactive Tool Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
            {/* Filter by Department */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-bold text-slate-700 shrink-0">หน่วยงาน:</span>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">ทุกหน่วยงาน ({assets.length} รายการ)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({assets.filter((a) => a.departmentId === d.id).length} ชิ้น)
                  </option>
                ))}
              </select>
            </div>

            {/* Column Layout Controls */}
            <div className="flex items-center space-x-2">
              <LayoutGrid className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-bold text-slate-700">จัดคอลัมน์:</span>
              <div className="flex bg-slate-200 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setGridColumns(2); setQrSize(110); }}
                  className={`px-3 py-1 rounded-lg font-extrabold text-[11px] transition-all ${
                    gridColumns === 2 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2 คอลัมน์ (ใหญ่)
                </button>
                <button
                  type="button"
                  onClick={() => { setGridColumns(3); setQrSize(90); }}
                  className={`px-3 py-1 rounded-lg font-extrabold text-[11px] transition-all ${
                    gridColumns === 3 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3 คอลัมน์ (A4 มาตรฐาน)
                </button>
                <button
                  type="button"
                  onClick={() => { setGridColumns(4); setQrSize(75); }}
                  className={`px-3 py-1 rounded-lg font-extrabold text-[11px] transition-all ${
                    gridColumns === 4 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  4 คอลัมน์ (กะทัดรัด)
                </button>
              </div>
            </div>

            {/* Selection Toggles */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold flex items-center space-x-1 transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>เลือกทั้งหมด</span>
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold flex items-center space-x-1 transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                <span>ล้างการเลือก</span>
              </button>
            </div>
          </div>
        </div>

        {/* Print Printable Sheet Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100">
          <div
            id="printable-qr-sheet"
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md max-w-[210mm] mx-auto min-h-[297mm] print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {/* Header banner on sheet */}
            <div className="text-center pb-4 mb-6 border-b border-slate-200 print:mb-4">
              <div className="flex items-center justify-center space-x-2">
                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                <span className="text-sm font-black text-slate-900">{organizationName}</span>
              </div>
              <div className="text-xs font-bold text-slate-600 mt-1">
                ทะเบียนสติกเกอร์ QR Code ครุภัณฑ์ ({printableAssets.length} รายการ)
              </div>
            </div>

            {printableAssets.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2 no-print">
                <Filter className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-600">ไม่มีรายการสติกเกอร์ที่เลือกพิมพ์</div>
                <p>กรุณากดปุ่ม "เลือกทั้งหมด" หรือคลิกเลือกสติกเกอร์ที่ต้องการพิมพ์เพื่อแสดงผล</p>
                <button
                  onClick={handleSelectAll}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold inline-flex items-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>เลือกทุกสติกเกอร์</span>
                </button>
              </div>
            ) : (
              /* Sticker Responsive Grid */
              <div
                className={`grid gap-4 print:gap-3 ${
                  gridColumns === 2
                    ? 'grid-cols-2 print:grid-cols-2'
                    : gridColumns === 4
                    ? 'grid-cols-2 sm:grid-cols-4 print:grid-cols-4'
                    : 'grid-cols-2 sm:grid-cols-3 print:grid-cols-3'
                }`}
              >
                {departmentFilteredAssets.map((asset) => {
                  const isSelected = selectedAssetIds.has(asset.id);
                  const dept = departments.find((d) => d.id === asset.departmentId);

                  // If in print mode, hide items that are unselected
                  if (!isSelected) {
                    return (
                      <div
                        key={asset.id}
                        onClick={() => toggleSelectAsset(asset.id)}
                        className="no-print border-2 border-dashed border-slate-200 p-3 rounded-2xl bg-slate-50/60 flex flex-col items-center justify-center text-center opacity-50 hover:opacity-100 transition-all cursor-pointer group"
                      >
                        <Square className="w-5 h-5 text-slate-400 mb-1 group-hover:text-blue-600" />
                        <div className="text-[11px] font-bold text-slate-600">{asset.assetCode}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{asset.name}</div>
                        <span className="text-[9px] text-blue-600 font-bold mt-1">คลิกเพื่อเลือกพิมพ์</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={asset.id}
                      onClick={() => toggleSelectAsset(asset.id)}
                      className="page-break-avoid relative border-2 border-slate-300 hover:border-blue-500 p-3 rounded-2xl bg-white shadow-2xs flex flex-col items-center text-center space-y-2 cursor-pointer transition-all print:border-slate-800 print:shadow-none"
                    >
                      {/* Selection Badge (Hidden on Print) */}
                      <div className="no-print absolute top-2 right-2 text-blue-600">
                        <CheckSquare className="w-4 h-4 fill-blue-600 text-white" />
                      </div>

                      <div className="flex items-center space-x-1.5 border-b border-slate-100 pb-1 w-full justify-center">
                        <img src={logoUrl} alt="Logo" className="w-4 h-4 object-contain" />
                        <span className="text-[10px] font-extrabold text-slate-800 truncate max-w-[130px]">
                          โรงพยาบาลสังขละบุรี
                        </span>
                      </div>

                      <div className="bg-white p-1 rounded-lg border border-slate-100">
                        <QRCodeSVG
                          value={`ASSET-${asset.assetCode}`}
                          size={qrSize}
                          level="H"
                          includeMargin={false}
                        />
                      </div>

                      <div className="w-full space-y-0.5">
                        <div className="text-xs font-black text-blue-700 print:text-black">
                          {asset.assetCode}
                        </div>
                        <div className="text-[11px] font-bold text-slate-800 line-clamp-1">
                          {asset.name}
                        </div>
                        <div className="text-[9px] text-slate-500 line-clamp-1">
                          S/N: {asset.serialNumber || '-'}
                        </div>
                        <div className="text-[9px] text-slate-600 font-semibold line-clamp-1">
                          {dept?.name || 'ไม่ระบุหน่วยงาน'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions Bar - Hidden on Print */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 no-print">
          <div className="text-xs font-bold text-slate-600">
            คำแนะนำ: สามารถคลิกบนสติกเกอร์แต่ละใบเพื่อเลือก/ยกเลิกรายการพิมพ์ได้
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={printableAssets.length === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-200 flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์สติกเกอร์ ({printableAssets.length} รายการ)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
