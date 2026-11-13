import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, CheckCircle2, AlertCircle, Send, Smartphone, User, Monitor, Check, DollarSign, Edit, Plus, Trash2, Calendar, TrendingUp, Clock, Printer, Package } from 'lucide-react';
import { RepairStatus, RepairRequest } from '../types';
import { canManageRepairStatus, getUserRoleFlags } from '../utils/permissions';
import { OfficialRepairPrintModal } from './OfficialRepairPrintModal';
import { showSwalToast } from '../utils/swal';

interface LineOARepairNotifierProps {
  highlightRepairId?: string | null;
}

export const LineOARepairNotifier: React.FC<LineOARepairNotifierProps> = ({ highlightRepairId }) => {
  const { repairRequests, assets, users, departments, updateRepairRequest, currentUser, settings, setActiveTab } = useApp();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  const canManage = canManageRepairStatus(currentUser.role);
  const roleFlags = getUserRoleFlags(currentUser);
  const isAdmin = roleFlags.isAdmin;
  const isPowerUser =
    canManage ||
    roleFlags.isApprover ||
    roleFlags.isDepartmentHead ||
    roleFlags.isSupplyOfficer ||
    (currentUser.role || '').toLowerCase().includes('auditor');

  // View Scope state: Defaults to 'my' so every user sees ONLY their own repair requests
  const [viewScope, setViewScope] = useState<'my' | 'all'>('my');
  const [printingRepair, setPrintingRepair] = useState<RepairRequest | null>(null);

  // Edit Repair Details Modal State
  const [editingRepair, setEditingRepair] = useState<RepairRequest | null>(null);
  const [editForm, setEditForm] = useState({
    technicianId: '',
    status: 'กำลังดำเนินการ' as RepairStatus,
    laborCost: 0,
    partsCost: 0,
    repairMethod: '',
    notes: '',
    spareParts: [] as { id: string; partName: string; qty: number; unitPrice: number }[]
  });
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState(0);

  // 1. Sort repairs latest first (descending order by createdAt)
  const sortedRepairs = [...repairRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 2. Scope repairs: Every user sees ONLY their own repair requests by default
  const userScopedRepairs = (viewScope === 'my' || !isPowerUser)
    ? sortedRepairs.filter(r => r.reporterId === currentUser.id)
    : sortedRepairs;

  // 3. Filter by selected status tab
  const filteredRequests = userScopedRepairs.filter(req => {
    if (selectedStatusFilter === 'all') return true;
    if (selectedStatusFilter === 'pending') return req.status === 'รอรับเรื่อง' || req.status === 'รอตรวจสอบ' || req.status === 'รอดำเนินการ';
    if (selectedStatusFilter === 'in_progress') return req.status === 'กำลังดำเนินการ' || req.status === 'รออะไหล่' || req.status === 'ส่งซ่อมภายนอก';
    if (selectedStatusFilter === 'completed') return req.status === 'ซ่อมเสร็จ' || req.status === 'ดำเนินการเสร็จ' || req.status === 'ปิดงาน';
    return true;
  });

  // Calculate Monthly & Yearly Maintenance Costs
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyCost = userScopedRepairs.reduce((sum, r) => {
    const d = new Date(r.createdAt);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      return sum + (r.totalCost || 0);
    }
    return sum;
  }, 0);

  const yearlyCost = userScopedRepairs.reduce((sum, r) => {
    const d = new Date(r.createdAt);
    if (d.getFullYear() === currentYear) {
      return sum + (r.totalCost || 0);
    }
    return sum;
  }, 0);

  const handleOpenEditModal = (rep: RepairRequest) => {
    setEditingRepair(rep);
    setEditForm({
      technicianId: rep.technicianId || currentUser.id,
      status: rep.status,
      laborCost: rep.laborCost || 0,
      partsCost: rep.partsCost || 0,
      repairMethod: rep.repairMethod || '',
      notes: rep.notes || '',
      spareParts: rep.spareParts ? [...rep.spareParts] : []
    });
  };

  const handleAddSparePart = () => {
    if (!newPartName.trim()) return;
    const newPart = {
      id: `sp-${Date.now()}`,
      partName: newPartName.trim(),
      qty: newPartQty,
      unitPrice: newPartPrice
    };
    const updatedParts = [...editForm.spareParts, newPart];
    const newPartsCost = updatedParts.reduce((sum, p) => sum + (p.qty * p.unitPrice), 0);
    setEditForm({
      ...editForm,
      spareParts: updatedParts,
      partsCost: newPartsCost
    });
    setNewPartName('');
    setNewPartQty(1);
    setNewPartPrice(0);
  };

  const handleRemoveSparePart = (partId: string) => {
    const updatedParts = editForm.spareParts.filter(p => p.id !== partId);
    const newPartsCost = updatedParts.reduce((sum, p) => sum + (p.qty * p.unitPrice), 0);
    setEditForm({
      ...editForm,
      spareParts: updatedParts,
      partsCost: newPartsCost
    });
  };

  const handleSaveEditRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepair) return;

    const partsCost = editForm.spareParts.reduce((sum, p) => sum + (p.qty * p.unitPrice), 0) || editForm.partsCost;
    const totalCost = partsCost + Number(editForm.laborCost);

    updateRepairRequest(editingRepair.id, {
      technicianId: editForm.technicianId,
      status: editForm.status,
      laborCost: Number(editForm.laborCost),
      partsCost,
      totalCost,
      spareParts: editForm.spareParts,
      repairMethod: editForm.repairMethod,
      notes: editForm.notes
    });

    const techName = users.find(u => u.id === editForm.technicianId)?.name || currentUser.name;
    showSwalToast('success', 'บันทึกข้อมูลงานซ่อมสำเร็จ', `ช่าง: ${techName} | ค่าใช้จ่ายรวม ฿${totalCost.toLocaleString()}`);
    setEditingRepair(null);
  };

  const handleAcceptJob = (repairId: string, repairNo: string) => {
    updateRepairRequest(repairId, { 
      status: 'กำลังดำเนินการ',
      technicianId: currentUser.id,
      acceptedDate: new Date().toISOString()
    });
    showSwalToast('success', `รับงานซ่อม ${repairNo} เรียบร้อยแล้ว`, `ช่างผู้รับผิดชอบ: ${currentUser.name}`);
  };

  return (
    <div className="space-y-6 font-['Sarabun',sans-serif]">
      {highlightRepairId && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl text-xs font-black flex items-center justify-between shadow-xl animate-bounce">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>📲 ยื่นใบแจ้งซ่อมเรียบร้อยแล้ว (รายการซ่อมล่าสุดอยู่ด้านบนสุด)</span>
          </div>
          <span className="bg-white text-emerald-800 px-3 py-1 rounded-xl text-[11px]">LINE OA Live Feed</span>
        </div>
      )}

      {/* Monthly & Yearly Maintenance Cost Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500">ค่าซ่อมบำรุงต่อเดือน (ประจำเดือนนี้)</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5 font-mono">
              ฿{monthlyCost.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">รวมค่าแรงและอะไหล่ประจำเดือนปัจจุบัน</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500">ค่าซ่อมบำรุงต่อปี (ประจำปีนี้)</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5 font-mono">
              ฿{yearlyCost.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">สะสมรวมค่าซ่อมบำรุงตลอดทั้งปี</div>
          </div>
        </div>
      </div>

      {/* LINE OA Admin Banner - ONLY visible to user:admin */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
              <Smartphone className="w-4 h-4 text-emerald-200" />
              <span>LINE Official Account (@765satuz)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              ระบบตั้งค่า LINE Official Account และรับงานซ่อม (@765satuz)
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl">
              (เฉพาะผู้ดูแลระบบ user:admin) เมื่อยื่นใบแจ้งซ่อม ระบบจะรอให้ Approver อนุมัติ แล้วส่งการแจ้งเตือนเข้า LINE OA ของช่างเพื่อรับงานทันที
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href="https://line.me/R/ti/p/@765satuz"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-black transition-all shadow-md inline-flex items-center space-x-1"
              >
                <span>💬 ปุ่มเพิ่มเพื่อน LINE Official Account (@765satuz)</span>
              </a>
              <button
                onClick={() => setActiveTab('settings')}
                className="px-3 py-1.5 bg-emerald-800/60 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all border border-emerald-400/30 cursor-pointer"
              >
                ⚙️ ปุ่มตั้งค่า Token & Webhook LINE OA
              </button>
            </div>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/20 text-center backdrop-blur-md shrink-0">
            <div className="text-2xl font-black">{userScopedRepairs.filter(r => r.status === 'รอตรวจสอบ').length}</div>
            <div className="text-[11px] text-amber-200 font-semibold">งานซ่อมรอ Approver อนุมัติ</div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Scope selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedStatusFilter === 'all' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            ทั้งหมด ({userScopedRepairs.length})
          </button>
          <button
            onClick={() => setSelectedStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedStatusFilter === 'pending' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            รออนุมัติ/รอช่างรับ ({userScopedRepairs.filter(r => r.status === 'รอรับเรื่อง' || r.status === 'รอตรวจสอบ' || r.status === 'รอดำเนินการ').length})
          </button>
          <button
            onClick={() => setSelectedStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedStatusFilter === 'in_progress' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            กำลังซ่อม ({userScopedRepairs.filter(r => r.status === 'กำลังดำเนินการ' || r.status === 'รออะไหล่').length})
          </button>
          <button
            onClick={() => setSelectedStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedStatusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            ซ่อมเสร็จ/ปิดงาน ({userScopedRepairs.filter(r => r.status === 'ซ่อมเสร็จ' || r.status === 'ปิดงาน').length})
          </button>
        </div>

        {/* Scope Toggle: Default is 'my' (shows ONLY own repairs) */}
        {isPowerUser && (
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setViewScope('my')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewScope === 'my' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👤 การแจ้งซ่อมของฉัน
            </button>
            <button
              onClick={() => setViewScope('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewScope === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌐 งานซ่อมทั้งหมดในระบบ
            </button>
          </div>
        )}
      </div>

      {/* LINE OA Chat Simulator Cards Feed - Latest Repair First */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map(rep => {
          const asset = assets.find(a => a.id === rep.assetId);
          const reporter = users.find(u => u.id === rep.reporterId) || { name: currentUser.name, email: currentUser.email };
          const technician = users.find(u => u.id === rep.technicianId);
          const dept = departments.find(d => d.id === rep.departmentId);
          const isNeedsApproval = rep.status === 'รอตรวจสอบ';
          const isPendingAccept = rep.status === 'รอรับเรื่อง' || rep.status === 'รอดำเนินการ';

          return (
            <div key={rep.id} className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col transition-all hover:shadow-2xl">
              {/* LINE Card Header */}
              <div className="bg-[#00B900] px-4 py-3 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-white text-[#00B900] flex items-center justify-center font-black text-xs shadow-md">
                    LINE
                  </div>
                  <div>
                    <div className="text-xs font-bold">แจ้งซ่อมครุภัณฑ์ (@765satuz)</div>
                    <div className="text-[10px] text-emerald-100">{new Date(rep.createdAt).toLocaleString('th-TH')}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  rep.status === 'ซ่อมเสร็จ' || rep.status === 'ปิดงาน' ? 'bg-white text-emerald-700' :
                  rep.status === 'รอตรวจสอบ' ? 'bg-amber-300 text-amber-950 font-extrabold' :
                  rep.status === 'กำลังดำเนินการ' ? 'bg-amber-400 text-slate-900' : 'bg-rose-500 text-white'
                }`}>
                  {rep.status === 'รอตรวจสอบ' ? 'รอ Approver อนุมัติ' : rep.status}
                </span>
              </div>

              {/* Card Content Body */}
              <div className="p-5 space-y-4 flex-1 bg-slate-50/50">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400">เลขที่ใบแจ้งซ่อม</span>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{rep.repairNo}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                      <Monitor className="w-3.5 h-3.5 text-slate-500" />
                      <span>ครุภัณฑ์ที่แจ้งซ่อม</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{asset?.name || 'ไม่ระบุครุภัณฑ์'}</div>
                    <div className="text-[11px] text-slate-500">รหัส: {asset?.assetCode || '-'} | สถานที่: {asset?.location || '-'}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>ผู้แจ้ง / หน่วยงาน</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">{reporter.name}</div>
                    <div className="text-[11px] text-slate-500">{dept?.name || 'หน่วยงานทั่วไป'}</div>
                  </div>

                  {/* Technician & Costs Highlights */}
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center space-x-1">
                        <Wrench className="w-3.5 h-3.5 text-blue-600" />
                        <span>ช่างผู้รับผิดชอบ:</span>
                      </span>
                      <span className="font-bold text-blue-800 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                        {technician ? technician.name : 'ยังไม่ระบุช่าง'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-blue-100">
                      <span className="text-slate-600">ค่าซ่อมรวมทั้งสิ้น:</span>
                      <span className="font-black text-emerald-700 text-xs font-mono">฿{(rep.totalCost || 0).toLocaleString()}</span>
                    </div>
                    {rep.spareParts && rep.spareParts.length > 0 && (
                      <div className="text-[10px] text-slate-500 pt-0.5">
                        อะไหล่: {rep.spareParts.map(p => `${p.partName} (${p.qty})`).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-rose-600">อาการเสีย / ปัญหาที่พบ:</div>
                    <div className="text-xs font-semibold text-slate-800 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                      {rep.issueDescription}
                    </div>
                  </div>

                  {rep.repairMethod && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-blue-600">วิธีการแก้ไข / ผลการซ่อม:</div>
                      <div className="text-xs font-medium text-slate-700 bg-blue-50/40 p-2 rounded-lg">
                        {rep.repairMethod}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">ความเร่งด่วน:</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      rep.urgency === 'ด่วนมาก / ฉุกเฉิน' ? 'bg-rose-100 text-rose-700' :
                      rep.urgency === 'ด่วน' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {rep.urgency}
                    </span>
                  </div>

                  {/* Accepted & Completed Time Displays */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100 space-y-0.5">
                      <div className="text-[10px] font-bold text-blue-600 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>เวลารับงาน:</span>
                      </div>
                      <div className="font-bold text-slate-800 text-[11px]">
                        {rep.acceptedDate 
                          ? new Date(rep.acceptedDate).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
                          : (rep.technicianId || rep.sentDate)
                            ? (rep.sentDate ? new Date(rep.sentDate).toLocaleDateString('th-TH') : new Date(rep.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }))
                            : '⏳ รอช่างรับงาน'}
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100 space-y-0.5">
                      <div className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>เวลาดำเนินการเสร็จ:</span>
                      </div>
                      <div className="font-bold text-slate-800 text-[11px]">
                        {rep.completedDate 
                          ? new Date(rep.completedDate).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
                          : (rep.status === 'ซ่อมเสร็จ' || rep.status === 'ปิดงาน' || rep.status === 'ดำเนินการเสร็จ')
                            ? '✅ เสร็จสิ้นแล้ว'
                            : '⚙️ อยู่ระหว่างดำเนินการ'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 text-center mb-1">
                  {isNeedsApproval ? 'ขั้นตอนการอนุมัติ:' : canManage ? 'การจัดการสำหรับช่าง/ผู้ดูแลระบบ:' : 'สถานะงานซ่อมปัจจุบัน:'}
                </div>
                
                {/* Step 1 -> Step 2: Waiting for Department Head Approval */}
                {(!rep.departmentHeadApproved && (rep.status === 'รอหัวหน้าอนุมัติ' || rep.status === 'รอตรวจสอบ' || rep.status === 'รอรับเรื่อง')) && (
                  roleFlags.isDepartmentHead || roleFlags.isAdmin ? (
                    <button
                      onClick={() => {
                        const signerPos = currentUser.position || rep.headPosition || 'หัวหน้าฝ่าย/หัวหน้ากลุ่มงาน';
                        const opinion = rep.headOpinion || 'เห็นควรอนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ';
                        updateRepairRequest(rep.id, {
                          departmentHeadApproved: true,
                          departmentHeadApprovedBy: currentUser.name,
                          departmentHeadApprovedAt: new Date().toISOString(),
                          headPosition: signerPos,
                          headOpinion: opinion,
                          memoData: {
                            ...(rep.memoData || {}),
                            headSign: currentUser.name,
                            headName: currentUser.name,
                            headPosition: signerPos,
                            headOpinion: opinion
                          },
                          status: 'รอพัสดุอนุมัติ'
                        });
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer animate-pulse"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>✍️ กดอนุมัติซ่อม (หัวหน้ากลุ่มงาน: {currentUser.name})</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-center text-xs font-bold space-y-1">
                      <div>⏳ ขั้นตอนที่ 1: รอหัวหน้ากลุ่มงาน (Department Head) อนุมัติ</div>
                      <div className="text-[10px] text-amber-700 font-normal">ระบบจะส่งการแจ้งเตือนไปยังหัวหน้ากลุ่มงานในระบบ</div>
                    </div>
                  )
                )}

                {/* Step 2 -> Step 3: Waiting for Supply Officer Approval */}
                {(rep.departmentHeadApproved && !rep.supplyOfficerApproved && (rep.status === 'รอพัสดุอนุมัติ' || rep.status === 'รอหัวหน้าอนุมัติ' || rep.status === 'รอตรวจสอบ')) && (
                  roleFlags.isSupplyOfficer || roleFlags.isAdmin ? (
                    <button
                      onClick={() => {
                        updateRepairRequest(rep.id, {
                          supplyOfficerApproved: true,
                          supplyOfficerApprovedBy: currentUser.name,
                          supplyOfficerApprovedAt: new Date().toISOString(),
                          supplyPosition: currentUser.position || 'หัวหน้าเจ้าหน้าที่พัสดุ',
                          memoData: {
                            ...(rep.memoData || {}),
                            procureSign: currentUser.name,
                            procureName: currentUser.name
                          },
                          status: 'รอผู้อำนวยการอนุมัติ'
                        });
                      }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer animate-pulse"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>📦 กดอนุมัติซ่อม (หัวหน้าเจ้าหน้าที่พัสดุ: {currentUser.name})</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-center text-xs font-bold space-y-1">
                      <div>⏳ ขั้นตอนที่ 2: รอหัวหน้าเจ้าหน้าที่พัสดุ (Supply Officer) อนุมัติ</div>
                      <div className="text-[10px] text-indigo-700 font-normal">หัวหน้ากลุ่มงานอนุมัติแล้ว อยู่ระหว่างรอหัวหน้าพัสดุตรวจสอบ</div>
                    </div>
                  )
                )}

                {/* Step 3 -> Step 4: Waiting for Hospital Director (Approver) Approval */}
                {(rep.supplyOfficerApproved && !rep.directorApproved && (rep.status === 'รอผู้อำนวยการอนุมัติ' || rep.status === 'รอพัสดุอนุมัติ' || rep.status === 'รอตรวจสอบ')) && (
                  roleFlags.isApprover || roleFlags.isAdmin ? (
                    <button
                      onClick={() => {
                        updateRepairRequest(rep.id, {
                          directorApproved: true,
                          directorApprovedBy: currentUser.name,
                          directorApprovedAt: new Date().toISOString(),
                          status: 'รอดำเนินการ'
                        });
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer animate-pulse"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>🏥 กดอนุมัติซ่อม (ในฐานะผู้อำนวยการโรงพยาบาลสังขละบุรี)</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-center text-xs font-bold space-y-1">
                      <div>⏳ ขั้นตอนที่ 3: รอผู้อำนวยการโรงพยาบาลสังขละบุรี (Approver) พิจารณาอนุมัติ</div>
                      <div className="text-[10px] text-emerald-700 font-normal">หัวหน้ากลุ่มงานและหัวหน้าพัสดุอนุมัติแล้ว รอผู้อำนวยการลงนามอนุมัติ</div>
                    </div>
                  )
                )}

                {/* Step 4 -> Step 5: Technician Repair & Completion */}
                {(rep.directorApproved || (rep.status !== 'รอหัวหน้าอนุมัติ' && rep.status !== 'รอพัสดุอนุมัติ' && rep.status !== 'รอผู้อำนวยการอนุมัติ')) && (
                  canManage ? (
                    <>
                      {isPendingAccept ? (
                        <button
                          onClick={() => handleAcceptJob(rep.id, rep.repairNo)}
                          className="w-full py-3 bg-[#00B900] hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>🟢 กดรับงานซ่อม (Accept Job)</span>
                        </button>
                      ) : (
                        <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-center text-xs font-bold flex items-center justify-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>รับงานแล้วโดย {technician ? technician.name : currentUser.name}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(rep)}
                        className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-600" />
                        <span>✏️ บันทึกหน่วยงานซ่อมบำรุง & รายละเอียดค่าใช้จ่าย</span>
                      </button>

                      {rep.status !== 'ซ่อมเสร็จ' && rep.status !== 'รอหน่วยงานรับของ' && rep.status !== 'รับของเรียบร้อย' && rep.status !== 'ปิดงาน' && (
                        <button
                          onClick={() => {
                            updateRepairRequest(rep.id, {
                              status: 'รอหน่วยงานรับของ',
                              technicianApproved: true,
                              technicianApprovedBy: currentUser.name,
                              maintCompletedBy: currentUser.name,
                              maintCompletedAt: new Date().toISOString(),
                              completedDate: new Date().toISOString()
                            });
                          }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Wrench className="w-4 h-4" />
                          <span>🛠️ แจ้งซ่อมเสร็จ (ส่งให้ผู้แจ้งซ่อมกดรับของ)</span>
                        </button>
                      )}
                    </>
                  ) : null
                )}

                {/* Step 6: Requesting Department Confirm Item Receipt */}
                {(rep.status === 'รอหน่วยงานรับของ' || (rep.status === 'ซ่อมเสร็จ' && !rep.itemReceived)) && (
                  (currentUser.id === rep.reporterId || currentUser.departmentId === rep.departmentId || roleFlags.isAdmin || currentUser.role === 'General User') ? (
                    <button
                      onClick={() => {
                        updateRepairRequest(rep.id, {
                          itemReceived: true,
                          itemReceivedBy: currentUser.name,
                          itemReceivedAt: new Date().toISOString(),
                          status: 'รับของเรียบร้อย'
                        });
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer animate-pulse"
                    >
                      <Package className="w-4.5 h-4.5" />
                      <span>📦 กดรับของ / ยืนยันรับคืนพัสดุ (แสดงชื่อผู้รับของในเอกสาร)</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-center text-xs font-bold space-y-1">
                      <div>📦 ซ่อมเสร็จเรียบร้อยแล้ว (รอหน่วยงานผู้แจ้งซ่อมกดรับของ)</div>
                      <div className="text-[10px] text-amber-700 font-normal">ผู้แจ้งซ่อม หรือเจ้าหน้าที่ในแผนกเป็นผู้กดรับของ</div>
                    </div>
                  )
                )}

                {/* Final Status Badge */}
                {rep.itemReceived && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-center text-xs font-bold space-y-0.5">
                    <div className="flex items-center justify-center space-x-1 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>รับคืนพัสดุและปิดงานสมบูรณ์แล้ว</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">ผู้รับของ: {rep.itemReceivedBy} | {rep.itemReceivedAt ? new Date(rep.itemReceivedAt).toLocaleDateString('th-TH') : ''}</div>
                  </div>
                )}

                {/* Print Official Government Memo Form Button */}
                <button
                  type="button"
                  onClick={() => setPrintingRepair(rep)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs mt-1"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-700" />
                  <span>🖨️ พิมพ์แบบฟอร์มขออนุมัติซ่อม (บันทึกข้อความ)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRequests.length === 0 && (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-xs space-y-3">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">ไม่พบรายการแจ้งซ่อม</div>
          <p className="text-xs text-slate-400">เมื่อมีการแจ้งซ่อมครุภัณฑ์ รายการซ่อมล่าสุดจะแสดงด้านบนเสมอ</p>
        </div>
      )}

      {/* Modal: Edit Technician & Repair Costs */}
      {editingRepair && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-['Sarabun',sans-serif]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  <span>บันทึกช่างผู้รับงาน & ค่าใช้จ่ายการซ่อม</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">ใบแจ้งซ่อมเลขที่ {editingRepair.repairNo}</p>
              </div>
              <button
                onClick={() => setEditingRepair(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEditRepair} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">👨‍🔧 ช่างผู้รับผิดชอบงานซ่อม</label>
                <select
                  value={editForm.technicianId}
                  onChange={(e) => setEditForm({ ...editForm, technicianId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold text-blue-800 bg-blue-50/50 outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- กรุณาเลือกช่างผู้รับผิดชอบ --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.position} - {u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">สถานะงานซ่อม</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as RepairStatus })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold bg-white outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="รอรับเรื่อง">รอรับเรื่อง</option>
                    <option value="รอตรวจสอบ">รอตรวจสอบ</option>
                    <option value="รอดำเนินการ">รอดำเนินการ</option>
                    <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                    <option value="ส่งซ่อมภายนอก">ส่งซ่อมภายนอก</option>
                    <option value="รออะไหล่">รออะไหล่</option>
                    <option value="ซ่อมเสร็จ">ซ่อมเสร็จ</option>
                    <option value="ดำเนินการเสร็จ">ดำเนินการเสร็จ</option>
                    <option value="ปิดงาน">ปิดงาน</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ค่าแรงช่าง / ค่าบริการ (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.laborCost}
                    onChange={(e) => setEditForm({ ...editForm, laborCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Spare Parts Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center space-x-1">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>รายการอะไหล่ที่เปลี่ยน / เบิกใช้งาน</span>
                  </span>
                  <span className="font-bold text-emerald-700 font-mono">
                    ค่าอะไหล่รวม: ฿{(editForm.spareParts.reduce((sum, p) => sum + (p.qty * p.unitPrice), 0)).toLocaleString()}
                  </span>
                </div>

                {/* Spare parts list */}
                {editForm.spareParts.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {editForm.spareParts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-800">{p.partName} x {p.qty}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-emerald-700 font-bold">฿{(p.qty * p.unitPrice).toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSparePart(p.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic text-center py-1">ยังไม่มีรายการอะไหล่ในใบแจ้งซ่อมนี้</div>
                )}

                {/* Add part row */}
                <div className="grid grid-cols-12 gap-2 pt-1 border-t border-slate-200">
                  <input
                    type="text"
                    placeholder="ชื่ออะไหล่..."
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    className="col-span-6 px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="จำนวน"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(Number(e.target.value))}
                    className="col-span-2 px-2 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-center"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="ราคา/หน่วย"
                    value={newPartPrice}
                    onChange={(e) => setNewPartPrice(Number(e.target.value))}
                    className="col-span-3 px-2 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddSparePart}
                    className="col-span-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">วิธีการซ่อม / รายละเอียดการแก้ไข</label>
                <textarea
                  rows={2}
                  value={editForm.repairMethod}
                  onChange={(e) => setEditForm({ ...editForm, repairMethod: e.target.value })}
                  placeholder="ระบุวิธีการซ่อม เช่น เปลี่ยนชุดลูกกลิ้ง, ลงระบบปฏิบัติการใหม่..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Total cost banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-emerald-800 text-xs">ราคาสรุปค่าใช้จ่ายการซ่อมรวมทั้งสิ้น:</span>
                <span className="font-black text-emerald-700 text-base font-mono">
                  ฿{(Number(editForm.laborCost) + editForm.spareParts.reduce((sum, p) => sum + (p.qty * p.unitPrice), 0)).toLocaleString()}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingRepair(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-200 cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกข้อมูลการซ่อม</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Government Memo Form Print Modal */}
      {printingRepair && (
        <OfficialRepairPrintModal
          repairRequest={printingRepair}
          onClose={() => setPrintingRepair(null)}
        />
      )}
    </div>
  );
};
