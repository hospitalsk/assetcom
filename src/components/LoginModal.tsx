import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, KeyRound, Shield, CheckCircle } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, users, settings } = useApp();
  const [email, setEmail] = useState('admin@hospital.go.th');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (!success) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 font-['Sarabun',sans-serif]">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 border border-slate-100 max-h-[95vh] overflow-y-auto">
        <div className="text-center space-y-2">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl mx-auto object-cover shadow-md" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30 font-bold text-2xl">
              SA
            </div>
          )}
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
            เข้าสู่ระบบบริหารจัดการพัสดุ
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {settings.organizationName}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">อีเมลผู้ใช้งาน (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="admin@hospital.go.th"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสผ่าน (Password)</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="รหัสผ่านเข้าสู่ระบบ"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">รหัสผ่านเริ่มต้นสำหรับบัญชีทดสอบ: 123456</div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-600/30"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            เลือกบัญชีเข้าใช้งานด่วน
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {users.slice(0, 4).map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setEmail(u.email);
                  setPassword(u.password || '123456');
                  setError('');
                }}
                className={`p-2.5 text-left border rounded-xl transition-all ${
                  email === u.email ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-800 truncate">{u.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{u.role}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
