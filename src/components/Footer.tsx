import { Shield } from 'lucide-react';
import { UserSession } from '../types';

interface FooterProps {
  currentSession: UserSession;
}

export function Footer({ currentSession }: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-200 py-3.5 px-4 text-xs text-slate-500 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">
            กองคลัง เทศบาลเมืองมหาสารคาม
          </span>
          <span className="text-slate-300">•</span>
          <span>ฝ่ายบริหารงานทั่วไป ประจำปีงบประมาณ 2570</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[11px]">
            <Shield className="w-3 h-3 text-blue-600" />
            <span>สิทธิ์ปัจจุบัน:</span>
            <span className="font-semibold text-blue-800">
              {currentSession.roleTitle} ({currentSession.roleCode})
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            ความปลอดภัย: เข้ารหัสลับ TLS 1.3
          </span>
        </div>
      </div>
    </footer>
  );
}
