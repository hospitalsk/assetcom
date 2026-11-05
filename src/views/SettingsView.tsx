import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Shield, 
  Building, 
  Database, 
  History, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  KeyRound,
  ListPlus,
  Tag,
  Coins,
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Check,
  X
} from 'lucide-react';
import { UserRole, UserProfile, AssetCategory } from '../types';
import { getLineApiLogs, clearLineApiLogs, dispatchLineOaNotification } from '../utils/lineOaService';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    saveSettingsToSupabase,
    supabaseStatus,
    departments, 
    addDepartment, 
    deleteDepartment,
    users, 
    addUser, 
    updateUser,
    deleteUser,
    roles,
    addRole,
    updateRole,
    deleteRole,
    assetCategories,
    addAssetCategory,
    updateAssetCategory,
    deleteAssetCategory,
    budgetSources,
    addBudgetSource,
    updateBudgetSource,
    deleteBudgetSource,
    acquisitionMethods,
    addAcquisitionMethod,
    updateAcquisitionMethod,
    deleteAcquisitionMethod,
    assetStatuses,
    addAssetStatus,
    updateAssetStatus,
    deleteAssetStatus,
    assetLocations,
    addAssetLocation,
    updateAssetLocation,
    deleteAssetLocation,
    assets,
    auditLogs, 
    resetToDefaultData, 
    currentUser 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'departments' | 'users' | 'roles' | 'dropdowns' | 'line_oa' | 'audit' | 'backup'>('general');
  const [dropdownActiveSubTab, setDropdownActiveSubTab] = useState<'categories' | 'budgets' | 'acquisitions' | 'statuses' | 'locations'>('categories');

  const [formSettings, setFormSettings] = useState(settings);
  const [lineTestSuccess, setLineTestSuccess] = useState<string | null>(null);
  const [isSavingLineOa, setIsSavingLineOa] = useState(false);
  const [showGasGuide, setShowGasGuide] = useState(false);

  // Sync formSettings whenever settings load/update from Supabase
  React.useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  // Dropdown Management State
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatData, setNewCatData] = useState<Omit<AssetCategory, 'id'>>({
    code: '',
    name: '',
    defaultUsefulLife: 5,
    salvageValuePercent: 10,
    prefix: 'AST'
  });
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);

  const [newOptionInput, setNewOptionInput] = useState('');
  const [editingOption, setEditingOption] = useState<{ type: 'budget' | 'acquisition' | 'status' | 'location'; oldVal: string; newVal: string } | null>(null);

  // New Department form
  const [newDept, setNewDept] = useState({ code: '', name: '', building: '', floor: '1', headName: '', phone: '' });
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);

  // New User form
  const [newUser, setNewUser] = useState({ name: '', email: '', password: 'password123', role: (roles[0] || 'General User') as UserRole, departmentId: departments[0]?.id || '', position: '', phone: '', status: 'Active' as const });
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Edit User modal state
  const [editUserData, setEditUserData] = useState<UserProfile | null>(null);
  const [editPasswordOnlyUser, setEditPasswordOnlyUser] = useState<UserProfile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Role Management state
  const [newRoleInput, setNewRoleInput] = useState('');
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [editingRoleOldName, setEditingRoleOldName] = useState<string | null>(null);
  const [editingRoleNewName, setEditingRoleNewName] = useState('');

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    await saveSettingsToSupabase(formSettings);
  };

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    addDepartment(newDept);
    setShowAddDeptModal(false);
    setNewDept({ code: '', name: '', building: '', floor: '1', headName: '', phone: '' });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    addUser(newUser);
    setShowAddUserModal(false);
    setNewUser({ name: '', email: '', password: 'password123', role: 'General User', departmentId: departments[0]?.id || '', position: '', phone: '', status: 'Active' });
  };

  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserData) return;
    updateUser(editUserData.id, editUserData);
    setEditUserData(null);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPasswordOnlyUser) return;
    if (!newPasswordInput || newPasswordInput.length < 4) {
      alert('กรุณาระบุรหัสผ่านอย่างน้อย 4 ตัวอักษร');
      return;
    }
    updateUser(editPasswordOnlyUser.id, { password: newPasswordInput });
    alert(`เปลี่ยนรหัสผ่านสำหรับ ${editPasswordOnlyUser.name} สำเร็จ`);
    setEditPasswordOnlyUser(null);
    setNewPasswordInput('');
  };

  const isAdminOrSuper = currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || (currentUser.role && currentUser.role.toLowerCase().includes('admin'));

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">ระบบตั้งค่าและบริหารจัดการระบบ</h2>
          <p className="text-xs text-slate-500 mt-1">
            ตั้งค่าองค์กร โลโก้ หน่วยงาน ผู้ใช้งาน บทบาทสิทธิ์ ตัวเลือกดร็อปดาวน์ครุภัณฑ์ Audit Logs และสำรองข้อมูล
          </p>
        </div>
      </div>

      <div className="flex space-x-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'general' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          ตั้งค่าทั่วไป & องค์กร & โลโก้
        </button>
        <button
          onClick={() => setActiveSubTab('departments')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'departments' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          จัดการหน่วยงาน ({departments.length})
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          ผู้ใช้งาน ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab('roles')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'roles' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          บทบาทสิทธิ์ (Roles: {roles.length})
        </button>
        <button
          onClick={() => setActiveSubTab('dropdowns')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'dropdowns' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          ตัวเลือกฟอร์มครุภัณฑ์ (Dropdowns)
        </button>
        <button
          onClick={() => setActiveSubTab('line_oa')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
            activeSubTab === 'line_oa' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border-emerald-600' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
          }`}
        >
          📲 ตั้งค่า LINE OA API ({formSettings.lineOaEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'})
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'audit' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Audit Logs
        </button>
        <button
          onClick={() => setActiveSubTab('backup')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'backup' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          สำรอง & กู้คืนข้อมูล
        </button>
      </div>

      {activeSubTab === 'general' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-100 max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อหน่วยงาน / โรงพยาบาล</label>
              <input
                type="text"
                value={formSettings.organizationName}
                onChange={(e) => setFormSettings({ ...formSettings, organizationName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ที่อยู่หน่วยงาน</label>
              <input
                type="text"
                value={formSettings.orgAddress}
                onChange={(e) => setFormSettings({ ...formSettings, orgAddress: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={formSettings.orgPhone}
                  onChange={(e) => setFormSettings({ ...formSettings, orgPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ปีงบประมาณปัจจุบัน</label>
                <input
                  type="text"
                  value={formSettings.fiscalYear}
                  onChange={(e) => setFormSettings({ ...formSettings, fiscalYear: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL โลโก้เว็บแอป (Logo URL)</label>
              <input
                type="text"
                value={formSettings.logoUrl}
                onChange={(e) => setFormSettings({ ...formSettings, logoUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {formSettings.logoUrl && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-[11px] text-slate-500">ตัวอย่างโลโก้:</span>
                  <img src={formSettings.logoUrl} alt="Logo Preview" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-md shadow-blue-200"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการตั้งค่า</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {activeSubTab === 'line_oa' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 max-w-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>📲 ตั้งค่า LINE Official Account (LINE OA Bot API)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                กำหนด Channel Access Token, Channel Secret และ Webhook URL สำหรับส่งแจ้งเตือนการแจ้งซ่อมไปยังช่างอัตโนมัติ
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              <span className="text-xs font-bold text-emerald-800">
                {formSettings.lineOaEnabled ? 'เปิดใช้งานอยู่' : 'ปิดใช้งาน'}
              </span>
              <span className="text-[10px] text-emerald-600 bg-white px-2 py-0.5 rounded-full border border-emerald-300 font-mono">
                Supabase: ซิงค์อัตโนมัติ (ID: 1)
              </span>
            </div>
          </div>

          {lineTestSuccess && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center space-x-2 ${
              lineTestSuccess.includes('⚠️') || lineTestSuccess.includes('Error') || lineTestSuccess.includes('กรุณา')
                ? 'bg-amber-50 border border-amber-300 text-amber-900 shadow-sm'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              {lineTestSuccess.includes('⚠️') || lineTestSuccess.includes('Error') || lineTestSuccess.includes('กรุณา') ? (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <span className="leading-relaxed">{lineTestSuccess}</span>
            </div>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSavingLineOa(true);
            try {
              updateSettings(formSettings);
              const result = await saveSettingsToSupabase(formSettings);
              if (result && result.success) {
                setLineTestSuccess('✅ บันทึกการตั้งค่า LINE OA ลงฐานข้อมูล Supabase (ตาราง system_settings ID=1) ถาวรเรียบร้อยแล้ว!');
              } else {
                setLineTestSuccess('✅ บันทึกการตั้งค่าเรียบร้อยแล้ว');
              }
            } catch (err: any) {
              setLineTestSuccess('⚠️ เกิดข้อผิดพลาด: ' + err.message);
            } finally {
              setIsSavingLineOa(false);
              setTimeout(() => setLineTestSuccess(null), 6000);
            }
          }} className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-800">เปิดใช้งานระบบแจ้งเตือน LINE OA</div>
                <div className="text-[11px] text-slate-500">เปิดให้ระบบส่งข้อความแจ้งเตือนอัตโนมัติเมื่อมีผู้แจ้งซ่อมครุภัณฑ์</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formSettings.lineOaEnabled}
                  onChange={(e) => setFormSettings({ ...formSettings, lineOaEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LINE OA Basic ID / Bot Account ID</label>
              <input
                type="text"
                value={formSettings.lineOaBasicId || ''}
                onChange={(e) => setFormSettings({ ...formSettings, lineOaBasicId: e.target.value })}
                placeholder="@sangkhla_repair_bot"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Channel Access Token (Long-lived)</label>
              <textarea
                rows={3}
                value={formSettings.lineOaChannelAccessToken || ''}
                onChange={(e) => setFormSettings({ ...formSettings, lineOaChannelAccessToken: e.target.value })}
                placeholder="ระบุ Channel Access Token จาก LINE Developers Console..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Channel Secret</label>
              <input
                type="password"
                value={formSettings.lineOaChannelSecret || ''}
                onChange={(e) => setFormSettings({ ...formSettings, lineOaChannelSecret: e.target.value })}
                placeholder="ระบุ Channel Secret"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LINE Messaging Webhook URL</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  readOnly
                  value={formSettings.lineOaWebhookUrl || 'https://ais-dev-ngnwk27rcrrjxtrwkcr3lu-843482220752.asia-east1.run.app/api/line/webhook'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(formSettings.lineOaWebhookUrl || 'https://ais-dev-ngnwk27rcrrjxtrwkcr3lu-843482220752.asia-east1.run.app/api/line/webhook');
                    alert('คัดลอก Webhook URL เรียบร้อย นำไปวางใน LINE Developers Console');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl whitespace-nowrap"
                >
                  คัดลอก URL
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relay Proxy URL (ทางเลือกสำหรับ GitHub Pages เพื่อส่งข้อความข้ามโดเมน)
              </label>
              <input
                type="text"
                value={formSettings.lineProxyUrl || ''}
                onChange={(e) => setFormSettings({ ...formSettings, lineProxyUrl: e.target.value })}
                placeholder="เช่น https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-400">
                  สำหรับรันบน GitHub Pages: ใช้ Google Apps Script Web App ฟรี ไม่ต้องมีเซิร์ฟเวอร์
                </span>
                <button
                  type="button"
                  onClick={() => setShowGasGuide(!showGasGuide)}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
                >
                  {showGasGuide ? 'ซ่อนวิธีทำ' : '📖 วิธีสร้าง Google Apps Script Relay ฟรี'}
                </button>
              </div>
            </div>

            {showGasGuide && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2 text-xs text-slate-700">
                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>🚀 วิธีส่ง LINE จาก GitHub Pages ฟรี 100% ด้วย Google Apps Script:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                  <li>เปิด <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-bold">script.google.com</a> แล้วกด New Project</li>
                  <li>วางโค้ดสคริปต์ด้านล่างนี้ลงในหน้า Code.gs แล้วกด Save:</li>
                </ol>
                <div className="relative">
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[10px] font-mono overflow-x-auto">
{`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + data.token
    },
    payload: JSON.stringify({ messages: data.messages }),
    muteHttpExceptions: true
  });
  return ContentService.createTextOutput(res.getContentText()).setMimeType(ContentService.MimeType.JSON);
}`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + data.token
    },
    payload: JSON.stringify({ messages: data.messages }),
    muteHttpExceptions: true
  });
  return ContentService.createTextOutput(res.getContentText()).setMimeType(ContentService.MimeType.JSON);
}`);
                      alert('คัดลอกโค้ด Google Apps Script เรียบร้อย!');
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    คัดลอกโค้ด
                  </button>
                </div>
                <ol start={3} className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                  <li>กด <b>Deploy</b> &gt; <b>New deployment</b> &gt; เลือก <b>Web app</b></li>
                  <li>ตั้งค่า Who has access: <b>Anyone</b> แล้วกด Deploy</li>
                  <li>คัดลอก <b>Web app URL</b> มาวางในช่อง Relay Proxy URL ด้านบนนี้ แล้วกดบันทึก</li>
                </ol>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                LINE Notify Token (ทางเลือก - แจ้งเตือนเข้าไลน์กลุ่มอัตโนมัติ)
              </label>
              <input
                type="password"
                value={formSettings.lineNotifyToken || ''}
                onChange={(e) => setFormSettings({ ...formSettings, lineNotifyToken: e.target.value })}
                placeholder="ระบุ LINE Notify Token สำหรับกลุ่มไลน์ช่าง"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                สามารถออก Token ได้ฟรีที่ notify-bot.line.me เพื่อให้ระบบส่งแจ้งเตือนเข้ากลุ่ม LINE ช่างได้ทันทีโดยตรง
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={async () => {
                  setLineTestSuccess('กำลังยิงสัญญาณทดสอบไปยัง LINE Messaging API & LINE Notify...');
                  const testRep: any = {
                    repairNo: 'REP-TEST-001',
                    issueDescription: 'ทดสอบการส่งข้อความแจ้งเตือนผ่าน API',
                    urgency: 'ด่วน'
                  };
                  const res = await dispatchLineOaNotification(
                    formSettings,
                    testRep,
                    'เครื่องคอมพิวเตอร์ทดสอบ',
                    'COM-TEST-001',
                    currentUser.name,
                    'ศูนย์สารสนเทศ'
                  );
                  if (res.success) {
                    setLineTestSuccess(`✅ ${res.message} (ส่งสัญญาณสำเร็จ)`);
                  } else {
                    setLineTestSuccess(`⚠️ ${res.message}`);
                  }
                  setTimeout(() => setLineTestSuccess(null), 10000);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ⚡ ทดสอบยิงข้อความจริง (Test LINE API)
              </button>

              <button
                type="submit"
                disabled={isSavingLineOa}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingLineOa ? 'กำลังบันทึกลง Supabase...' : 'บันทึกการตั้งค่า LINE OA'}</span>
              </button>
            </div>
          </form>

          {/* Live LINE API Terminal Log */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>บันทึกประวัติการส่งสัญญาณ API (Live API Terminal Logs)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearLineApiLogs();
                  setLineTestSuccess('ล้างประวัติ Log เรียบร้อย');
                  setTimeout(() => setLineTestSuccess(null), 2000);
                }}
                className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold"
              >
                ล้าง Log
              </button>
            </div>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-[11px] max-h-60 overflow-y-auto space-y-2 shadow-inner border border-slate-800">
              {getLineApiLogs().length === 0 ? (
                <div className="text-slate-500 italic">ยังไม่มีประวัติการส่ง API (เมื่อมีการกดแจ้งซ่อมจะปรากฏประวัติที่นี่)</div>
              ) : (
                getLineApiLogs().map((log, idx) => (
                  <div key={`${log.id}-${idx}`} className="pb-2 border-b border-slate-800/80 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={log.status === 'SUCCESS' ? 'text-emerald-400 font-bold' : log.status === 'ERROR' ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                        [{log.type}] Status: {log.statusCode} - {log.status}
                      </span>
                      <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString('th-TH')}</span>
                    </div>
                    <div className="text-slate-300">{log.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
            <span className="text-xs font-bold text-slate-800">รายการหน่วยงานภายในองค์กร</span>
            {isAdminOrSuper && (
              <button
                onClick={() => setShowAddDeptModal(true)}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มหน่วยงานใหม่</span>
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">รหัส</th>
                    <th className="p-4">ชื่อหน่วยงาน</th>
                    <th className="p-4">อาคาร / ชั้น</th>
                    <th className="p-4">หัวหน้าหน่วยงาน</th>
                    <th className="p-4">เบอร์โทร</th>
                    {isAdminOrSuper && <th className="p-4 text-center">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-blue-600">{d.code}</td>
                      <td className="p-4 font-bold text-slate-900">{d.name}</td>
                      <td className="p-4 text-slate-600">{d.building} ชั้น {d.floor}</td>
                      <td className="p-4 text-slate-700">{d.headName}</td>
                      <td className="p-4 text-slate-600">{d.phone}</td>
                      {isAdminOrSuper && (
                        <td className="p-4 text-center">
                          <button
                            onClick={() => deleteDepartment(d.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                            title="ลบหน่วยงาน"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-xs border border-slate-100 gap-2">
            <span className="text-xs font-bold text-slate-800">รายชื่อผู้ใช้งาน บทบาทสิทธิ์ และการจัดการรหัสผ่าน (User & Role Management)</span>
            {isAdminOrSuper && (
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มผู้ใช้งานใหม่</span>
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">ชื่อ - นามสกุล</th>
                    <th className="p-4">อีเมล</th>
                    <th className="p-4">บทบาท (Role)</th>
                    <th className="p-4">ตำแหน่ง</th>
                    <th className="p-4 text-center">สถานะ</th>
                    {isAdminOrSuper && <th className="p-4 text-center">การจัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{u.name}</td>
                      <td className="p-4 text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{u.position}</td>
                      <td className="p-4 text-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" title="Active"></span>
                      </td>
                      {isAdminOrSuper && (
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setEditUserData(u)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                              title="แก้ไขข้อมูลผู้ใช้"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditPasswordOnlyUser(u);
                                setNewPasswordInput('');
                              }}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                              title="เปลี่ยนรหัสผ่าน"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (users.length <= 1) {
                                  alert('ไม่สามารถลบผู้ใช้งานคนสุดท้ายได้');
                                  return;
                                }
                                if (window.confirm(`ยืนยันการลบผู้ใช้ ${u.name}?`)) {
                                  deleteUser(u.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                              title="ลบผู้ใช้งาน"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-xs border border-slate-100 gap-2">
            <div>
              <span className="text-xs font-bold text-slate-800">การจัดการบทบาทและสิทธิ์ผู้ใช้งาน (Role & Permission Management)</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ผู้ดูแลระบบ (Admin) สามารถเพิ่ม แก้ไขชื่อ และลบบทบาทสิทธิ์ในระบบได้อย่างยืดหยุ่น
              </p>
            </div>
            {isAdminOrSuper && (
              <button
                onClick={() => {
                  setNewRoleInput('');
                  setShowAddRoleModal(true);
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มบทบาทสิทธิ์ใหม่</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">ลำดับ</th>
                    <th className="p-4">ชื่อบทบาทสิทธิ์ (Role Name)</th>
                    <th className="p-4">ขอบเขตสิทธิ์การใช้งาน (Scope & Access)</th>
                    <th className="p-4 text-center">ผู้ใช้งานในบทบาทนี้</th>
                    {isAdminOrSuper && <th className="p-4 text-center">การจัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roles.map((roleName, index) => {
                    const assignedUsers = users.filter(u => u.role === roleName);
                    
                    let roleScope = 'สิทธิ์ทั่วไปในระบบ';
                    let badgeColor = 'bg-slate-100 text-slate-700';

                    if (roleName.includes('Super Admin')) {
                      roleScope = 'สิทธิ์สูงสุดทุกฟังก์ชัน ดูแลระบบ ตั้งค่า และสิทธิ์ทั้งหมด';
                      badgeColor = 'bg-purple-50 text-purple-700 border border-purple-200';
                    } else if (roleName.includes('Admin')) {
                      roleScope = 'จัดการข้อมูลระบบ ผู้ใช้ บทบาท ทะเบียน ครุภัณฑ์ และรายงาน';
                      badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200';
                    } else if (roleName.includes('Supply')) {
                      roleScope = 'จัดการงานพัสดุ ทะเบียนครุภัณฑ์ คลังวัสดุ รับเข้า-เบิกจ่าย และรายงานระเบียบฯ 2560';
                      badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                    } else if (roleName.includes('IT')) {
                      roleScope = 'จัดการงานแจ้งซ่อม บันทึกสถานะการซ่อม ตรวจสอบ QR Scanner และผู้จัดทำรายงาน';
                      badgeColor = 'bg-cyan-50 text-cyan-700 border border-cyan-200';
                    } else if (roleName.includes('Department Head') || roleName.includes('Approver')) {
                      roleScope = 'อนุมัติการยืมพัสดุ ตรวจสอบงานซ่อม และตรวจรับพัสดุ';
                      badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200';
                    } else if (roleName.includes('Auditor')) {
                      roleScope = 'ตรวจสอบ Audit Logs ดูรายงาน และติดตามทรัพย์สิน';
                      badgeColor = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
                    } else {
                      roleScope = 'ยื่นคำขอยืมครุภัณฑ์ แจ้งซ่อมครุภัณฑ์ ตรวจสอบสถานะการเบิก';
                    }

                    return (
                      <tr key={roleName} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-400 font-medium">{index + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-slate-400" />
                            <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${badgeColor}`}>
                              {roleName}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">
                          <span>{roleScope}</span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            <span>{assignedUsers.length} คน</span>
                          </div>
                          {assignedUsers.length > 0 && (
                            <div className="text-[10px] text-slate-400 mt-1 max-w-[200px] truncate mx-auto" title={assignedUsers.map(u => u.name).join(', ')}>
                              ({assignedUsers.map(u => u.name).join(', ')})
                            </div>
                          )}
                        </td>
                        {isAdminOrSuper && (
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => {
                                  setEditingRoleOldName(roleName);
                                  setEditingRoleNewName(roleName);
                                }}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="แก้ไขชื่อบทบาท"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (roles.length <= 1) {
                                    alert('ไม่สามารถลบบทบาทสุดท้ายในระบบได้');
                                    return;
                                  }
                                  const confirmMsg = assignedUsers.length > 0
                                    ? `บทบาท "${roleName}" มีผู้ใช้งานอยู่ ${assignedUsers.length} คน หากลบ ระบบจะโอนผู้ใช้ไปยังบทบาทเริ่มต้น ท่านยืนยันจะลบหรือไม่?`
                                    : `ยืนยันการลบบทบาท "${roleName}" หรือไม่?`;
                                  
                                  if (window.confirm(confirmMsg)) {
                                    deleteRole(roleName);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                title="ลบบทบาทนี้"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'dropdowns' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-xs border border-slate-100 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <ListPlus className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-slate-800">จัดการรายการใน Dropbox / ตัวเลือกฟอร์มครุภัณฑ์</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                กำหนดรายการตัวเลือกดร็อปดาวน์ที่จะนำไปใช้ในหน้าเพิ่มและแก้ไขรายการครุภัณฑ์ (ประเภท, แหล่งงบประมาณ, วิธีการได้มา, สถานะ, สถานที่จัดเก็บ)
              </p>
            </div>
          </div>

          {/* Sub Navigation for Dropdowns */}
          <div className="flex space-x-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setDropdownActiveSubTab('categories')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                dropdownActiveSubTab === 'categories'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>ประเภทครุภัณฑ์ ({assetCategories.length})</span>
            </button>
            <button
              onClick={() => setDropdownActiveSubTab('budgets')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                dropdownActiveSubTab === 'budgets'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>แหล่งงบประมาณ ({budgetSources.length})</span>
            </button>
            <button
              onClick={() => setDropdownActiveSubTab('acquisitions')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                dropdownActiveSubTab === 'acquisitions'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>วิธีการได้มา ({acquisitionMethods.length})</span>
            </button>
            <button
              onClick={() => setDropdownActiveSubTab('statuses')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                dropdownActiveSubTab === 'statuses'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>สถานะครุภัณฑ์ ({assetStatuses.length})</span>
            </button>
            <button
              onClick={() => setDropdownActiveSubTab('locations')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                dropdownActiveSubTab === 'locations'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>สถานที่จัดเก็บ/ห้อง ({assetLocations.length})</span>
            </button>
          </div>

          {/* 1. Asset Categories Tab */}
          {dropdownActiveSubTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
                <span className="text-xs font-bold text-slate-700">หมวดหมู่และประเภทครุภัณฑ์คอมพิวเตอร์</span>
                {isAdminOrSuper && (
                  <button
                    onClick={() => {
                      setNewCatData({
                        code: `AST-${Math.floor(100 + Math.random() * 900)}`,
                        name: '',
                        defaultUsefulLife: 5,
                        salvageValuePercent: 10,
                        prefix: 'AST'
                      });
                      setShowAddCatModal(true);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มประเภทใหม่</span>
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-4">รหัสประเภท</th>
                        <th className="p-4">ชื่อประเภทครุภัณฑ์</th>
                        <th className="p-4 text-center">อายุการใช้งาน (ปี)</th>
                        <th className="p-4 text-center">มูลค่าซาก (%)</th>
                        <th className="p-4 text-center">คำนำหน้ารหัส</th>
                        <th className="p-4 text-center">จำนวนในระบบ</th>
                        {isAdminOrSuper && <th className="p-4 text-center">การจัดการ</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assetCategories.map(cat => {
                        const count = assets.filter(a => a.categoryId === cat.id).length;
                        return (
                          <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-mono font-bold text-blue-600">{cat.code}</td>
                            <td className="p-4 font-semibold text-slate-900">{cat.name}</td>
                            <td className="p-4 text-center font-medium">{cat.defaultUsefulLife} ปี</td>
                            <td className="p-4 text-center font-medium">{cat.salvageValuePercent}%</td>
                            <td className="p-4 text-center font-mono text-slate-600">{cat.prefix}</td>
                            <td className="p-4 text-center">
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                                {count} รายการ
                              </span>
                            </td>
                            {isAdminOrSuper && (
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    onClick={() => setEditingCategory(cat)}
                                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    title="แก้ไขประเภท"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (assetCategories.length <= 1) {
                                        alert('ไม่สามารถลบประเภทครุภัณฑ์ทั้งหมดได้');
                                        return;
                                      }
                                      if (window.confirm(`ยืนยันการลบประเภท "${cat.name}"?`)) {
                                        deleteAssetCategory(cat.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                    title="ลบประเภทนี้"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. Budget Sources Tab */}
          {dropdownActiveSubTab === 'budgets' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-2">เพิ่มแหล่งงบประมาณใหม่</span>
                <div className="flex space-x-2 max-w-md">
                  <input
                    type="text"
                    placeholder="เช่น งบประมาณรายได้พิเศษ, งบอุดหนุน อบจ..."
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (!newOptionInput.trim()) return;
                      addBudgetSource(newOptionInput.trim());
                      setNewOptionInput('');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    + เพิ่มตัวเลือก
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {budgetSources.map(bs => {
                  const count = assets.filter(a => a.budgetSource === bs).length;
                  return (
                    <div key={bs} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-800">{bs}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{count} ครุภัณฑ์ที่ใช้งาน</div>
                      </div>
                      {isAdminOrSuper && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingOption({ type: 'budget', oldVal: bs, newVal: bs })}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="แก้ไขชื่อ"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (budgetSources.length <= 1) {
                                alert('ไม่สามารถลบแหล่งงบประมาณทั้งหมดได้');
                                return;
                              }
                              if (window.confirm(`ยืนยันการลบแหล่งงบประมาณ "${bs}"?`)) {
                                deleteBudgetSource(bs);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Acquisition Methods Tab */}
          {dropdownActiveSubTab === 'acquisitions' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-2">เพิ่มวิธีการได้มาใหม่</span>
                <div className="flex space-x-2 max-w-md">
                  <input
                    type="text"
                    placeholder="เช่น วิธีคัดเลือก, ได้รับบริจาคจากมูลนิธิ..."
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (!newOptionInput.trim()) return;
                      addAcquisitionMethod(newOptionInput.trim());
                      setNewOptionInput('');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    + เพิ่มตัวเลือก
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {acquisitionMethods.map(method => {
                  const count = assets.filter(a => a.acquisitionMethod === method).length;
                  return (
                    <div key={method} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-800">{method}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{count} ครุภัณฑ์ที่ใช้งาน</div>
                      </div>
                      {isAdminOrSuper && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingOption({ type: 'acquisition', oldVal: method, newVal: method })}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="แก้ไขชื่อ"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (acquisitionMethods.length <= 1) {
                                alert('ไม่สามารถลบวิธีการได้มาทั้งหมดได้');
                                return;
                              }
                              if (window.confirm(`ยืนยันการลบวิธีการได้มา "${method}"?`)) {
                                deleteAcquisitionMethod(method);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Asset Statuses Tab */}
          {dropdownActiveSubTab === 'statuses' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-2">เพิ่มสถานะครุภัณฑ์ใหม่</span>
                <div className="flex space-x-2 max-w-md">
                  <input
                    type="text"
                    placeholder="เช่น รอจำหน่าย, สำรองใช้งาน..."
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (!newOptionInput.trim()) return;
                      addAssetStatus(newOptionInput.trim());
                      setNewOptionInput('');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    + เพิ่มตัวเลือก
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {assetStatuses.map(status => {
                  const count = assets.filter(a => a.status === status).length;
                  return (
                    <div key={status} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                      <div>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          status === 'พร้อมใช้งาน' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          status === 'กำลังใช้งาน' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          status === 'กำลังซ่อม' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {status}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">{count} ครุภัณฑ์</div>
                      </div>
                      {isAdminOrSuper && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingOption({ type: 'status', oldVal: status, newVal: status })}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="แก้ไขชื่อ"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (assetStatuses.length <= 1) {
                                alert('ไม่สามารถลบสถานะครุภัณฑ์ทั้งหมดได้');
                                return;
                              }
                              if (window.confirm(`ยืนยันการลบสถานะ "${status}"?`)) {
                                deleteAssetStatus(status);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Asset Locations Tab */}
          {dropdownActiveSubTab === 'locations' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-2">เพิ่มสถานที่จัดเก็บ/ห้องประจำใหม่</span>
                <div className="flex space-x-2 max-w-md">
                  <input
                    type="text"
                    placeholder="เช่น อาคารรังสีวินิจฉัย ชั้น 1, ห้องประชุม 2..."
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (!newOptionInput.trim()) return;
                      addAssetLocation(newOptionInput.trim());
                      setNewOptionInput('');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    + เพิ่มตัวเลือก
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {assetLocations.map(loc => {
                  const count = assets.filter(a => a.location === loc).length;
                  return (
                    <div key={loc} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                      <div className="pr-2">
                        <div className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{loc}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{count} ครุภัณฑ์ที่ติดตั้ง</div>
                      </div>
                      {isAdminOrSuper && (
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => setEditingOption({ type: 'location', oldVal: loc, newVal: loc })}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="แก้ไขชื่อ"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (assetLocations.length <= 1) {
                                alert('ไม่สามารถลบสถานที่ทั้งหมดได้');
                                return;
                              }
                              if (window.confirm(`ยืนยันการลบสถานที่ "${loc}"?`)) {
                                deleteAssetLocation(loc);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">วันเวลา</th>
                  <th className="p-4">ผู้ใช้งาน</th>
                  <th className="p-4">การกระทำ</th>
                  <th className="p-4">โมดูล</th>
                  <th className="p-4">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log, idx) => (
                  <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('th-TH')}</td>
                    <td className="p-4 font-bold text-slate-900">{log.userName}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-blue-600 font-medium">{log.module}</td>
                    <td className="p-4 text-slate-700">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'backup' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 max-w-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900">สำรองและกู้คืนข้อมูล</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            ท่านสามารถสำรองข้อมูลทะเบียนครุภัณฑ์และวัสดุทั้งหมดออกเป็นไฟล์ JSON เพื่อเก็บไว้เป็นหลักฐาน หรือรีเซ็ตข้อมูลระบบกลับสู่ค่าเริ่มต้น
          </p>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
            <button
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `smart_asset_backup_${new Date().toISOString().split('T')[0]}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm text-center"
            >
              Export JSON Backup
            </button>
            {isAdminOrSuper && (
              <button
                onClick={resetToDefaultData}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors text-center"
              >
                รีเซ็ตข้อมูลเริ่มต้น (Factory Reset - เฉพาะ Admin)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">เพิ่มหน่วยงานใหม่</h3>
              <button onClick={() => setShowAddDeptModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreateDept} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสหน่วยงาน</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น IT"
                    value={newDept.code}
                    onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อหน่วยงาน</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ศูนย์เทคโนโลยี"
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">อาคาร</label>
                  <input
                    type="text"
                    placeholder="อาคารอำนวยการ"
                    value={newDept.building}
                    onChange={(e) => setNewDept({ ...newDept, building: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หัวหน้าหน่วยงาน</label>
                  <input
                    type="text"
                    placeholder="ชื่อ-นามสกุล"
                    value={newDept.headName}
                    onChange={(e) => setNewDept({ ...newDept, headName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">เพิ่มผู้ใช้งานใหม่</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ - นามสกุล</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสผ่านเริ่มต้น</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">บทบาทสิทธิ์ (Role)</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                <input
                  type="text"
                  value={newUser.position}
                  onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  บันทึกผู้ใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">แก้ไขข้อมูลผู้ใช้งาน: {editUserData.name}</h3>
              <button onClick={() => setEditUserData(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleUpdateUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ - นามสกุล</label>
                <input
                  type="text"
                  required
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  required
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">บทบาทสิทธิ์ (Role)</label>
                <select
                  value={editUserData.role}
                  onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                <input
                  type="text"
                  value={editUserData.position}
                  onChange={(e) => setEditUserData({ ...editUserData, position: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUserData(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {editPasswordOnlyUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">เปลี่ยนรหัสผ่าน</h3>
              </div>
              <button onClick={() => setEditPasswordOnlyUser(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                ผู้ใช้งาน: <span className="font-bold text-slate-800">{editPasswordOnlyUser.name}</span> ({editPasswordOnlyUser.email})
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  required
                  placeholder="ระบุรหัสผ่านใหม่..."
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditPasswordOnlyUser(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                >
                  บันทึกรหัสผ่านใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">เพิ่มบทบาทสิทธิ์ใหม่</h3>
              </div>
              <button onClick={() => setShowAddRoleModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = newRoleInput.trim();
                if (!trimmed) {
                  alert('กรุณาระบุชื่อบทบาทสิทธิ์');
                  return;
                }
                if (roles.includes(trimmed)) {
                  alert('มีชื่อบทบาทสิทธิ์นี้อยู่ในระบบแล้ว');
                  return;
                }
                addRole(trimmed);
                setShowAddRoleModal(false);
                setNewRoleInput('');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อบทบาทสิทธิ์ (Role Name)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น IT Support, ช่างซ่อมบำรุง, ผู้ช่วยพัสดุ..."
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">คำแนะนำบทบาทที่พบบ่อย:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['ช่างเทคนิคคอมพิวเตอร์', 'เจ้าหน้าที่พัสดุหน่วยย่อย', 'ผู้ตรวจสอบพัสดุประจำปี', 'กรรมการตรวจรับพัสดุ'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewRoleInput(suggestion)}
                      className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600 transition-colors"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  บันทึกบทบาทใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingRoleOldName && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">แก้ไขชื่อบทบาทสิทธิ์</h3>
              </div>
              <button onClick={() => setEditingRoleOldName(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = editingRoleNewName.trim();
                if (!trimmed) {
                  alert('กรุณาระบุชื่อบทบาทสิทธิ์ใหม่');
                  return;
                }
                if (trimmed !== editingRoleOldName && roles.includes(trimmed)) {
                  alert('มีชื่อบทบาทนี้ในระบบแล้ว');
                  return;
                }
                updateRole(editingRoleOldName, trimmed);
                setEditingRoleOldName(null);
                setEditingRoleNewName('');
              }}
              className="space-y-4"
            >
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                บทบาทปัจจุบัน: <span className="font-bold text-slate-800">{editingRoleOldName}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ระบบจะอัปเดตบทบาทของผู้ใช้งานที่ถือครองบทบาทนี้ทั้งหมดโดยอัตโนมัติ
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อบทบาทใหม่</label>
                <input
                  type="text"
                  required
                  value={editingRoleNewName}
                  onChange={(e) => setEditingRoleNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRoleOldName(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">เพิ่มประเภทครุภัณฑ์ใหม่</h3>
              </div>
              <button onClick={() => setShowAddCatModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCatData.name || !newCatData.code) {
                  alert('กรุณากรอกรหัสและชื่อประเภทครุภัณฑ์');
                  return;
                }
                addAssetCategory(newCatData);
                setShowAddCatModal(false);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสประเภท (Code)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น AST-PC"
                    value={newCatData.code}
                    onChange={(e) => setNewCatData({ ...newCatData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">คำนำหน้ารหัส (Prefix)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น COM"
                    value={newCatData.prefix}
                    onChange={(e) => setNewCatData({ ...newCatData, prefix: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อประเภทครุภัณฑ์</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คอมพิวเตอร์ประมวลผล (Desktop PC)"
                  value={newCatData.name}
                  onChange={(e) => setNewCatData({ ...newCatData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">อายุการใช้งาน (ปี)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={newCatData.defaultUsefulLife}
                    onChange={(e) => setNewCatData({ ...newCatData, defaultUsefulLife: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">มูลค่าซาก (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={newCatData.salvageValuePercent}
                    onChange={(e) => setNewCatData({ ...newCatData, salvageValuePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  บันทึกประเภทใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">แก้ไขประเภทครุภัณฑ์</h3>
              </div>
              <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingCategory.name || !editingCategory.code) {
                  alert('กรุณากรอกรหัสและชื่อประเภทครุภัณฑ์');
                  return;
                }
                updateAssetCategory(editingCategory.id, editingCategory);
                setEditingCategory(null);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสประเภท (Code)</label>
                  <input
                    type="text"
                    required
                    value={editingCategory.code}
                    onChange={(e) => setEditingCategory({ ...editingCategory, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">คำนำหน้ารหัส (Prefix)</label>
                  <input
                    type="text"
                    required
                    value={editingCategory.prefix}
                    onChange={(e) => setEditingCategory({ ...editingCategory, prefix: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อประเภทครุภัณฑ์</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">อายุการใช้งาน (ปี)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={editingCategory.defaultUsefulLife}
                    onChange={(e) => setEditingCategory({ ...editingCategory, defaultUsefulLife: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">มูลค่าซาก (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={editingCategory.salvageValuePercent}
                    onChange={(e) => setEditingCategory({ ...editingCategory, salvageValuePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Simple Option Modal */}
      {editingOption && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingOption.type === 'budget' ? 'แก้ไขแหล่งงบประมาณ' :
                   editingOption.type === 'acquisition' ? 'แก้ไขวิธีการได้มา' :
                   editingOption.type === 'status' ? 'แก้ไขสถานะครุภัณฑ์' : 'แก้ไขสถานที่จัดเก็บ'}
                </h3>
              </div>
              <button onClick={() => setEditingOption(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = editingOption.newVal.trim();
                if (!trimmed) {
                  alert('กรุณาระบุข้อความ');
                  return;
                }
                if (editingOption.type === 'budget') {
                  updateBudgetSource(editingOption.oldVal, trimmed);
                } else if (editingOption.type === 'acquisition') {
                  updateAcquisitionMethod(editingOption.oldVal, trimmed);
                } else if (editingOption.type === 'status') {
                  updateAssetStatus(editingOption.oldVal, trimmed);
                } else if (editingOption.type === 'location') {
                  updateAssetLocation(editingOption.oldVal, trimmed);
                }
                setEditingOption(null);
              }}
              className="space-y-4"
            >
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                ค่าปัจจุบัน: <span className="font-bold text-slate-800">{editingOption.oldVal}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ค่าใหม่ที่ต้องการเปลี่ยน</label>
                <input
                  type="text"
                  required
                  value={editingOption.newVal}
                  onChange={(e) => setEditingOption({ ...editingOption, newVal: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOption(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
