import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { QrCode, Camera, Printer, CheckCircle, StopCircle, Search, Info, ExternalLink, Wrench } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { PrintDocumentModal } from '../components/PrintDocumentModal';
import { PrintAllQRCodesModal } from '../components/PrintAllQRCodesModal';
import { ScannedAssetDetailModal } from '../components/ScannedAssetDetailModal';
import { Asset } from '../types';

export const QRCodeView: React.FC = () => {
  const { assets, departments, assetCategories, repairRequests, borrowRequests, settings, setActiveTab } = useApp();
  const [activeTabMode, setActiveTabMode] = useState<'generator' | 'scanner'>('generator');
  const [selectedAssetCode, setSelectedAssetCode] = useState(assets[0]?.assetCode || '');
  
  // Modals state
  const [showSinglePrintModal, setShowSinglePrintModal] = useState(false);
  const [showPrintAllModal, setShowPrintAllModal] = useState(false);
  const [scannedAssetModal, setScannedAssetModal] = useState<Asset | null>(null);

  // Scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Currently selected asset in Generator tab
  const targetAsset = assets.find(a => a.assetCode === selectedAssetCode || a.id === selectedAssetCode);
  const targetDept = departments.find(d => d.id === targetAsset?.departmentId);

  // Filtered assets for batch print
  const filteredAssets = assets.filter(ast => {
    if (selectedDeptFilter === 'all') return true;
    return ast.departmentId === selectedDeptFilter;
  });

  // Handle Scan Result
  const handleProcessScanCode = (code: string) => {
    const cleanCode = code.trim().replace(/^ASSET-/, '');
    const found = assets.find(a => 
      a.assetCode.toLowerCase() === cleanCode.toLowerCase() || 
      a.id.toLowerCase() === cleanCode.toLowerCase() ||
      (a.serialNumber && a.serialNumber.toLowerCase() === cleanCode.toLowerCase())
    );

    setScanResult(code);
    if (found) {
      setScannedAssetModal(found);
    } else {
      alert(`ไม่พบข้อมูลครุภัณฑ์รหัส "${code}" ในระบบ`);
    }
  };

  useEffect(() => {
    if (activeTabMode === 'scanner' && scannerActive) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scanner.render(
        (decodedText) => {
          setScannerActive(false);
          try {
            scanner.clear();
          } catch (e) {}
          handleProcessScanCode(decodedText);
        },
        () => {}
      );
      scannerRef.current = scanner;

      return () => {
        try {
          scanner.clear();
        } catch (e) {}
      };
    }
  }, [activeTabMode, scannerActive]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ระบบ QR Code และเครื่องสแกน</h2>
          <p className="text-xs text-slate-500 mt-1">
            สร้าง QR Code และพิมพ์สติกเกอร์สำหรับติดครุภัณฑ์ทุกชิ้น พร้อมระบบสแกนแสดงข้อมูลครบถ้วน
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTabMode('generator')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTabMode === 'generator' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            สร้าง & พิมพ์สติกเกอร์
          </button>
          <button
            onClick={() => {
              setActiveTabMode('scanner');
              setScannerActive(true);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTabMode === 'scanner' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>สแกน QR Code</span>
          </button>
        </div>
      </div>

      {activeTabMode === 'generator' ? (
        <div className="space-y-6">
          {/* Batch Print All Banner */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="text-xs font-bold text-blue-200 uppercase tracking-wider">ระบบพิมพ์สติกเกอร์ QR Code แบบกลุ่ม (Batch Print)</div>
              <h3 className="text-lg sm:text-xl font-extrabold">พิมพ์ QR Code สำหรับติดครุภัณฑ์ทั้งหมดในระบบ ({assets.length} รายการ)</h3>
              <p className="text-xs text-blue-100">รองรับกระดาษสติกเกอร์ขนาด A4 สำหรับติดบนตัวเครื่องครุภัณฑ์ เพื่อความสะดวกในการตรวจสอบและสแกน</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-white/10 text-white border border-white/20 outline-hidden font-bold"
              >
                <option value="all" className="text-slate-900">ทุกหน่วยงาน ({assets.length} ชิ้น)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id} className="text-slate-900">{d.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowPrintAllModal(true)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-500/30 flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ พิมพ์สติกเกอร์ทั้งหมด ({filteredAssets.length} รายการ)</span>
              </button>
            </div>
          </div>

          {/* Single Item Creator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">เลือกครุภัณฑ์รายชิ้นเพื่อดูตัวอย่าง QR Code</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เลือกครุภัณฑ์</label>
                <select
                  value={selectedAssetCode}
                  onChange={(e) => setSelectedAssetCode(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
                >
                  {assets.map(ast => (
                    <option key={ast.id} value={ast.assetCode}>
                      {ast.assetCode} - {ast.name}
                    </option>
                  ))}
                </select>
              </div>

              {targetAsset && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div><span className="font-semibold text-slate-500">รหัสครุภัณฑ์:</span> <span className="font-bold text-blue-600">{targetAsset.assetCode}</span></div>
                  <div><span className="font-semibold text-slate-500">ชื่อรายการ:</span> {targetAsset.name}</div>
                  <div><span className="font-semibold text-slate-500">Serial Number:</span> {targetAsset.serialNumber || '-'}</div>
                  <div><span className="font-semibold text-slate-500">หน่วยงาน:</span> {targetDept?.name || '-'}</div>
                  <div><span className="font-semibold text-slate-500">สถานที่:</span> {targetAsset.location || '-'}</div>
                  <div><span className="font-semibold text-slate-500">สถานะ:</span> <span className="font-bold text-emerald-600">{targetAsset.status}</span></div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setShowSinglePrintModal(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-md shadow-blue-200"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์สติกเกอร์ชิ้นนี้</span>
                </button>
                {targetAsset && (
                  <button
                    onClick={() => setScannedAssetModal(targetAsset)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>ดูข้อมูลครุภัณฑ์ชิ้นนี้แบบเต็ม</span>
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-xs border border-slate-100 flex flex-col items-center justify-center space-y-6">
              {targetAsset ? (
                <div className="border-2 border-slate-300 p-6 rounded-3xl bg-white shadow-md flex flex-col items-center space-y-4 w-80 text-center relative">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 w-full justify-center">
                    <img src={settings.logoUrl} alt="Logo" className="w-7 h-7 object-contain" />
                    <div className="text-xs font-black text-slate-900 tracking-tight">{settings.organizationName}</div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
                    <QRCodeSVG value={`ASSET-${targetAsset.assetCode}`} size={160} level="H" includeMargin />
                  </div>

                  <div className="space-y-1 w-full">
                    <div className="text-base font-black text-blue-700">{targetAsset.assetCode}</div>
                    <div className="text-xs font-bold text-slate-800 truncate px-2">{targetAsset.name}</div>
                    <div className="text-[11px] text-slate-500">S/N: {targetAsset.serialNumber || '-'}</div>
                    <div className="text-[10px] text-slate-600 font-semibold truncate pt-1 border-t border-slate-100">{targetDept?.name || 'กลุ่มงาน'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-xs">กรุณาเลือกครุภัณฑ์เพื่อแสดง QR Code</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Scanner Mode */
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-100 text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">สแกน QR Code ตรวจสอบข้อมูลครุภัณฑ์ครบถ้วน</h3>
              <p className="text-xs text-slate-500">
                สแกนจากกล้องมือถือ/แท็บเล็ต หรือพิมพ์/ยิงบาร์โค้ดรหัสครุภัณฑ์ เพื่อดูข้อมูลสเปก ประวัติการซ่อมบำรุง และมูลค่าปัจจุบัน
              </p>
            </div>

            {/* Manual input or scanner gun option */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-md mx-auto space-y-3">
              <label className="block text-xs font-bold text-slate-700 text-left">
                🔍 ระบุรหัสครุภัณฑ์ หรือใช้เครื่องสแกนบาร์โค้ด
              </label>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (manualCodeInput) handleProcessScanCode(manualCodeInput);
              }} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="เช่น COM-2568-001..."
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200"
                >
                  ค้นหาข้อมูล
                </button>
              </form>
            </div>

            {/* Camera View */}
            {scannerActive ? (
              <div className="w-full max-w-md mx-auto space-y-3">
                <div id="reader" className="w-full rounded-3xl overflow-hidden border-2 border-blue-500 shadow-xl"></div>
                <button
                  onClick={() => setScannerActive(false)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 mx-auto"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>ปิดกล้องสแกน</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setScannerActive(true)}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black transition-all flex items-center space-x-2 shadow-lg shadow-blue-200 mx-auto"
              >
                <Camera className="w-5 h-5" />
                <span>เปิดกล้องสแกน QR Code</span>
              </button>
            )}

            {/* Quick Demo Scan Click Buttons */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                คลิกทดสอบสแกนครุภัณฑ์ตัวอย่างในระบบ
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {assets.slice(0, 5).map(ast => (
                  <button
                    key={ast.id}
                    onClick={() => handleProcessScanCode(ast.assetCode)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:border-blue-300 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                  >
                    🔍 สแกน {ast.assetCode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Print Sticker Modal */}
      {showSinglePrintModal && targetAsset && (
        <PrintDocumentModal
          title="สติกเกอร์บาร์โค้ดและ QR Code ครุภัณฑ์"
          documentNo={targetAsset.assetCode}
          date={new Date().toLocaleDateString('th-TH')}
          departmentName={targetDept?.name || 'หน่วยงาน'}
          contentData={[
            { label: 'รหัสครุภัณฑ์', value: targetAsset.assetCode },
            { label: 'ชื่อครุภัณฑ์', value: targetAsset.name },
            { label: 'Serial Number', value: targetAsset.serialNumber || '-' },
            { label: 'สถานที่ติดตั้ง', value: targetAsset.location || '-' }
          ]}
          onClose={() => setShowSinglePrintModal(false)}
        />
      )}

      {/* Batch Print All Assets QR Codes Modal */}
      {showPrintAllModal && (
        <PrintAllQRCodesModal
          assets={filteredAssets}
          departments={departments}
          organizationName={settings.organizationName}
          logoUrl={settings.logoUrl}
          onClose={() => setShowPrintAllModal(false)}
        />
      )}

      {/* Scanned Asset Complete Information Modal */}
      {scannedAssetModal && (
        <ScannedAssetDetailModal
          asset={scannedAssetModal}
          departments={departments}
          assetCategories={assetCategories}
          repairRequests={repairRequests}
          borrowRequests={borrowRequests}
          organizationName={settings.organizationName}
          logoUrl={settings.logoUrl}
          onClose={() => setScannedAssetModal(null)}
          onNotifyRepair={() => {
            setActiveTab('repair');
          }}
          onPrintSticker={(ast) => {
            setSelectedAssetCode(ast.assetCode);
            setShowSinglePrintModal(true);
          }}
        />
      )}
    </div>
  );
};
