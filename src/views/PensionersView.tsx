import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Check,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Building,
  Globe,
  Bell,
  HeartCrack,
  Percent,
  User,
  Phone,
  PlusCircle,
  ShieldCheck,
  Lock,
  Unlock,
  Wallet,
  PiggyBank,
  HeartHandshake,
  Calculator,
  Calendar,
} from 'lucide-react';
import { PensionerRecord, UserSession, HeirBeneficiary } from '../types';
import { formatCurrency, formatNumber, formatThaiDate } from '../utils/formatters';
import { Pagination } from '../components/Pagination';

interface PensionersViewProps {
  currentSession: UserSession;
  pensioners: PensionerRecord[];
  onAddPensioner: (p: PensionerRecord) => void;
  onUpdatePensioner: (p: PensionerRecord) => void;
  onDeletePensioner: (id: string) => void;
  onQuickVerify: (id: string, channel: 'ยืนยันตัวตนออนไลน์' | 'แสดงตนที่กองคลัง') => void;
}

export interface ApproachingMilestoneInfo {
  isApproaching: boolean;
  targetAge: 60 | 65 | 70 | null;
  label: string;
  subText: string;
  badgeColor: string;
}

export function checkApproachingMilestone(p: PensionerRecord): ApproachingMilestoneInfo {
  if (!p.isAlive) {
    return { isApproaching: false, targetAge: null, label: '', subText: '', badgeColor: '' };
  }

  const age = Number(p.age) || 0;

  if (age === 59) {
    return {
      isApproaching: true,
      targetAge: 60,
      label: 'อายุใกล้ครบ 60 ปีแล้ว',
      subText: 'เตรียมสิทธิบำเหน็จดำรงชีพ งวดที่ 1 (ไม่เกิน 200,000 บาท)',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30',
    };
  }

  if (age === 64) {
    return {
      isApproaching: true,
      targetAge: 65,
      label: 'อายุใกล้ครบ 65 ปีแล้ว',
      subText: 'เตรียมสิทธิบำเหน็จดำรงชีพ งวดที่ 2 (เพิ่มอีกไม่เกิน 200,000 บาท)',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400/30',
    };
  }

  if (age === 69) {
    return {
      isApproaching: true,
      targetAge: 70,
      label: 'อายุใกล้ครบ 70 ปีแล้ว',
      subText: 'เตรียมสิทธิบำเหน็จดำรงชีพ งวดที่ 3 (ส่วนที่เหลือรวมไม่เกิน 500,000 บาท)',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300 ring-1 ring-purple-400/30',
    };
  }

  // Check if birthDate indicates turning 60, 65, or 70 in fiscal year 2570 (2027 AD)
  if (p.birthDate) {
    const bDate = new Date(p.birthDate);
    if (!isNaN(bDate.getTime())) {
      const bYear = bDate.getFullYear();
      const age2570 = 2027 - bYear;
      if (age2570 === 60 && age < 60) {
        return {
          isApproaching: true,
          targetAge: 60,
          label: 'อายุใกล้ครบ 60 ปีแล้ว',
          subText: 'เตรียมสิทธิบำเหน็จดำรงชีพ งวดที่ 1 (ปี 2570)',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30',
        };
      }
      if (age2570 === 65 && age < 65) {
        return {
          isApproaching: true,
          targetAge: 65,
          label: 'อายุใกล้ครบ 65 ปีแล้ว',
          subText: 'เตรียมสิทธิบำเหน็จดำรงชีพ งวดที่ 2 (ปี 2570)',
          badgeColor: 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400/30',
        };
      }
      if (age2570 === 70 && age < 70) {
        return {
          isApproaching: true,
          targetAge: 70,
          label: 'อายุใกล้ครบ 70 ปีแล้ว',
          subText: 'เตรียมสิทธิบำเหน็จดำรงชีพ งวดที่ 3 (ปี 2570)',
          badgeColor: 'bg-purple-50 text-purple-800 border-purple-300 ring-1 ring-purple-400/30',
        };
      }
    }
  }

  return { isApproaching: false, targetAge: null, label: '', subText: '', badgeColor: '' };
}

export function PensionersView({
  currentSession,
  pensioners,
  onAddPensioner,
  onUpdatePensioner,
  onDeletePensioner,
  onQuickVerify,
}: PensionersViewProps) {
  const canEdit = currentSession.roleCode === 'User';

  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = React.useDeferredValue(searchTerm);
  const [filterVerification, setFilterVerification] = useState<
    'all' | 'verified' | 'unverified' | 'deceased' | 'approaching_milestone' | 'approaching_60' | 'approaching_65' | 'approaching_70'
  >('all');
  const [filterRecorder, setFilterRecorder] = useState<string>('all');

  // Quick verify modal state
  const [quickVerifyTarget, setQuickVerifyTarget] = useState<PensionerRecord | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<'ยืนยันตัวตนออนไลน์' | 'แสดงตนที่กองคลัง'>('ยืนยันตัวตนออนไลน์');

  // Non-blocking in-app delete confirmation state
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<PensionerRecord | null>(null);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [formData, setFormData] = useState<Partial<PensionerRecord>>({
    code: '',
    title: 'นาย',
    firstName: '',
    lastName: '',
    idCard: '',
    formerPosition: '',
    birthDate: '1961-01-01',
    age: 65,
    ageGroup: '65',
    isAlive: true,
    deathDate: '',
    heirName: '',
    heirRelation: 'คู่สมรส',
    heirPercentage: 100,
    heirPhone: '',
    heirs: [],
    special3xHeirName: '',
    special3xAmount: 120000,
    special3xRelation: 'คู่สมรส',
    special3xPhone: '',
    isVerified: false,
    verifiedDate: '',
    verificationChannel: undefined,
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

  const totalCount = pensioners.length;
  const livingPensioners = useMemo(() => pensioners.filter((p) => p.isAlive), [pensioners]);
  const verifiedList = useMemo(() => livingPensioners.filter((p) => p.isVerified), [livingPensioners]);
  const unverifiedList = useMemo(() => livingPensioners.filter((p) => !p.isVerified), [livingPensioners]);
  const deceasedList = useMemo(() => pensioners.filter((p) => !p.isAlive), [pensioners]);

  // Approaching Milestone Lists (อายุใกล้ครบ 60 ปี 65 ปี 70 ปี)
  const approaching60List = useMemo(
    () => livingPensioners.filter((p) => checkApproachingMilestone(p).targetAge === 60),
    [livingPensioners]
  );
  const approaching65List = useMemo(
    () => livingPensioners.filter((p) => checkApproachingMilestone(p).targetAge === 65),
    [livingPensioners]
  );
  const approaching70List = useMemo(
    () => livingPensioners.filter((p) => checkApproachingMilestone(p).targetAge === 70),
    [livingPensioners]
  );
  const approachingAllList = useMemo(
    () => livingPensioners.filter((p) => checkApproachingMilestone(p).isApproaching),
    [livingPensioners]
  );

  const filteredList = useMemo(() => {
    return pensioners.filter((p) => {
      const matchSearch =
        deferredSearchTerm === '' ||
        p.code.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
        `${p.title}${p.firstName} ${p.lastName}`.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
        p.idCard.includes(deferredSearchTerm) ||
        p.formerPosition.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
        (p.heirName && p.heirName.toLowerCase().includes(deferredSearchTerm.toLowerCase())) ||
        (p.heirs && p.heirs.some((h) => h.name.toLowerCase().includes(deferredSearchTerm.toLowerCase()))) ||
        (p.special3xHeirName && p.special3xHeirName.toLowerCase().includes(deferredSearchTerm.toLowerCase()));

      let matchFilter = true;
      if (filterVerification === 'verified') matchFilter = p.isAlive && p.isVerified;
      if (filterVerification === 'unverified') matchFilter = p.isAlive && !p.isVerified;
      if (filterVerification === 'deceased') matchFilter = !p.isAlive;
      if (filterVerification === 'approaching_milestone') {
        matchFilter = p.isAlive && checkApproachingMilestone(p).isApproaching;
      }
      if (filterVerification === 'approaching_60') {
        matchFilter = p.isAlive && checkApproachingMilestone(p).targetAge === 60;
      }
      if (filterVerification === 'approaching_65') {
        matchFilter = p.isAlive && checkApproachingMilestone(p).targetAge === 65;
      }
      if (filterVerification === 'approaching_70') {
        matchFilter = p.isAlive && checkApproachingMilestone(p).targetAge === 70;
      }

      let matchRecorder = true;
      if (filterRecorder !== 'all') {
        matchRecorder = (p.recordedBy || 'User') === filterRecorder;
      }

      return matchSearch && matchFilter && matchRecorder;
    });
  }, [pensioners, deferredSearchTerm, filterVerification, filterRecorder]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to first page when filtering or searching
  React.useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, filterVerification, filterRecorder]);

  // Paginated items
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setIsCustomTitle(false);
    const initialHeirs: HeirBeneficiary[] = [
      {
        id: `h-${Date.now()}-1`,
        name: '',
        relation: 'คู่สมรส',
        percentage: 100,
        phone: '',
      },
    ];

    setFormData({
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
      deathDate: '',
      heirName: '',
      heirRelation: 'คู่สมรส',
      heirPercentage: 100,
      heirPhone: '',
      heirs: initialHeirs,
      special3xHeirName: '',
      special3xAmount: 120000,
      special3xRelation: 'คู่สมรส',
      special3xPhone: '',
      isVerified: false,
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

  const handleOpenEditModal = (p: PensionerRecord) => {
    setEditingId(p.id);
    const standardTitles = ['นาย', 'นาง', 'นางสาว', 'ว่าที่ ร.ต.'];
    setIsCustomTitle(!standardTitles.includes(p.title || 'นาย'));
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
      special3xHeirName: p.special3xHeirName || '',
      special3xAmount: p.special3xAmount !== undefined ? p.special3xAmount : (p.regularPension ? p.regularPension * 3 : 0),
      special3xRelation: p.special3xRelation || 'คู่สมรส',
      special3xPhone: p.special3xPhone || '',
    });
    setIsModalOpen(true);
  };

  // Multiple heirs helpers in form
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

    // Sync primary heir from first row
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

    const computedBonusTotal =
      (Number(formData.bonus25Budget) || 0) + (Number(formData.bonus25Deposit) || 0);

    // Clean heirs list
    const validHeirs = (formData.heirs || []).filter((h) => h.name.trim() !== '');
    const primaryHeir = validHeirs[0] || {
      name: formData.heirName || '',
      relation: formData.heirRelation || '',
      percentage: Number(formData.heirPercentage) || 0,
      phone: formData.heirPhone || '',
    };

    const updatedData: PensionerRecord = {
      id: editingId || `PEN-2570-${String(pensioners.length + 1).padStart(3, '0')}`,
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

      // ทายาทผู้มีสิทธิรับเงินช่วยพิเศษ 3 เท่า (กำหนด 1 คน ได้ 100%)
      special3xHeirName: formData.special3xHeirName?.trim() || undefined,
      special3xAmount: formData.special3xAmount !== undefined ? Number(formData.special3xAmount) : undefined,
      special3xRelation: formData.special3xRelation?.trim() || undefined,
      special3xPhone: formData.special3xPhone?.trim() || undefined,

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

      bonus25Total: computedBonusTotal,
      bonus25Budget: Number(formData.bonus25Budget) || 0,
      bonus25Deposit: Number(formData.bonus25Deposit) || 0,
      chkbAmount: Number(formData.chkbAmount) || 0,
      recordedBy: editingId
        ? (pensioners.find((p) => p.id === editingId)?.recordedBy || currentSession.username)
        : currentSession.username,
      updatedAt: new Date().toISOString(),
    };

    if (editingId) {
      onUpdatePensioner(updatedData);
    } else {
      onAddPensioner(updatedData);
    }
    setIsModalOpen(false);
  };

  const handleConfirmQuickVerify = () => {
    if (quickVerifyTarget) {
      onQuickVerify(quickVerifyTarget.id, selectedChannel);
      setQuickVerifyTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              ปีงบประมาณ 2570
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              อัพเดทอัตโนมัติแบบเรียลไทม์ (เห็นข้อมูลทุกผู้ใช้งาน: User, User1, User2)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700" />
            รายงานจำนวนผู้รับบำนาญ ปีงบประมาณ 2570 และการยืนยันตัวตน
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            สรุปจำนวนผู้รับบำนาญทั้งหมด ติดตามการยืนยันตัวตนออนไลน์และ ณ กองคลัง พร้อมจัดเก็บฐานข้อมูลส่วนกลาง
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            เพิ่มรายชื่อผู้รับบำนาญ
          </button>
        )}
      </div>

      {/* Overview Cards with Verification Status & Age Milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Pensioners */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ผู้รับบำนาญทั้งหมด</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(totalCount)}{' '}
            <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            มีชีวิต {formatNumber(livingPensioners.length)} / ถึงแก่กรรม {formatNumber(deceasedList.length)}
          </div>
        </div>

        {/* Verified Count */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ยืนยันตัวตนแล้ว</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-950">
            {formatNumber(verifiedList.length)}{' '}
            <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">
            {livingPensioners.length
              ? ((verifiedList.length / livingPensioners.length) * 100).toFixed(1)
              : 0}
            % ของผู้มีชีวิต (ได้รับเงินตามกำหนด)
          </div>
        </div>

        {/* Unverified Count (Alert) */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-amber-900 flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
              ยังไม่ได้ยืนยันตัวตน
            </span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-950">
            {formatNumber(unverifiedList.length)}{' '}
            <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[11px] text-amber-800 font-medium mt-1">
            ต้องติดตามสิทธิและเร่งรัดแสดงตน
          </div>
        </div>

        {/* Approaching Age Milestone Card (Alert) */}
        <div
          onClick={() =>
            setFilterVerification(
              filterVerification.startsWith('approaching') ? 'all' : 'approaching_milestone'
            )
          }
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs ${
            filterVerification.startsWith('approaching')
              ? 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/40'
              : 'border-indigo-100 hover:border-indigo-300'
          }`}
          title="คลิกเพื่อกรองรายชื่อผู้รับบำนาญที่อายุใกล้ครบ 60, 65, 70 ปี"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-indigo-950 flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-indigo-600 animate-bounce" />
              อายุใกล้ครบ 60/65/70 ปี
            </span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-indigo-950">
            {formatNumber(approachingAllList.length)}{' '}
            <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1 flex flex-wrap gap-1">
            <span>60 ปี: <b>{approaching60List.length}</b></span>
            <span>• 65 ปี: <b>{approaching65List.length}</b></span>
            <span>• 70 ปี: <b>{approaching70List.length}</b></span>
          </div>
        </div>

        {/* Deceased Count */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ถึงแก่กรรม</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <HeartCrack className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-950">
            {formatNumber(deceasedList.length)}{' '}
            <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[11px] text-rose-700 mt-1">
            ทายาทมีสิทธิขอรับบำเหน็จตกทอด
          </div>
        </div>
      </div>

      {/* Unverified Alert Box */}
      {unverifiedList.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                แจ้งเตือนเพื่อติดตามสิทธิ: มีข้าราชการบำนาญยังไม่ได้ยืนยันตัวตน {formatNumber(unverifiedList.length)} ราย
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                เจ้าหน้าที่สามารถประสานงานทางโทรศัพท์ และกด "ยืนยันตัวตนด่วน" เมื่อผู้รับบำนาญแสดงตน
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterVerification('unverified')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            กรองเฉพาะผู้ยังไม่ยืนยัน
          </button>
        </div>
      )}

      {/* Approaching Milestone Alert Box */}
      {approachingAllList.length > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xs font-bold text-indigo-950">
                  แจ้งเตือนอายุใกล้ครบเกณฑ์: มีผู้รับบำนาญอายุใกล้ครบ 60, 65, 70 ปี รวม {formatNumber(approachingAllList.length)} ราย
                </h4>
                <span className="px-2 py-0.5 bg-indigo-200 text-indigo-900 rounded-full text-[10px] font-bold">
                  แจ้งเตือนสิทธิบำเหน็จดำรงชีพ
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 self-end md:self-center shrink-0">
            <button
              onClick={() =>
                setFilterVerification(filterVerification === 'approaching_60' ? 'all' : 'approaching_60')
              }
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg cursor-pointer transition-colors ${
                filterVerification === 'approaching_60'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              ใกล้ 60 ปี ({approaching60List.length})
            </button>
            <button
              onClick={() =>
                setFilterVerification(filterVerification === 'approaching_65' ? 'all' : 'approaching_65')
              }
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg cursor-pointer transition-colors ${
                filterVerification === 'approaching_65'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              ใกล้ 65 ปี ({approaching65List.length})
            </button>
            <button
              onClick={() =>
                setFilterVerification(filterVerification === 'approaching_70' ? 'all' : 'approaching_70')
              }
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg cursor-pointer transition-colors ${
                filterVerification === 'approaching_70'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-50'
              }`}
            >
              ใกล้ 70 ปี ({approaching70List.length})
            </button>
            <button
              onClick={() => setFilterVerification('approaching_milestone')}
              className="px-3 py-1 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs"
            >
              ดูทั้งหมด ({approachingAllList.length})
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ-สกุล, เลขบำนาญ, บัตรประชาชน..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Filter by recorder */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
          <User className="w-3.5 h-3.5 text-blue-700" />
          <span className="text-[11px] text-slate-500 font-medium">ผู้บันทึก:</span>
          <select
            value={filterRecorder}
            onChange={(e) => setFilterRecorder(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="all">ทุกคน (ทุกผู้ใช้งาน)</option>
            <option value="User">User</option>
            <option value="User1">User1</option>
            <option value="User2">User2</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterVerification('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
              filterVerification === 'all'
                ? 'bg-blue-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({formatNumber(totalCount)})
          </button>
          <button
            onClick={() => setFilterVerification('verified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
              filterVerification === 'verified'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            ยืนยันแล้ว ({formatNumber(verifiedList.length)})
          </button>
          <button
            onClick={() => setFilterVerification('unverified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
              filterVerification === 'unverified'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            ยังไม่ได้ยืนยัน ({formatNumber(unverifiedList.length)})
          </button>
          <button
            onClick={() =>
              setFilterVerification(
                filterVerification === 'approaching_milestone' ? 'all' : 'approaching_milestone'
              )
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
              filterVerification.startsWith('approaching')
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
            }`}
            title="แสดงผู้ที่อายุใกล้ครบ 60, 65, 70 ปี เพื่อแจ้งเตือนสิทธิบำเหน็จดำรงชีพ"
          >
            <Bell className="w-3 h-3 text-indigo-500" />
            อายุใกล้ครบแล้ว ({formatNumber(approachingAllList.length)})
          </button>
          <button
            onClick={() => setFilterVerification('deceased')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
              filterVerification === 'deceased'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            ถึงแก่กรรม ({formatNumber(deceasedList.length)})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                <th className="py-3 px-4 w-28">รหัสบำนาญ</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4 w-32 font-mono">เลขบัตรประชาชน</th>
                <th className="py-3 px-4">ตำแหน่งเดิม</th>
                <th className="py-3 px-4 w-44 text-center">อายุ / แจ้งเตือนสิทธิ</th>
                <th className="py-3 px-4 w-44 text-center">สถานะการยืนยันตัวตน</th>
                <th className="py-3 px-4 w-48">ทายาทผู้มีสิทธิรับบำเหน็จตกทอด</th>
                <th className="py-3 px-4 w-32 text-right">เงินบำนาญปกติ</th>
                <th className="py-3 px-4 w-36 text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลผู้รับบำนาญตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => {
                  const itemIndex = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {formatNumber(itemIndex)}
                      </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-900 whitespace-nowrap">
                      {item.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {item.title}
                        {item.firstName} {item.lastName}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {!item.isAlive && (
                          <span className="inline-block px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[10px] font-medium">
                            ถึงแก่กรรม ({formatThaiDate(item.deathDate)})
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono border border-slate-200">
                          <User className="w-2.5 h-2.5 text-blue-600" />
                          ผู้บันทึก: {item.recordedBy || 'User'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{item.idCard}</td>
                    <td className="py-3 px-4 text-slate-600">{item.formerPosition}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-mono font-bold text-slate-800">
                        {formatNumber(item.age)} ปี
                      </div>
                      {item.isAlive && (() => {
                        const milestone = checkApproachingMilestone(item);
                        if (!milestone.isApproaching) return null;
                        return (
                          <div className="mt-1 flex flex-col items-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border shadow-2xs ${milestone.badgeColor}`}
                              title={milestone.subText}
                            >
                              <Bell className="w-2.5 h-2.5 shrink-0 animate-bounce" />
                              {milestone.label}
                            </span>
                            <span
                              className="text-[9px] text-slate-500 mt-0.5 max-w-[130px] truncate"
                              title={milestone.subText}
                            >
                              {milestone.subText}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!item.isAlive ? (
                        <span className="text-slate-400 text-xs italic">-</span>
                      ) : item.isVerified ? (
                        <div className="flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> ยืนยันแล้ว
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            {item.verificationChannel === 'ยืนยันตัวตนออนไลน์' ? (
                              <Globe className="w-2.5 h-2.5 text-blue-500" />
                            ) : (
                              <Building className="w-2.5 h-2.5 text-amber-500" />
                            )}
                            {item.verificationChannel || 'ออนไลน์'} ({formatThaiDate(item.verifiedDate)})
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-medium border border-amber-200">
                            <Clock className="w-2.5 h-2.5" /> ยังไม่ยืนยัน
                          </span>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setQuickVerifyTarget(item);
                                setSelectedChannel('ยืนยันตัวตนออนไลน์');
                              }}
                              className="px-2 py-0.5 rounded-md bg-blue-800 hover:bg-blue-900 text-white text-[10px] font-medium cursor-pointer shadow-2xs flex items-center gap-0.5"
                            >
                              <Check className="w-2.5 h-2.5" /> ยืนยันด่วน
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.heirs && item.heirs.length > 0 ? (
                        <div className="space-y-1">
                          {item.heirs.map((h, hIdx) => (
                            <div key={h.id || hIdx} className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="font-medium text-slate-800 truncate" title={h.name}>
                                {h.name || '-'}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {h.relation && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                                    {h.relation}
                                  </span>
                                )}
                                <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold font-mono text-[10px]">
                                  {h.percentage}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : item.heirName ? (
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="font-medium text-slate-800 truncate">
                            {item.heirName}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {item.heirRelation && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                                {item.heirRelation}
                              </span>
                            )}
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold font-mono text-[10px]">
                              {item.heirPercentage ?? 100}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">ยังไม่ระบุ</span>
                      )}

                      {item.special3xHeirName && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                          <span
                            className="text-emerald-800 font-medium truncate"
                            title={`ทายาทเงินช่วยพิเศษ 3 เท่า (100%): ${item.special3xHeirName} (${item.special3xRelation || '-'}) โทร: ${item.special3xPhone || '-'}`}
                          >
                            <span className="font-bold text-emerald-900">ช่วยพิเศษ 3x:</span> {item.special3xHeirName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-bold font-mono text-[9px] border border-emerald-200 shrink-0">
                            100%
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                      {formatCurrency(item.regularPension)} ฿
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmTarget(item)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบรายชื่อ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {!canEdit && (
                          <span className="text-slate-400 text-[11px] italic">ดูข้อมูลอย่างเดียว</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bar with items per page selector */}
      {filteredList.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredList.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      )}
    </div>

      {/* Quick Verify Modal */}
      {quickVerifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ยืนยันตัวตนด่วน
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              ผู้รับบำนาญ:{' '}
              <span className="font-bold text-slate-800">
                {quickVerifyTarget.title}
                {quickVerifyTarget.firstName} {quickVerifyTarget.lastName}
              </span>{' '}
              ({quickVerifyTarget.code})
            </p>

            <div className="space-y-2 mb-5">
              <label className="block text-xs font-semibold text-slate-700">
                เลือกช่องทางการยืนยันตัวตน:
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="channel"
                  checked={selectedChannel === 'ยืนยันตัวตนออนไลน์'}
                  onChange={() => setSelectedChannel('ยืนยันตัวตนออนไลน์')}
                  className="text-blue-600"
                />
                <Globe className="w-4 h-4 text-blue-600" />
                <span>ยืนยันตัวตนออนไลน์ (ผ่านระบบดิจิทัล/แอปพลิเคชัน)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="channel"
                  checked={selectedChannel === 'แสดงตนที่กองคลัง'}
                  onChange={() => setSelectedChannel('แสดงตนที่กองคลัง')}
                  className="text-blue-600"
                />
                <Building className="w-4 h-4 text-amber-600" />
                <span>แสดงตนที่กองคลัง (เทศบาลเมืองมหาสารคาม)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickVerifyTarget(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickVerify}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                บันทึกการยืนยัน
              </button>
            </div>
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
              ยืนยันการลบรายชื่อผู้รับบำนาญ
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

      {/* Add / Edit Pensioner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-300" />
                {editingId ? 'แก้ไขข้อมูลผู้รับบำนาญ' : 'เพิ่มรายชื่อข้าราชการบำนาญใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="font-bold text-slate-800 border-b pb-1 text-xs">
                ข้อมูลส่วนบุคคลและตำแหน่ง
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสบำนาญ</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">คำนำหน้า</label>
                  <select
                    value={isCustomTitle ? 'อื่นๆ' : (formData.title || 'นาย')}
                    onChange={(e) => {
                      if (e.target.value === 'อื่นๆ') {
                        setIsCustomTitle(true);
                        setFormData({ ...formData, title: '' });
                      } else {
                        setIsCustomTitle(false);
                        setFormData({ ...formData, title: e.target.value });
                      }
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="ว่าที่ ร.ต.">ว่าที่ ร.ต.</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                  {isCustomTitle && (
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="ระบุคำนำหน้าชื่ออื่นๆ (เช่น ด.ต., ร.ต.อ., ดร.)"
                      className="mt-1.5 w-full p-2 bg-amber-50/70 border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">นามสกุล</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลขประจำตัวประชาชน (13 หลัก)</label>
                  <input
                    type="text"
                    maxLength={13}
                    value={formData.idCard}
                    onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                    placeholder="3440100xxxxxx"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อายุ (ปี)</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => {
                      const ageNum = parseInt(e.target.value, 10) || 0;
                      let g: any = 'other';
                      if (ageNum === 60) g = '60';
                      else if (ageNum === 65) g = '65';
                      else if (ageNum === 70) g = '70';
                      else if (ageNum === 75) g = '75';

                      const isEligible60 = ageNum >= 60;
                      const isEligible65 = ageNum >= 65;
                      const isEligible70 = ageNum >= 70;

                      const inst1 = isEligible60 ? (formData.livingGratuityInstallment1 ?? 200000) : 0;
                      const inst2 = isEligible65 ? (formData.livingGratuityInstallment2 ?? 0) : 0;
                      const inst3 = isEligible70 ? (formData.livingGratuityInstallment3 ?? 0) : 0;

                      setFormData({
                        ...formData,
                        age: ageNum,
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
                  <label className="block font-semibold text-slate-700 mb-1">กลุ่มอายุตามเกณฑ์</label>
                  <select
                    value={formData.ageGroup}
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
                    <option value="other">กลุ่มอายุอื่น</option>
                  </select>
                </div>
              </div>

              {/* Approaching Milestone Modal Alert */}
              {(() => {
                const temp: PensionerRecord = {
                  ...(formData as any),
                  age: Number(formData.age) || 0,
                  isAlive: formData.isAlive ?? true,
                };
                const ms = checkApproachingMilestone(temp);
                if (!ms.isApproaching) return null;
                return (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-950">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 animate-bounce" />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                        <span>แจ้งเตือนอายุใกล้ครบเกณฑ์:</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold text-[11px]">
                          {ms.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        {ms.subText}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ตำแหน่งเดิมก่อนเกษียณ</label>
                <input
                  type="text"
                  value={formData.formerPosition}
                  onChange={(e) => setFormData({ ...formData, formerPosition: e.target.value })}
                  placeholder="เช่น ผู้อำนวยการกองคลัง, เจ้าพนักงานธุรการชำนาญงาน"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
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
                          id: 'h-default-1',
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

                        {/* ช่องกรอกเบอร์โทรศัพท์ทายาท */}
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

                </div>
              </div>

              {/* ทายาทผู้มีสิทธิรับเงินช่วยพิเศษ 3 เท่า */}
              <div className="p-4 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40 rounded-2xl border border-emerald-200/90 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                      <HeartHandshake className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
                        ทายาทผู้มีสิทธิรับเงินช่วยพิเศษ 3 เท่า
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                          กำหนดให้รับแค่ 1 คน ได้ 100%
                        </span>
                      </h4>
                    </div>
                  </div>
                </div>

                {/* แผงแสดงยอดคำนวณ 3 รายการ คูณ ด้วย 3 เท่า */}
                {(() => {
                  const regP = Number(formData.regularPension) || 0;
                  const chkbP = Number(formData.bonus25Deposit) || 0; // ช.ค.บ (งบประมาณ)
                  const bonusP = Number(formData.bonus25Budget) || 0; // เงินเพิ่ม 25% (จากงบประมาณ)

                  const p3x = regP * 3;
                  const c3x = chkbP * 3;
                  const b3x = bonusP * 3;
                  const total3x = p3x + c3x + b3x;

                  return (
                    <div className="space-y-2.5">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                        ยอดคำนวณเงินช่วยพิเศษ คูณ ด้วย 3 เท่า:
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* 1. บำนาญปกติ x 3 เท่า */}
                        <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-1.5 hover:border-emerald-400 transition-colors">
                          <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between">
                            <span>บำนาญปกติ × 3 เท่า</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {formatCurrency(regP)} × 3
                            </span>
                          </div>
                          <div className="text-base font-black font-mono text-emerald-900">
                            {formatCurrency(p3x)}{' '}
                            <span className="text-[11px] font-normal text-slate-500">บาท</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, special3xAmount: p3x })}
                            className="w-full mt-1 py-1 px-2 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-medium transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            ใช้ยอดนี้ ({formatCurrency(p3x)} ฿)
                          </button>
                        </div>

                        {/* 2. ช.ค.บ (งบประมาณ) x 3 เท่า */}
                        <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-1.5 hover:border-amber-400 transition-colors">
                          <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between">
                            <span>ช.ค.บ (งบประมาณ) × 3 เท่า</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {formatCurrency(chkbP)} × 3
                            </span>
                          </div>
                          <div className="text-base font-black font-mono text-amber-900">
                            {formatCurrency(c3x)}{' '}
                            <span className="text-[11px] font-normal text-slate-500">บาท</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, special3xAmount: c3x })}
                            className="w-full mt-1 py-1 px-2 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-medium transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3 text-amber-600" />
                            ใช้ยอดนี้ ({formatCurrency(c3x)} ฿)
                          </button>
                        </div>

                        {/* 3. เงินเพิ่ม 25% (จากงบประมาณ) x 3 เท่า */}
                        <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-1.5 hover:border-blue-400 transition-colors">
                          <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between">
                            <span>เงินเพิ่ม 25% (จากงบประมาณ) × 3 เท่า</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {formatCurrency(bonusP)} × 3
                            </span>
                          </div>
                          <div className="text-base font-black font-mono text-blue-900">
                            {formatCurrency(b3x)}{' '}
                            <span className="text-[11px] font-normal text-slate-500">บาท</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, special3xAmount: b3x })}
                            className="w-full mt-1 py-1 px-2 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg font-medium transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3 text-blue-600" />
                            ใช้ยอดนี้ ({formatCurrency(b3x)} ฿)
                          </button>
                        </div>
                      </div>

                      {/* สรุปรวม 3 รายการ x 3 */}
                      <div className="p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-[11px] text-emerald-950 font-medium">
                          <span className="font-bold">รวมทั้ง 3 ยอด (บำนาญปกติ + ช.ค.บ + เงินเพิ่ม 25%) × 3 เท่า:</span>{' '}
                          <span className="font-mono text-slate-700">
                            ({formatCurrency(regP)} + {formatCurrency(chkbP)} + {formatCurrency(bonusP)}) × 3
                          </span>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="font-black font-mono text-base text-emerald-950">
                            {formatCurrency(total3x)} บาท
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, special3xAmount: total3x })}
                            className="py-1 px-2.5 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
                          >
                            ใช้ยอดรวมนี้
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ชื่อ - สกุล ทายาท (1 คน)
                    </label>
                    <input
                      type="text"
                      value={formData.special3xHeirName || ''}
                      onChange={(e) => setFormData({ ...formData, special3xHeirName: e.target.value })}
                      placeholder="ระบุชื่อและนามสกุลทายาท"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      จำนวนเงิน (บาท)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={formData.special3xAmount ?? ((Number(formData.regularPension) || 0) * 3)}
                        onChange={(e) => setFormData({ ...formData, special3xAmount: Number(e.target.value) })}
                        placeholder="จำนวนเงิน"
                        className="w-full p-2 pr-7 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-950"
                      />
                      <span className="text-[11px] text-slate-400 absolute right-2.5 top-2.5">บาท</span>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ความสัมพันธ์
                    </label>
                    <input
                      type="text"
                      value={formData.special3xRelation || ''}
                      onChange={(e) => setFormData({ ...formData, special3xRelation: e.target.value })}
                      placeholder="เช่น คู่สมรส"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {['คู่สมรส', 'บุตร', 'บิดา', 'มารดา'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({ ...formData, special3xRelation: r })}
                          className={`px-1 py-0.5 rounded text-[9px] cursor-pointer ${
                            formData.special3xRelation === r
                              ? 'bg-emerald-800 text-white font-medium'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      เบอร์โทรศัพท์ติดต่อ
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.special3xPhone || ''}
                        onChange={(e) => setFormData({ ...formData, special3xPhone: e.target.value })}
                        placeholder="08x-xxx-xxxx"
                        className="w-full p-2 pl-7 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-100/50 border border-emerald-200/70 flex items-center justify-between text-[11px] text-emerald-900">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    สิทธิการรับเงินช่วยพิเศษ 3 เท่า:
                  </span>
                  <span className="font-bold font-mono px-2 py-0.5 rounded-lg bg-emerald-700 text-white text-[10px]">
                    กำหนดให้รับแค่ 1 คน ได้รับ 100%
                  </span>
                </div>
              </div>

              {/* Status and Verification */}
              <div className="font-bold text-slate-800 border-b pb-1 text-xs pt-2">
                สถานะการมีชีวิตและการยืนยันตัวตน
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.isAlive}
                      onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>สถานะ: ยังมีชีวิตอยู่</span>
                  </label>
                  {!formData.isAlive && (
                    <div className="mt-2 space-y-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200">
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
                        * สิทธิบำเหน็จตกทอดจะส่งมอบให้แก่ทายาทตามข้อมูลที่ระบุไว้ข้างต้น
                      </p>
                    </div>
                  )}
                </div>

                {formData.isAlive && (
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.isVerified}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isVerified: e.target.checked,
                            verifiedDate: e.target.checked
                              ? new Date().toISOString().split('T')[0]
                              : undefined,
                            verificationChannel: e.target.checked ? 'ยืนยันตัวตนออนไลน์' : undefined,
                          })
                        }
                        className="rounded text-emerald-600"
                      />
                      <span>ยืนยันตัวตนแล้ว</span>
                    </label>

                    {formData.isVerified && (
                      <div className="mt-2 space-y-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600">ช่องทางการยืนยัน</label>
                          <select
                            value={formData.verificationChannel}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                verificationChannel: e.target.value as any,
                              })
                            }
                            className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          >
                            <option value="ยืนยันตัวตนออนไลน์">ยืนยันตัวตนออนไลน์</option>
                            <option value="แสดงตนที่กองคลัง">แสดงตนที่กองคลัง</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600">วันที่ยืนยัน</label>
                          <input
                            type="date"
                            value={formData.verifiedDate || ''}
                            onChange={(e) => setFormData({ ...formData, verifiedDate: e.target.value })}
                            className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Financial Pension Details */}
              <div className="font-bold text-slate-800 border-b pb-1 text-xs pt-2">
                ข้อมูลเงินสิทธิประโยชน์ (บาท)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เงินบำนาญปกติ (บาท/เดือน)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.regularPension}
                    onChange={(e) => setFormData({ ...formData, regularPension: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              {/* ข้อมูลเงินบำเหน็จดำรงชีพ (ตามเกณฑ์ 60/65/70 ปี) */}
              <div className="p-4 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 rounded-2xl border border-amber-200/80 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                  <div>
                    <h4 className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-amber-700" />
                      เงินบำเหน็จดำรงชีพ (ตามเกณฑ์ 60 / 65 / 70 ปี)
                    </h4>
                    <p className="text-[11px] text-amber-800/80 mt-0.5">
                      เงื่อนไขตามเกณฑ์ราชการ: อายุครบ 60 ปี ใส่ช่องงวดที่ 1 | อายุครบ 65 ปี ใส่ช่องงวดที่ 2 | อายุครบ 70 ปี ใส่ช่องงวดที่ 3
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-600">อายุปัจจุบัน:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
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

                {/* Status Callout Banner */}
                {(() => {
                  const age = Number(formData.age) || 0;
                  if (age < 60) {
                    return (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                        <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          <strong>ยังไม่ถึงเกณฑ์อายุ:</strong> ผู้รับบำนาญอายุ {age} ปี ยังไม่ครบ 60 ปีบริบูรณ์ จึงยังไม่สามารถกรอกเงินงวดที่ 1, 2 และ 3 ได้
                        </span>
                      </div>
                    );
                  }
                  if (age >= 60 && age < 65) {
                    return (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                        <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>อายุครบ 60 ปี:</strong> ปลดล็อกใส่ช่องจำนวนเงิน <strong>งวดที่ 1</strong> ได้ (ส่วนงวดที่ 2 และ 3 จะปลดล็อกเมื่ออายุครบ 65 และ 70 ปี)
                        </span>
                      </div>
                    );
                  }
                  if (age >= 65 && age < 70) {
                    return (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-800">
                        <Unlock className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          <strong>อายุครบ 65 ปี:</strong> ปลดล็อกใส่ช่องจำนวนเงิน <strong>งวดที่ 1</strong> และ <strong>งวดที่ 2</strong> ได้ (ส่วนงวดที่ 3 จะปลดล็อกเมื่ออายุครบ 70 ปี)
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-800">
                      <Unlock className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        <strong>อายุครบ 70 ปี:</strong> ปลดล็อกใส่ช่องจำนวนเงินได้ <strong>ครบทั้ง 3 งวด</strong> (งวดที่ 1, งวดที่ 2, งวดที่ 3 รวมไม่เกิน 500,000 บาท)
                      </span>
                    </div>
                  );
                })()}

                {/* 3 Installments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* งวดที่ 1 - อายุครบ 60 ปี */}
                  {(() => {
                    const isEligible = (Number(formData.age) || 0) >= 60;
                    return (
                      <div
                        className={`p-3 rounded-xl border transition-all ${
                          isEligible
                            ? 'bg-white border-emerald-300 shadow-2xs'
                            : 'bg-slate-100/80 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                            {isEligible ? (
                              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            งวดที่ 1 (อายุครบ 60 ปี)
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              isEligible
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isEligible ? 'กรอกเงินได้' : 'ล็อก (รออายุ 60)'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">
                          สิทธิเบิกได้ไม่เกิน 200,000 บาท
                        </p>
                        <div className="relative">
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
                            placeholder={isEligible ? 'ระบุจำนวนเงินงวดที่ 1' : 'ล็อก (ต้องอายุ 60 ปีขึ้นไป)'}
                            className={`w-full p-2 rounded-xl text-xs font-mono font-bold ${
                              isEligible
                                ? 'bg-emerald-50/50 border border-emerald-300 text-emerald-950 focus:ring-2 focus:ring-emerald-500'
                                : 'bg-slate-200/70 border border-slate-300 text-slate-400 cursor-not-allowed'
                            }`}
                          />
                          <span className="text-[11px] text-slate-400 font-normal absolute right-2.5 top-2.5">
                            บาท
                          </span>
                        </div>
                        {isEligible && (
                          <div className="flex gap-1 mt-2">
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
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                                  (formData.livingGratuityInstallment1 ?? 0) === amt
                                    ? 'bg-emerald-700 text-white font-bold'
                                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                {amt === 0 ? '0' : formatNumber(amt)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* งวดที่ 2 - อายุครบ 65 ปี */}
                  {(() => {
                    const isEligible = (Number(formData.age) || 0) >= 65;
                    return (
                      <div
                        className={`p-3 rounded-xl border transition-all ${
                          isEligible
                            ? 'bg-white border-blue-300 shadow-2xs'
                            : 'bg-slate-100/80 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                            {isEligible ? (
                              <Unlock className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            งวดที่ 2 (อายุครบ 65 ปี)
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              isEligible
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isEligible ? 'กรอกเงินได้' : 'ล็อก (รออายุ 65)'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">
                          สิทธิเบิกเพิ่มอีกไม่เกิน 200,000 บาท
                        </p>
                        <div className="relative">
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
                            placeholder={isEligible ? 'ระบุจำนวนเงินงวดที่ 2' : 'ล็อก (ต้องอายุ 65 ปีขึ้นไป)'}
                            className={`w-full p-2 rounded-xl text-xs font-mono font-bold ${
                              isEligible
                                ? 'bg-blue-50/50 border border-blue-300 text-blue-950 focus:ring-2 focus:ring-blue-500'
                                : 'bg-slate-200/70 border border-slate-300 text-slate-400 cursor-not-allowed'
                            }`}
                          />
                          <span className="text-[11px] text-slate-400 font-normal absolute right-2.5 top-2.5">
                            บาท
                          </span>
                        </div>
                        {isEligible && (
                          <div className="flex gap-1 mt-2">
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
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                                  (formData.livingGratuityInstallment2 ?? 0) === amt
                                    ? 'bg-blue-700 text-white font-bold'
                                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                                }`}
                              >
                                {amt === 0 ? '0' : formatNumber(amt)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* งวดที่ 3 - อายุครบ 70 ปี */}
                  {(() => {
                    const isEligible = (Number(formData.age) || 0) >= 70;
                    return (
                      <div
                        className={`p-3 rounded-xl border transition-all ${
                          isEligible
                            ? 'bg-white border-purple-300 shadow-2xs'
                            : 'bg-slate-100/80 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                            {isEligible ? (
                              <Unlock className="w-3.5 h-3.5 text-purple-600" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            งวดที่ 3 (อายุครบ 70 ปี)
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              isEligible
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isEligible ? 'กรอกเงินได้' : 'ล็อก (รออายุ 70)'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">
                          เบิกส่วนที่เหลือ (ไม่เกิน 100,000 บาท รวมไม่เกิน 500,000)
                        </p>
                        <div className="relative">
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
                            placeholder={isEligible ? 'ระบุจำนวนเงินงวดที่ 3' : 'ล็อก (ต้องอายุ 70 ปีขึ้นไป)'}
                            className={`w-full p-2 rounded-xl text-xs font-mono font-bold ${
                              isEligible
                                ? 'bg-purple-50/50 border border-purple-300 text-purple-950 focus:ring-2 focus:ring-purple-500'
                                : 'bg-slate-200/70 border border-slate-300 text-slate-400 cursor-not-allowed'
                            }`}
                          />
                          <span className="text-[11px] text-slate-400 font-normal absolute right-2.5 top-2.5">
                            บาท
                          </span>
                        </div>
                        {isEligible && (
                          <div className="flex gap-1 mt-2">
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
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                                  (formData.livingGratuityInstallment3 ?? 0) === amt
                                    ? 'bg-purple-700 text-white font-bold'
                                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                                }`}
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

                {/* Living Gratuity Total Summary Card */}
                {(() => {
                  const age = Number(formData.age) || 0;
                  const inst1 = age >= 60 ? Number(formData.livingGratuityInstallment1) || 0 : 0;
                  const inst2 = age >= 65 ? Number(formData.livingGratuityInstallment2) || 0 : 0;
                  const inst3 = age >= 70 ? Number(formData.livingGratuityInstallment3) || 0 : 0;
                  const total = inst1 + inst2 + inst3;

                  return (
                    <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                          <PiggyBank className="w-3.5 h-3.5 text-amber-700" />
                          สรุปยอดเงินบำเหน็จดำรงชีพรวม (ตามเกณฑ์ 60/65/70 ปี):
                        </span>
                        <div className="text-[11px] text-amber-800 flex items-center gap-1.5 flex-wrap font-mono">
                          <span>
                            งวด 1 (60 ปี): <strong>{formatCurrency(inst1)}</strong>
                          </span>
                          <span>+</span>
                          <span>
                            งวด 2 (65 ปี): <strong>{formatCurrency(inst2)}</strong>
                          </span>
                          <span>+</span>
                          <span>
                            งวด 3 (70 ปี): <strong>{formatCurrency(inst3)}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-amber-950 font-mono">
                          {formatCurrency(total)}
                        </span>
                        <span className="text-xs font-semibold text-amber-900 ml-1">บาท</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เงินเพิ่ม 25% (จากงบประมาณ)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.bonus25Budget}
                    onChange={(e) => setFormData({ ...formData, bonus25Budget: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ช.ค.บ (งบประมาณ)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.bonus25Deposit}
                    onChange={(e) => setFormData({ ...formData, bonus25Deposit: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
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
                  {editingId ? 'บันทึกการแก้ไข' : 'บันทึกรายชื่อ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
