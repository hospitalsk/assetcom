import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Database, 
  RefreshCw,
  LogOut,
  Menu,
  X,
  Calendar,
  Clock,
  UserCheck,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { 
    currentUser, 
    logout,
    notifications, 
    markNotificationAsRead, 
    settings,
    setActiveTab,
    resetToDefaultData 
  } = useApp();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  // Live Thai Date Time Clock State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const dayName = thaiDays[currentTime.getDay()];
  const dateNum = currentTime.getDate();
  const monthName = thaiMonths[currentTime.getMonth()];
  const yearBE = currentTime.getFullYear() + 543;
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');

  const thaiDateTimeStr = `วัน${dayName}ที่ ${dateNum} ${monthName} ${yearBE} | เวลา ${hours}:${minutes} น.`;

  const roleLower = (currentUser.role || '').toLowerCase();
  const isAdminUser = roleLower.includes('admin');
  const isGeneralUser = roleLower.includes('general') || currentUser.role === 'เจ้าหน้าที่ทั่วไป';
  const isITUser = roleLower.includes('it') || roleLower.includes('it officer');

  // Filter notifications
  const visibleNotifications = notifications.filter(notif => {
    const isWithdrawalNotif = notif.title.includes('เบิกวัสดุ') || notif.message.includes('ผู้เบิก:');
    if (isWithdrawalNotif && !isITUser) {
      return false;
    }

    if (isGeneralUser) {
      const isSystemNotif = notif.linkModule === 'settings' || 
                            notif.title.includes('ระบบ') || 
                            notif.title.includes('Supabase') || 
                            notif.title.includes('LINE') ||
                            notif.title.includes('ตั้งค่า');
      return !isSystemNotif;
    }
    return true;
  });

  const unreadCount = visibleNotifications.filter(n => !n.isRead).length;

  return (
    <>
      <header className="bg-gradient-to-r from-[#07162C] via-[#091D38] to-[#0B2545] border-b border-blue-900/40 min-h-[4rem] py-2 px-3 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-30 shadow-md font-['Sarabun',sans-serif] text-white">
        {/* Left: Mobile Toggle + Emblem Logo + Main System Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="เปิด/ปิดเมนู"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Government / Hospital Emblem Badge */}
          <div className="relative shrink-0">
            <img 
              src={settings.logoUrl || "./assets/aistudio/Logo_SK_26693d5e.png"} 
              alt="Logo Emblem" 
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-amber-400/80 shadow-md bg-white p-0.5" 
            />
          </div>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-[#38BDF8] tracking-tight leading-tight drop-shadow-xs">
              ลดภาระงานพัสดุ ควบคุมโปร่งใส ตรวจสอบได้
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-white/95 leading-tight truncate">
              "{settings.appName || 'ด้วยระบบบริหารจัดการครุภัณฑ์และพัสดุคลังย่อย'}"
            </p>
          </div>
        </div>

        {/* Right: Date Time Capsule + Notifications + User Profile */}
        <div className="flex items-center justify-between md:justify-end space-x-2 sm:space-x-3 shrink-0">
          
          {/* Live Date / Time Widget Pill */}
          <div className="hidden lg:flex items-center space-x-2 bg-[#0E2F56] border border-blue-400/30 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-200 shadow-inner">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold">{thaiDateTimeStr}</span>
          </div>

          {/* Supabase Status Button */}
          <button
            onClick={() => setShowSupabaseModal(true)}
            className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/20 text-sky-200 border border-sky-400/30 hover:bg-blue-500/30 transition-colors"
            title="จัดการการเชื่อมต่อ Supabase & Database"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Ready</span>
          </button>

          {/* Admin Reset Data Button */}
          {isAdminUser && (
            <button
              onClick={resetToDefaultData}
              className="hidden 2xl:flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="รีเซ็ตข้อมูลเริ่มต้น (เฉพาะ Admin)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>รีเซ็ตข้อมูล</span>
            </button>
          )}

          {/* Notification Bell Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 rounded-full bg-[#123663] hover:bg-[#1A457B] text-slate-200 transition-colors focus:outline-hidden border border-blue-400/30 shadow-xs"
              title="การแจ้งเตือน"
            >
              <Bell className="w-4 h-4 text-sky-300" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-bounce">
                  {unreadCount}
                </span>
              ) : (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  3
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">การแจ้งเตือนสำคัญ</span>
                  <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount || 3} รายการใหม่
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {visibleNotifications.length === 0 ? (
                    <div className="p-4 space-y-2">
                      <div className="p-2.5 bg-emerald-50 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between">
                        <span>🟢 พัสดุใกล้หมด (กระดาษ A4)</span>
                        <span className="text-[10px] text-slate-400">10 นาทีที่แล้ว</span>
                      </div>
                      <div className="p-2.5 bg-amber-50 rounded-xl text-xs font-semibold text-amber-800 flex items-center justify-between">
                        <span>🟠 ยืมครุภัณฑ์เกินกำหนด (โน้ตบุ๊ก)</span>
                        <span className="text-[10px] text-slate-400">1 ชม.ที่แล้ว</span>
                      </div>
                      <div className="p-2.5 bg-rose-50 rounded-xl text-xs font-semibold text-rose-800 flex items-center justify-between">
                        <span>🔴 รออนุมัติใบเบิกพัสดุ (พส.1)</span>
                        <span className="text-[10px] text-slate-400">2 ชม.ที่แล้ว</span>
                      </div>
                    </div>
                  ) : (
                    visibleNotifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.linkModule) setActiveTab(notif.linkModule);
                          setShowNotifDropdown(false);
                        }}
                        className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-start space-x-3 ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{notif.title}</p>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2 bg-[#123663] hover:bg-[#1A457B] px-3 py-1.5 rounded-full border border-blue-400/40 transition-colors shadow-xs cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs shrink-0 border border-white/50">
                👤
              </div>
              <span className="text-xs font-bold text-white truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 font-medium">สิทธิ์: {currentUser.role}</div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                >
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>ข้อมูลส่วนตัว & ตั้งค่า</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Supabase Config Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-['Sarabun',sans-serif]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-2xl">
                  <Database className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Supabase Cloud Database</h3>
                  <p className="text-[11px] text-emerald-600 font-bold">🟢 เชื่อมต่อออนไลน์ (ไม่ต้องรัน Local)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSupabaseModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-emerald-900 space-y-1">
                <div className="font-extrabold text-sm">☁️ บันทึกข้อมูลขึ้นคลาวด์ Supabase โดยตรง</div>
                <div>แอปพลิเคชันจะอ่านและเขียนข้อมูลขึ้น Supabase Cloud Database แบบเรียลไทม์</div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowSupabaseModal(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-200"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

