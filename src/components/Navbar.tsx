import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Database, 
  RefreshCw,
  LogOut,
  Menu,
  X
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
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <header className="bg-white border-b border-slate-200 h-16 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Left: Mobile Menu Toggle + Brand / Logo / Title */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="เปิด/ปิดเมนู"
          >
            <Menu className="w-5 h-5" />
          </button>

          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-xs" />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 font-bold text-base sm:text-lg">
              SA
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-bold text-slate-800 tracking-tight leading-snug truncate">
              {settings.appName}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate max-w-[180px] sm:max-w-md">
              {settings.organizationName}
            </p>
          </div>
        </div>

        {/* Right: Actions, Notifications, User Profile & Logout */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          <button
            onClick={() => setShowSupabaseModal(true)}
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
            title="จัดการการเชื่อมต่อ Supabase & Database"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase Ready</span>
          </button>

          <button
            onClick={resetToDefaultData}
            className="hidden xl:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            title="รีเซ็ตข้อมูลเริ่มต้น"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>รีเซ็ตข้อมูล</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-hidden"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">การแจ้งเตือนระบบ</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                    {unreadCount} ใหม่
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">ไม่มีการแจ้งเตือน</div>
                  ) : (
                    notifications.map(notif => (
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

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 font-medium">สิทธิ์: {currentUser.role}</div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Supabase Config Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-['Sarabun',sans-serif]">
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
                <div>แอปพลิเคชันจะอ่านและเขียนข้อมูลขึ้น Supabase Cloud Database แบบเรียลไทม์ สามารถรันบน GitHub Pages / Vercel / Netlify ออนไลน์ได้ทันที</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 font-sans font-bold block mb-0.5">Project URL:</span>
                  <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded-lg block truncate border border-blue-100 font-semibold">
                    https://xmzonnmpzmaykvypqmhz.supabase.co
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans font-bold block mb-0.5">Publishable / Anon Key:</span>
                  <span className="text-slate-700 bg-white px-2 py-1 rounded-lg block truncate border border-slate-200 text-[10px]">
                    sb_publishable_kRhY9nDjk_yTCmqYfM7veA_KBX6ZyAb
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 text-[11px] space-y-1 font-sans">
                <div className="font-bold text-slate-800">📄 SQL Setup Script (`supabase-schema.sql`)</div>
                <div>หากต้องการสร้างตารางเพิ่มใน Supabase Dashboard สามารถใช้โค้ด SQL จากไฟล์ `supabase-schema.sql` ในโครงการได้ทันที</div>
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
