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
  FileSpreadsheet,
  QrCode,
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

export const DashboardView: React.FC = () => {
  const { 
    setActiveTab
  } = useApp();

  const [fiscalYear, setFiscalYear] = useState('2568');
  const [reportPeriod, setReportPeriod] = useState('เดือนนี้');

  // Core Metric Calculations matching the reference dashboard
  const totalAssetsCount = 1250;
  const totalInventoryCount = 12580;
  const totalPendingRepairs = 23;

  // Bar Chart Data (สถิติครุภัณฑ์แยกตามประเภท)
  const categoryBarData = [
    { name: 'คอมพิวเตอร์', count: 320, fill: '#38BDF8', icon: '💻' },
    { name: 'เครื่องพิมพ์', count: 280, fill: '#F59E0B', icon: '🖨️' },
    { name: 'เฟอร์นิเจอร์', count: 210, fill: '#10B981', icon: '🪑' },
    { name: 'เครื่องมือ/อุปกรณ์', count: 180, fill: '#3B82F6', icon: '🛠️' },
    { name: 'อื่นๆ', count: 120, fill: '#A855F7', icon: '💬' },
  ];

  // Donut Chart Data (สถานะครุภัณฑ์)
  const statusPieData = [
    { name: 'ใช้งาน', value: 905, percent: '72.4%', color: '#10B981' },
    { name: 'ชำรุด', value: 158, percent: '12.6%', color: '#F59E0B' },
    { name: 'ส่งซ่อม', value: 101, percent: '8.1%', color: '#3B82F6' },
    { name: 'จำหน่ายแล้ว', value: 86, percent: '6.9%', color: '#A855F7' },
  ];

  // Featured Assets Top 5
  const topFeaturedAssets = [
    { id: '1', code: 'ทร-00123', name: 'คอมพิวเตอร์ตั้งโต๊ะ', dept: 'สำนักปลัด', status: 'ใช้งาน', statusColor: 'bg-emerald-500', price: 25000 },
    { id: '2', code: 'ทร-00124', name: 'เครื่องพิมพ์เลเซอร์', dept: 'กองคลัง', status: 'ใช้งาน', statusColor: 'bg-emerald-500', price: 18000 },
    { id: '3', code: 'ทร-00125', name: 'โปรเจคเตอร์', dept: 'กองการศึกษา', status: 'ใช้งาน', statusColor: 'bg-emerald-500', price: 16500 },
    { id: '4', code: 'ทร-00126', name: 'เครื่องปรับอากาศ', dept: 'กองสาธารณสุข', status: 'ชำรุด', statusColor: 'bg-amber-500', price: 45000 },
    { id: '5', code: 'ทร-00127', name: 'เครื่องสำรองไฟ', dept: 'สำนักปลัด', status: 'ใช้งาน', statusColor: 'bg-emerald-500', price: 8500 },
  ];

  // Activity Log Today
  const todayActivities = [
    { time: '14:20', badgeColor: 'bg-emerald-500', text: 'เพิ่มรายการยืมครุภัณฑ์ (โน้ตบุ๊ก)', user: 'น.ส.กมลวรรณ' },
    { time: '13:55', badgeColor: 'bg-amber-500', text: 'รับวัสดุเข้าคลัง (กระดาษ A4)', user: 'นายสมชาย' },
    { time: '13:40', badgeColor: 'bg-emerald-500', text: 'บันทึกผลตรวจนับประจำปี 2568', user: 'นายอนันต์' },
    { time: '12:30', badgeColor: 'bg-yellow-500', text: 'อนุมัติใบเบิกวัสดุ (พส.1)', user: 'น.ส.สุชาวดี' },
    { time: '11:50', badgeColor: 'bg-blue-500', text: 'แจ้งซ่อมเครื่องปริ้นเตอร์', user: 'นายธีรชัย' },
  ];

  return (
    <div className="space-y-4 font-['Sarabun',sans-serif]">
      
      {/* ROW 1: TOP 5 SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* KPI 1: Total Assets (Blue Gradient) */}
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
                <TrendingUp className="w-3 h-3 mr-0.5" /> +2%
              </span>
              <span>95%</span>
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-white h-full rounded-full" style={{ width: '95%' }}></div>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Asset Valuation (Green Gradient) */}
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
              <span className="text-2xl font-black">48,750,000</span>
              <span className="text-xs text-emerald-100 font-bold">บ.</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-emerald-100 mt-2 font-semibold">
              <span className="flex items-center text-emerald-200 font-bold">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +1.5%
              </span>
              <span>92%</span>
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-white h-full rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
        </div>

        {/* KPI 3: Remaining Inventory (Purple Gradient) */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="bg-gradient-to-br from-[#8E24AA] to-[#6A1B9A] text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-100">วัสดุคงเหลือ</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black">{totalInventoryCount.toLocaleString()}</span>
              <span className="text-xs text-purple-100 font-bold">รายการ</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-purple-100 mt-2 font-semibold">
              <span className="flex items-center text-emerald-200 font-bold">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +3%
              </span>
              <span>88%</span>
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-white h-full rounded-full" style={{ width: '88%' }}></div>
            </div>
          </div>
        </div>

        {/* KPI 4: Pending Repairs (Orange Gradient) */}
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
                <TrendingDown className="w-3 h-3 mr-0.5" /> -8%
              </span>
              <span>76%</span>
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-white h-full rounded-full" style={{ width: '76%' }}></div>
            </div>
          </div>
        </div>

        {/* KPI 5: Important Alerts (Red / Amber Gradient Card) */}
        <div className="bg-gradient-to-br from-[#E53935] to-[#C62828] text-white p-3.5 rounded-2xl shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/20 pb-1.5 mb-1.5">
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-extrabold text-white">แจ้งเตือนสำคัญ</span>
            </div>
            <button 
              onClick={() => setActiveTab('inventory')} 
              className="text-[10px] text-amber-200 hover:text-white font-bold flex items-center"
            >
              ดูทั้งหมด <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="bg-black/20 px-2 py-1 rounded-lg flex items-center justify-between text-white">
              <span className="flex items-center min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 shrink-0"></span>
                <span className="truncate">พัสดุใกล้หมด (กระดาษ A4)</span>
              </span>
              <span className="text-[9px] text-slate-200 shrink-0 ml-1">10 นาทีที่แล้ว</span>
            </div>
            <div className="bg-black/20 px-2 py-1 rounded-lg flex items-center justify-between text-white">
              <span className="flex items-center min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5 shrink-0"></span>
                <span className="truncate">ยืมครุภัณฑ์เกินกำหนด (โน้ตบุ๊ก)</span>
              </span>
              <span className="text-[9px] text-slate-200 shrink-0 ml-1">1 ชม.ที่แล้ว</span>
            </div>
            <div className="bg-black/20 px-2 py-1 rounded-lg flex items-center justify-between text-white">
              <span className="flex items-center min-w-0">
                <span className="w-2 h-2 rounded-full bg-rose-300 mr-1.5 shrink-0"></span>
                <span className="truncate">รออนุมัติใบเบิกพัสดุ (พส.1)</span>
              </span>
              <span className="text-[9px] text-slate-200 shrink-0 ml-1">2 ชม.ที่แล้ว</span>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: 3 ANALYTICS PANELS (WITH NAVY HEADER BARS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Panel 1: Bar Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#091D38] text-white px-4 py-2.5 flex items-center justify-between border-b border-blue-900/50">
            <div className="flex items-center space-x-2 font-bold text-xs">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>สถิติครุภัณฑ์แยกตามประเภท</span>
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
                <BarChart data={categoryBarData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="count" position="top" style={{ fill: '#0F172A', fontWeight: 'bold', fontSize: '11px' }} />
                    {categoryBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-5 gap-1 pt-3 border-t border-slate-100 text-center text-[10px] font-semibold text-slate-600">
              <div className="flex flex-col items-center">
                <span className="text-base mb-0.5">💻</span>
                <span>คอมพิวเตอร์</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base mb-0.5">🖨️</span>
                <span>เครื่องพิมพ์</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base mb-0.5">🪑</span>
                <span>เฟอร์นิเจอร์</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base mb-0.5">🛠️</span>
                <span className="truncate max-w-full">เครื่องมือ/อุปกรณ์</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base mb-0.5">💬</span>
                <span>อื่นๆ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Donut Chart (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#091D38] text-white px-4 py-2.5 flex items-center space-x-2 font-bold text-xs border-b border-blue-900/50">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>สถานะครุภัณฑ์</span>
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
                <span className="text-sm font-black text-slate-900 leading-tight">1,250</span>
                <span className="text-[10px] text-slate-500 font-bold">รายการ</span>
              </div>
            </div>

            <div className="w-full space-y-1.5 pt-3 mt-2 border-t border-slate-100 text-[11px]">
              {statusPieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-700 font-semibold">{item.name}</span>
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
              <span>กิจกรรมล่าสุด วันนี้</span>
            </div>
            <button 
              onClick={() => setActiveTab('reports')}
              className="text-[10px] text-sky-300 hover:text-white font-bold flex items-center"
            >
              ดูทั้งหมด <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 text-xs flex-1">
            {todayActivities.map((act, idx) => (
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
            ))}
          </div>
        </div>

      </div>

      {/* ROW 3: FEATURED TABLE, PROGRESS REPORT & QUICK MENU GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Panel 1: Featured Assets Table (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="bg-[#091D38] text-white px-4 py-2.5 flex items-center space-x-2 font-bold text-xs border-b border-blue-900/50">
            <span>🏆 รายการครุภัณฑ์เด่น (5 อันดับแรก)</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#0F2F57] text-sky-200 font-bold text-[11px]">
                <tr>
                  <th className="p-2.5 text-center">ลำดับ</th>
                  <th className="p-2.5">เลขทะเบียน</th>
                  <th className="p-2.5">ชื่อครุภัณฑ์</th>
                  <th className="p-2.5">กองงาน</th>
                  <th className="p-2.5 text-center">สถานะ</th>
                  <th className="p-2.5 text-right">มูลค่า (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {topFeaturedAssets.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 font-medium text-slate-700">
                    <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-mono text-slate-600">{item.code}</td>
                    <td className="p-2.5 font-bold text-slate-900 truncate max-w-[110px]">{item.name}</td>
                    <td className="p-2.5 text-slate-600">{item.dept}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: Progress Report & Depreciation summary (3 cols) */}
        <div className="lg:col-span-3 space-y-3 flex flex-col justify-between">
          
          {/* Progress Metrics Box */}
          <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-bold text-[#091D38]">📊 สรุปรายงานสำคัญ</span>
              <select 
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700 outline-hidden"
              >
                <option value="เดือนนี้">เดือนนี้ ▾</option>
                <option value="ไตรมาสนี้">ไตรมาสนี้</option>
              </select>
            </div>

            <div className="space-y-2 text-[11px]">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                  <span>การยืมคืนครุภัณฑ์</span>
                  <span className="font-bold text-blue-600">78% <span className="text-[9px] text-slate-400 font-normal">(39/50)</span></span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                  <span>การเบิกวัสดุคลังย่อย</span>
                  <span className="font-bold text-emerald-600">65% <span className="text-[9px] text-slate-400 font-normal">(130/200)</span></span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                  <span>การตรวจนับประจำปี</span>
                  <span className="font-bold text-purple-600">100% <span className="text-[9px] text-emerald-600 font-bold">(เสร็จสิ้น)</span></span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '100%' }}></div>
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
                <span>🟩 สรุปค่าเสื่อมราคา</span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-md">ดูข้อมูล &gt;</span>
              </div>
              <div className="text-xl font-black tracking-tight font-mono">12,560,750 บ.</div>
              <div className="text-[10px] text-emerald-100 font-semibold">ค่าเสื่อมราคาสะสม</div>
              <div className="text-[10px] text-emerald-200 font-bold mt-0.5 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +2.5% จากเดือนที่แล้ว
              </div>
            </div>
            <div className="text-3xl opacity-80 shrink-0 ml-2">🪙</div>
          </div>

        </div>

        {/* Panel 3: Quick Action Menu Grid (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#091D38] text-white px-4 py-2.5 flex items-center space-x-2 font-bold text-xs border-b border-blue-900/50">
            <span className="text-amber-400 text-sm">⚡</span>
            <span>เมนูด่วน</span>
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
