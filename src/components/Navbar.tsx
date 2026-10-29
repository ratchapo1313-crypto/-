import { LogOut, Calendar, Building2, Shield, Menu } from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  currentSession: UserSession;
  onLogout: () => void;
  onToggleSidebar?: () => void;
  isServerSynced?: boolean;
  dbLastUpdatedBy?: string;
  dbLastUpdated?: string;
}

export function Navbar({
  currentSession,
  onLogout,
  onToggleSidebar,
  isServerSynced = true,
  dbLastUpdatedBy,
  dbLastUpdated,
}: NavbarProps) {
  // Determine badge color based on role
  const getRoleBadgeColor = () => {
    switch (currentSession.roleCode) {
      case 'Executive':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Director':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'User':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile hamburger & Municipality Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="เปิดเมนู"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-800 flex items-center justify-center text-white shadow-xs">
                <Building2 className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  กองคลัง เทศบาลเมืองมหาสารคาม
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  ฝ่ายบริหารงานทั่วไป
                </p>
              </div>
            </div>
          </div>

          {/* Right: Database Sync Pill, Year Badge, Current Role Display, and Logout Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Database Live & Persistent Status */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
                isServerSynced
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={
                dbLastUpdated
                  ? `Firebase & Server อัปเดตล่าสุด: ${new Date(dbLastUpdated).toLocaleTimeString('th-TH')} โดย ${dbLastUpdatedBy || 'ผู้ใช้'}`
                  : 'ฐานข้อมูล Firebase & Server พร้อมใช้งาน'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isServerSynced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-[11px] font-semibold">
                {isServerSynced ? 'ฐานข้อมูล: Firebase & Server' : 'กำลังซิงค์ฐานข้อมูล...'}
              </span>
              {dbLastUpdatedBy && isServerSynced && (
                <span className="text-[10px] text-emerald-600 font-mono font-semibold">
                  ({dbLastUpdatedBy})
                </span>
              )}
            </div>

            {/* Fiscal Year Badge (Arabic 2570) */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>ปีงบประมาณ 2570</span>
            </div>

            {/* Current Role Banner (No personal name) */}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-2xs ${getRoleBadgeColor()}`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[11px] opacity-80">สิทธิ์ปัจจุบัน:</span>
                <span>{currentSession.roleTitle}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/10 font-mono font-bold">
                  ({currentSession.username})
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs font-medium transition-all cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
