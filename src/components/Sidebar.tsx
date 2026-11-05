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
  Boxes,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, currentUser } = useApp();

  const allMenuItems = [
    { id: 'dashboard', label: 'ภาพรวมระบบ', icon: LayoutDashboard },
    { id: 'assets', label: 'ทะเบียนครุภัณฑ์', icon: Monitor },
    { id: 'inventory', label: 'วัสดุและอะไหล่ IT', icon: Package },
    { id: 'qrcode', label: 'QR Code และสแกนเนอร์', icon: QrCode },
    { id: 'borrow', label: 'ระบบยืม - คืนครุภัณฑ์', icon: ArrowLeftRight },
    { id: 'repair', label: 'แจ้งซ่อมและงานซ่อม', icon: Wrench },
    { id: 'depreciation', label: 'คำนวณค่าเสื่อมราคา', icon: Calculator },
    { id: 'budget', label: 'แผนงบประมาณประจำปี', icon: FileSpreadsheet },
    { id: 'reports', label: 'รายงานและสถิติ', icon: BarChart3 },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings },
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
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      <aside className={`
        fixed md:static top-0 bottom-0 left-0 z-40
        w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              เมนูหลักระบบพัสดุ
            </span>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer Info inside Sidebar */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1">
          <div className="font-semibold text-slate-400 truncate">ผู้ใช้งาน: {currentUser.name}</div>
          <div className="truncate">สิทธิ์: {currentUser.role}</div>
          <div className="text-emerald-400 font-medium pt-1 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            <span>เชื่อมต่อฐานข้อมูลแล้ว</span>
          </div>
        </div>
      </aside>
    </>
  );
};
