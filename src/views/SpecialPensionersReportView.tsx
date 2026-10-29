import React, { useState, useMemo } from 'react';
import {
  Award,
  Users,
  Wallet,
  PiggyBank,
  HeartCrack,
  CalendarDays,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  UserCheck,
  X,
  FileSpreadsheet,
  ShieldCheck,
  Percent,
  PlusCircle,
  User,
  Lock,
  Unlock,
} from 'lucide-react';
import { PensionerRecord, UserSession, HeirBeneficiary } from '../types';
import { formatCurrency, formatNumber, formatThaiDate } from '../utils/formatters';
import { exportSingleCategoryToExcel } from '../utils/excel';

interface SpecialPensionersReportViewProps {
  currentSession: UserSession;
  pensioners: PensionerRecord[];
  onAddPensioner: (p: PensionerRecord) => void;
  onUpdatePensioner: (p: PensionerRecord) => void;
  onDeletePensioner: (id: string) => void;
}

type SubTab = 'regular' | 'living' | 'bonus25-budget' | 'bonus25-deposit' | 'deceased' | 'age-tiers';

export function SpecialPensionersReportView({
  currentSession,
  pensioners,
  onAddPensioner,
  onUpdatePensioner,
  onDeletePensioner,
}: SpecialPensionersReportViewProps) {
  const canEdit = currentSession.roleCode === 'User';

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('regular');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = React.useDeferredValue(searchTerm);
  const [selectedAgeTier, setSelectedAgeTier] = useState<'all' | '60' | '65' | '70' | '75'>('all');

  // Modal State for Quick Edit/Add
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PensionerRecord | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<PensionerRecord | null>(null);

  // Form fields
  const [formData, setFormData] = useState<Partial<PensionerRecord>>({});

  // 1. Regular Pension Data
  const livingPensioners = useMemo(() => pensioners.filter((p) => p.isAlive), [pensioners]);
  const regularPensionTotal = useMemo(
    () => livingPensioners.reduce((s, p) => s + (p.regularPension || 0), 0),
    [livingPensioners]
  );

  // 2. Living Gratuity Data
  const livingGratuityPensioners = useMemo(
    () => livingPensioners.filter((p) => (p.livingGratuity || 0) > 0 || p.age >= 60),
    [livingPensioners]
  );
  const livingGratuityEligible60 = useMemo(
    () => livingPensioners.filter((p) => p.age === 60 || p.ageGroup === '60' || (p.livingGratuityInstallment1 || 0) > 0),
    [livingPensioners]
  );
  const livingGratuityEligible65 = useMemo(
    () => livingPensioners.filter((p) => p.age === 65 || p.ageGroup === '65' || (p.livingGratuityInstallment2 || 0) > 0),
    [livingPensioners]
  );
  const livingGratuityEligible70 = useMemo(
    () => livingPensioners.filter((p) => p.age === 70 || p.ageGroup === '70' || (p.livingGratuityInstallment3 || 0) > 0),
    [livingPensioners]
  );
  const livingGratuityTotal = useMemo(
    () => livingPensioners.reduce((s, p) => s + (p.livingGratuity || 0), 0),
    [livingPensioners]
  );

  // 3. จากงบประมาณ Data (แยกเมนูออกจากเงินเพิ่ม 25%)
  const bonus25BudgetList = useMemo(
    () => livingPensioners.filter((p) => (p.bonus25Budget || 0) > 0),
    [livingPensioners]
  );
  const totalBonusBudget = useMemo(
    () => livingPensioners.reduce((s, p) => s + (p.bonus25Budget || 0), 0),
    [livingPensioners]
  );

  // 4. เงินรับฝาก Data (แยกเมนูออกจากเงินเพิ่ม 25%)
  const bonus25DepositList = useMemo(
    () => livingPensioners.filter((p) => (p.bonus25Deposit || 0) > 0),
    [livingPensioners]
  );
  const totalBonusDeposit = useMemo(
    () => livingPensioners.reduce((s, p) => s + (p.bonus25Deposit || 0), 0),
    [livingPensioners]
  );

  // รวมเงินเพิ่ม 25% (ทั้งงบประมาณและรับฝาก)
  const totalBonus25 = totalBonusBudget + totalBonusDeposit;

  // 4. Deceased Data
  const deceasedList = useMemo(() => pensioners.filter((p) => !p.isAlive), [pensioners]);

  // 5. Age Tiers Data
  const age60List = useMemo(
    () => livingPensioners.filter((p) => p.age === 60 || p.ageGroup === '60'),
    [livingPensioners]
  );
  const age65List = useMemo(
    () => livingPensioners.filter((p) => p.age === 65 || p.ageGroup === '65'),
    [livingPensioners]
  );
  const age70List = useMemo(
    () => livingPensioners.filter((p) => p.age === 70 || p.ageGroup === '70'),
    [livingPensioners]
  );
  const age75List = useMemo(
    () => livingPensioners.filter((p) => p.age === 75 || p.ageGroup === '75'),
    [livingPensioners]
  );

  // Search Filter Helper
  const matchesSearch = (p: PensionerRecord, term: string) => {
    if (!term) return true;
    const lower = term.toLowerCase();
    const fullName = `${p.title}${p.firstName} ${p.lastName}`.toLowerCase();
    const matchIdCard = p.idCard?.includes(term);
    const matchCode = p.code?.toLowerCase().includes(lower);
    const matchPos = p.formerPosition?.toLowerCase().includes(lower);
    const matchHeir = p.heirName?.toLowerCase().includes(lower);
    const matchHeirs = p.heirs?.some((h) => h.name.toLowerCase().includes(lower));
    return fullName.includes(lower) || matchIdCard || matchCode || matchPos || matchHeir || matchHeirs;
  };

  // Filtered lists by deferredSearchTerm for each of the 5 categories + age tiers
  const filteredLivingPensioners = useMemo(
    () => livingPensioners.filter((p) => matchesSearch(p, deferredSearchTerm)),
    [livingPensioners, deferredSearchTerm]
  );

  const filteredLivingGratuityPensioners = useMemo(
    () => livingGratuityPensioners.filter((p) => matchesSearch(p, deferredSearchTerm)),
    [livingGratuityPensioners, deferredSearchTerm]
  );

  const filteredBonus25BudgetList = useMemo(
    () => bonus25BudgetList.filter((p) => matchesSearch(p, deferredSearchTerm)),
    [bonus25BudgetList, deferredSearchTerm]
  );

  const filteredBonus25DepositList = useMemo(
    () => bonus25DepositList.filter((p) => matchesSearch(p, deferredSearchTerm)),
    [bonus25DepositList, deferredSearchTerm]
  );

  const filteredDeceasedList = useMemo(
    () => deceasedList.filter((p) => matchesSearch(p, deferredSearchTerm)),
    [deceasedList, deferredSearchTerm]
  );

  const filteredAgeTierList = useMemo(() => {
    return livingPensioners
      .filter((p) => {
        if (selectedAgeTier === '60') return p.age === 60 || p.ageGroup === '60';
        if (selectedAgeTier === '65') return p.age === 65 || p.ageGroup === '65';
        if (selectedAgeTier === '70') return p.age === 70 || p.ageGroup === '70';
        if (selectedAgeTier === '75') return p.age === 75 || p.ageGroup === '75';
        return true;
      })
      .filter((p) => matchesSearch(p, deferredSearchTerm));
  }, [livingPensioners, selectedAgeTier, deferredSearchTerm]);

  // Handle Delete with Confirmation (Non-blocking)
  const handleDelete = (item: PensionerRecord) => {
    setDeleteConfirmTarget(item);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: PensionerRecord) => {
    setEditingItem(p);
    let resolvedHeirs: HeirBeneficiary[] = [];
    if (p.heirs && p.heirs.length > 0) {
      resolvedHeirs = p.heirs.map((h) => ({ ...h }));
    } else if (p.heirName) {
      resolvedHeirs = [
        {
          id: `h-init-1`,
          name: p.heirName,
          relation: p.heirRelation || 'คู่สมรส',
          percentage: p.heirPercentage || 100,
          phone: p.heirPhone || '',
        },
      ];
    } else {
      resolvedHeirs = [
        {
          id: `h-init-1`,
          name: '',
          relation: 'คู่สมรส',
          percentage: 100,
          phone: '',
        },
      ];
    }

    const currentLiving = p.livingGratuity || 0;
    const inst1 = p.livingGratuityInstallment1 !== undefined
      ? p.livingGratuityInstallment1
      : (p.age >= 60 ? Math.min(200000, currentLiving) : 0);
    const inst2 = p.livingGratuityInstallment2 !== undefined
      ? p.livingGratuityInstallment2
      : (p.age >= 65 && currentLiving > 200000 ? Math.min(200000, currentLiving - 200000) : 0);
    const inst3 = p.livingGratuityInstallment3 !== undefined
      ? p.livingGratuityInstallment3
      : (p.age >= 70 && currentLiving > 400000 ? currentLiving - 400000 : 0);

    setFormData({
      ...p,
      livingGratuityInstallment1: inst1,
      livingGratuityInstallment2: inst2,
      livingGratuityInstallment3: inst3,
      livingGratuity: inst1 + inst2 + inst3,
      heirName: p.heirName || '',
      heirRelation: p.heirRelation || 'คู่สมรส',
      heirPercentage: p.heirPercentage ?? 100,
      heirPhone: p.heirPhone || '',
      heirs: resolvedHeirs,
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    const newId = `PEN-2570-${String(pensioners.length + 1).padStart(3, '0')}`;
    setFormData({
      id: newId,
      code: `บน-2570-${String(pensioners.length + 1).padStart(3, '0')}`,
      title: 'นาย',
      firstName: '',
      lastName: '',
      idCard: '',
      formerPosition: '',
      birthDate: '1961-01-01',
      age: 65,
      ageGroup: '65',
      isAlive: true,
      heirName: '',
      heirRelation: 'คู่สมรส',
      heirPercentage: 100,
      heirPhone: '',
      heirs: [
        {
          id: `h-add-${Date.now()}`,
          name: '',
          relation: 'คู่สมรส',
          percentage: 100,
          phone: '',
        },
      ],
      regularPension: 40000,
      livingGratuityInstallment1: 200000,
      livingGratuityInstallment2: 0,
      livingGratuityInstallment3: 0,
      livingGratuity: 200000,
      livingGratuityStatus: 'eligible_65',
      bonus25Total: 10000,
      bonus25Budget: 7000,
      bonus25Deposit: 3000,
      chkbAmount: 8000,
    });
    setIsModalOpen(true);
  };

  const handleAddHeirRow = () => {
    const currentHeirs = formData.heirs || [];
    const remainingPercentage = Math.max(
      0,
      100 - currentHeirs.reduce((sum, h) => sum + (Number(h.percentage) || 0), 0)
    );
    const newHeir: HeirBeneficiary = {
      id: `h-${Date.now()}-${currentHeirs.length + 1}`,
      name: '',
      relation: 'บุตร',
      percentage: remainingPercentage > 0 ? remainingPercentage : 50,
      phone: '',
    };
    setFormData({
      ...formData,
      heirs: [...currentHeirs, newHeir],
    });
  };

  const handleRemoveHeirRow = (id: string) => {
    const currentHeirs = (formData.heirs || []).filter((h) => h.id !== id);
    setFormData({
      ...formData,
      heirs: currentHeirs,
    });
  };

  const handleUpdateHeirRow = (id: string, field: keyof HeirBeneficiary, value: any) => {
    const updatedHeirs = (formData.heirs || []).map((h) => {
      if (h.id === id) {
        return { ...h, [field]: value };
      }
      return h;
    });

    const first = updatedHeirs[0];
    setFormData({
      ...formData,
      heirs: updatedHeirs,
      heirName: first ? first.name : '',
      heirRelation: first ? first.relation : '',
      heirPercentage: first ? Number(first.percentage) || 0 : 0,
      heirPhone: first ? first.phone : '',
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.code) return;

    const bBudget = Number(formData.bonus25Budget) || 0;
    const bDeposit = Number(formData.bonus25Deposit) || 0;
    const bTotal = bBudget + bDeposit;

    const validHeirs = (formData.heirs || []).filter((h) => h.name.trim() !== '');
    const primaryHeir = validHeirs[0] || {
      name: formData.heirName || '',
      relation: formData.heirRelation || '',
      percentage: Number(formData.heirPercentage) || 0,
      phone: formData.heirPhone || '',
    };

    const record: PensionerRecord = {
      id: formData.id || `PEN-2570-${String(pensioners.length + 1).padStart(3, '0')}`,
      code: formData.code || '',
      title: formData.title || 'นาย',
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      idCard: formData.idCard || '',
      formerPosition: formData.formerPosition || '',
      birthDate: formData.birthDate || '1961-01-01',
      age: Number(formData.age) || 65,
      ageGroup: (formData.ageGroup as any) || '65',
      isAlive: formData.isAlive ?? true,
      deathDate: formData.deathDate || undefined,
      
      // ทายาทผู้มีสิทธิขอรับบำเหน็จตกทอด
      heirName: primaryHeir.name || undefined,
      heirRelation: primaryHeir.relation || undefined,
      heirPercentage: primaryHeir.percentage !== undefined ? Number(primaryHeir.percentage) : undefined,
      heirPhone: primaryHeir.phone || undefined,
      heirs: validHeirs.length > 0 ? validHeirs : undefined,

      isVerified: formData.isVerified ?? false,
      verifiedDate: formData.verifiedDate || undefined,
      verificationChannel: formData.verificationChannel,
      regularPension: Number(formData.regularPension) || 0,

      // บำเหน็จดำรงชีพ (ตามเกณฑ์ 60/65/70 ปี)
      livingGratuityInstallment1: (Number(formData.age) || 65) >= 60 ? (Number(formData.livingGratuityInstallment1) || 0) : 0,
      livingGratuityInstallment2: (Number(formData.age) || 65) >= 65 ? (Number(formData.livingGratuityInstallment2) || 0) : 0,
      livingGratuityInstallment3: (Number(formData.age) || 65) >= 70 ? (Number(formData.livingGratuityInstallment3) || 0) : 0,
      livingGratuity:
        ((Number(formData.age) || 65) >= 60 ? (Number(formData.livingGratuityInstallment1) || 0) : 0) +
        ((Number(formData.age) || 65) >= 65 ? (Number(formData.livingGratuityInstallment2) || 0) : 0) +
        ((Number(formData.age) || 65) >= 70 ? (Number(formData.livingGratuityInstallment3) || 0) : 0),
      livingGratuityStatus:
        (Number(formData.age) || 65) >= 70
          ? 'eligible_70'
          : (Number(formData.age) || 65) >= 65
          ? 'eligible_65'
          : (Number(formData.age) || 65) >= 60
          ? 'eligible_60'
          : 'not_eligible',

      bonus25Total: bTotal,
      bonus25Budget: bBudget,
      bonus25Deposit: bDeposit,
      chkbAmount: Number(formData.chkbAmount) || 0,
      special3xHeirName: formData.special3xHeirName?.trim() || undefined,
      special3xAmount: formData.special3xAmount !== undefined ? Number(formData.special3xAmount) : undefined,
      special3xRelation: formData.special3xRelation?.trim() || undefined,
      special3xPhone: formData.special3xPhone?.trim() || undefined,
      recordedBy: editingItem?.recordedBy || currentSession.username,
      updatedAt: new Date().toISOString(),
    };

    if (editingItem) {
      onUpdatePensioner(record);
    } else {
      onAddPensioner(record);
    }
    setIsModalOpen(false);
  };

  // Export current active view to Excel
  const handleExportCurrentTab = () => {
    if (activeSubTab === 'regular') {
      const data = livingPensioners.map((p, i) => ({
        ลำดับ: i + 1,
        รหัสบำนาญ: p.code,
        ชื่อสกุล: `${p.title}${p.firstName} ${p.lastName}`,
        ตำแหน่งเดิม: p.formerPosition,
        'เงินบำนาญปกติ (บาท)': p.regularPension,
      }));
      exportSingleCategoryToExcel('เงินบำนาญปกติ 2570', 'รายงาน_เงินบำนาญปกติ_2570', data);
    } else if (activeSubTab === 'living') {
      const data = livingGratuityPensioners.map((p, i) => ({
        ลำดับ: i + 1,
        รหัสบำนาญ: p.code,
        ชื่อสกุล: `${p.title}${p.firstName} ${p.lastName}`,
        อายุ: p.age,
        'เกณฑ์สิทธิ': p.age === 65 ? 'อายุครบ 65 ปี' : p.age === 70 ? 'อายุครบ 70 ปี' : 'อื่นๆ',
        'เงินบำเหน็จดำรงชีพ (บาท)': p.livingGratuity,
      }));
      exportSingleCategoryToExcel('บำเหน็จดำรงชีพ 2570', 'รายงาน_เงินบำเหน็จดำรงชีพ_2570', data);
    } else if (activeSubTab === 'bonus25-budget') {
      const data = bonus25BudgetList.map((p, i) => ({
        ลำดับ: i + 1,
        รหัสบำนาญ: p.code,
        ชื่อสกุล: `${p.title}${p.firstName} ${p.lastName}`,
        ตำแหน่งเดิม: p.formerPosition,
        'จากงบประมาณ (บาท)': p.bonus25Budget,
      }));
      exportSingleCategoryToExcel('เงินเพิ่ม 25% จากงบประมาณ', 'รายงาน_เงินเพิ่ม25_จากงบประมาณ_2570', data);
    } else if (activeSubTab === 'bonus25-deposit') {
      const data = bonus25DepositList.map((p, i) => ({
        ลำดับ: i + 1,
        รหัสบำนาญ: p.code,
        ชื่อสกุล: `${p.title}${p.firstName} ${p.lastName}`,
        ตำแหน่งเดิม: p.formerPosition,
        'ช.ค.บ (งบประมาณ) (บาท)': p.bonus25Deposit,
      }));
      exportSingleCategoryToExcel('ช.ค.บ (งบประมาณ)', 'รายงาน_ช.ค.บ_งบประมาณ_2570', data);
    } else if (activeSubTab === 'deceased') {
      const data = deceasedList.map((p, i) => ({
        ลำดับ: i + 1,
        รหัสบำนาญ: p.code,
        ชื่อสกุล: `${p.title}${p.firstName} ${p.lastName}`,
        วันที่ถึงแก่กรรม: p.deathDate || '-',
        ชื่อทายาท: p.heirName || '-',
        ความสัมพันธ์: p.heirRelation || '-',
        เบอร์โทรศัพท์: p.heirPhone || '-',
      }));
      exportSingleCategoryToExcel('ผู้รับบำนาญเสียชีวิต 2570', 'รายงาน_ผู้รับบำนาญเสียชีวิต_2570', data);
    } else if (activeSubTab === 'age-tiers') {
      const data = livingPensioners.map((p, i) => ({
        ลำดับ: i + 1,
        รหัสบำนาญ: p.code,
        ชื่อสกุล: `${p.title}${p.firstName} ${p.lastName}`,
        อายุ: p.age,
        กลุ่มอายุ: p.age === 65 ? 'ครบ 65 ปี' : p.age === 70 ? 'ครบ 70 ปี' : p.age === 75 ? 'ครบ 75 ปี' : 'กลุ่มอื่น',
      }));
      exportSingleCategoryToExcel('สถิติตามเกณฑ์อายุ 2570', 'รายงาน_จำแนกตามเกณฑ์อายุ_2570', data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1">
            <Award className="w-3.5 h-3.5" />
            เมนูเฉพาะ (Specialized Pension Report)
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            รายงานข้าราชการบำนาญจำแนกประเภทและเกณฑ์อายุ (ปีงบประมาณ 2570)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            แยกเมนูพิเศษตามระเบียบราชการ 5 หมวดหมู่หลัก พร้อมรองรับการเพิ่ม แก้ไข และลบข้อมูลรายบุคคล
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCurrentTab}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="ดาวน์โหลดข้อมูลหมวดนี้เป็น Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            ดาวน์โหลด Excel
          </button>
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรายชื่อ
            </button>
          )}
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ, สกุล, รหัสบำนาญ, เลขบัตร 13 หลัก, ตำแหน่ง, ชื่อทายาท..."
            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
          <button
            type="button"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Search className="w-3.5 h-3.5" />
            ค้นหา
          </button>
        </div>

        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-medium flex items-center gap-1 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" /> ล้างคำค้นหา
          </button>
        )}

        <div className="text-xs text-slate-500 flex items-center gap-2 shrink-0">
          <span>ผลการค้นหา:</span>
          <span className="font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-mono">
            {activeSubTab === 'regular' && `${formatNumber(filteredLivingPensioners.length)} ราย`}
            {activeSubTab === 'living' && `${formatNumber(filteredLivingGratuityPensioners.length)} ราย`}
            {activeSubTab === 'bonus25-budget' && `${formatNumber(filteredBonus25BudgetList.length)} ราย`}
            {activeSubTab === 'bonus25-deposit' && `${formatNumber(filteredBonus25DepositList.length)} ราย`}
            {activeSubTab === 'deceased' && `${formatNumber(filteredDeceasedList.length)} ราย`}
            {activeSubTab === 'age-tiers' && `${formatNumber(filteredAgeTierList.length)} ราย`}
          </span>
        </div>
      </div>

      {/* Sub Tabs Bar (5 หมวดหมู่หลัก + เกณฑ์อายุ) */}
      <div className="flex overflow-x-auto gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveSubTab('regular')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'regular'
              ? 'bg-white text-blue-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Users className="w-4 h-4 text-blue-700" />
          1. รายงานเงินบำนาญปกติ
        </button>

        <button
          onClick={() => setActiveSubTab('living')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'living'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-700" />
          2. รายงานเงินบำเหน็จดำรงชีพ
        </button>

        <button
          onClick={() => setActiveSubTab('bonus25-budget')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'bonus25-budget'
              ? 'bg-white text-indigo-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <PiggyBank className="w-4 h-4 text-indigo-700" />
          3. จากงบประมาณ ({formatCurrency(totalBonusBudget)} ฿)
        </button>

        <button
          onClick={() => setActiveSubTab('bonus25-deposit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'bonus25-deposit'
              ? 'bg-white text-amber-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <PiggyBank className="w-4 h-4 text-amber-700" />
          4. ช.ค.บ (งบประมาณ) ({formatCurrency(totalBonusDeposit)} ฿)
        </button>

        <button
          onClick={() => setActiveSubTab('deceased')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'deceased'
              ? 'bg-white text-rose-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <HeartCrack className="w-4 h-4 text-rose-700" />
          5. รายงานผู้รับบำนาญเสียชีวิต
        </button>

        <button
          onClick={() => setActiveSubTab('age-tiers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'age-tiers'
              ? 'bg-white text-blue-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-blue-800" />
          6. สถิติตามเกณฑ์อายุ (60, 65, 70, 75 ปี)
        </button>
      </div>

      {/* 1. Regular Pension Sub-View */}
      {activeSubTab === 'regular' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">จำนวนราย (คน)</span>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {formatNumber(livingPensioners.length)}{' '}
                <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-blue-600 mt-1">ข้าราชการบำนาญที่มีชีวิตอยู่ทั้งหมด</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">จำนวนเงินรวม (บาท)</span>
              <div className="text-3xl font-bold text-blue-900 mt-1">
                {formatCurrency(regularPensionTotal)}{' '}
                <span className="text-xs font-normal text-slate-500">บาท/เดือน</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">ยอดจ่ายเงินบำนาญปกติประจำเดือน</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800">
                ตารางเงินบำนาญปกติรายบุคคล (รองรับการบันทึกและแก้ไข)
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {formatNumber(filteredLivingPensioners.length)} จาก {formatNumber(livingPensioners.length)} รายการ
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                    <th className="py-3 px-4 w-28">รหัสบำนาญ</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-4">ตำแหน่งเดิม</th>
                    <th className="py-3 px-4 w-44 text-right font-bold text-blue-900">
                      เงินบำนาญปกติ (บาท/เดือน)
                    </th>
                    <th className="py-3 px-4 w-32 text-center">สถานะ</th>
                    {canEdit && <th className="py-3 px-4 w-20 text-center">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLivingPensioners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลตามคำค้นหา &ldquo;{searchTerm}&rdquo;
                      </td>
                    </tr>
                  ) : (
                    filteredLivingPensioners.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {formatNumber(idx + 1)}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-blue-900">
                          {item.code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>
                            {item.title}
                            {item.firstName} {item.lastName}
                          </div>
                          {item.recordedBy && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              ผู้บันทึก: {item.recordedBy}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.formerPosition}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-900">
                          {formatCurrency(item.regularPension)} ฿
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                            ปกติ
                          </span>
                        </td>
                        {canEdit && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                title="แก้ไขข้อมูล"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="ลบข้อมูล"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Living Gratuity Sub-View */}
      {activeSubTab === 'living' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">จำนวนรายรวม (คน)</span>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {formatNumber(livingGratuityPensioners.length)}{' '}
                <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">ผู้ได้รับสิทธิบำเหน็จดำรงชีพ</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">จำนวนเงินรวม (บาท)</span>
              <div className="text-3xl font-bold text-emerald-800 mt-1">
                {formatCurrency(livingGratuityTotal)}{' '}
                <span className="text-xs font-normal text-slate-500">บาท</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">เบิกจ่ายตามระเบียบ ก.บ.ท.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">จำแนกตามเกณฑ์สิทธิ (3 งวด)</span>
              <div className="text-xs space-y-1 mt-2 text-slate-700">
                <div className="flex justify-between">
                  <span>• อายุครบ 60 ปี (งวด 1):</span>
                  <span className="font-bold text-emerald-800">
                    {formatNumber(livingGratuityEligible60.length)} คน
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>• อายุครบ 65 ปี (งวด 2):</span>
                  <span className="font-bold text-blue-800">
                    {formatNumber(livingGratuityEligible65.length)} คน
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>• อายุครบ 70 ปี (งวด 3):</span>
                  <span className="font-bold text-purple-800">
                    {formatNumber(livingGratuityEligible70.length)} คน
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-bold text-xs text-slate-800">
                  ตารางการคำนวณและเบิกจ่ายเงินบำเหน็จดำรงชีพ (ตามเกณฑ์ 60 / 65 / 70 ปี)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  แสดงรายละเอียดการเบิกจ่ายแยกตามงวดที่ 1 (60 ปี), งวดที่ 2 (65 ปี) และงวดที่ 3 (70 ปี)
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {formatNumber(filteredLivingGratuityPensioners.length)} จาก {formatNumber(livingGratuityPensioners.length)} ราย
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">ลำดับ</th>
                    <th className="py-3 px-3 w-28">รหัสบำนาญ</th>
                    <th className="py-3 px-3">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-3 w-16 text-center">อายุ</th>
                    <th className="py-3 px-3 text-right text-emerald-800 font-semibold">
                      งวด 1 (60 ปี)
                    </th>
                    <th className="py-3 px-3 text-right text-blue-800 font-semibold">
                      งวด 2 (65 ปี)
                    </th>
                    <th className="py-3 px-3 text-right text-purple-800 font-semibold">
                      งวด 3 (70 ปี)
                    </th>
                    <th className="py-3 px-3 text-right font-bold text-amber-900 bg-amber-50/50">
                      รวมบำเหน็จดำรงชีพ
                    </th>
                    <th className="py-3 px-3">ตำแหน่งเดิม</th>
                    {canEdit && <th className="py-3 px-3 w-20 text-center">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLivingGratuityPensioners.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลตามคำค้นหา &ldquo;{searchTerm}&rdquo;
                      </td>
                    </tr>
                  ) : (
                    filteredLivingGratuityPensioners.map((item, idx) => {
                      const inst1 =
                        item.livingGratuityInstallment1 !== undefined
                          ? item.livingGratuityInstallment1
                          : item.age >= 60
                          ? Math.min(200000, item.livingGratuity || 0)
                          : 0;
                      const inst2 =
                        item.livingGratuityInstallment2 !== undefined
                          ? item.livingGratuityInstallment2
                          : item.age >= 65 && (item.livingGratuity || 0) > 200000
                          ? Math.min(200000, (item.livingGratuity || 0) - 200000)
                          : 0;
                      const inst3 =
                        item.livingGratuityInstallment3 !== undefined
                          ? item.livingGratuityInstallment3
                          : item.age >= 70 && (item.livingGratuity || 0) > 400000
                          ? (item.livingGratuity || 0) - 400000
                          : 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-3 text-center font-mono text-slate-500">
                            {formatNumber(idx + 1)}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-blue-900">
                            {item.code}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            <div>
                              {item.title}
                              {item.firstName} {item.lastName}
                            </div>
                            {item.recordedBy && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                ผู้บันทึก: {item.recordedBy}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] ${
                                item.age >= 70
                                  ? 'bg-purple-100 text-purple-900 font-bold'
                                  : item.age >= 65
                                  ? 'bg-blue-100 text-blue-900 font-bold'
                                  : item.age >= 60
                                  ? 'bg-emerald-100 text-emerald-900 font-bold'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {formatNumber(item.age)} ปี
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-800">
                            {inst1 > 0 ? (
                              <span className="font-semibold">{formatCurrency(inst1)} ฿</span>
                            ) : item.age >= 60 ? (
                              <span className="text-slate-400">0 ฿</span>
                            ) : (
                              <span className="text-slate-300 text-[10px]">ยังไม่ถึงเกณฑ์</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-blue-800">
                            {inst2 > 0 ? (
                              <span className="font-semibold">{formatCurrency(inst2)} ฿</span>
                            ) : item.age >= 65 ? (
                              <span className="text-slate-400">0 ฿</span>
                            ) : (
                              <span className="text-slate-300 text-[10px]">รอ 65 ปี</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-purple-800">
                            {inst3 > 0 ? (
                              <span className="font-semibold">{formatCurrency(inst3)} ฿</span>
                            ) : item.age >= 70 ? (
                              <span className="text-slate-400">0 ฿</span>
                            ) : (
                              <span className="text-slate-300 text-[10px]">รอ 70 ปี</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-950 bg-amber-50/40">
                            {formatCurrency(item.livingGratuity)} ฿
                          </td>
                          <td className="py-3 px-3 text-slate-600">{item.formerPosition}</td>
                          {canEdit && (
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                  title="แก้ไขข้อมูล"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                                  title="ลบข้อมูล"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. จากงบประมาณ Sub-View (แยกเมนู) */}
      {activeSubTab === 'bonus25-budget' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">จำนวนราย (คน)</span>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {formatNumber(bonus25BudgetList.length)}{' '}
                <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-indigo-700 mt-1">ผู้ได้รับเงินเพิ่ม 25% จากงบประมาณ</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">จากงบประมาณ จำนวนกี่บาท</span>
              <div className="text-3xl font-bold text-indigo-900 mt-1">
                {formatCurrency(totalBonusBudget)}{' '}
                <span className="text-xs font-normal text-slate-500">บาท</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">ยอดเงินรวมจัดสรรจากงบประมาณ</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">แหล่งเงินทุน</span>
                <div className="text-sm font-bold text-slate-800 mt-1">งบประมาณเทศบาล / อุดหนุน</div>
                <p className="text-[11px] text-slate-500 mt-0.5">เบิกจ่ายตามข้อบัญญัติงบประมาณ</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <PiggyBank className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800">
                ตารางเงินเพิ่ม 25% (จากงบประมาณ) รายบุคคล
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {formatNumber(filteredBonus25BudgetList.length)} จาก {formatNumber(bonus25BudgetList.length)} รายการ
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                    <th className="py-3 px-4 w-28">รหัสบำนาญ</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-4">ตำแหน่งเดิม</th>
                    <th className="py-3 px-4 w-44 text-right font-bold text-indigo-900">
                      จากงบประมาณ (บาท)
                    </th>
                    {canEdit && <th className="py-3 px-4 w-20 text-center">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBonus25BudgetList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลตามคำค้นหา &ldquo;{searchTerm}&rdquo;
                      </td>
                    </tr>
                  ) : (
                    filteredBonus25BudgetList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {formatNumber(idx + 1)}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-blue-900">
                          {item.code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>
                            {item.title}
                            {item.firstName} {item.lastName}
                          </div>
                          {item.recordedBy && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              ผู้บันทึก: {item.recordedBy}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.formerPosition}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-900 bg-indigo-50/30">
                          {formatCurrency(item.bonus25Budget)} ฿
                        </td>
                        {canEdit && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded"
                                title="แก้ไขยอดเงิน"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="ลบข้อมูล"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. ช.ค.บ (งบประมาณ) Sub-View (แยกเมนู) */}
      {activeSubTab === 'bonus25-deposit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">จำนวนราย (คน)</span>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {formatNumber(bonus25DepositList.length)}{' '}
                <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-amber-700 mt-1">ผู้ได้รับ ช.ค.บ (งบประมาณ)</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">ช.ค.บ (งบประมาณ) จำนวนกี่บาท</span>
              <div className="text-3xl font-bold text-amber-900 mt-1">
                {formatCurrency(totalBonusDeposit)}{' '}
                <span className="text-xs font-normal text-slate-500">บาท</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">ยอดเงินรวมเบิกจ่าย ช.ค.บ (งบประมาณ)</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">แหล่งเงินทุน</span>
                <div className="text-sm font-bold text-slate-800 mt-1">งบประมาณเงินช่วยค่าครองชีพ ช.ค.บ</div>
                <p className="text-[11px] text-slate-500 mt-0.5">ช.ค.บ (งบประมาณ) ตามระเบียบการคลัง</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <PiggyBank className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800">
                ตาราง ช.ค.บ (งบประมาณ) รายบุคคล
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {formatNumber(filteredBonus25DepositList.length)} จาก {formatNumber(bonus25DepositList.length)} รายการ
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                    <th className="py-3 px-4 w-28">รหัสบำนาญ</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-4">ตำแหน่งเดิม</th>
                    <th className="py-3 px-4 w-44 text-right font-bold text-amber-900">
                      ช.ค.บ (งบประมาณ) (บาท)
                    </th>
                    {canEdit && <th className="py-3 px-4 w-20 text-center">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBonus25DepositList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลตามคำค้นหา &ldquo;{searchTerm}&rdquo;
                      </td>
                    </tr>
                  ) : (
                    filteredBonus25DepositList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {formatNumber(idx + 1)}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-blue-900">
                          {item.code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>
                            {item.title}
                            {item.firstName} {item.lastName}
                          </div>
                          {item.recordedBy && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              ผู้บันทึก: {item.recordedBy}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.formerPosition}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-900 bg-amber-50/30">
                          {formatCurrency(item.bonus25Deposit)} ฿
                        </td>
                        {canEdit && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded"
                                title="แก้ไขยอดเงิน"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="ลบข้อมูล"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Deceased Sub-View */}
      {activeSubTab === 'deceased' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">จำนวนรายที่เสียชีวิต</span>
              <div className="text-3xl font-bold text-rose-900 mt-1">
                {formatNumber(deceasedList.length)}{' '}
                <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-rose-600 mt-1">
                บันทึกข้อมูลทายาทผู้มีสิทธิรับบำเหน็จตกทอด ความสัมพันธ์ และเบอร์โทรศัพท์อย่างครบถ้วน
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <HeartCrack className="w-7 h-7" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800">
                ตารางผู้รับบำนาญเสียชีวิตและข้อมูลทายาทผู้มีสิทธิ
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {formatNumber(filteredDeceasedList.length)} จาก {formatNumber(deceasedList.length)} รายการ
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                    <th className="py-3 px-4 w-28">รหัสบำนาญ</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล (ผู้ถึงแก่กรรม)</th>
                    <th className="py-3 px-4 w-36 font-semibold text-rose-900">วันที่ถึงแก่กรรม</th>
                    <th className="py-3 px-4">ชื่อทายาทผู้มีสิทธิรับบำเหน็จตกทอด</th>
                    <th className="py-3 px-4 w-28">ความสัมพันธ์</th>
                    <th className="py-3 px-4 w-28 text-center font-bold text-blue-900">
                      เปอร์เซ็นต์ที่ได้รับ (%)
                    </th>
                    <th className="py-3 px-4 w-32 font-mono">เบอร์โทรศัพท์</th>
                    {canEdit && <th className="py-3 px-4 w-20 text-center">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeceasedList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        {searchTerm
                          ? `ไม่พบข้อมูลตามคำค้นหา "${searchTerm}"`
                          : 'ไม่มีข้อมูลข้าราชการบำนาญเสียชีวิต'}
                      </td>
                    </tr>
                  ) : (
                    filteredDeceasedList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {formatNumber(idx + 1)}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-blue-900">
                          {item.code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>
                            {item.title}
                            {item.firstName} {item.lastName}
                          </div>
                          {item.recordedBy && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              ผู้บันทึก: {item.recordedBy}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-rose-900 whitespace-nowrap">
                          {formatThaiDate(item.deathDate)}
                        </td>
                        <td className="py-3 px-4">
                          {item.heirs && item.heirs.length > 0 ? (
                            <div className="space-y-1">
                              {item.heirs.map((h, hIdx) => (
                                <div key={h.id || hIdx} className="font-semibold text-slate-800">
                                  {h.name}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-800">
                              {item.heirName || '-'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.heirs && item.heirs.length > 0 ? (
                            <div className="space-y-1">
                              {item.heirs.map((h, hIdx) => (
                                <div key={h.id || hIdx}>
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                                    {h.relation || '-'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : item.heirRelation ? (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                              {item.heirRelation}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.heirs && item.heirs.length > 0 ? (
                            <div className="space-y-1">
                              {item.heirs.map((h, hIdx) => (
                                <div key={h.id || hIdx}>
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold font-mono text-[11px] border border-blue-200">
                                    {h.percentage}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold font-mono text-[11px] border border-blue-200">
                              {item.heirPercentage ?? 100}%
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-blue-800">
                          {item.heirs && item.heirs.length > 0 ? (
                            <div className="space-y-1">
                              {item.heirs.map((h, hIdx) => (
                                <div key={h.id || hIdx}>
                                  {h.phone ? (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {h.phone}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : item.heirPhone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {item.heirPhone}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        {canEdit && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                title="แก้ไขข้อมูลทายาท"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="ลบข้อมูล"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Age Tiers Sub-View */}
      {activeSubTab === 'age-tiers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* 60 */}
            <div
              onClick={() => setSelectedAgeTier(selectedAgeTier === '60' ? 'all' : '60')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedAgeTier === '60'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white border-slate-200 shadow-2xs hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-900">อายุครบ 60 ปี</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  งวดที่ 1
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatNumber(age60List.length)}{' '}
                <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">สิทธิบำเหน็จดำรงชีพงวด 1</p>
            </div>

            {/* 65 */}
            <div
              onClick={() => setSelectedAgeTier(selectedAgeTier === '65' ? 'all' : '65')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedAgeTier === '65'
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-slate-200 shadow-2xs hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-blue-900">อายุครบ 65 ปี</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  งวดที่ 2
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatNumber(age65List.length)}{' '}
                <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">สิทธิบำเหน็จดำรงชีพงวด 2</p>
            </div>

            {/* 70 */}
            <div
              onClick={() => setSelectedAgeTier(selectedAgeTier === '70' ? 'all' : '70')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedAgeTier === '70'
                  ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500/20 shadow-sm'
                  : 'bg-white border-slate-200 shadow-2xs hover:border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-purple-900">อายุครบ 70 ปี</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                  งวดที่ 3
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatNumber(age70List.length)}{' '}
                <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">สิทธิบำเหน็จดำรงชีพงวด 3</p>
            </div>

            {/* 75 */}
            <div
              onClick={() => setSelectedAgeTier(selectedAgeTier === '75' ? 'all' : '75')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedAgeTier === '75'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-white border-slate-200 shadow-2xs hover:border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-900">อายุ 75 ปี</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  ผู้สูงวัย
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatNumber(age75List.length)}{' '}
                <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">ข้าราชการบำนาญอาวุโส</p>
            </div>
          </div>

          {/* Quick Filter buttons */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-700">ตัวกรองกลุ่มอายุ:</span>
              <button
                onClick={() => setSelectedAgeTier('all')}
                className={`px-3 py-1 rounded-xl text-xs font-medium cursor-pointer ${
                  selectedAgeTier === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setSelectedAgeTier('60')}
                className={`px-3 py-1 rounded-xl text-xs font-medium cursor-pointer ${
                  selectedAgeTier === '60'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                อายุครบ 60 ปี ({formatNumber(age60List.length)})
              </button>
              <button
                onClick={() => setSelectedAgeTier('65')}
                className={`px-3 py-1 rounded-xl text-xs font-medium cursor-pointer ${
                  selectedAgeTier === '65'
                    ? 'bg-blue-800 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                อายุครบ 65 ปี ({formatNumber(age65List.length)})
              </button>
              <button
                onClick={() => setSelectedAgeTier('70')}
                className={`px-3 py-1 rounded-xl text-xs font-medium cursor-pointer ${
                  selectedAgeTier === '70'
                    ? 'bg-purple-700 text-white'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                อายุครบ 70 ปี ({formatNumber(age70List.length)})
              </button>
              <button
                onClick={() => setSelectedAgeTier('75')}
                className={`px-3 py-1 rounded-xl text-xs font-medium cursor-pointer ${
                  selectedAgeTier === '75'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                อายุ 75 ปี ({formatNumber(age75List.length)})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800">
                ตารางจำแนกข้าราชการบำนาญตามเกณฑ์อายุ
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {formatNumber(filteredAgeTierList.length)} จาก {formatNumber(livingPensioners.length)} รายการ
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                    <th className="py-3 px-4 w-28">รหัสบำนาญ</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-4 w-20 text-center font-mono">อายุ</th>
                    <th className="py-3 px-4 w-36 text-center">แท็กกลุ่มอายุ</th>
                    <th className="py-3 px-4">ตำแหน่งเดิม</th>
                    <th className="py-3 px-4 w-32 text-right">เงินบำนาญปกติ</th>
                    {canEdit && <th className="py-3 px-4 w-20 text-center">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAgeTierList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {searchTerm
                          ? `ไม่พบข้อมูลตามคำค้นหา "${searchTerm}"`
                          : 'ไม่พบข้อมูลตามเงื่อนไขที่เลือก'}
                      </td>
                    </tr>
                  ) : (
                    filteredAgeTierList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {formatNumber(idx + 1)}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-blue-900">
                          {item.code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>
                            {item.title}
                            {item.firstName} {item.lastName}
                          </div>
                          {item.recordedBy && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              ผู้บันทึก: {item.recordedBy}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                          {formatNumber(item.age)} ปี
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.age === 60 || item.ageGroup === '60' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              อายุครบ 60 ปี
                            </span>
                          ) : item.age === 65 || item.ageGroup === '65' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                              อายุครบ 65 ปี
                            </span>
                          ) : item.age === 70 || item.ageGroup === '70' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                              อายุครบ 70 ปี
                            </span>
                          ) : item.age === 75 || item.ageGroup === '75' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              อายุ 75 ปี
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                              กลุ่มทั่วไป ({item.age} ปี)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.formerPosition}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium">
                          {formatCurrency(item.regularPension)} ฿
                        </td>
                        {canEdit && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                title="แก้ไข"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="ลบข้อมูล"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-300" />
                {editingItem ? 'แก้ไขข้อมูลผู้รับบำนาญ' : 'เพิ่มข้อมูลผู้รับบำนาญใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสบำนาญ</label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">คำนำหน้า</label>
                  <select
                    value={formData.title || 'นาย'}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="ว่าที่ ร.ต.">ว่าที่ ร.ต.</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ</label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">นามสกุล</label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อายุ (ปี)</label>
                  <input
                    type="number"
                    value={formData.age || 65}
                    onChange={(e) => {
                      const a = parseInt(e.target.value, 10) || 0;
                      let g: any = 'other';
                      if (a === 60) g = '60';
                      else if (a === 65) g = '65';
                      else if (a === 70) g = '70';
                      else if (a === 75) g = '75';

                      const isEligible60 = a >= 60;
                      const isEligible65 = a >= 65;
                      const isEligible70 = a >= 70;

                      const inst1 = isEligible60 ? (formData.livingGratuityInstallment1 ?? 200000) : 0;
                      const inst2 = isEligible65 ? (formData.livingGratuityInstallment2 ?? 0) : 0;
                      const inst3 = isEligible70 ? (formData.livingGratuityInstallment3 ?? 0) : 0;

                      setFormData({
                        ...formData,
                        age: a,
                        ageGroup: g,
                        livingGratuityInstallment1: inst1,
                        livingGratuityInstallment2: inst2,
                        livingGratuityInstallment3: inst3,
                        livingGratuity: inst1 + inst2 + inst3,
                      });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">กลุ่มอายุ</label>
                  <select
                    value={formData.ageGroup || '65'}
                    onChange={(e) => {
                      const g = e.target.value as any;
                      let newAge = formData.age || 65;
                      if (g === '60') newAge = 60;
                      else if (g === '65') newAge = 65;
                      else if (g === '70') newAge = 70;
                      else if (g === '75') newAge = 75;

                      const isEligible60 = newAge >= 60;
                      const isEligible65 = newAge >= 65;
                      const isEligible70 = newAge >= 70;

                      const inst1 = isEligible60 ? (formData.livingGratuityInstallment1 ?? 200000) : 0;
                      const inst2 = isEligible65 ? (formData.livingGratuityInstallment2 ?? 0) : 0;
                      const inst3 = isEligible70 ? (formData.livingGratuityInstallment3 ?? 0) : 0;

                      setFormData({
                        ...formData,
                        age: newAge,
                        ageGroup: g,
                        livingGratuityInstallment1: inst1,
                        livingGratuityInstallment2: inst2,
                        livingGratuityInstallment3: inst3,
                        livingGratuity: inst1 + inst2 + inst3,
                      });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="60">อายุครบ 60 ปี (งวด 1)</option>
                    <option value="65">อายุครบ 65 ปี (งวด 2)</option>
                    <option value="70">อายุครบ 70 ปี (งวด 3)</option>
                    <option value="75">อายุ 75 ปี</option>
                    <option value="other">กลุ่มอื่น</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ตำแหน่งเดิม</label>
                <input
                  type="text"
                  value={formData.formerPosition || ''}
                  onChange={(e) => setFormData({ ...formData, formerPosition: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              {/* Financial Inputs */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
                <div className="font-semibold text-slate-800">ยอดเงินสิทธิประโยชน์ (บาท)</div>
                
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    เงินบำนาญปกติ (บาท)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.regularPension ?? 0}
                    onChange={(e) => setFormData({ ...formData, regularPension: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                {/* ข้อมูลเงินบำเหน็จดำรงชีพ (ตามเกณฑ์ 60/65/70 ปี) */}
                <div className="p-3 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 rounded-xl border border-amber-200/80 shadow-2xs space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-amber-200/60 pb-2">
                    <div>
                      <h4 className="font-bold text-xs text-amber-950 flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-amber-700" />
                        เงินบำเหน็จดำรงชีพ (ตามเกณฑ์ 60/65/70 ปี)
                      </h4>
                      <p className="text-[10px] text-amber-800/80">
                        เงื่อนไข: อายุครบ 60 ปี ใส่ช่องงวด 1 | อายุครบ 65 ปี ใส่ช่องงวด 2 | อายุครบ 70 ปี ใส่ช่องงวด 3
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-600">อายุปัจจุบัน:</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          (Number(formData.age) || 0) >= 70
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : (Number(formData.age) || 0) >= 65
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : (Number(formData.age) || 0) >= 60
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {Number(formData.age) || 0} ปี
                      </span>
                    </div>
                  </div>

                  {/* 3 Installments Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* งวด 1 */}
                    {(() => {
                      const isEligible = (Number(formData.age) || 0) >= 60;
                      return (
                        <div
                          className={`p-2.5 rounded-lg border text-xs ${
                            isEligible
                              ? 'bg-white border-emerald-300 shadow-2xs'
                              : 'bg-slate-100 border-slate-200 opacity-70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1">
                              {isEligible ? (
                                <Unlock className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Lock className="w-3 h-3 text-slate-400" />
                              )}
                              งวด 1 (อายุ 60 ปี)
                            </span>
                            <span
                              className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
                                isEligible
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isEligible ? 'กรอกได้' : 'รอ 60 ปี'}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500 mb-1">ไม่เกิน 200,000 บาท</p>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max="200000"
                            disabled={!isEligible}
                            value={isEligible ? (formData.livingGratuityInstallment1 ?? 0) : 0}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              const inst2 =
                                (Number(formData.age) || 0) >= 65
                                  ? Number(formData.livingGratuityInstallment2) || 0
                                  : 0;
                              const inst3 =
                                (Number(formData.age) || 0) >= 70
                                  ? Number(formData.livingGratuityInstallment3) || 0
                                  : 0;
                              setFormData({
                                ...formData,
                                livingGratuityInstallment1: val,
                                livingGratuity: val + inst2 + inst3,
                              });
                            }}
                            className={`w-full p-1.5 rounded-lg text-xs font-mono font-bold ${
                              isEligible
                                ? 'bg-emerald-50/50 border border-emerald-300 text-emerald-950'
                                : 'bg-slate-200/70 border border-slate-300 text-slate-400 cursor-not-allowed'
                            }`}
                          />
                          {isEligible && (
                            <div className="flex gap-1 mt-1.5">
                              {[200000, 100000, 0].map((amt) => (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() => {
                                    const inst2 =
                                      (Number(formData.age) || 0) >= 65
                                      ? Number(formData.livingGratuityInstallment2) || 0
                                      : 0;
                                    const inst3 =
                                      (Number(formData.age) || 0) >= 70
                                      ? Number(formData.livingGratuityInstallment3) || 0
                                      : 0;
                                    setFormData({
                                      ...formData,
                                      livingGratuityInstallment1: amt,
                                      livingGratuity: amt + inst2 + inst3,
                                    });
                                  }}
                                  className="px-1 py-0.5 rounded text-[9px] font-mono bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                                >
                                  {amt === 0 ? '0' : formatNumber(amt)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* งวด 2 */}
                    {(() => {
                      const isEligible = (Number(formData.age) || 0) >= 65;
                      return (
                        <div
                          className={`p-2.5 rounded-lg border text-xs ${
                            isEligible
                              ? 'bg-white border-blue-300 shadow-2xs'
                              : 'bg-slate-100 border-slate-200 opacity-70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1">
                              {isEligible ? (
                                <Unlock className="w-3 h-3 text-blue-600" />
                              ) : (
                                <Lock className="w-3 h-3 text-slate-400" />
                              )}
                              งวด 2 (อายุ 65 ปี)
                            </span>
                            <span
                              className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
                                isEligible
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isEligible ? 'กรอกได้' : 'รอ 65 ปี'}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500 mb-1">เพิ่มอีกไม่เกิน 200,000</p>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max="200000"
                            disabled={!isEligible}
                            value={isEligible ? (formData.livingGratuityInstallment2 ?? 0) : 0}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              const inst1 =
                                (Number(formData.age) || 0) >= 60
                                  ? Number(formData.livingGratuityInstallment1) || 0
                                  : 0;
                              const inst3 =
                                (Number(formData.age) || 0) >= 70
                                  ? Number(formData.livingGratuityInstallment3) || 0
                                  : 0;
                              setFormData({
                                ...formData,
                                livingGratuityInstallment2: val,
                                livingGratuity: inst1 + val + inst3,
                              });
                            }}
                            className={`w-full p-1.5 rounded-lg text-xs font-mono font-bold ${
                              isEligible
                                ? 'bg-blue-50/50 border border-blue-300 text-blue-950'
                                : 'bg-slate-200/70 border border-slate-300 text-slate-400 cursor-not-allowed'
                            }`}
                          />
                          {isEligible && (
                            <div className="flex gap-1 mt-1.5">
                              {[200000, 100000, 0].map((amt) => (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() => {
                                    const inst1 =
                                      (Number(formData.age) || 0) >= 60
                                      ? Number(formData.livingGratuityInstallment1) || 0
                                      : 0;
                                    const inst3 =
                                      (Number(formData.age) || 0) >= 70
                                      ? Number(formData.livingGratuityInstallment3) || 0
                                      : 0;
                                    setFormData({
                                      ...formData,
                                      livingGratuityInstallment2: amt,
                                      livingGratuity: inst1 + amt + inst3,
                                    });
                                  }}
                                  className="px-1 py-0.5 rounded text-[9px] font-mono bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                                >
                                  {amt === 0 ? '0' : formatNumber(amt)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* งวด 3 */}
                    {(() => {
                      const isEligible = (Number(formData.age) || 0) >= 70;
                      return (
                        <div
                          className={`p-2.5 rounded-lg border text-xs ${
                            isEligible
                              ? 'bg-white border-purple-300 shadow-2xs'
                              : 'bg-slate-100 border-slate-200 opacity-70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1">
                              {isEligible ? (
                                <Unlock className="w-3 h-3 text-purple-600" />
                              ) : (
                                <Lock className="w-3 h-3 text-slate-400" />
                              )}
                              งวด 3 (อายุ 70 ปี)
                            </span>
                            <span
                              className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
                                isEligible
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isEligible ? 'กรอกได้' : 'รอ 70 ปี'}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500 mb-1">ส่วนที่เหลือ ไม่เกิน 100,000</p>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max="100000"
                            disabled={!isEligible}
                            value={isEligible ? (formData.livingGratuityInstallment3 ?? 0) : 0}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              const inst1 =
                                (Number(formData.age) || 0) >= 60
                                  ? Number(formData.livingGratuityInstallment1) || 0
                                  : 0;
                              const inst2 =
                                (Number(formData.age) || 0) >= 65
                                  ? Number(formData.livingGratuityInstallment2) || 0
                                  : 0;
                              setFormData({
                                ...formData,
                                livingGratuityInstallment3: val,
                                livingGratuity: inst1 + inst2 + val,
                              });
                            }}
                            className={`w-full p-1.5 rounded-lg text-xs font-mono font-bold ${
                              isEligible
                                ? 'bg-purple-50/50 border border-purple-300 text-purple-950'
                                : 'bg-slate-200/70 border border-slate-300 text-slate-400 cursor-not-allowed'
                            }`}
                          />
                          {isEligible && (
                            <div className="flex gap-1 mt-1.5">
                              {[100000, 50000, 0].map((amt) => (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() => {
                                    const inst1 =
                                      (Number(formData.age) || 0) >= 60
                                      ? Number(formData.livingGratuityInstallment1) || 0
                                      : 0;
                                    const inst2 =
                                      (Number(formData.age) || 0) >= 65
                                      ? Number(formData.livingGratuityInstallment2) || 0
                                      : 0;
                                    setFormData({
                                      ...formData,
                                      livingGratuityInstallment3: amt,
                                      livingGratuity: inst1 + inst2 + amt,
                                    });
                                  }}
                                  className="px-1 py-0.5 rounded text-[9px] font-mono bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 cursor-pointer"
                                >
                                  {amt === 0 ? '0' : formatNumber(amt)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Summary row */}
                  {(() => {
                    const age = Number(formData.age) || 0;
                    const inst1 = age >= 60 ? Number(formData.livingGratuityInstallment1) || 0 : 0;
                    const inst2 = age >= 65 ? Number(formData.livingGratuityInstallment2) || 0 : 0;
                    const inst3 = age >= 70 ? Number(formData.livingGratuityInstallment3) || 0 : 0;
                    const total = inst1 + inst2 + inst3;

                    return (
                      <div className="p-2 bg-amber-100/70 border border-amber-300 rounded-lg flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px]">
                          <PiggyBank className="w-3.5 h-3.5 text-amber-700" />
                          รวมเงินบำเหน็จดำรงชีพ:
                        </span>
                        <div className="text-right">
                          <span className="font-black text-amber-950 font-mono text-sm">
                            {formatCurrency(total)}
                          </span>
                          <span className="text-[10px] text-amber-900 ml-1">บาท</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      เงินเพิ่ม 25% (จากงบประมาณ)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.bonus25Budget ?? 0}
                      onChange={(e) => setFormData({ ...formData, bonus25Budget: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      ช.ค.บ (งบประมาณ)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.bonus25Deposit ?? 0}
                      onChange={(e) => setFormData({ ...formData, bonus25Deposit: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Heir Beneficiaries Section (ทายาทผู้มีสิทธิขอรับบำเหน็จตกทอด) */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-blue-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-blue-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        ทายาทผู้มีสิทธิขอรับบำเหน็จตกทอด
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        ตามหนังสือแสดงเจตนาระบุตัวผู้รับบำเหน็จตกทอด (ข้าราชการบำนาญระบุไว้เป็นหลักฐาน)
                      </p>
                    </div>
                  </div>

                  {/* Total percentage badge */}
                  {(() => {
                    const totalP = (formData.heirs || []).reduce(
                      (sum, h) => sum + (Number(h.percentage) || 0),
                      0
                    );
                    return (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-600">เปอร์เซ็นต์รวม:</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                            Math.abs(totalP - 100) < 0.01
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : totalP > 100
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {totalP}%
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* List of Heirs */}
                <div className="space-y-3">
                  {(formData.heirs && formData.heirs.length > 0
                    ? formData.heirs
                    : [
                        {
                          id: 'h-default-sp-1',
                          name: formData.heirName || '',
                          relation: formData.heirRelation || 'คู่สมรส',
                          percentage: formData.heirPercentage ?? 100,
                          phone: formData.heirPhone || '',
                        },
                      ]
                  ).map((heir, hIndex) => (
                    <div
                      key={heir.id || hIndex}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          ทายาทลำดับที่ {formatNumber(hIndex + 1)}
                        </span>
                        {(formData.heirs || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveHeirRow(heir.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบทายาทลำดับนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        {/* ช่องให้กรอกข้อมูลชื่อ */}
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            ชื่อ-สกุล ทายาทผู้มีสิทธิ <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={heir.name}
                            onChange={(e) =>
                              handleUpdateHeirRow(heir.id, 'name', e.target.value)
                            }
                            placeholder="ระบุชื่อและนามสกุลทายาท"
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                          />
                        </div>

                        {/* ช่องให้กรอกความสัมพันธ์ */}
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            ความสัมพันธ์ <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={heir.relation}
                            onChange={(e) =>
                              handleUpdateHeirRow(heir.id, 'relation', e.target.value)
                            }
                            placeholder="เช่น คู่สมรส, บุตร"
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                          />
                          <div className="flex flex-wrap gap-1 mt-1">
                            {['คู่สมรส', 'บุตร', 'บิดา', 'มารดา'].map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => handleUpdateHeirRow(heir.id, 'relation', r)}
                                className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                                  heir.relation === r
                                    ? 'bg-blue-800 text-white font-medium'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ช่องให้กรอกข้อมูลเปอร์เซ็นการได้รับบำเหน็จตกทอด */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            เปอร์เซ็นต์ที่ได้รับ (%) <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={heir.percentage}
                              onChange={(e) =>
                                handleUpdateHeirRow(
                                  heir.id,
                                  'percentage',
                                  Number(e.target.value)
                                )
                              }
                              placeholder="100"
                              className="w-full p-2 pr-6 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-900"
                            />
                            <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5" />
                          </div>
                          <div className="flex gap-1 mt-1">
                            {[100, 50, 25].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() =>
                                  handleUpdateHeirRow(heir.id, 'percentage', pct)
                                }
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                                  Number(heir.percentage) === pct
                                    ? 'bg-blue-800 text-white font-bold'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* เบอร์โทรศัพท์ทายาท */}
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            เบอร์โทรศัพท์ติดต่อ
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={heir.phone || ''}
                              onChange={(e) =>
                                handleUpdateHeirRow(heir.id, 'phone', e.target.value)
                              }
                              placeholder="08x-xxx-xxxx"
                              className="w-full p-2 pl-7 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                            />
                            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddHeirRow}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    เพิ่มทายาทอีกคน (กรณีแบ่งสัดส่วนหลายคน)
                  </button>

                  <span className="text-[11px] text-slate-500">
                    * ทายาทจะได้รับสิทธิบำเหน็จตกทอดตามร้อยละที่ระบุไว้
                  </span>
                </div>
              </div>

              {/* Deceased Section */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={!formData.isAlive}
                    onChange={(e) => setFormData({ ...formData, isAlive: !e.target.checked })}
                    className="rounded text-rose-600"
                  />
                  <span>สถานะถึงแก่กรรม</span>
                </label>

                {!formData.isAlive && (
                  <div className="space-y-2 pt-1 p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl">
                    <div>
                      <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                        วันที่ถึงแก่กรรม
                      </label>
                      <input
                        type="date"
                        value={formData.deathDate || ''}
                        onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                        className="w-full p-1.5 bg-white border border-rose-300 rounded-lg text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-rose-700">
                      * สิทธิบำเหน็จตกทอดจะส่งมอบให้แก่ทายาทตามข้อมูลที่ระบุไว้ในส่วนทายาทข้างต้น
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl font-semibold shadow-xs"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Smooth & Non-blocking) */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              ยืนยันการลบรายชื่อข้าราชการบำนาญ
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              ต้องการลบ{' '}
              <span className="font-bold text-slate-900">
                {deleteConfirmTarget.title}
                {deleteConfirmTarget.firstName} {deleteConfirmTarget.lastName}
              </span>{' '}
              ({deleteConfirmTarget.code}) ใช่หรือไม่? ข้อมูลจะถูกลบออกจากฐานข้อมูลทันที
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-medium cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePensioner(deleteConfirmTarget.id);
                  setDeleteConfirmTarget(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
