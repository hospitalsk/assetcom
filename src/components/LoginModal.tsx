import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Lock, Eye, EyeOff, ShieldCheck, QrCode, Wrench, Package, ArrowRight, Info } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, settings } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const success = login(username, password);
      setIsLoading(false);
      if (!success) {
        setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#071326] via-[#0C1E3C] to-[#0A182F] text-slate-100 font-['Sarabun',sans-serif] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Ambient background glow accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Organization Brand & Institutional Showcase */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
          {/* Logo & System Badge */}
          <div className="flex flex-col items-center lg:items-start space-y-3">
            <div className="inline-flex items-center gap-3 bg-blue-950/60 border border-blue-800/40 px-3.5 py-1.5 rounded-full shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-blue-200 tracking-wide">
                ระบบสารสนเทศภาครัฐและสถานพยาบาล
              </span>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-3 pt-1">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Organization Logo"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-lg border border-white/10 bg-white/5 p-1"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-lg font-bold text-xl sm:text-2xl">
                  SA
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  ระบบบริหารจัดการครุภัณฑ์
                </h1>
                <p className="text-xs sm:text-sm text-sky-300/90 font-medium">
                  และวัสดุคอมพิวเตอร์ (Smart Asset & IT Inventory)
                </p>
              </div>
            </div>
          </div>

          {/* Subtitle & Description */}
          <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed max-w-xl mx-auto lg:mx-0">
            ระบบศูนย์กลางสำหรับบริหารจัดการทะเบียนครุภัณฑ์ ตรวจรับ คลังพัสดุ แจ้งซ่อมบำรุง
            คำนวณค่าเสื่อมราคา และติดตามทรัพย์สินของ <span className="text-white font-semibold">{settings.organizationName}</span>
          </p>

          {/* Key Capabilities Showcase Grid */}
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl backdrop-blur-sm space-y-1.5 text-left">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-sky-400 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">QR Code & ทะเบียน</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                สแกนตรวจสอบข้อมูลครุภัณฑ์และพิมพ์สติกเกอร์ทันที
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl backdrop-blur-sm space-y-1.5 text-left">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">แจ้งซ่อมบำรุง</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                บันทึกข้อความขออนุมัติซ่อมและติดตามงานแบบเรียลไทม์
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl backdrop-blur-sm space-y-1.5 text-left">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">คลังพัสดุและเบิกจ่าย</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                ควบคุมสต็อกวัสดุคอมพิวเตอร์และตัดยอดอัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Modern Authentication Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20 relative">
            <div className="space-y-1.5 mb-6 text-center sm:text-left">
              <div className="inline-block sm:hidden mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                  เข้าสู่ระบบ
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                เข้าสู่ระบบ
              </h2>
              <p className="text-xs text-slate-500">
                กรุณาระบุชื่อผู้ใช้งานและรหัสผ่านเพื่อเข้าสู่ระบบ
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <span className="text-rose-500 font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {showForgotNotice && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">ต้องการความช่วยเหลือ?</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    กรุณาติดต่อผู้ดูแลระบบศูนย์คอมพิวเตอร์ หรือเจ้าหน้าที่พัสดุ เพื่อขอรับการรีเซ็ตรหัสผ่าน
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    ชื่อผู้ใช้งาน (Username)
                  </label>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError('');
                    }}
                    placeholder="กรอกชื่อผู้ใช้งาน (เช่น user หรือ admin)"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="กรอกรหัสผ่านเข้าสู่ระบบ"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>จดจำการเข้าสู่ระบบ</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotNotice(!showForgotNotice)}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security Guarantee Footer in Card */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center justify-center gap-1 text-[11px] text-slate-400 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>ระบบรักษาความปลอดภัยตามมาตรฐานข้อมูลภาครัฐ</span>
              </div>
              <span className="text-[10px] text-slate-400/80 font-medium">v1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

