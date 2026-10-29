import {
  FileText,
  Wallet,
  PiggyBank,
  Users,
  CheckCircle2,
  Clock,
  HeartCrack,
  Award,
  ArrowUpRight,
  Shield,
  Calendar,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { EOfficeRecord, FinancialFundRecord, PensionerRecord, ArticleRecord, UserSession } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface DashboardViewProps {
  currentSession: UserSession;
  eOfficeData: EOfficeRecord[];
  chkbData: FinancialFundRecord[];
  gbtData: FinancialFundRecord[];
  pensionersData: PensionerRecord[];
  articlesData?: ArticleRecord[];
  onNavigateTab: (tab: any) => void;
}

export function DashboardView({
  currentSession,
  eOfficeData,
  chkbData,
  gbtData,
  pensionersData,
  onNavigateTab,
}: DashboardViewProps) {
  // E-Office stats (เฉพาะการรับหนังสือ และการส่งหนังสือออก พร้อมจำนวนตัวเลขที่บวกเพิ่ม)
  const eOfficeIn = eOfficeData.filter(d => d.type === 'in').reduce((s, d) => s + (d.quantity || 1), 0);
  const eOfficeOut = eOfficeData.filter(d => d.type === 'out').reduce((s, d) => s + (d.quantity || 1), 0);

  // Funds stats
  const chkbTotalReceived = chkbData.reduce((s, r) => s + r.receivedAmount, 0);
  const chkbTotalPaid = chkbData.reduce((s, r) => s + r.paidAmount, 0);
  const chkbBalance = chkbTotalReceived - chkbTotalPaid;

  const gbtTotalReceived = gbtData.reduce((s, r) => s + r.receivedAmount, 0);
  const gbtTotalPaid = gbtData.reduce((s, r) => s + r.paidAmount, 0);
  const gbtBalance = gbtTotalReceived - gbtTotalPaid;

  // Pensioners stats
  const totalPensioners = pensionersData.length;
  const livingPensioners = pensionersData.filter(p => p.isAlive);
  const deceasedPensioners = pensionersData.filter(p => !p.isAlive);
  
  const verifiedPensioners = livingPensioners.filter(p => p.isVerified);
  const unverifiedPensioners = livingPensioners.filter(p => !p.isVerified);

  // 4 Special Categories
  // 1. Regular Pension
  const regularPensionTotal = livingPensioners.reduce((s, p) => s + (p.regularPension || 0), 0);
  // 2. Living Gratuity
  const livingGratuityPensioners = livingPensioners.filter(p => (p.livingGratuity || 0) > 0);
  const livingGratuityTotal = livingPensioners.reduce((s, p) => s + (p.livingGratuity || 0), 0);
  // 3. จากงบประมาณ
  const bonus25BudgetPensioners = livingPensioners.filter(p => (p.bonus25Budget || 0) > 0);
  const bonus25Budget = livingPensioners.reduce((s, p) => s + (p.bonus25Budget || 0), 0);
  // 4. เงินรับฝาก
  const bonus25DepositPensioners = livingPensioners.filter(p => (p.bonus25Deposit || 0) > 0);
  const bonus25Deposit = livingPensioners.reduce((s, p) => s + (p.bonus25Deposit || 0), 0);
  // 5. Deceased
  const deceasedCount = deceasedPensioners.length;

  // Age Tiers: 60, 65, 70 (ตามเกณฑ์บำเหน็จดำรงชีพ 3 งวด)
  const age60Count = livingPensioners.filter(p => p.age === 60 || p.ageGroup === '60').length;
  const age65Count = livingPensioners.filter(p => p.age === 65 || p.ageGroup === '65').length;
  const age70Count = livingPensioners.filter(p => p.age === 70 || p.ageGroup === '70').length;

  return (
    <div className="space-y-6">
      {/* Dashboard Banner with Fiscal Year 2570 and Current Role */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5" />
                ปีงบประมาณ 2570
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                สิทธิ์ปัจจุบัน: {currentSession.roleTitle} ({currentSession.roleCode})
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ฝ่ายบริหารงานทั่วไป กองคลัง
            </h2>
            <p className="text-blue-200 text-xs sm:text-sm mt-1 max-w-2xl">
              เทศบาลเมืองมหาสารคาม จังหวัดมหาสารคาม • ระบบติดตามผลงานสารบรรณ E-Office, ทะเบียน ช.ค.บ., ก.บ.ท. และสถิติข้าราชการบำนาญแบบ Real-time
            </p>
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />
      </div>

      {/* Specialized Summary Cards (แยกหมวด: บำนาญปกติ, บำเหน็จดำรงชีพ, จากงบประมาณ, เงินรับฝาก, เสียชีวิต) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-700" />
            สรุปข้อมูลข้าราชการบำนาญหมวดหมู่สำคัญ (ปีงบประมาณ 2570)
          </h3>
          <button
            onClick={() => onNavigateTab('special-pensioners')}
            className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 cursor-pointer"
          >
            ดูรายละเอียดทั้งหมด <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. เงินบำนาญปกติ */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">1. เงินบำนาญปกติ</span>
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatNumber(livingPensioners.length)}{' '}
              <span className="text-xs font-normal text-slate-500">คน</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-blue-700 bg-blue-50/80 px-2.5 py-1.5 rounded-lg">
              ยอดรวม: {formatCurrency(regularPensionTotal)} ฿/ด.
            </div>
          </div>

          {/* 2. เงินบำเหน็จดำรงชีพ */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">2. เงินบำเหน็จดำรงชีพ</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatNumber(livingGratuityPensioners.length)}{' '}
              <span className="text-xs font-normal text-slate-500">คน</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg">
              ยอดรวม: {formatCurrency(livingGratuityTotal)} ฿
            </div>
            <p className="text-[11px] text-slate-400 mt-1">เกณฑ์อายุ 65 และ 70 ปี</p>
          </div>

          {/* 3. จากงบประมาณ */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">3. จากงบประมาณ</span>
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <PiggyBank className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatNumber(bonus25BudgetPensioners.length)}{' '}
              <span className="text-xs font-normal text-slate-500">คน</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-indigo-800 bg-indigo-50/80 px-2.5 py-1.5 rounded-lg">
              จำนวน: {formatCurrency(bonus25Budget)} ฿
            </div>
            <p className="text-[11px] text-slate-400 mt-1">งบเทศบาล / อุดหนุน</p>
          </div>

          {/* 4. ช.ค.บ (งบประมาณ) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">4. ช.ค.บ (งบประมาณ)</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <PiggyBank className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatNumber(bonus25DepositPensioners.length)}{' '}
              <span className="text-xs font-normal text-slate-500">คน</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-lg">
              จำนวน: {formatCurrency(bonus25Deposit)} ฿
            </div>
            <p className="text-[11px] text-slate-400 mt-1">งบประมาณเงินช่วยค่าครองชีพ ช.ค.บ</p>
          </div>

          {/* 5. ผู้รับบำนาญเสียชีวิต */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">5. ผู้รับบำนาญเสียชีวิต</span>
              <span className="p-2 rounded-xl bg-rose-50 text-rose-700">
                <HeartCrack className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatNumber(deceasedCount)}{' '}
              <span className="text-xs font-normal text-slate-500">คน</span>
            </div>
            <div className="mt-2 text-xs font-medium text-rose-700 bg-rose-50/80 px-2.5 py-1.5 rounded-lg">
              สิทธิบำเหน็จตกทอด
            </div>
            <p className="text-[11px] text-slate-400 mt-1">บันทึกชื่อทายาทครบ</p>
          </div>
        </div>
      </div>

      {/* Age Groups & Identity Verification Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* สถิติกลุ่มอายุ 65, 70, 75 ปี */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                สถิติจำแนกกลุ่มอายุตามเงื่อนไข (ปีงบประมาณ 2570)
              </h4>
              <p className="text-xs text-slate-500">
                กลุ่มเป้าหมายเพื่อการพิจารณาสิทธิบำเหน็จดำรงชีพและการดูแลสวัสดิการ
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              รวมมีชีวิต {formatNumber(livingPensioners.length)} ราย
            </span>
          </div>

          <div className="space-y-4">
            {/* 60 years */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-700">อายุ 60 ปี (สิทธิเบิกงวดที่ 1 - ไม่เกิน 200,000 ฿)</span>
                <span className="font-bold text-blue-700">{formatNumber(age60Count)} คน</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${livingPensioners.length ? (age60Count / livingPensioners.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* 65 years */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-700">อายุ 65 ปี (สิทธิเบิกงวดที่ 2 - ไม่เกิน 200,000 ฿)</span>
                <span className="font-bold text-emerald-700">{formatNumber(age65Count)} คน</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${livingPensioners.length ? (age65Count / livingPensioners.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* 70 years */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-700">อายุ 70 ปี (สิทธิเบิกงวดที่ 3 - ไม่เกิน 100,000 ฿)</span>
                <span className="font-bold text-purple-700">{formatNumber(age70Count)} คน</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${livingPensioners.length ? (age70Count / livingPensioners.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">จำแนกตามเกณฑ์เงื่อนไขกฎหมาย ก.บ.ท.</span>
            <button
              onClick={() => onNavigateTab('special-pensioners')}
              className="text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
            >
              เปิดตารางจำแนกเกณฑ์อายุ &rarr;
            </button>
          </div>
        </div>

        {/* สถานะการยืนยันตัวตน */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                รายงานการยืนยันตัวตนข้าราชการบำนาญ
              </h4>
              <p className="text-xs text-slate-500">
                สถานะการแสดงตนเพื่อรับเงินบำนาญประจำปีงบประมาณ 2570
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('pensioners')}
              className="text-xs text-blue-700 hover:text-blue-900 font-medium cursor-pointer"
            >
              จัดการรายชื่อ &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-semibold">ยืนยันตัวตนแล้ว</span>
              </div>
              <div className="text-2xl font-bold text-emerald-900">
                {formatNumber(verifiedPensioners.length)}{' '}
                <span className="text-xs font-normal text-emerald-700">ราย</span>
              </div>
              <p className="text-[11px] text-emerald-600 mt-1">
                {livingPensioners.length
                  ? ((verifiedPensioners.length / livingPensioners.length) * 100).toFixed(1)
                  : 0}
                % ของผู้มีชีวิตทั้งหมด
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold">ยังไม่ได้ยืนยันตัวตน</span>
              </div>
              <div className="text-2xl font-bold text-amber-900">
                {formatNumber(unverifiedPensioners.length)}{' '}
                <span className="text-xs font-normal text-amber-700">ราย</span>
              </div>
              <p className="text-[11px] text-amber-700 mt-1">
                ต้องติดตามสิทธิและประสานงานด่วน
              </p>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>ช่องทางการยืนยัน: ออนไลน์ หรือ แสดงตนที่กองคลัง</span>
            <button
              onClick={() => onNavigateTab('pensioners')}
              className="px-2.5 py-1 bg-blue-800 text-white rounded-lg font-medium text-xs hover:bg-blue-900 cursor-pointer"
            >
              ยืนยันตัวตนด่วน
            </button>
          </div>
        </div>
      </div>

      {/* Module Overview: E-Office, ช.ค.บ., and ก.บ.ท. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* E-Office Stats Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">E-Office บริหารงานทั่วไป</h4>
            </div>
            <button
              onClick={() => onNavigateTab('eoffice')}
              className="text-xs text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              เข้าสู่ระบบ &rarr;
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-center pt-2">
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
              <div className="text-xs text-blue-700 font-medium">การรับหนังสือ</div>
              <div className="text-lg font-bold text-blue-950">{formatNumber(eOfficeIn)}</div>
              <div className="text-[10px] text-blue-600">เรื่อง</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="text-xs text-emerald-700 font-medium">การส่งหนังสือออก</div>
              <div className="text-lg font-bold text-emerald-950">{formatNumber(eOfficeOut)}</div>
              <div className="text-[10px] text-emerald-600">เรื่อง</div>
            </div>
          </div>
        </div>

        {/* ช.ค.บ. Stats Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">เงินช่วยค่าครองชีพ (ช.ค.บ.)</h4>
            </div>
            <button
              onClick={() => onNavigateTab('chkb')}
              className="text-xs text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              เปิดทะเบียน &rarr;
            </button>
          </div>
          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex justify-between text-slate-600">
              <span>ยอดรับเงินรวม:</span>
              <span className="font-semibold text-emerald-700">{formatCurrency(chkbTotalReceived)} ฿</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ยอดจ่ายเงินรวม:</span>
              <span className="font-semibold text-rose-700">{formatCurrency(chkbTotalPaid)} ฿</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
              <span>คงเหลือสุทธิ:</span>
              <span className="text-emerald-800">{formatCurrency(chkbBalance)} ฿</span>
            </div>
          </div>
        </div>

        {/* ก.บ.ท. Stats Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <PiggyBank className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">กองทุนบำเหน็จบำนาญ (ก.บ.ท.)</h4>
            </div>
            <button
              onClick={() => onNavigateTab('gbt')}
              className="text-xs text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              เปิดทะเบียน &rarr;
            </button>
          </div>
          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex justify-between text-slate-600">
              <span>ยอดรับเงินรวม:</span>
              <span className="font-semibold text-blue-700">{formatCurrency(gbtTotalReceived)} ฿</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ยอดจ่ายเงินรวม:</span>
              <span className="font-semibold text-rose-700">{formatCurrency(gbtTotalPaid)} ฿</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
              <span>คงเหลือสุทธิ:</span>
              <span className="text-blue-900">{formatCurrency(gbtBalance)} ฿</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
