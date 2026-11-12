import React from 'react';
import { ShieldCheck, Cloud, Mail, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#07162C] border-t border-blue-900/40 text-slate-300 py-2.5 px-4 text-xs font-['Sarabun',sans-serif] flex flex-col md:flex-row items-center justify-between gap-2 shadow-inner">
      {/* Left Version & System Title */}
      <div className="flex items-center space-x-2 text-slate-300 text-[11px] sm:text-xs">
        <span className="font-extrabold text-sky-400 tracking-wider">PORMODIT v1.0.0</span>
        <span className="text-slate-600">|</span>
        <span className="font-semibold text-slate-300">
          ระบบบริหารจัดการครุภัณฑ์และพัสดุคลังย่อย สำหรับองค์กรปกครองส่วนท้องถิ่น / หน่วยงานภาครัฐ
        </span>
      </div>

      {/* Right Badges & Attribution */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] font-medium text-slate-300">
        <div className="flex items-center space-x-1 text-emerald-400 font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ปลอดภัย 100%</span>
        </div>
        <span className="text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center space-x-1 text-sky-300">
          <Cloud className="w-3.5 h-3.5" />
          <span>ข้อมูลของคุณอยู่ในระบบของหน่วยงาน</span>
        </div>
        <span className="text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors cursor-pointer">
          <Mail className="w-3.5 h-3.5 text-amber-400" />
          <span>ติดต่อผู้ดูแลระบบ</span>
        </div>
        <span className="text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center space-x-1 text-amber-300 font-bold">
          <span>⚽ โดย พ่อมดไอที</span>
        </div>
      </div>
    </footer>
  );
};
