import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Monitor, 
  Package, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Coins,
  ArrowLeftRight,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Clock,
  Boxes,
  Trash2,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell, LabelList 
} from 'recharts';
import { Asset } from '../types';

export const DashboardView: React.FC = () => {
  const { 
    assets,
    repairRequests,
    borrowRequests,
    inventoryItems,
    departments,
    assetCategories,
    auditLogs,
    setActiveTab
  } = useApp();

  const [fiscalYear, setFiscalYear] = useState('2568');
  const [reportPeriod, setReportPeriod] = useState('เดือนนี้');

  // 1. Core Metric Calculations (Live Real Data)
  const totalAssetsCount = assets.length;
  const totalAssetValue = assets.reduce((sum, a) => sum + (Number(a.purchasePrice) || 0), 0);
  const totalInventoryCount = inventoryItems.reduce((sum, item) => sum + (Number(item.stockQty) || 0), 0);
  const totalPendingRepairs = repairRequests.filter(r => 
    r.status !== 'ปิดงาน' && 
    r.status !== 'รับของเรียบร้อย' && 
    r.status !== 'ดำเนินการเสร็จ' && 
    r.status !== 'ไม่สามารถซ่อมได้'
  ).length;

  // 2. Real Depreciation Calculation (ค่าเสื่อมราคาสะสมจริง)
  const calculateAccumulatedDepreciation = (asset: Asset) => {
    if (!asset.purchasePrice || asset.purchasePrice <= 0) return 0;
    const usefulLife = asset.usefulLife || 5;
    const salvage = asset.salvageValue ?? (asset.purchasePrice * 0.1);
    const depreciable = Math.max(0, asset.purchasePrice - salvage);
    const yearlyDep = depreciable / usefulLife;
    
    const rDate = asset.receivedDate ? new Date(asset.receivedDate) : new Date();
    const now = new Date();
    const ageYears = Math.max(0, (now.getTime() - rDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    
    const accumDep = Math.min(depreciable, yearlyDep * ageYears);
    return Math.round(accumDep);
  };
  const totalAccumulatedDepreciation = assets.reduce((sum, a) => sum + calculateAccumulatedDepreciation(a), 0);

  // 3. Bar Chart Data (สถิติครุภัณฑ์แยกตามประเภทจริง)
  const categoryCountsMap: Record<string, number> = {};
  assets.forEach(a => {
    const cat = assetCategories.find(c => c.id === a.categoryId)?.name || 'ประเภทอื่นๆ';
    categoryCountsMap[cat] = (categoryCountsMap[cat] || 0) + 1;
  });

  const defaultCategoryColors = ['#38BDF8', '#F59E0B', '#10B981', '#3B82F6', '#A855F7', '#EC4899', '#6366F1'];
  const categoryBarData = Object.entries(categoryCountsMap).map(([name, count], idx) => ({
    name: name.length > 12 ? `${name.slice(0, 10)}...` : name,
    fullName: name,
    count,
    fill: defaultCategoryColors[idx % defaultCategoryColors.length]
  }));

  // Fallback if no assets exist yet
  const barChartDisplayData = categoryBarData.length > 0 ? categoryBarData : [
    { name: 'ไม่มีข้อมูล', count: 0, fill: '#CBD5E1' }
  ];

  // 4. Donut Chart Data (สถานะครุภัณฑ์จริง)
  const statusCounts = {
    inUse: assets.filter(a => a.status === 'พร้อมใช้งาน' || a.status === 'กำลังใช้งาน' || a.status === 'ว่าง').length,
    damaged: assets.filter(a => a.status === 'ชำรุด').length,
    repairing: assets.filter(a => a.status === 'กำลังซ่อม' || a.status === 'ยืมใช้งาน').length,
    disposed: assets.filter(a => a.status === 'จำหน่าย' || a.status === 'สูญหาย').length,
  };
  const totalForStatus = assets.length || 1;
  
  const statusPieData = [
    { name: 'พร้อมใช้งาน', value: statusCounts.inUse, percent: `${((statusCounts.inUse / totalForStatus) * 100).toFixed(1)}%`, color: '#10B981' },
    { name: 'ชำรุด', value: statusCounts.damaged, percent: `${((statusCounts.damaged / totalForStatus) * 100).toFixed(1)}%`, color: '#F59E0B' },
    { name: 'ส่งซ่อม/ยืม', value: statusCounts.repairing, percent: `${((statusCounts.repairing / totalForStatus) * 100).toFixed(1)}%`, color: '#3B82F6' },
    { name: 'จำหน่ายแล้ว', value: statusCounts.disposed, percent: `${((statusCounts.disposed / totalForStatus) * 100).toFixed(1)}%`, color: '#A855F7' },
  ].filter(item => item.value > 0 || totalAssetsCount === 0);

  // 5. Featured Assets Top 5 (เรียงตามมูลค่าสูงสุดจริง)
  const topFeaturedAssets = [...assets]
    .sort((a, b) => (b.purchasePrice || 0) - (a.purchasePrice || 0))
    .slice(0, 5)
    .map(item => {
      const dept = departments.find(d => d.id === item.departmentId)?.name || 'ทั่วไป';
      const isOk = item.status === 'พร้อมใช้งาน' || item.status === 'กำลังใช้งาน';
      return {
        id: item.id,
        code: item.assetCode,
        name: item.name,
        dept,
        status: item.status,
        statusColor: isOk ? 'bg-emerald-500' : item.status === 'ชำรุด' ? 'bg-amber-500' : 'bg-blue-500',
        price: item.purchasePrice || 0
      };
    });

  // 6. Activity Log (ดึงจาก auditLogs จริง)
  const recentActivities = auditLogs.slice(0, 5).map(act => {
    const d = new Date(act.createdAt);
    const timeStr = isNaN(d.getTime()) ? 'เมื่อซักครู่' : d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const badgeColor = act.action === 'CREATE' ? 'bg-emerald-500' : act.action === 'UPDATE' ? 'bg-blue-500' : 'bg-amber-500';
    return {
      time: timeStr,
      badgeColor,
      text: `${act.action === 'CREATE' ? 'สร้าง' : act.action === 'UPDATE' ? 'อัปเดต' : 'ดำเนินการ'}: ${act.description}`,
      user: act.userName || 'ผู้ใช้งาน'
    };
  });

  // 7. Dynamic Alert Lists (แจ้งเตือนจริง)
  const lowStockItems = inventoryItems.filter(i => i.stockQty <= i.minQty);
  const overdueBorrows = borrowRequests.filter(b => b.dueDate && new Date(b.dueDate) < new Date() && b.status !== 'คืนแล้ว');
  const pendingApprovals = repairRequests.filter(r => r.status.includes('อนุมัติ') || r.status.includes('รอ'));

  const alertsList: Array<{ color: string; text: string; time: string; tab: string }> = [
    ...(lowStockItems.length > 0 ? [{
      color: 'bg-amber-400',
      text: `พัสดุใกล้หมดคลัง (${lowStockItems[0].name})`,
      time: 'เรียลไทม์',
      tab: 'inventory'
    }] : []),
    ...(overdueBorrows.length > 0 ? [{
      color: 'bg-rose-400',
      text: `ยืมครุภัณฑ์เกินกำหนด (${overdueBorrows.length} รายการ)`,
      time: 'เรียลไทม์',
      tab: 'borrow'
    }] : []),
    ...(pendingApprovals.length > 0 ? [{
      color: 'bg-sky-400',
      text: `ใบแจ้งซ่อมรออนุมัติ (${pendingApprovals.length} รายการ)`,
      time: 'เรียลไทม์',
      tab: 'repair'
    }] : [])
  ];

  if (alertsList.length === 0) {
    alertsList.push({
      color: 'bg-emerald-400',
      text: 'ระบบทำงานเป็นปกติ ไม่มีแจ้งเตือนค้างอยู่',
      time: 'ปกติ',
      tab: 'dashboard'
    });
  }

  // 8. Dynamic Progress Metrics (สัดส่วนจริง)
  const returnedBorrowsCount = borrowRequests.filter(b => b.status === 'คืนแล้ว').length;
  const borrowReturnRate = borrowRequests.length > 0 
    ? Math.round((returnedBorrowsCount / borrowRequests.length) * 100) 
    : 100;

  const completedRepairsCount = repairRequests.filter(r => r.status === 'ปิดงาน' || r.status === 'รับของเรียบร้อย' || r.status === 'ซ่อมเสร็จ').length;
  const repairCompleteRate = repairRequests.length > 0 
    ? Math.round((completedRepairsCount / repairRequests.length) * 100) 
    : 100;

  const normalStockCount = inventoryItems.filter(i => i.stockQty > i.minQty).length;
  const inventoryStockRate = inventoryItems.length > 0 
    ? Math.round((normalStockCount / inventoryItems.length) * 100) 
    : 100;

  return (
    <div className="space-y-4 font-['Sarabun',sans-serif]">
      
      {/* ROW 1: TOP 5 SUMMARY KPI CARDS (DYNAMIC REAL DATA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* KPI 1: Total Assets */}
        <div 
          onClick={() => setActiveTab('assets')}
          className="bg-gradient-to-br from-[#1E88E5] to-[#1565C0] text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-100">ครุภัณฑ์ทั้งหมด</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black">{totalAssetsCount.toLocaleString()}</span>
              <span className="text-xs text-blue-100 font-bold">รายการ</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-blue-100 mt-2 font-semibold">
              <span className="flex items-center text-emerald-200 font-bold">
                <TrendingUp className="w-3 h-3 mr-0.5" /> เรียลไทม์
              </span>
              <span>100%</span>
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-white h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Asset Valuation */}
        <div 
          onClick={() => setActiveTab('assets')}
          className="bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-100">มูลค่าครุภัณฑ์รวม</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black">{totalAssetValue.toLocaleString()}</span>
              <span className="text-xs text-emerald-100 font-bold">บ.</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-emerald-100 mt-2 font-semibold">
              <span className="flex items-center text-emerald-200 font-bold">
                <TrendingUp className="w-3 h-3 mr-0.5" /> ตามมูลค่าจริง
              </span>
              <span>100%</span>
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-white h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* KPI 3: Remaining Inventory */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="bg-gradient-to-br from-[#8E24AA] to-[#6A1B9A] text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-100">วัสดุคงเหลือรวม</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black">{totalInventoryCount.toLocaleString()}</span>
              <span className="text-xs text-purple-100 font-bold">ชิ้น</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-purple-100 mt-2 font-semibold">
              <span className="flex items-center text-emerald-200 font-bold">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {inventoryItems.length} ชนิด
              </span>
              <span>{inventoryStockRate}%</span>
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-white h-full rounded-full" style={{ width: `${inventoryStockRate}%` }}></div>
            </div>
          </div>
        </div>

        {/* KPI 4: Pending Repairs */}
        <div 
          onClick={() => setActiveTab('repair')}
          className="bg-gradient-to-br from-[#FB8C00] to-[#E65100] text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-orange-100">รายการรอซ่อม</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black">{totalPendingRepairs}</span>
              <span className="text-xs text-orange-100 font-bold">รายการ</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-orange-100 mt-2 font-semibold">
              <span className="flex items-center text-amber-200 font-bold">
                <TrendingDown className="w-3 h-3 mr-0.5" /> จาก {repairRequests.length} ใบแจ้งซ่อม
              </span>
              <span>{repairCompleteRate}%</span>
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-white h-full rounded-full" style={{ width: `${repairCompleteRate}%` }}></div>
            </div>
          </div>
        </div>

        {/* KPI 5: Important Alerts */}
        <div className="bg-gradient-to-br from-[#E53935] to-[#C62828] text-white p-3.5 rounded-2xl shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/20 pb-1.5 mb-1.5">
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-extrabold text-white">แจ้งเตือนสำคัญ</span>
            </div>
            <button 
              onClick={() => setActiveTab(alertsList[0]?.tab || 'inventory')} 
              className="text-[10px] text-amber-200 hover:text-white font-bold flex items-center cursor-pointer"
            >
              ดูทั้งหมด <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {alertsList.slice(0, 3).map((alert, idx) => (
              <div key={idx} className="bg-black/20 px-2 py-1 rounded-lg flex items-center justify-between text-white">
                <span className="flex items-center min-w-0">
                  <span className={`w-2 h-2 rounded-full ${alert.color} mr-1.5 shrink-0`}></span>
                  <span className="truncate">{alert.text}</span>
                </span>
                <span className="text-[9px] text-slate-200 shrink-0 ml-1">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ROW 2: 3 ANALYTICS PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Panel 1: Bar Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#091D38] text-white px-4 py-2.5 flex items-center justify-between border-b border-blue-900/50">
            <div className="flex items-center space-x-2 font-bold text-xs">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>สถิติครุภัณฑ์แยกตามประเภทจริง</span>
            </div>
            <select 
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              className="bg-[#0F2F57] text-sky-200 text-xs px-2.5 py-1 rounded-lg border border-blue-400/30 outline-hidden font-semibold cursor-pointer"
            >
              <option value="2568">ปีงบประมาณ 2568</option>
              <option value="2567">ปีงบประมาณ 2567</option>
            </select>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartDisplayData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="count" position="top" style={{ fill: '#0F172A', fontWeight: 'bold', fontSize: '11px' }} />
                    {barChartDisplayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-5 gap-1 pt-3 border-t border-slate-100 text-center text-[10px] font-semibold text-slate-600">
              {barChartDisplayData.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-base mb-0.5">📦</span>
                  <span className="truncate max-w-full font-bold">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 2: Donut Chart (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#091D38] text-white px-4 py-2.5 flex items-center space-x-2 font-bold text-xs border-b border-blue-900/50">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>สัดส่วนสถานะครุภัณฑ์จริง</span>
          </div>

          <div className="p-4 flex-1 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-black text-slate-900 leading-tight">{totalAssetsCount}</span>
                <span className="text-[10px] text-slate-500 font-bold">รายการ</span>
              </div>
            </div>

            <div className="w-full space-y-1.5 pt-3 mt-2 border-t border-slate-100 text-[11px]">
              {statusPieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-700 font-semibold">{item.name} ({item.value})</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{item.percent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 3: Recent Activity List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#091D38] text-white px-4 py-2.5 flex items-center justify-between border-b border-blue-900/50">
            <div className="flex items-center space-x-2 font-bold text-xs">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>กิจกรรมในระบบล่าสุด</span>
            </div>
            <button 
              onClick={() => setActiveTab('reports')}
              className="text-[10px] text-sky-300 hover:text-white font-bold flex items-center cursor-pointer"
            >
              ดูทั้งหมด <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 text-xs flex-1">
            {recentActivities.length > 0 ? (
              recentActivities.map((act, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0">{act.time}</span>
                    <span className={`w-4 h-4 rounded-md ${act.badgeColor} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                      📋
                    </span>
                    <span className="text-slate-800 font-medium truncate text-[11px]">{act.text}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 shrink-0 bg-slate-100 px-2 py-0.5 rounded-md">
                    {act.user}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">ยังไม่มีบันทึกกิจกรรมในระบบ</div>
            )}
          </div>
        </div>

      </div>

      {/* ROW 3: FEATURED TABLE, PROGRESS REPORT & QUICK MENU GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Panel 1: Featured Assets Table (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="bg-[#091D38] text-white px-4 py-2.5 flex items-center space-x-2 font-bold text-xs border-b border-blue-900/50">
            <span>🏆 ครุภัณฑ์มูลค่าสูงสุด (เรียงลำดับตามมูลค่าจริง)</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#0F2F57] text-sky-200 font-bold text-[11px]">
                <tr>
                  <th className="p-2.5 text-center">ลำดับ</th>
                  <th className="p-2.5">เลขทะเบียน</th>
                  <th className="p-2.5">ชื่อครุภัณฑ์</th>
                  <th className="p-2.5">หน่วยงาน</th>
                  <th className="p-2.5 text-center">สถานะ</th>
                  <th className="p-2.5 text-right">มูลค่า (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {topFeaturedAssets.length > 0 ? (
                  topFeaturedAssets.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 font-medium text-slate-700">
                      <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-mono text-slate-600">{item.code}</td>
                      <td className="p-2.5 font-bold text-slate-900 truncate max-w-[110px]">{item.name}</td>
                      <td className="p-2.5 text-slate-600 truncate max-w-[90px]">{item.dept}</td>
                      <td className="p-2.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.statusColor}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white mr-1"></span>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                        {item.price.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400 text-xs">ยังไม่มีครุภัณฑ์ในระบบ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: Progress Report & Depreciation summary (3 cols) */}
        <div className="lg:col-span-3 space-y-3 flex flex-col justify-between">
          
          {/* Progress Metrics Box */}
          <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-bold text-[#091D38]">📊 สรุปรายงานสถานะจริง</span>
              <select 
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700 outline-hidden cursor-pointer"
              >
                <option value="เดือนนี้">เดือนนี้ ▾</option>
                <option value="ไตรมาสนี้">ไตรมาสนี้</option>
              </select>
            </div>

            <div className="space-y-2 text-[11px]">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                  <span>การคืนพัสดุยืม</span>
                  <span className="font-bold text-blue-600">{borrowReturnRate}% <span className="text-[9px] text-slate-400 font-normal">({returnedBorrowsCount}/{borrowRequests.length})</span></span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${borrowReturnRate}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                  <span>งานซ่อมบำรุงแล้วเสร็จ</span>
                  <span className="font-bold text-emerald-600">{repairCompleteRate}% <span className="text-[9px] text-slate-400 font-normal">({completedRepairsCount}/{repairRequests.length})</span></span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${repairCompleteRate}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                  <span>วัสดุคงคลังปกติ</span>
                  <span className="font-bold text-purple-600">{inventoryStockRate}% <span className="text-[9px] text-slate-400 font-normal">({normalStockCount}/{inventoryItems.length})</span></span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${inventoryStockRate}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Depreciation Emerald Box */}
          <div 
            onClick={() => setActiveTab('depreciation')}
            className="bg-gradient-to-br from-[#00B67A] to-[#00875A] text-white p-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-between relative overflow-hidden"
          >
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-100 mb-1">
                <span>🟩 ค่าเสื่อมราคาสะสมจริง</span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-md">ดูรายละเอียด &gt;</span>
              </div>
              <div className="text-xl font-black tracking-tight font-mono">{totalAccumulatedDepreciation.toLocaleString()} บ.</div>
              <div className="text-[10px] text-emerald-100 font-semibold">คำนวณแบบเส้นตรงตามอายุการใช้งานจริง</div>
            </div>
            <div className="text-3xl opacity-80 shrink-0 ml-2">🪙</div>
          </div>

        </div>

        {/* Panel 3: Quick Action Menu Grid (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#091D38] text-white px-4 py-2.5 flex items-center space-x-2 font-bold text-xs border-b border-blue-900/50">
            <span className="text-amber-400 text-sm">⚡</span>
            <span>เมนูด่วนเข้าใช้งาน</span>
          </div>

          <div className="p-3 grid grid-cols-3 gap-2 text-center flex-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="bg-sky-50 hover:bg-sky-100 border border-sky-200 p-2.5 rounded-xl transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer group"
            >
              <div className="p-2 bg-sky-500 text-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">แดชบอร์ด<br />ภาพรวม</span>
            </button>

            <button 
              onClick={() => setActiveTab('assets')}
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-2.5 rounded-xl transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer group"
            >
              <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                <Monitor className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">ทะเบียน<br />ครุภัณฑ์</span>
            </button>

            <button 
              onClick={() => setActiveTab('inventory')}
              className="bg-amber-50 hover:bg-amber-100 border border-amber-200 p-2.5 rounded-xl transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer group"
            >
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">เบิกวัสดุ<br />พส.1</span>
            </button>

            <button 
              onClick={() => setActiveTab('borrow')}
              className="bg-purple-50 hover:bg-purple-100 border border-purple-200 p-2.5 rounded-xl transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer group"
            >
              <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">ยืม-คืน<br />ครุภัณฑ์</span>
            </button>

            <button 
              onClick={() => setActiveTab('repair')}
              className="bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 p-2.5 rounded-xl transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer group"
            >
              <div className="p-2 bg-cyan-500 text-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">แจ้งซ่อม<br />ครุภัณฑ์</span>
            </button>

            <button 
              onClick={() => setActiveTab('depreciation')}
              className="bg-teal-50 hover:bg-teal-100 border border-teal-200 p-2.5 rounded-xl transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer group"
            >
              <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">ตรวจนับ<br />ประจำปี</span>
            </button>

            <button 
              onClick={() => setActiveTab('assets')}
              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 p-2.5 rounded-xl transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer group"
            >
              <div className="p-2 bg-rose-500 text-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                <Trash2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">จำหน่าย<br />พัสดุ</span>
            </button>

            <button 
              onClick={() => setActiveTab('reports')}
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 p-2.5 rounded-xl transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer group"
            >
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">รายงาน<br />ทั้งหมด</span>
            </button>

            <button 
              onClick={() => setActiveTab('settings')}
              className="bg-amber-50 hover:bg-amber-100 border border-amber-200 p-2.5 rounded-xl transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer group"
            >
              <div className="p-2 bg-amber-600 text-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">ตั้งค่า<br />ระบบ</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
