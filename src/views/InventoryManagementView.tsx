import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  Plus,
  Search,
  UserCheck,
  FileBarChart2,
  Printer,
  Download,
  Calendar,
  Building2,
  RotateCcw,
  ClipboardList,
  Layers,
  Wallet
} from 'lucide-react';
import { showSwalAlert, showSwalToast } from '../utils/swal';
import { PrintDocumentModal } from '../components/PrintDocumentModal';

export const InventoryManagementView: React.FC = () => {
  const {
    inventoryItems,
    inventoryCategories,
    inventoryTransactions,
    addInventoryItem,
    processInventoryTransaction,
    departments,
    users,
    currentUser,
    assetLocations
  } = useApp();

  const [activeTab, setActiveTab] = useState<'stock' | 'withdrawal_report'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrxModal, setShowTrxModal] = useState<{ item: any; type: 'รับเข้าสต็อก' | 'เบิกวัสดุ' | 'ปรับปรุงยอด' } | null>(null);

  // Withdrawal report filter & print states
  const [reportSearch, setReportSearch] = useState('');
  const [reportDeptId, setReportDeptId] = useState<string>('all');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [showReportPrintModal, setShowReportPrintModal] = useState(false);

  // Role permission: Only Admin, Super Admin, Supply Officer, IT Officer can receive inventory or add new items
  const roleClean = (currentUser.role || '').toLowerCase().trim();
  const canReceiveInventory =
    roleClean.includes('admin') ||
    roleClean.includes('supply') ||
    roleClean.includes('it') ||
    roleClean === 'super admin' ||
    roleClean === 'admin' ||
    roleClean === 'supply officer' ||
    roleClean === 'it officer';

  // New item form
  const [newItem, setNewItem] = useState({
    itemCode: `INV-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    categoryId: inventoryCategories[0]?.id || '',
    unit: 'ชิ้น',
    unitPrice: 100,
    stockQty: 10,
    minQty: 5,
    location: assetLocations[0] || 'คลังพัสดุ IT ชั้น 3',
    supplier: '',
    notes: ''
  });

  // Transaction form state
  const [trxQty, setTrxQty] = useState(1);
  const [trxUnitPrice, setTrxUnitPrice] = useState(100);
  const [trxMinQty, setTrxMinQty] = useState(5);
  const [trxDeptId, setTrxDeptId] = useState(currentUser.departmentId);
  const [trxNotes, setTrxNotes] = useState('');

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Enrich withdrawal transactions ('เบิกวัสดุ')
  const enrichedWithdrawals = useMemo(() => {
    return inventoryTransactions
      .filter((t) => t.transactionType === 'เบิกวัสดุ')
      .map((t) => {
        const item = inventoryItems.find((i) => i.id === t.itemId);
        const dept = departments.find((d) => d.id === t.departmentId);
        const requester = users.find((u) => u.id === t.userId);
        const unitPrice = item?.unitPrice || 0;
        const totalValue = t.quantity * unitPrice;
        const dateObj = new Date(t.createdAt);
        const isoDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : '';
        const formattedDate = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : t.createdAt;
        const formattedTime = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit'
            })
          : '';

        return {
          ...t,
          itemCode: item?.itemCode || '-',
          itemName: item?.name || 'รายการวัสดุที่ถูกลบ',
          unit: item?.unit || 'ชิ้น',
          unitPrice,
          totalValue,
          deptName: dept?.name || 'ไม่ระบุหน่วยงาน',
          requesterName: requester?.name || currentUser.name || 'ไม่ระบุผู้เบิก',
          requesterPosition: requester?.position || '',
          isoDate,
          formattedDate,
          formattedTime
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [inventoryTransactions, inventoryItems, departments, users, currentUser.name]);

  const filteredWithdrawals = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    return enrichedWithdrawals.filter((row) => {
      if (reportDeptId !== 'all' && row.departmentId !== reportDeptId) return false;
      if (reportStartDate && row.isoDate && row.isoDate < reportStartDate) return false;
      if (reportEndDate && row.isoDate && row.isoDate > reportEndDate) return false;
      if (q) {
        const haystack = [
          row.itemCode,
          row.itemName,
          row.requesterName,
          row.deptName,
          row.notes,
          row.referenceNo || ''
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [enrichedWithdrawals, reportSearch, reportDeptId, reportStartDate, reportEndDate]);

  // Summary metrics & breakdowns for the filtered withdrawal report
  const withdrawalSummary = useMemo(() => {
    const totalCount = filteredWithdrawals.length;
    const totalQty = filteredWithdrawals.reduce((sum, r) => sum + r.quantity, 0);
    const totalValue = filteredWithdrawals.reduce((sum, r) => sum + r.totalValue, 0);

    const byDeptMap = new Map<
      string,
      { departmentId: string; deptName: string; count: number; totalQty: number; totalValue: number }
    >();
    const byItemMap = new Map<
      string,
      { itemId: string; itemCode: string; itemName: string; unit: string; count: number; totalQty: number; totalValue: number }
    >();

    filteredWithdrawals.forEach((r) => {
      const existingDept = byDeptMap.get(r.departmentId) || {
        departmentId: r.departmentId,
        deptName: r.deptName,
        count: 0,
        totalQty: 0,
        totalValue: 0
      };
      existingDept.count += 1;
      existingDept.totalQty += r.quantity;
      existingDept.totalValue += r.totalValue;
      byDeptMap.set(r.departmentId, existingDept);

      const existingItem = byItemMap.get(r.itemId) || {
        itemId: r.itemId,
        itemCode: r.itemCode,
        itemName: r.itemName,
        unit: r.unit,
        count: 0,
        totalQty: 0,
        totalValue: 0
      };
      existingItem.count += 1;
      existingItem.totalQty += r.quantity;
      existingItem.totalValue += r.totalValue;
      byItemMap.set(r.itemId, existingItem);
    });

    const deptBreakdown = Array.from(byDeptMap.values()).sort((a, b) => b.totalValue - a.totalValue || b.totalQty - a.totalQty);
    const itemBreakdown = Array.from(byItemMap.values()).sort((a, b) => b.totalQty - a.totalQty || b.totalValue - a.totalValue);

    return {
      totalCount,
      totalQty,
      totalValue,
      deptBreakdown,
      itemBreakdown,
      topDept: deptBreakdown[0] || null
    };
  }, [filteredWithdrawals]);

  const handleResetReportFilters = () => {
    setReportSearch('');
    setReportDeptId('all');
    setReportStartDate('');
    setReportEndDate('');
  };

  const handleExportWithdrawalCsv = () => {
    if (filteredWithdrawals.length === 0) {
      showSwalAlert('warning', 'ไม่พบข้อมูลสำหรับส่งออก', 'กรุณาตรวจสอบตัวกรองหรือทำรายการเบิกวัสดุก่อนส่งออกไฟล์');
      return;
    }

    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'ลำดับ',
      'วันที่เบิก',
      'เวลา',
      'รหัสวัสดุ',
      'ชื่อรายการวัสดุ',
      'จำนวนที่เบิก',
      'หน่วยนับ',
      'ราคาต่อหน่วย (บาท)',
      'มูลค่ารวม (บาท)',
      'คงเหลือหลังเบิก',
      'ผู้เบิกวัสดุ',
      'หน่วยงานที่เบิก',
      'หมายเหตุ'
    ];

    const rows = filteredWithdrawals.map((r, idx) => [
      idx + 1,
      r.formattedDate,
      r.formattedTime,
      r.itemCode,
      r.itemName,
      r.quantity,
      r.unit,
      r.unitPrice,
      r.totalValue,
      r.remainingQty,
      r.requesterName,
      r.deptName,
      r.notes
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `รายงานการเบิกวัสดุ_${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSwalToast('success', 'ส่งออกรายงานการเบิกวัสดุ (CSV) เรียบร้อยแล้ว');
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReceiveInventory) {
      showSwalAlert('error', 'สิทธิ์ไม่เพียงพอ!', 'เฉพาะ user: admin, user: supply officer, และ user: IT officer เท่านั้นที่สามารถรับเข้าวัสดุได้');
      return;
    }
    addInventoryItem({
      ...newItem,
      lastReceivedDate: new Date().toISOString().split('T')[0]
    });
    showSwalToast('success', 'เพิ่มรายการวัสดุเรียบร้อยแล้ว');
    setShowAddModal(false);
    setNewItem({
      itemCode: `INV-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      categoryId: inventoryCategories[0]?.id || '',
      unit: 'ชิ้น',
      unitPrice: 100,
      stockQty: 10,
      minQty: 5,
      location: assetLocations[0] || 'คลังพัสดุ IT ชั้น 3',
      supplier: '',
      notes: ''
    });
  };

  const handleProcessTrx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTrxModal) return;

    if (showTrxModal.type === 'รับเข้าสต็อก' && !canReceiveInventory) {
      showSwalAlert('error', 'สิทธิ์ไม่เพียงพอ!', 'เฉพาะ user: admin, user: supply officer, และ user: IT officer เท่านั้นที่สามารถรับเข้าวัสดุได้');
      return;
    }

    processInventoryTransaction(
      showTrxModal.item.id,
      showTrxModal.type,
      trxQty,
      showTrxModal.type === 'รับเข้าสต็อก' ? trxUnitPrice : undefined,
      showTrxModal.type === 'เบิกวัสดุ' ? trxDeptId : undefined,
      trxNotes,
      showTrxModal.type === 'รับเข้าสต็อก' ? trxMinQty : undefined
    );

    setShowTrxModal(null);
    setTrxQty(1);
    setTrxNotes('');
  };

  const selectedReportDeptName =
    reportDeptId === 'all'
      ? 'ทุกหน่วยงาน'
      : departments.find((d) => d.id === reportDeptId)?.name || 'ไม่ระบุหน่วยงาน';

  const reportPeriodLabel =
    reportStartDate || reportEndDate
      ? `${reportStartDate || 'เริ่มต้น'} ถึง ${reportEndDate || 'ปัจจุบัน'}`
      : 'ทั้งหมด';

  return (
    <>
      <div className={`space-y-6 font-['Sarabun',sans-serif] ${showReportPrintModal ? 'print:hidden' : ''}`}>
        {/* Page Header + View Tabs */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">ระบบจัดการวัสดุคอมพิวเตอร์และอะไหล่</h2>
              <p className="text-xs text-slate-500 mt-1">
                รับเข้าพัสดุโดย Admin/Supply/IT • เบิกวัสดุได้ทุกผู้ใช้งาน พร้อมแจ้งเตือน IT ทันทีที่มีการเบิก
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'stock' ? 'withdrawal_report' : 'stock')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === 'withdrawal_report'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                }`}
              >
                <FileBarChart2 className="w-4 h-4" />
                <span>{activeTab === 'withdrawal_report' ? 'กลับไปทะเบียนวัสดุคงคลัง' : 'รายงานการเบิกวัสดุ'}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'withdrawal_report' ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {enrichedWithdrawals.length}
                </span>
              </button>
              {canReceiveInventory && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มรายการวัสดุใหม่ (รับเข้า)</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'stock'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>ทะเบียนวัสดุคงคลัง ({inventoryItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('withdrawal_report')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'withdrawal_report'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>รายงานการเบิกวัสดุ ({enrichedWithdrawals.length})</span>
            </button>
          </div>
        </div>

        {activeTab === 'stock' ? (
          <>
            {/* Search & Low Stock Warning */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="ค้นหารหัส, ชื่อวัสดุ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>
              <div className="text-xs text-slate-500 font-medium flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>รายการวัสดุทั้งหมด: {inventoryItems.length} รายการ</span>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">รหัสวัสดุ</th>
                      <th className="p-4">ชื่อวัสดุ / ผู้จำหน่าย</th>
                      <th className="p-4 text-center">คงเหลือ</th>
                      <th className="p-4 text-center">จุดสั่งซื้อ (Min)</th>
                      <th className="p-4">ราคาต่อหน่วย</th>
                      <th className="p-4">สถานที่จัดเก็บ</th>
                      <th className="p-4 text-center">ทำรายการ (Transaction)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const isLow = item.stockQty <= item.minQty;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-blue-600">{item.itemCode}</td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="text-[11px] text-slate-500">
                              หน่วยนับ: {item.unit} • ผู้จำหน่าย: <span className="font-medium text-slate-700">{item.supplier || '-'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                isLow ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {item.stockQty} {item.unit}
                            </span>
                          </td>
                          <td className="p-4 text-center font-medium text-slate-600">
                            {item.minQty} {item.unit}
                          </td>
                          <td className="p-4 font-semibold">฿{item.unitPrice.toLocaleString()}</td>
                          <td className="p-4 text-slate-600 font-medium">{item.location || '-'}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {canReceiveInventory && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowTrxModal({ item, type: 'รับเข้าสต็อก' });
                                    setTrxUnitPrice(item.unitPrice);
                                    setTrxMinQty(item.minQty);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  รับเข้า
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setShowTrxModal({ item, type: 'เบิกวัสดุ' });
                                  setTrxDeptId(currentUser.departmentId);
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                เบิกวัสดุ
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          ไม่พบรายการวัสดุที่ตรงกับการค้นหา
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Material Withdrawal Report Tab */
          <div className="space-y-5">
            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">จำนวนครั้งที่เบิกวัสดุ</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {withdrawalSummary.totalCount.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ครั้ง</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">ปริมาณวัสดุที่เบิกรวม</div>
                  <div className="text-2xl font-extrabold text-indigo-700 mt-1">
                    {withdrawalSummary.totalQty.toLocaleString()} <span className="text-xs font-semibold text-slate-500">หน่วย</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">มูลค่าการเบิกรวม</div>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                    ฿{withdrawalSummary.totalValue.toLocaleString()}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="text-[11px] font-semibold text-slate-500">หน่วยงานที่เบิกสูงสุด</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-1 truncate" title={withdrawalSummary.topDept?.deptName || '-'}>
                    {withdrawalSummary.topDept?.deptName || '-'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {withdrawalSummary.topDept
                      ? `${withdrawalSummary.topDept.count} ครั้ง • ฿${withdrawalSummary.topDept.totalValue.toLocaleString()}`
                      : 'ยังไม่มีข้อมูลการเบิก'}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Report Filter & Action Toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">ค้นหารายการเบิก</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="ชื่อวัสดุ, รหัสวัสดุ, ชื่อผู้เบิก, หมายเหตุ..."
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">หน่วยงานที่เบิก</label>
                  <select
                    value={reportDeptId}
                    onChange={(e) => setReportDeptId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    <option value="all">ทุกหน่วยงาน ({departments.length})</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>ตั้งแต่วันที่</span>
                  </label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>ถึงวันที่</span>
                  </label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={handleResetReportFilters}
                    title="ล้างตัวกรอง"
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>รีเซ็ต</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  แสดงผล <span className="font-bold text-slate-800">{filteredWithdrawals.length}</span> รายการเบิกวัสดุ
                  {(reportDeptId !== 'all' || reportStartDate || reportEndDate || reportSearch) && (
                    <span className="ml-1 text-blue-600 font-medium">(ตามเงื่อนไขตัวกรองที่เลือก)</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportWithdrawalCsv}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ส่งออก Excel (CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (filteredWithdrawals.length === 0) {
                        showSwalAlert('warning', 'ไม่พบข้อมูลสำหรับพิมพ์รายงาน', 'กรุณาตรวจสอบตัวกรองหรือทำรายการเบิกวัสดุก่อนพิมพ์รายงาน');
                        return;
                      }
                      setShowReportPrintModal(true);
                    }}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์รายงานการเบิกวัสดุ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Withdrawal Transactions Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">รายการประวัติการเบิกวัสดุทั้งหมด</h3>
                <span className="text-[11px] font-semibold text-slate-500">เรียงตามเวลาล่าสุด</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 text-center w-12">ลำดับ</th>
                      <th className="p-3.5">วัน/เวลาที่เบิก</th>
                      <th className="p-3.5">รหัสวัสดุ</th>
                      <th className="p-3.5">ชื่อวัสดุ / อะไหล่</th>
                      <th className="p-3.5 text-center">จำนวนเบิก</th>
                      <th className="p-3.5 text-right">มูลค่า (บาท)</th>
                      <th className="p-3.5 text-center">คงเหลือหลังเบิก</th>
                      <th className="p-3.5">ผู้เบิกวัสดุ</th>
                      <th className="p-3.5">หน่วยงานที่เบิก</th>
                      <th className="p-3.5">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWithdrawals.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 text-center font-semibold text-slate-500">{idx + 1}</td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{row.formattedDate}</div>
                          {row.formattedTime && <div className="text-[11px] text-slate-400">{row.formattedTime} น.</div>}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-blue-600 whitespace-nowrap">{row.itemCode}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{row.itemName}</div>
                          <div className="text-[11px] text-slate-500">ราคา/หน่วย: ฿{row.unitPrice.toLocaleString()}</div>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                            {row.quantity.toLocaleString()} {row.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-bold text-slate-800 whitespace-nowrap">
                          ฿{row.totalValue.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center font-medium text-slate-600 whitespace-nowrap">
                          {row.remainingQty.toLocaleString()} {row.unit}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{row.requesterName}</div>
                          {row.requesterPosition && <div className="text-[11px] text-slate-400">{row.requesterPosition}</div>}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                            {row.deptName}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 max-w-xs break-words">{row.notes || '-'}</td>
                      </tr>
                    ))}
                    {filteredWithdrawals.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-10 text-center space-y-2">
                          <div className="text-slate-400 text-sm font-semibold">ไม่พบประวัติการเบิกวัสดุตามเงื่อนไขที่เลือก</div>
                          <div className="text-xs text-slate-400">
                            เมื่อมีการทำรายการเบิกวัสดุจากหน้าทะเบียนวัสดุคงคลัง รายการจะปรากฏในรายงานนี้โดยอัตโนมัติ
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredWithdrawals.length > 0 && (
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                      <tr>
                        <td colSpan={4} className="p-3.5 text-right">
                          รวมทั้งหมด ({withdrawalSummary.totalCount.toLocaleString()} รายการ)
                        </td>
                        <td className="p-3.5 text-center text-blue-700">{withdrawalSummary.totalQty.toLocaleString()} หน่วย</td>
                        <td className="p-3.5 text-right text-emerald-700">฿{withdrawalSummary.totalValue.toLocaleString()}</td>
                        <td colSpan={4} className="p-3.5"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Department & Item Breakdown Summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
                  <h3 className="text-sm font-bold text-slate-900">สรุปการเบิกแยกตามหน่วยงาน</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">หน่วยงาน</th>
                        <th className="p-3 text-center">จำนวนครั้ง</th>
                        <th className="p-3 text-center">จำนวนเบิกรวม</th>
                        <th className="p-3 text-right">มูลค่ารวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {withdrawalSummary.deptBreakdown.map((d) => (
                        <tr key={d.departmentId} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-800">{d.deptName}</td>
                          <td className="p-3 text-center text-slate-600">{d.count.toLocaleString()}</td>
                          <td className="p-3 text-center font-bold text-blue-700">{d.totalQty.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-emerald-700">฿{d.totalValue.toLocaleString()}</td>
                        </tr>
                      ))}
                      {withdrawalSummary.deptBreakdown.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400">
                            ไม่มีข้อมูลสรุปตามหน่วยงาน
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
                  <h3 className="text-sm font-bold text-slate-900">สรุปการเบิกแยกตามรายการวัสดุ</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">รายการวัสดุ</th>
                        <th className="p-3 text-center">จำนวนครั้ง</th>
                        <th className="p-3 text-center">จำนวนเบิกรวม</th>
                        <th className="p-3 text-right">มูลค่ารวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {withdrawalSummary.itemBreakdown.map((item) => (
                        <tr key={item.itemId} className="hover:bg-slate-50">
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{item.itemName}</div>
                            <div className="text-[11px] font-mono text-slate-400">{item.itemCode}</div>
                          </td>
                          <td className="p-3 text-center text-slate-600">{item.count.toLocaleString()}</td>
                          <td className="p-3 text-center font-bold text-blue-700">
                            {item.totalQty.toLocaleString()} {item.unit}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-700">฿{item.totalValue.toLocaleString()}</td>
                        </tr>
                      ))}
                      {withdrawalSummary.itemBreakdown.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400">
                            ไม่มีข้อมูลสรุปตามรายการวัสดุ
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-['Sarabun',sans-serif]">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">เพิ่มรายการวัสดุใหม่ (รับเข้าสต็อก)</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">
                  &times;
                </button>
              </div>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสวัสดุ</label>
                  <input
                    type="text"
                    required
                    value={newItem.itemCode}
                    onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อวัสดุ</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ตลับหมึก HP LaserJet, สาย LAN Cat6 3m"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ผู้จำหน่าย / ร้านค้า</label>
                    <input
                      type="text"
                      placeholder="เช่น บจก. ไอที ซัพพลาย"
                      value={newItem.supplier}
                      onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">สถานที่จัดเก็บ</label>
                    <input
                      type="text"
                      placeholder="เช่น คลังพัสดุ IT ชั้น 3"
                      value={newItem.location}
                      onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยนับ</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น ตลับ, กล่อง, ชิ้น"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ราคาต่อหน่วย (บาท)</label>
                    <input
                      type="number"
                      required
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวนรับเข้า (รับเข้าเริ่มต้น)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newItem.stockQty}
                      onChange={(e) => setNewItem({ ...newItem, stockQty: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">จุดสั่งซื้อขั้นต่ำ (Min Qty)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newItem.minQty}
                      onChange={(e) => setNewItem({ ...newItem, minQty: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-blue-200"
                  >
                    บันทึกรับเข้าพัสดุ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transaction Modal (Receive / Dispense) */}
        {showTrxModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-['Sarabun',sans-serif]">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {showTrxModal.type}: {showTrxModal.item.name}
                </h3>
                <button onClick={() => setShowTrxModal(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">
                  &times;
                </button>
              </div>

              <form onSubmit={handleProcessTrx} className="space-y-4">
                {showTrxModal.type === 'เบิกวัสดุ' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                    <div className="text-[11px] font-semibold text-blue-700">ชื่อผู้เบิก (ดึงจากบัญชีผู้ใช้ที่ล็อกอินอยู่):</div>
                    <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        {currentUser.name} ({currentUser.position || currentUser.role})
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวน ({showTrxModal.item.unit})</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={trxQty}
                    onChange={(e) => setTrxQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                {showTrxModal.type === 'รับเข้าสต็อก' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">ราคาต่อหน่วย (บาท)</label>
                        <input
                          type="number"
                          required
                          value={trxUnitPrice}
                          onChange={(e) => setTrxUnitPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">จุดสั่งซื้อขั้นต่ำ (Min Qty)</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={trxMinQty}
                          onChange={(e) => setTrxMinQty(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-blue-800"
                        />
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-semibold">ราคารวมทั้งสิ้น:</span>
                      <span className="text-sm font-bold text-emerald-600">฿{(trxQty * trxUnitPrice).toLocaleString()}</span>
                    </div>
                  </>
                )}

                {showTrxModal.type === 'เบิกวัสดุ' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยงานที่เบิก</label>
                    <select
                      value={trxDeptId}
                      onChange={(e) => setTrxDeptId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุ / วัตถุประสงค์</label>
                  <textarea
                    rows={2}
                    value={trxNotes}
                    onChange={(e) => setTrxNotes(e.target.value)}
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowTrxModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-blue-200"
                  >
                    ยืนยันทำรายการ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Printable Official Material Withdrawal Report Modal */}
      {showReportPrintModal && (
        <PrintDocumentModal
          title="รายงานการเบิกวัสดุคอมพิวเตอร์และอะไหล่"
          documentNo={`INV-WD-${new Date().getFullYear() + 543}`}
          date={new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          departmentName={selectedReportDeptName}
          contentData={[
            { label: 'ช่วงวันที่รายงาน', value: reportPeriodLabel },
            { label: 'จำนวนครั้งที่เบิกทั้งหมด', value: `${withdrawalSummary.totalCount.toLocaleString()} ครั้ง` },
            { label: 'ปริมาณวัสดุที่เบิกรวม', value: `${withdrawalSummary.totalQty.toLocaleString()} หน่วย` },
            { label: 'มูลค่าการเบิกรวมทั้งสิ้น', value: `฿${withdrawalSummary.totalValue.toLocaleString()} บาท` }
          ]}
          tables={[
            {
              title: '1. รายละเอียดประวัติการเบิกวัสดุทั้งหมด',
              headers: ['ลำดับ', 'วันที่เบิก', 'รหัสวัสดุ', 'ชื่อรายการวัสดุ', 'จำนวนเบิก', 'มูลค่า (บาท)', 'คงเหลือ', 'ผู้เบิก', 'หน่วยงาน'],
              rows: filteredWithdrawals.map((r, i) => [
                String(i + 1),
                r.formattedDate,
                r.itemCode,
                r.itemName,
                `${r.quantity.toLocaleString()} ${r.unit}`,
                r.totalValue.toLocaleString(),
                `${r.remainingQty.toLocaleString()} ${r.unit}`,
                r.requesterName,
                r.deptName
              ])
            },
            {
              title: '2. สรุปการเบิกแยกตามหน่วยงาน',
              headers: ['ลำดับ', 'หน่วยงานที่เบิก', 'จำนวนครั้งที่เบิก', 'จำนวนวัสดุรวม', 'มูลค่ารวม (บาท)'],
              rows: withdrawalSummary.deptBreakdown.map((d, i) => [
                String(i + 1),
                d.deptName,
                `${d.count.toLocaleString()} ครั้ง`,
                `${d.totalQty.toLocaleString()} หน่วย`,
                d.totalValue.toLocaleString()
              ])
            }
          ]}
          onClose={() => setShowReportPrintModal(false)}
        />
      )}
    </>
  );
};

