import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './views/DashboardView';
import { AssetManagementView } from './views/AssetManagementView';
import { InventoryManagementView } from './views/InventoryManagementView';
import { QRCodeView } from './views/QRCodeView';
import { BorrowReturnView } from './views/BorrowReturnView';
import { RepairManagementView } from './views/RepairManagementView';
import { DepreciationView } from './views/DepreciationView';
import { BudgetPlanningView } from './views/BudgetPlanningView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { hasPermission } from './utils/permissions';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, isLoggedIn, currentUser, repairRequests, updateRepairRequest } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lineAcceptToast, setLineAcceptToast] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn && !hasPermission(currentUser.role, activeTab)) {
      setActiveTab('dashboard');
    }
  }, [isLoggedIn, currentUser.role, activeTab, setActiveTab]);

  // Handle direct job acceptance from LINE OA deep link button (?action=accept&repairId=...)
  useEffect(() => {
    if (!isLoggedIn) return;
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const repairId = urlParams.get('repairId');

    if (action === 'accept' && repairId) {
      const repair = repairRequests.find(r => r.id === repairId);
      if (repair) {
        updateRepairRequest(repairId, {
          status: 'กำลังดำเนินการ',
          technicianId: currentUser.id
        });
        setLineAcceptToast(`🟢 คุณ (${currentUser.name}) กดรับงานซ่อมเลขที่ [${repair.repairNo}] ผ่าน LINE OA สำเร็จแล้ว! สถานะถูกปรับเป็น "กำลังดำเนินการ"`);
        setActiveTab('repair');
        setTimeout(() => setLineAcceptToast(null), 6000);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isLoggedIn, repairRequests, currentUser, updateRepairRequest, setActiveTab]);

  if (!isLoggedIn) {
    return <LoginModal />;
  }

  const allowedToView = hasPermission(currentUser.role, activeTab);
  const currentTab = allowedToView ? activeTab : 'dashboard';

  return (
    <div className="min-h-screen bg-[#E8F0F8] flex flex-col font-['Sarabun',sans-serif] text-slate-800">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      {lineAcceptToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 text-xs sm:text-sm font-black flex items-center justify-between shadow-lg animate-in slide-in-from-top-4 z-50">
          <div className="flex items-center space-x-2">
            <span className="text-base">📲</span>
            <span>{lineAcceptToast}</span>
          </div>
          <button
            onClick={() => setLineAcceptToast(null)}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all"
          >
            ปิด
          </button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-3 sm:p-5 overflow-y-auto max-w-[1700px] mx-auto w-full space-y-4">
          {currentTab === 'dashboard' && <DashboardView />}
          {currentTab === 'assets' && <AssetManagementView />}
          {currentTab === 'inventory' && <InventoryManagementView />}
          {currentTab === 'qrcode' && <QRCodeView />}
          {currentTab === 'borrow' && <BorrowReturnView />}
          {currentTab === 'repair' && <RepairManagementView />}
          {currentTab === 'depreciation' && <DepreciationView />}
          {currentTab === 'budget' && <BudgetPlanningView />}
          {currentTab === 'reports' && <ReportsView />}
          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
