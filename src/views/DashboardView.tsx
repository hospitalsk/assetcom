import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Monitor, 
  Package, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  ArrowLeftRight,
  FileSpreadsheet,
  QrCode,
  BarChart3,
  Zap,
  ChevronRight,
  ShieldCheck,
  Activity,
  Coins
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { 
    assets, 
    inventoryItems, 
    repairRequests, 
    borrowRequests, 
    departments, 
    assetCategories, 
    setActiveTab, 
    currentUser 
  } = useApp();

  // Core Metric Calculations
  const totalAssets = assets.length;
  const activeAssets = assets.filter(a => a.status === 'พร้อมใช้งาน' || a.status === 'กำลังใช้งาน').length;
  const repairingAssets = assets.filter(a => a.status === 'กำลังซ่อม' || a.status === 'ชำรุด').length;
  const borrowedAssets = assets.filter(a => a.status === 'ยืมใช้งาน').length;
  const availableAssets = assets.filter(a => a.status === 'ว่าง').length;

  // Availability Ratio %
  const availabilityRatio = totalAssets > 0 ? ((activeAssets / totalAssets) * 100).toFixed(1) : '100';

  // Repair Metrics
  const totalRepairsCount = repairRequests.length;
  const completedRepairsCount = repairRequests.filter(r => r.status === 'ซ่อมเสร็จ' || r.status === 'ปิดงาน' || r.status === 'ดำเนินการเสร็จ').length;
  const pendingRepairs = repairRequests.filter(r => r.status !== 'ซ่อมเสร็จ' && r.status !== 'ปิดงาน' && r.status !== 'ดำเนินการเสร็จ').length;
  const repairSuccessRate = totalRepairsCount > 0 ? ((completedRepairsCount / totalRepairsCount) * 100).toFixed(1) : '100';
  const totalRepairExpense = repairRequests.reduce((sum, r) => sum + (r.totalCost || 0), 0);

  // Borrow Metrics
  const pendingBorrows = borrowRequests.filter(b => b.status === 'ยืมใช้งาน' || b.status === 'รออนุมัติ' || b.status === 'รอตรวจสอบ').length;

  // Inventory Metrics
  const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + (item.stockQty * item.unitPrice), 0);
  const lowStockItems = inventoryItems.filter(i => i.stockQty <= i.minQty);

  // Asset Valuation & Expiry
  const totalAssetPrice = assets.reduce((sum, a) => sum + a.purchasePrice, 0);
  const expiredAssetsCount = assets.filter(a => {
    const acqYear = a.receivedDate ? new Date(a.receivedDate).getFullYear() : new Date().getFullYear();
    const ageYears = Math.max(0, new Date().getFullYear() - acqYear);
    return ageYears >= (a.usefulLife || 5);
  }).length;

  const totalDepreciation = assets.reduce((sum, a) => {
    const acqYear = a.receivedDate ? new Date(a.receivedDate).getFullYear() : new Date().getFullYear();
    const ageYears = Math.max(0, new Date().getFullYear() - acqYear);
    const usefulLife = a.usefulLife || 5;
    const annualDep = usefulLife > 0 ? (a.purchasePrice - (a.salvageValue || 1)) / usefulLife : 0;
    return sum + Math.min(a.purchasePrice - (a.salvageValue || 1), annualDep * ageYears);
  }, 0);

  // Donut Chart Data
  const statusColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
  const statusPieData = [
    { name: 'พร้อมใช้งาน', value: activeAssets },
    { name: 'ยืมใช้งาน', value: borrowedAssets },
    { name: 'ชำรุด/กำลังซ่อม', value: repairingAssets },
    { name: 'ว่าง/สำรอง', value: availableAssets },
  ].filter(d => d.value > 0);

  // Category chart data
  const categoryData = assetCategories.map(cat => ({
    name: cat.name.split(' ')[0],
    count: assets.filter(a => a.categoryId === cat.id).length
  }));

  return (
    <div className="space-y-6 font-['Sarabun',sans-serif]">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full text-xs font-bold border border-blue-400/30 text-blue-200">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Smart Asset Analytics Dashboard</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            ภาพรวมระบบบริหารจัดการทรัพย์สินและงานซ่อม
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            ยินดีต้อนรับคุณ <span className="text-white font-bold underline underline-offset-2">{currentUser.name}</span> ({currentUser.role}) — สรุปดัชนีชี้วัดความพร้อมใช้งาน ค่าเสื่อมราคา และแผนพัสดุประจำปี
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex flex-wrap gap-2.5 z-10 shrink-0">
          <button
            onClick={() => setActiveTab('qrcode')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>สแกน QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('repair')}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <Wrench className="w-4 h-4" />
            <span>แจ้งซ่อมด่วน</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <Package className="w-4 h-4" />
            <span>เบิกวัสดุ IT</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Key High-Impact Metrics (4 Highlights - Clean, Concise, Non-cluttered) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Availability Rate */}
        <div 
          onClick={() => setActiveTab('assets')}
          className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">อัตราความพร้อมใช้งาน</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-emerald-600">{availabilityRatio}%</span>
              <span className="text-xs text-slate-400 font-bold">Uptime</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
              พร้อมใช้งาน {activeAssets} จาก {totalAssets} ชิ้น
            </p>
          </div>
        </div>

        {/* KPI 2: Repair Success Rate */}
        <div 
          onClick={() => setActiveTab('repair')}
          className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">อัตราซ่อมเสร็จสิ้น</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-blue-600">{repairSuccessRate}%</span>
              <span className="text-xs text-slate-400 font-bold">Success</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
              งานซ่อมเสร็จ {completedRepairsCount} / รอดำเนินการ {pendingRepairs} รายการ
            </p>
          </div>
        </div>

        {/* KPI 3: Accumulated Repair Cost */}
        <div 
          onClick={() => setActiveTab('budget')}
          className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ค่าซ่อมบำรุงสะสมรวม</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-amber-600 font-mono">฿{totalRepairExpense.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
              ครุภัณฑ์เสื่อมตามเกณฑ์ {expiredAssetsCount} ชิ้น
            </p>
          </div>
        </div>

        {/* KPI 4: Low Stock Alert */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-rose-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">วัสดุต้องสั่งซื้อเพิ่ม</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-rose-600">{lowStockItems.length}</span>
              <span className="text-xs text-slate-400 font-bold">รายการ</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
              ต่ำกว่าจุดสั่งซื้อ Min Qty
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Interactive Module Quick Navigation Cards (Clean 6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Module 1: Asset Management */}
        <div 
          onClick={() => setActiveTab('assets')}
          className="bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">ทะเบียนครุภัณฑ์</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">รวม {totalAssets} รายการ (฿{totalAssetPrice.toLocaleString()})</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </div>

        {/* Module 2: Repair Management */}
        <div 
          onClick={() => setActiveTab('repair')}
          className="bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-rose-500 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">งานแจ้งซ่อม & LINE OA</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">รอดำเนินการ {pendingRepairs} รายการ</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
        </div>

        {/* Module 3: Inventory */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">คลังวัสดุ IT</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">มูลค่ารวม ฿{totalInventoryValue.toLocaleString()}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
        </div>

        {/* Module 4: Borrow & Return */}
        <div 
          onClick={() => setActiveTab('borrow')}
          className="bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">ยืม - คืนพัสดุ</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">กำลังยืมใช้งาน {borrowedAssets} ชิ้น</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </div>

        {/* Module 5: Budget Planning */}
        <div 
          onClick={() => setActiveTab('budget')}
          className="bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-blue-600 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl group-hover:bg-blue-700 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">วางแผนงบประมาณประจำปี</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">วิเคราะห์จากความคุ้มค่าจริง</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" />
        </div>

        {/* Module 6: Official Reports */}
        <div 
          onClick={() => setActiveTab('reports')}
          className="bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-purple-600 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">รายงานระเบียบพัสดุฯ 2560</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">พิมพ์รายงานการจัดซื้อจัดจ้าง</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* SECTION 3: Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Asset Category Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-xs border border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">จำนวนครุภัณฑ์จำแนกตามหมวดหมู่</h3>
              <p className="text-[11px] text-slate-500">สถิติครุภัณฑ์ในแต่ละหมวดหมู่ตามทะเบียนพัสดุ</p>
            </div>
            <button 
              onClick={() => setActiveTab('assets')}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
            >
              ดูทั้งหมด →
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Donut Breakdown */}
        <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-100 space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">สัดส่วนสถานะครุภัณฑ์ปัจจุบัน</h3>
            <p className="text-[11px] text-slate-500">จำแนกตามสภาพความพร้อมใช้งาน</p>
          </div>
          
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            {statusPieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: statusColors[idx % statusColors.length] }}></span>
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <span className="font-extrabold text-slate-900">{item.value} ชิ้น</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
