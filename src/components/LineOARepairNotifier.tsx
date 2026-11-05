import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, CheckCircle2, AlertCircle, Send, Smartphone, User, Monitor, Check } from 'lucide-react';
import { RepairStatus } from '../types';

interface LineOARepairNotifierProps {
  highlightRepairId?: string | null;
}

export const LineOARepairNotifier: React.FC<LineOARepairNotifierProps> = ({ highlightRepairId }) => {
  const { repairRequests, assets, users, departments, updateRepairRequest, currentUser, settings, setActiveTab } = useApp();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleAcceptJob = (repairId: string, repairNo: string) => {
    updateRepairRequest(repairId, { 
      status: 'กำลังดำเนินการ',
      technicianId: currentUser.id 
    });
    setSuccessToast(`ช่าง ${currentUser.name} กดรับงานซ่อมเลขที่ ${repairNo} เรียบร้อยแล้ว (สถานะเปลี่ยนเป็น "กำลังดำเนินการ")`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleUpdateStatus = (repairId: string, newStatus: RepairStatus) => {
    updateRepairRequest(repairId, { status: newStatus });
    setSuccessToast(`อัปเดตสถานะการซ่อมเรียบร้อยแล้ว: ${newStatus}`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const isTechnicianOrAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'IT Officer' || currentUser.role.includes('ช่าง') || currentUser.role.includes('Technician');

  const filteredRequests = repairRequests.filter(req => {
    if (selectedStatusFilter === 'all') return true;
    if (selectedStatusFilter === 'pending') return req.status === 'รอรับเรื่อง' || req.status === 'รอตรวจสอบ' || req.status === 'รอดำเนินการ';
    if (selectedStatusFilter === 'in_progress') return req.status === 'กำลังดำเนินการ' || req.status === 'รออะไหล่' || req.status === 'ส่งซ่อมภายนอก';
    if (selectedStatusFilter === 'completed') return req.status === 'ซ่อมเสร็จ' || req.status === 'ดำเนินการเสร็จ' || req.status === 'ปิดงาน';
    return true;
  });

  return (
    <div className="space-y-6">
      {highlightRepairId && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl text-xs font-black flex items-center justify-between shadow-xl animate-bounce">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>📲 ระบบได้ส่งข้อความ Flex Message แจ้งซ่อมใหม่เข้า LINE OA เรียบร้อยแล้ว! (แสดงการ์ดด้านล่าง)</span>
          </div>
          <span className="bg-white text-emerald-800 px-3 py-1 rounded-xl text-[11px]">LINE OA Live Feed</span>
        </div>
      )}

      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
            <Smartphone className="w-4 h-4 text-emerald-200" />
            <span>LINE Official Account ({settings.lineOaBasicId || '@sangkhla_repair_bot'})</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            ระบบแจ้งเตือนและรับงานซ่อมผ่าน LINE OA
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl">
            แจ้งเตือนรายละเอียดการแจ้งซ่อมครุภัณฑ์ไปยังแชตไลน์ของช่างอัตโนมัติ ผ่าน API Broadcast / LINE Notify พร้อมปุ่มกดรับงานและเปลี่ยนสถานะได้ทันที
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <a
              href={`https://line.me/R/ti/p/${(settings.lineOaBasicId || '@sangkhla_repair_bot').replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-black transition-all shadow-md inline-flex items-center space-x-1"
            >
              <span>💬 เพิ่มเพื่อน LINE OA ({settings.lineOaBasicId || '@sangkhla_repair_bot'})</span>
            </a>
            <button
              onClick={() => setActiveTab('settings')}
              className="px-3 py-1.5 bg-emerald-800/60 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all border border-emerald-400/30"
            >
              ⚙️ ตั้งค่า Token & ตรวจสอบ Live API Log
            </button>
          </div>
        </div>
        <div className="bg-white/10 p-4 rounded-2xl border border-white/20 text-center backdrop-blur-md shrink-0">
          <div className="text-2xl font-black">{repairRequests.filter(r => r.status === 'รอรับเรื่อง' || r.status === 'รอตรวจสอบ').length}</div>
          <div className="text-[11px] text-emerald-200 font-semibold">งานซ่อมรอช่างกดรับ</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
        <button
          onClick={() => setSelectedStatusFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedStatusFilter === 'all' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          ทั้งหมด ({repairRequests.length})
        </button>
        <button
          onClick={() => setSelectedStatusFilter('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedStatusFilter === 'pending' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          รอรับเรื่อง/ตรวจสอบ ({repairRequests.filter(r => r.status === 'รอรับเรื่อง' || r.status === 'รอตรวจสอบ' || r.status === 'รอดำเนินการ').length})
        </button>
        <button
          onClick={() => setSelectedStatusFilter('in_progress')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedStatusFilter === 'in_progress' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          กำลังดำเนินการ ({repairRequests.filter(r => r.status === 'กำลังดำเนินการ' || r.status === 'รออะไหล่').length})
        </button>
        <button
          onClick={() => setSelectedStatusFilter('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedStatusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          ซ่อมเสร็จ/ปิดงาน ({repairRequests.filter(r => r.status === 'ซ่อมเสร็จ' || r.status === 'ปิดงาน').length})
        </button>
      </div>

      {/* LINE OA Chat Simulator Cards Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map(rep => {
          const asset = assets.find(a => a.id === rep.assetId);
          const reporter = users.find(u => u.id === rep.reporterId) || { name: currentUser.name, email: currentUser.email };
          const dept = departments.find(d => d.id === rep.departmentId);
          const isPending = rep.status === 'รอรับเรื่อง' || rep.status === 'รอตรวจสอบ' || rep.status === 'รอดำเนินการ';

          return (
            <div key={rep.id} className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col transition-all hover:shadow-2xl">
              {/* LINE Header */}
              <div className="bg-[#00B900] px-4 py-3 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-white text-[#00B900] flex items-center justify-center font-black text-xs shadow-md">
                    LINE
                  </div>
                  <div>
                    <div className="text-xs font-bold">แจ้งเตือนระบบซ่อมบำรุง (LINE OA)</div>
                    <div className="text-[10px] text-emerald-100">{new Date(rep.createdAt).toLocaleString('th-TH')}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  rep.status === 'ซ่อมเสร็จ' || rep.status === 'ปิดงาน' ? 'bg-white text-emerald-700' :
                  rep.status === 'กำลังดำเนินการ' ? 'bg-amber-400 text-slate-900' : 'bg-rose-500 text-white'
                }`}>
                  {rep.status}
                </span>
              </div>

              {/* LINE Flex Message Body */}
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

                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-rose-600">อาการเสีย / ปัญหาที่พบ:</div>
                    <div className="text-xs font-semibold text-slate-800 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                      {rep.issueDescription}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">ความเร่งด่วน:</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      rep.urgency === 'ด่วนมาก / ฉุกเฉิน' ? 'bg-rose-100 text-rose-700' :
                      rep.urgency === 'ด่วน' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {rep.urgency}
                    </span>
                  </div>
                </div>
              </div>

              {/* LINE Flex Message Action Buttons (ช่างกดรับงานได้ทันที) */}
              <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 text-center mb-1">เมนูปุ่มกดสำหรับช่างใน LINE OA:</div>
                
                {isPending ? (
                  <button
                    onClick={() => handleAcceptJob(rep.id, rep.repairNo)}
                    className="w-full py-3 bg-[#00B900] hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>🟢 กดรับงานซ่อม (Accept Job)</span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-center text-xs font-bold flex items-center justify-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>รับงานแล้ว (กำลังดำเนินการ / ดำเนินการ)</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <select
                    value={rep.status}
                    onChange={(e) => handleUpdateStatus(rep.id, e.target.value as RepairStatus)}
                    className="w-full px-2 py-2 text-[11px] rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
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
                  <button
                    onClick={() => handleUpdateStatus(rep.id, 'ซ่อมเสร็จ')}
                    className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-md"
                  >
                    🛠️ แจ้งซ่อมเสร็จ
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRequests.length === 0 && (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-xs space-y-3">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">ไม่พบรายการแจ้งซ่อมในระบบ</div>
          <p className="text-xs text-slate-400">เมื่อมีการแจ้งซ่อมครุภัณฑ์ ระบบจะส่งการแจ้งเตือนไปยัง LINE OA ของช่างโดยอัตโนมัติทันที</p>
        </div>
      )}
    </div>
  );
};
