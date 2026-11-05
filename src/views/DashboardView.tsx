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
  Boxes,
  ArrowLeftRight,
  FileSpreadsheet,
  QrCode,
  BarChart3,
  ArrowRight,
  Zap,
  Clock,
  ChevronRight
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
    budgetPlans, 
    departments, 
    assetCategories, 
    setActiveTab, 
    currentUser 
  } = useApp();

  // Metric Calculations
  const totalAssets = assets.length;
  const activeAssets = assets.filter(a => a.status === 'พร้อมใช้งาน' || a.status === 'กำลังใช้งาน').length;
  const repairingAssets = assets.filter(a => a.status === 'กำลังซ่อม' || a.status === 'ชำรุด').length;
  const borrowedAssets = assets.filter(a => a.status === 'ยืมใช้งาน').length;
  
  const pendingRepairs = repairRequests.filter(r => r.status !== 'ซ่อมเสร็จ' && r.status !== 'ปิดงาน' && r.status !== 'ดำเนินการเสร็จ').length;
  const pendingBorrows = borrowRequests.filter(b => b.status === 'ยืมใช้งาน' || b.status === 'รออนุมัติ' || b.status === 'รอตรวจสอบ').length;

  const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + (item.stockQty * item.unitPrice), 0);
  const totalAssetPrice = assets.reduce((sum, a) => sum + a.purchasePrice, 0);
  
  const totalDepreciation = assets.reduce((sum, a) => {
    const acqYear = a.receivedDate ? new Date(a.receivedDate).getFullYear() : new Date().getFullYear();
    const ageYears = Math.max(0, new Date().getFullYear() - acqYear);
    const usefulLife = a.usefulLife || 5;
    const annualDep = usefulLife > 0 ? (a.purchasePrice - (a.salvageValue || 1)) / usefulLife : 0;
    return sum + Math.min(a.purchasePrice - (a.salvageValue || 1), annualDep * ageYears);
  }, 0);

  const lowStockItems = inventoryItems.filter(i => i.stockQty <= i.minQty);

  // Asset Status Donut Chart Data
  const statusColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
  const statusPieData = [
    { name: 'พร้อมใช้งาน', value: activeAssets },
    { name: 'ยืมใช้งาน', value: borrowedAssets },
    { name: 'ชำรุด/กำลังซ่อม', value: repairingAssets },
    { name: 'ว่าง/สำรอง', value: assets.filter(a => a.status === 'ว่าง').length },
  ].filter(d => d.value > 0);

  // Category chart data
  const categoryData = assetCategories.map(cat => ({
    name: cat.name.split(' ')[0],
    count: assets.filter(a => a.categoryId === cat.id).length
  }));

  // Department distribution
  const deptData = departments.map(d => ({
    name: d.code,
    fullName: d.name,
    count: assets.filter(a => a.departmentId === d.id).length
  }));

  return (
    <div className="space-y-6 font-['Sarabun',sans-serif]">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full text-xs font-bold border border-blue-400/30 text-blue-200">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Smart Asset Management & Analytics Dashboard</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            ระบบสารสนเทศทะเบียนครุภัณฑ์ คลังวัสดุ และงานซ่อมบำรุง
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            ยินดีต้อนรับคุณ <span className="text-white font-bold underline underline-offset-2">{currentUser.name}</span> ({currentUser.role}) — ติดตามสถานะทรัพย์สิน ตรวจสอบความคุ้มค่า และวางแผนงบประมาณประจำปี
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

      {/* Interactive Clickable KPI Summary Cards (8 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assets */}
        <div 
          onClick={() => setActiveTab('assets')}
          className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Monitor className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 group-hover:bg-blue-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
              <span>ทะเบียนครุภัณฑ์</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">จำนวนครุภัณฑ์ทั้งหมด</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className="text-2xl font-black text-slate-900">{totalAssets}</h3>
              <span className="text-xs font-bold text-slate-500">รายการ</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">พร้อมใช้งาน {activeAssets} รายการ</p>
          </div>
        </div>

        {/* Card 2: Repair Jobs */}
        <div 
          onClick={() => setActiveTab('repair')}
          className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 hover:border-rose-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-2xl ${pendingRepairs > 0 ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-600' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600'} group-hover:text-white transition-colors`}>
              <Wrench className="w-6 h-6" />
            </div>
            <span className={`text-[10px] font-extrabold ${pendingRepairs > 0 ? 'text-rose-600 bg-rose-50 group-hover:bg-rose-100' : 'text-emerald-600 bg-emerald-50'} px-2.5 py-1 rounded-full flex items-center space-x-1`}>
              <span>งานแจ้งซ่อม</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">งานซ่อมที่รอดำเนินการ</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className={`text-2xl font-black ${pendingRepairs > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{pendingRepairs}</h3>
              <span className="text-xs font-bold text-slate-500">รายการ</span>
            </div>
            <p className="text-[11px] text-rose-500 font-semibold mt-1">
              {pendingRepairs > 0 ? '⚠️ ต้องติดตามช่างผู้รับงาน' : '✅ ไม่มีงานซ่อมค้าง'}
            </p>
          </div>
        </div>

        {/* Card 3: Inventory Low Stock */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-2xl ${lowStockItems.length > 0 ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600' : 'bg-teal-50 text-teal-600 group-hover:bg-teal-600'} group-hover:text-white transition-colors`}>
              <Package className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 group-hover:bg-teal-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
              <span>คลังวัสดุ IT</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">วัสดุเตือนใกล้หมด (Min Qty)</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className={`text-2xl font-black ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{lowStockItems.length}</h3>
              <span className="text-xs font-bold text-slate-500">รายการ</span>
            </div>
            <p className="text-[11px] text-teal-600 font-semibold mt-1">มูลค่าคลังรวม ฿{totalInventoryValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Card 4: Borrow & Return */}
        <div 
          onClick={() => setActiveTab('borrow')}
          className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 hover:border-indigo-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
              <span>ยืม - คืนพัสดุ</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">คำขอยืมครุภัณฑ์ค้างส่ง</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className="text-2xl font-black text-slate-900">{pendingBorrows}</h3>
              <span className="text-xs font-bold text-slate-500">รายการ</span>
            </div>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">กำลังยืมใช้งาน {borrowedAssets} ชิ้น</p>
          </div>
        </div>

        {/* Card 5: Depreciation & Valuation */}
        <div 
          onClick={() => setActiveTab('depreciation')}
          className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 hover:border-purple-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 group-hover:bg-purple-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
              <span>มูลค่า & ค่าเสื่อม</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">ราคาทุนจัดซื้อครุภัณฑ์รวม</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className="text-xl font-black text-slate-900">฿{totalAssetPrice.toLocaleString()}</h3>
            </div>
            <p className="text-[11px] text-purple-600 font-semibold mt-1">ค่าเสื่อมสะสม ฿{totalDepreciation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        {/* Card 6: Budget Planning */}
        <div 
          onClick={() => setActiveTab('budget')}
          className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 hover:border-blue-600 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 group-hover:bg-blue-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
              <span>แผนงบประมาณ</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">แผนวิเคราะห์จัดซื้อประจำปี</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className="text-2xl font-black text-slate-900">{repairingAssets + lowStockItems.length}</h3>
              <span className="text-xs font-bold text-slate-500">รายการจำเป็น</span>
            </div>
            <p className="text-[11px] text-blue-700 font-semibold mt-1">วิเคราะห์จากความคุ้มค่าจริง</p>
          </div>
        </div>

        {/* Card 7: Official Reports */}
        <div 
          onClick={() => setActiveTab('reports')}
          className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 hover:border-emerald-600 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
              <span>รายงานระเบียบฯ</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">พิมพ์รายงานระเบียบพัสดุฯ</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className="text-2xl font-black text-slate-900">4</h3>
              <span className="text-xs font-bold text-slate-500">รูปแบบรายงาน</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">ระเบียบกระทรวงการคลัง พ.ศ. 2560</p>
          </div>
        </div>

        {/* Card 8: QR Code Scanner */}
        <div 
          onClick={() => setActiveTab('qrcode')}
          className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 hover:border-slate-800 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-800 bg-slate-100 group-hover:bg-slate-200 px-2.5 py-1 rounded-full flex items-center space-x-1">
              <span>สแกนเนอร์</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">สแกน QR Code ครุภัณฑ์</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className="text-xl font-black text-slate-900">สแกน/พิมพ์</h3>
            </div>
            <p className="text-[11px] text-slate-600 font-semibold mt-1">พิมพ์สติกเกอร์ QR Code ติดครุภัณฑ์</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Asset Category Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-xs border border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">จำนวนครุภัณฑ์แยกตามหมวดหมู่</h3>
              <p className="text-[11px] text-slate-500">สถิติจำนวนครุภัณฑ์ในแต่ประเภทตามทะเบียนพัสดุ</p>
            </div>
            <button 
              onClick={() => setActiveTab('assets')}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
            >
              ดูรายละเอียด →
            </button>
          </div>
          <div className="h-72">
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
          
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
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
