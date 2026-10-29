import {
  LayoutDashboard,
  FileText,
  Wallet,
  PiggyBank,
  Users,
  Award,
  FileSpreadsheet,
  FileCheck,
  Shield,
  X,
  Lock,
  Banknote,
  BookOpen,
} from 'lucide-react';
import { UserSession } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'eoffice'
  | 'chkb'
  | 'gbt'
  | 'pensioners'
  | 'gratuity-report'
  | 'special-pensioners'
  | 'research'
  | 'excel'
  | 'memo';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentSession: UserSession;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  currentSession,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const menuItems: { id: ActiveTab; label: string; icon: any; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'ภาพรวมและแดชบอร์ด 2570',
      icon: LayoutDashboard,
    },
    {
      id: 'eoffice',
      label: 'E-Office บริหารงานทั่วไป',
      icon: FileText,
    },
    {
      id: 'chkb',
      label: 'ทะเบียนเงินช่วยฯ (ช.ค.บ.)',
      icon: Wallet,
    },
    {
      id: 'gbt',
      label: 'ทะเบียนกองทุน (ก.บ.ท.)',
      icon: PiggyBank,
    },
    {
      id: 'pensioners',
      label: 'รายงานผู้รับบำนาญ & ยืนยันตัวตน',
      icon: Users,
    },
    {
      id: 'gratuity-report',
      label: 'รายงานผู้รับบำเหน็จ (คำนวณเงิน)',
      icon: Banknote,
      badge: 'คำนวณเงิน',
    },
    {
      id: 'special-pensioners',
      label: 'จำแนกประเภทและเกณฑ์อายุ',
      icon: Award,
      badge: 'พิเศษ',
    },
    {
      id: 'research',
      label: 'ค้นคว้าวิจัย & บทความการคลัง',
      icon: BookOpen,
      badge: 'อัปเดต',
    },
    {
      id: 'excel',
      label: 'ศูนย์นำเข้า-ส่งออก Excel (.xlsx)',
      icon: FileSpreadsheet,
    },
    {
      id: 'memo',
      label: 'แบบรายงานราชการ (บันทึกข้อความ)',
      icon: FileCheck,
    },
  ];

  const handleTabClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center text-white">
              <Shield className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm block">กองคลัง เทศบาลเมืองมหาสารคาม</span>
              <span className="text-[10px] text-slate-500 block">ฝ่ายบริหารงานทั่วไป</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Role Status Box (Without Personal Name) */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                สถานะสิทธิ์ปัจจุบัน
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                {currentSession.username}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {currentSession.roleTitle}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {currentSession.description}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            เมนูการดำเนินงาน
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-800 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-amber-300' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide shrink-0 ${
                      isActive
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500">
          <div className="flex items-center justify-between">
            <span>กองคลัง เทศบาลเมืองมหาสารคาม</span>
            <span className="font-mono text-slate-400">พ.ศ. 2570</span>
          </div>
        </div>
      </aside>
    </>
  );
}
