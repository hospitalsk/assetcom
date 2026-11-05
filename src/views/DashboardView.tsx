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
  Boxes
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { assets, inventoryItems, repairRequests, departments, assetCategories } = useApp();

  // Calculations
  const totalAssets = assets.length;
  const activeAssets = assets.filter(a => a.status === 'พร้อมใช้งาน' || a.status === 'กำลังใช้งาน').length;
  const repairingAssets = assets.filter(a => a.status === 'กำลังซ่อม').length;
  const availableAssets = assets.filter(a => a.status === 'ว่าง').length;
  
  const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + (item.stockQty * item.unitPrice), 0);
  const totalAssetPrice = assets.reduce((sum, a) => sum + a.purchasePrice, 0);
  const totalDepreciation = assets.reduce((sum, a) => {
    const ageYears = 2; // simulated years elapsed
    const annualDep = (a.purchasePrice - a.salvageValue) / a.usefulLife;
    return sum + Math.min(a.purchasePrice - a.salvageValue, annualDep * ageYears);
  }, 0);

  const lowStockItems = inventoryItems.filter(i => i.stockQty <= i.minQty);

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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ภาพรวมระบบ (Dashboard & Analytics)</h2>
          <p className="text-xs text-slate-500 mt-1">
            ระบบบริหารจัดการครุภัณฑ์และวัสดุคอมพิวเตอร์ โรงพยาบาลและหน่วยงานภาครัฐ
          </p>
        </div>
      </div>

      {/* Summary Cards Grid (8 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">จำนวนครุภัณฑ์ทั้งหมด</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalAssets}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">รายการตามทะเบียน</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Monitor className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">ครุภัณฑ์พร้อม/กำลังใช้งาน</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{activeAssets}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">สถานะปกติ</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">ครุภัณฑ์กำลังซ่อม</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{repairingAssets}</h3>
            <span className="text-[11px] text-rose-500 font-semibold mt-1 inline-block">ต้องเร่งติดตาม</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">ครุภัณฑ์ว่าง</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{availableAssets}</h3>
            <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-block">พร้อมจ่ายออก</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">มูลค่าครุภัณฑ์รวม</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">฿{totalAssetPrice.toLocaleString()}</h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">ราคาทุนจัดซื้อ</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">ค่าเสื่อมราคาสะสม</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">฿{totalDepreciation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">ตามวิธีเส้นตรง</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">มูลค่าวัสดุคงเหลือ</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">฿{totalInventoryValue.toLocaleString()}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">{inventoryItems.length} รายการพัสดุ</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">วัสดุใกล้หมดสต็อก</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{lowStockItems.length}</h3>
            <span className="text-[11px] text-rose-500 font-semibold mt-1 inline-block">ต้องสั่งซื้อเพิ่ม</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">จำนวนครุภัณฑ์แยกตามประเภท</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">จำนวนครุภัณฑ์แยกตามหน่วยงาน</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0EA5E9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
