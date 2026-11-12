import React from 'react';
import { useApp } from '../context/AppContext';
import { hasPermission } from '../utils/permissions';
import { 
  LayoutDashboard, 
  Monitor, 
  Package, 
  QrCode, 
  ArrowLeftRight, 
  Wrench, 
  Calculator, 
  FileSpreadsheet, 
  BarChart3, 
  Settings,
  CheckCircle2,
  Trash2,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, currentUser, settings } = useApp();

  const allMenuItems = [
    { id: 'dashboard', label: 'หน้าหลัก Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: 'ทะเบียนครุภัณฑ์', icon: Monitor },
    { id: 'inventory', label: 'คลังวัสดุและเบิกจ่าย', icon: Package },
    { id: 'borrow', label: 'ยืม-คืน / โอนย้าย', icon: ArrowLeftRight },
    { id: 'repair', label: 'งานซ่อมบำรุง', icon: Wrench },
    { id: 'depreciation', label: 'ตรวจนับประจำปี (ค่าเสื่อม)', icon: CheckCircle2 },
    { id: 'budget', label: 'แผนงบประมาณประจำปี', icon: FileSpreadsheet },
    { id: 'reports', label: 'รายงานและเอกสาร', icon: BarChart3 },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings },
    { id: 'qrcode', label: 'สแกน QR ตรวจสอบครุภัณฑ์', icon: QrCode },
  ];

  const menuItems = allMenuItems.filter(item => hasPermission(currentUser.role, item.id));

  const handleSelect = (id: string) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      <aside className={`
        fixed md:static top-0 bottom-0 left-0 z-40
        w-64 bg-gradient-to-b from-[#07152B] via-[#091D38] to-[#0B2545] text-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-blue-900/40 shadow-xl
        transition-transform duration-300 ease-in-out font-['Sarabun',sans-serif]
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-blue-900/40 flex flex-col items-center text-center relative bg-[#091D38]/50">
          <button 
            onClick={onClose}
            className="md:hidden absolute top-3 right-3 p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Emblem Badge Logo */}
          <div className="w-14 h-14 rounded-full bg-white p-1 border-2 border-amber-400/80 shadow-md mb-2 flex items-center justify-center">
            <img 
              src={settings.logoUrl || "./assets/aistudio/Logo_SK_26693d5e.png"} 
              alt="Government Emblem" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <h2 className="text-xs font-bold text-white leading-tight tracking-tight">
            ระบบบริหารจัดการ<br />ครุภัณฑ์และพัสดุคลังย่อย
          </h2>
          <p className="text-[11px] font-semibold text-sky-400 mt-0.5">
            {settings.organizationName || 'เทศบาลตำบลตัวอย่าง'}
          </p>
        </div>

        {/* User Status Card Box inside Sidebar */}
        <div className="p-3 mx-3 my-3 bg-[#0B2A50] border border-blue-400/30 rounded-2xl flex items-center space-x-3 shadow-inner">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-amber-300/80 shrink-0 flex items-center justify-center text-slate-800 font-bold text-sm">
            {currentUser.name.charAt(0) || '👤'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-300 truncate">
              {currentUser.role}
            </div>
            <div className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              <span>ออนไลน์</span>
            </div>
          </div>
        </div>

        {/* Menu Navigation List */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0084FF] text-white shadow-lg shadow-blue-500/40 transform scale-[1.02]'
                    : 'text-slate-300 hover:bg-blue-900/30 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-sky-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              </button>
            );
          })}
        </nav>

        {/* Mascot QR Shortcut Promo Card inside Sidebar bottom */}
        <div className="p-3 m-3 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 rounded-2xl border border-blue-400/20 flex items-center space-x-2 text-xs">
          <div className="text-xl">📱</div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-sky-200 leading-tight">สแกน QR ตรวจสอบ</div>
            <div className="text-[10px] text-slate-400">ข้อมูลครุภัณฑ์รวดเร็ว</div>
          </div>
        </div>
      </aside>
    </>
  );
};

