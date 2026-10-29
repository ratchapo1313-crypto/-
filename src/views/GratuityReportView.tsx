import React, { useState, useMemo } from 'react';
import {
  Banknote,
  Users,
  CheckCircle2,
  Clock,
  HeartCrack,
  Search,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Calculator,
  User,
  Phone,
  Eye,
  X,
  AlertCircle,
  Filter,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { GratuityRecipientRecord, UserSession } from '../types';
import { formatCurrency, formatNumber, formatThaiDate } from '../utils/formatters';

interface GratuityReportViewProps {
  currentSession: UserSession;
  records: GratuityRecipientRecord[];
  onAddRecord: (record: GratuityRecipientRecord) => void;
  onUpdateRecord: (record: GratuityRecipientRecord) => void;
  onDeleteRecord: (id: string) => void;
  onQuickVerify: (id: string, channel: 'ยืนยันตัวตนออนไลน์' | 'แสดงตนที่กองคลัง') => void;
}

export function GratuityReportView({
  currentSession,
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onQuickVerify,
}: GratuityReportViewProps) {
  const canEdit = currentSession.roleCode === 'User';

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const deferredSearchTerm = React.useDeferredValue(searchTerm);
  const [lifeFilter, setLifeFilter] = useState<'all' | 'alive' | 'deceased'>('all');
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GratuityRecipientRecord | null>(null);
  const [viewingDetailItem, setViewingDetailItem] = useState<GratuityRecipientRecord | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<GratuityRecipientRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<GratuityRecipientRecord>>({
    title: 'นาย',
    firstName: '',
    lastName: '',
    idCard: '',
    formerPosition: '',
    department: 'กองคลัง',
    lastSalary: 0,
    serviceYears: 0,
    serviceMonths: 0,
    gratuityAmount: 0,
    isAlive: true,
    deathDate: '',
    isVerified: true,
    verifiedDate: new Date().toISOString().split('T')[0],
    verificationChannel: 'ยืนยันตัวตนออนไลน์',
    heirName: '',
    heirRelation: 'คู่สมรส',
    heirPercentage: 100,
    heirPhone: '',
    note: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Summary Metrics
  const totalRecipients = records.length;
  const aliveRecipients = useMemo(() => records.filter((r) => r.isAlive), [records]);
  const deceasedRecipients = useMemo(() => records.filter((r) => !r.isAlive), [records]);
  const verifiedRecipients = useMemo(() => records.filter((r) => r.isVerified), [records]);
  const unverifiedRecipients = useMemo(() => records.filter((r) => !r.isVerified), [records]);

  const totalGratuityDisbursed = useMemo(
    () => records.reduce((sum, r) => sum + (r.gratuityAmount || 0), 0),
    [records]
  );
  const avgGratuity = totalRecipients > 0 ? totalGratuityDisbursed / totalRecipients : 0;

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search Filter
      const term = deferredSearchTerm.trim().toLowerCase();
      const fullName = `${r.title || ''}${r.firstName} ${r.lastName}`.toLowerCase();
      const matchSearch =
        !term ||
        fullName.includes(term) ||
        r.firstName.toLowerCase().includes(term) ||
        r.lastName.toLowerCase().includes(term) ||
        r.idCard.includes(term) ||
        (r.code && r.code.toLowerCase().includes(term)) ||
        r.formerPosition.toLowerCase().includes(term) ||
        (r.department && r.department.toLowerCase().includes(term)) ||
        (r.heirName && r.heirName.toLowerCase().includes(term)) ||
        (r.note && r.note.toLowerCase().includes(term));

      // Life Filter
      const matchLife =
        lifeFilter === 'all' ||
        (lifeFilter === 'alive' && r.isAlive) ||
        (lifeFilter === 'deceased' && !r.isAlive);

      // Verify Filter
      const matchVerify =
        verifyFilter === 'all' ||
        (verifyFilter === 'verified' && r.isVerified) ||
        (verifyFilter === 'unverified' && !r.isVerified);

      return matchSearch && matchLife && matchVerify;
    });
  }, [records, deferredSearchTerm, lifeFilter, verifyFilter]);

  // Handle Form Change with Auto Gratuity Calculation
  const handleInputChange = (field: keyof GratuityRecipientRecord, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // If either lastSalary or serviceYears changes, re-calculate gratuityAmount
      if (field === 'lastSalary' || field === 'serviceYears') {
        const salary = field === 'lastSalary' ? Number(value) || 0 : Number(prev.lastSalary) || 0;
        const years = field === 'serviceYears' ? Number(value) || 0 : Number(prev.serviceYears) || 0;
        updated.gratuityAmount = Math.round(salary * years);
      }

      return updated;
    });

    if (formErrors[field]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const openAddModal = () => {
    const nextNum = records.length + 1;
    const code = `เหน็จ-2570-${String(nextNum).padStart(3, '0')}`;
    setEditingItem(null);
    setFormData({
      title: 'นาย',
      firstName: '',
      lastName: '',
      idCard: '',
      formerPosition: '',
      department: 'เทศบาลเมืองมหาสารคาม',
      lastSalary: 30000,
      serviceYears: 20,
      serviceMonths: 0,
      gratuityAmount: 600000, // 30,000 x 20
      isAlive: true,
      deathDate: '',
      isVerified: true,
      verifiedDate: new Date().toISOString().split('T')[0],
      verificationChannel: 'ยืนยันตัวตนออนไลน์',
      heirName: '',
      heirRelation: 'คู่สมรส',
      heirPercentage: 100,
      heirPhone: '',
      note: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: GratuityRecipientRecord) => {
    setEditingItem(item);
    setFormData({ ...item });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName?.trim()) errors.firstName = 'กรุณากรอกชื่อ';
    if (!formData.lastName?.trim()) errors.lastName = 'กรุณากรอกนามสกุล';
    if (!formData.idCard?.trim()) {
      errors.idCard = 'กรุณากรอกเลขบัตรประชาชน';
    } else if (formData.idCard.replace(/[^0-9]/g, '').length !== 13) {
      errors.idCard = 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก';
    }
    if ((formData.lastSalary || 0) <= 0) {
      errors.lastSalary = 'กรุณาระบุเงินเดือนที่ได้รับครั้งสุดท้ายให้ถูกต้อง (มากกว่า 0)';
    }
    if ((formData.serviceYears || 0) <= 0) {
      errors.serviceYears = 'กรุณาระบุอายุราชการให้ถูกต้อง (มากกว่า 0 ปี)';
    }
    if (!formData.isAlive && !formData.deathDate) {
      errors.deathDate = 'กรุณาระบุวันที่ถึงแก่กรรม';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const salary = Number(formData.lastSalary) || 0;
    const years = Number(formData.serviceYears) || 0;
    const calculatedAmount = Math.round(salary * years);

    if (editingItem) {
      const updated: GratuityRecipientRecord = {
        ...editingItem,
        title: formData.title || 'นาย',
        firstName: formData.firstName!.trim(),
        lastName: formData.lastName!.trim(),
        idCard: formData.idCard!.trim().replace(/[^0-9]/g, ''),
        formerPosition: formData.formerPosition?.trim() || 'พนักงานเทศบาล',
        department: formData.department?.trim() || 'เทศบาลเมืองมหาสารคาม',
        lastSalary: salary,
        serviceYears: years,
        serviceMonths: Number(formData.serviceMonths) || 0,
        gratuityAmount: formData.gratuityAmount || calculatedAmount,
        isAlive: formData.isAlive ?? true,
        deathDate: formData.isAlive ? undefined : formData.deathDate,
        isVerified: formData.isVerified ?? false,
        verifiedDate: formData.isVerified ? formData.verifiedDate : undefined,
        verificationChannel: formData.isVerified ? formData.verificationChannel : undefined,
        heirName: formData.heirName?.trim(),
        heirRelation: formData.heirRelation?.trim(),
        heirPercentage: formData.heirPercentage,
        heirPhone: formData.heirPhone?.trim(),
        paymentDate: formData.paymentDate,
        note: formData.note?.trim(),
        recordedBy: editingItem.recordedBy || currentSession.username,
        updatedAt: new Date().toISOString(),
      };
      onUpdateRecord(updated);
    } else {
      const nextNum = records.length + 1;
      const newRecord: GratuityRecipientRecord = {
        id: `GRAT-2570-${Date.now().toString().slice(-4)}`,
        code: `เหน็จ-2570-${String(nextNum).padStart(3, '0')}`,
        title: formData.title || 'นาย',
        firstName: formData.firstName!.trim(),
        lastName: formData.lastName!.trim(),
        idCard: formData.idCard!.trim().replace(/[^0-9]/g, ''),
        formerPosition: formData.formerPosition?.trim() || 'พนักงานเทศบาล',
        department: formData.department?.trim() || 'เทศบาลเมืองมหาสารคาม',
        lastSalary: salary,
        serviceYears: years,
        serviceMonths: Number(formData.serviceMonths) || 0,
        gratuityAmount: formData.gratuityAmount || calculatedAmount,
        isAlive: formData.isAlive ?? true,
        deathDate: formData.isAlive ? undefined : formData.deathDate,
        isVerified: formData.isVerified ?? false,
        verifiedDate: formData.isVerified ? formData.verifiedDate : undefined,
        verificationChannel: formData.isVerified ? formData.verificationChannel : undefined,
        heirName: formData.heirName?.trim(),
        heirRelation: formData.heirRelation?.trim(),
        heirPercentage: formData.heirPercentage,
        heirPhone: formData.heirPhone?.trim(),
        paymentDate: formData.paymentDate || new Date().toISOString().split('T')[0],
        note: formData.note?.trim(),
        recordedBy: currentSession.username,
        updatedAt: new Date().toISOString(),
      };
      onAddRecord(newRecord);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (item: GratuityRecipientRecord) => {
    setDeleteConfirmTarget(item);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = filteredRecords.map((r, index) => ({
      'ลำดับ': index + 1,
      'รหัสบำเหน็จ': r.code,
      'คำนำหน้า': r.title,
      'ชื่อ': r.firstName,
      'นามสกุล': r.lastName,
      'เลขบัตรประชาชน': r.idCard,
      'ตำแหน่งเดิม': r.formerPosition,
      'สังกัด/กอง': r.department || 'เทศบาลเมืองมหาสารคาม',
      'เงินเดือนที่ได้รับครั้งสุดท้าย (บาท)': r.lastSalary,
      'อายุราชการ (ปี)': r.serviceYears,
      'ยอดเงินบำเหน็จ (คำนวณ) (บาท)': r.gratuityAmount,
      'สถานะการมีชีวิต': r.isAlive ? 'มีชีวิต' : 'ถึงแก่กรรม',
      'วันที่ถึงแก่กรรม': r.deathDate || '-',
      'สถานะการยืนยันตัวตน': r.isVerified ? 'ยืนยันตัวตนแล้ว' : 'ยังไม่ได้ยืนยัน',
      'วันที่ยืนยัน': r.verifiedDate || '-',
      'ช่องทางการยืนยัน': r.verificationChannel || '-',
      'ชื่อทายาทผู้มีสิทธิรับบำเหน็จตกทอด': r.heirName || '-',
      'ความสัมพันธ์': r.heirRelation || '-',
      'สัดส่วนบำเหน็จตกทอด (%)': r.heirPercentage ? `${r.heirPercentage}%` : '-',
      'เบอร์โทรศัพท์ทายาท': r.heirPhone || '-',
      'วันที่จ่ายเงิน': r.paymentDate || '-',
      'หมายเหตุ': r.note || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายงานผู้รับบำเหน็จ 2570');
    XLSX.writeFile(wb, `รายงานผู้รับบำเหน็จ_เทศบาลเมืองมหาสารคาม_2570.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Fiscal Year 2570 & Formula Explanation */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium">
                <Banknote className="w-3.5 h-3.5" />
                ปีงบประมาณ 2570
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                อัพเดทอัตโนมัติ (User, User1, User2)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                ระเบียบบำเหน็จข้าราชการส่วนท้องถิ่น
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              รายงานผู้รับบำเหน็จ & ระบบคำนวณเงิน
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl">
              เทศบาลเมืองมหาสารคาม • บันทึกและคำนวณเงินบำเหน็จก้อนเดียวจากเงินเดือนครั้งสุดท้ายกับอายุราชการ
              พร้อมติดตามสถานะการมีชีวิตและการยืนยันตัวตน
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm transition-all border border-white/20 flex items-center gap-2 cursor-pointer shadow-sm"
              title="ส่งออก Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              ส่งออก Excel (.xlsx)
            </button>

            {canEdit && (
              <button
                onClick={openAddModal}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                เพิ่มผู้รับบำเหน็จ
              </button>
            )}
          </div>
        </div>

        {/* Highlighted Formula Callout */}
        <div className="mt-4 pt-3 border-t border-emerald-700/50 flex flex-wrap items-center gap-3 text-xs text-emerald-200">
          <div className="flex items-center gap-1.5 bg-emerald-800/60 px-3 py-1 rounded-lg border border-emerald-600/40 font-mono text-emerald-100">
            <Calculator className="w-3.5 h-3.5 text-amber-300" />
            <span>สูตรคำนวณ: เงินเดือนที่ได้รับครั้งสุดท้าย × อายุราชการ (ปี) = ยอดเงินบำเหน็จ</span>
          </div>
          <span className="text-emerald-300/80 hidden sm:inline">•</span>
          <span className="text-emerald-300/80">
            คำนวณอัตโนมัติ Real-time เมื่อกรอกข้อมูลเงินเดือนและอายุราชการ
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Gratuity Amount */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ยอดเงินบำเหน็จรวม</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Banknote className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-900">
            {formatCurrency(totalGratuityDisbursed)}{' '}
            <span className="text-xs font-normal text-slate-500">฿</span>
          </div>
          <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg">
            เฉลี่ย: {formatCurrency(avgGratuity)} ฿/ราย
          </div>
        </div>

        {/* Total Recipients */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ผู้รับบำเหน็จทั้งหมด</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(totalRecipients)}{' '}
            <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">ปีงบประมาณ 2570</p>
        </div>

        {/* Verified Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ยืนยันตัวตนแล้ว</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatNumber(verifiedRecipients.length)}{' '}
            <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-2">
            {totalRecipients > 0
              ? ((verifiedRecipients.length / totalRecipients) * 100).toFixed(1)
              : 0}
            % ของผู้รับบำเหน็จ
          </p>
        </div>

        {/* Unverified Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ยังไม่ยืนยันตัวตน</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {formatNumber(unverifiedRecipients.length)}{' '}
            <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <p className="text-[11px] text-amber-700 mt-2">รอการแสดงตน/ออนไลน์</p>
        </div>

        {/* Living / Deceased */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">สถานะชีวิต / ตกทอด</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <HeartCrack className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(deceasedRecipients.length)}{' '}
            <span className="text-xs font-normal text-rose-600">ถึงแก่กรรม</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            มีชีวิต {formatNumber(aliveRecipients.length)} คน (สิทธิบำเหน็จตกทอด)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box with Search Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchTerm(searchInput.trim());
            }}
            className="flex-1 w-full flex items-center gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSearchTerm(e.target.value);
                }}
                placeholder="ค้นหาชื่อ, นามสกุล, เลขบัตร 13 หลัก, รหัสบำเหน็จ, ตำแหน่ง, สังกัด, ทายาท..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchTerm('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title="ล้างคำค้นหา"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="กดค้นหาข้อมูล"
            >
              <Search className="w-3.5 h-3.5" />
              <span>ค้นหา</span>
            </button>
          </form>

          {/* Filter Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Life Filter */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
              <button
                onClick={() => setLifeFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  lifeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด ({totalRecipients})
              </button>
              <button
                onClick={() => setLifeFilter('alive')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  lifeFilter === 'alive'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                มีชีวิต ({aliveRecipients.length})
              </button>
              <button
                onClick={() => setLifeFilter('deceased')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  lifeFilter === 'deceased'
                    ? 'bg-white text-rose-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ถึงแก่กรรม ({deceasedRecipients.length})
              </button>
            </div>

            {/* Verification Filter */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
              <button
                onClick={() => setVerifyFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  verifyFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                สถานะยืนยันทั้งหมด
              </button>
              <button
                onClick={() => setVerifyFilter('verified')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  verifyFilter === 'verified'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ยืนยันแล้ว ({verifiedRecipients.length})
              </button>
              <button
                onClick={() => setVerifyFilter('unverified')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  verifyFilter === 'unverified'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ยังไม่ยืนยัน ({unverifiedRecipients.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-700" />
              ทะเบียนผู้รับบำเหน็จ เทศบาลเมืองมหาสารคาม
            </h3>
            <p className="text-xs text-slate-500">
              แสดง {filteredRecords.length} จากทั้งหมด {records.length} ราย
            </p>
          </div>

          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
            ยอดเงินบำเหน็จตามรายการที่เลือก:{' '}
            {formatCurrency(
              filteredRecords.reduce((sum, r) => sum + (r.gratuityAmount || 0), 0)
            )}{' '}
            บาท
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Banknote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">ไม่พบข้อมูลผู้รับบำเหน็จตามเงื่อนไข</p>
            <p className="text-xs text-slate-400 mt-1">
              ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองสถานะ
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 text-xs font-semibold">
                  <th className="py-3 px-4 text-center w-12">ลำดับ</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล / ตำแหน่ง</th>
                  <th className="py-3 px-4">เลขบัตรประชาชน 13 หลัก</th>
                  <th className="py-3 px-4 text-right">เงินเดือนครั้งสุดท้าย</th>
                  <th className="py-3 px-4 text-center">อายุราชการ</th>
                  <th className="py-3 px-4 text-right">ยอดเงินบำเหน็จ (คำนวณ)</th>
                  <th className="py-3 px-4 text-center">สถานะชีวิต</th>
                  <th className="py-3 px-4 text-center">การยืนยันตัวตน</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-emerald-50/30 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                      {index + 1}
                    </td>

                    {/* Name & Position */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-sm">
                        {item.title}
                        {item.firstName} {item.lastName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {item.code}
                        </span>
                        <span>•</span>
                        <span>{item.formerPosition}</span>
                      </div>
                      {item.heirName && (
                        <div className="text-[11px] text-amber-700 mt-0.5">
                          ทายาท: {item.heirName} ({item.heirRelation}) {item.heirPercentage}%
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono border border-slate-200">
                          <User className="w-2.5 h-2.5 text-emerald-600" />
                          ผู้บันทึก: {item.recordedBy || 'User'}
                        </span>
                      </div>
                    </td>

                    {/* ID Card */}
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                      {item.idCard.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5')}
                    </td>

                    {/* Last Salary */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                      {formatCurrency(item.lastSalary)} ฿
                    </td>

                    {/* Service Years */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold text-xs">
                        {item.serviceYears} ปี
                      </span>
                    </td>

                    {/* Gratuity Amount (Calculated) */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-emerald-800 text-sm">
                        {formatCurrency(item.gratuityAmount)} ฿
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ({formatNumber(item.lastSalary)} × {item.serviceYears})
                      </div>
                    </td>

                    {/* Life Status */}
                    <td className="py-3.5 px-4 text-center">
                      {item.isAlive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          มีชีวิต
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          <HeartCrack className="w-3 h-3 text-rose-600" />
                          ถึงแก่กรรม
                        </span>
                      )}
                      {!item.isAlive && item.deathDate && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatThaiDate(item.deathDate)}
                        </div>
                      )}
                    </td>

                    {/* Verification Status */}
                    <td className="py-3.5 px-4 text-center">
                      {item.isVerified ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ยืนยันแล้ว
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {formatThaiDate(item.verifiedDate)}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            ยังไม่ยืนยัน
                          </span>
                          {canEdit && (
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                onClick={() => onQuickVerify(item.id, 'ยืนยันตัวตนออนไลน์')}
                                className="px-1.5 py-0.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer shadow-2xs"
                                title="ยืนยันออนไลน์ทันที"
                              >
                                ยืนยันออนไลน์
                              </button>
                              <button
                                onClick={() => onQuickVerify(item.id, 'แสดงตนที่กองคลัง')}
                                className="px-1.5 py-0.5 text-[10px] bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer shadow-2xs"
                                title="แสดงตนที่กองคลัง"
                              >
                                มาแสดงตน
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingDetailItem(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="ดูรายละเอียดฉบับเต็ม"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบรายชื่อ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (Smooth & Non-blocking) */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              ยืนยันการลบรายชื่อผู้รับบำเหน็จ
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
                  onDeleteRecord(deleteConfirmTarget.id);
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

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingItem ? 'แก้ไขข้อมูลผู้รับบำเหน็จ' : 'เพิ่มรายชื่อผู้รับบำเหน็จ'}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    คำนวณเงินเดือนครั้งสุดท้าย × อายุราชการ พร้อมตรวจสอบสถานะ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Section 1: Personal Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-700" />
                  1. ข้อมูลส่วนบุคคลและตำแหน่ง
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      คำนำหน้า <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.title || 'นาย'}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    >
                      <option value="นาย">นาย</option>
                      <option value="นาง">นาง</option>
                      <option value="นางสาว">นางสาว</option>
                      <option value="ว่าที่ ร.ต.">ว่าที่ ร.ต.</option>
                      <option value="ดร.">ดร.</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1.5">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ชื่อ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="เช่น สมปอง"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white ${
                        formErrors.firstName ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                      }`}
                    />
                    {formErrors.firstName && (
                      <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.firstName}</p>
                    )}
                  </div>

                  <div className="sm:col-span-1.5">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      นามสกุล <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="เช่น สุวรรณโชติ"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white ${
                        formErrors.lastName ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                      }`}
                    />
                    {formErrors.lastName && (
                      <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      เลขประจำตัวประชาชน (13 หลัก) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={13}
                      value={formData.idCard || ''}
                      onChange={(e) =>
                        handleInputChange('idCard', e.target.value.replace(/[^0-9]/g, ''))
                      }
                      placeholder="เช่น 3440100123456"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white ${
                        formErrors.idCard ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                      }`}
                    />
                    {formErrors.idCard && (
                      <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.idCard}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ตำแหน่งเดิมก่อนลาออก/เกษียณ
                    </label>
                    <input
                      type="text"
                      value={formData.formerPosition || ''}
                      onChange={(e) => handleInputChange('formerPosition', e.target.value)}
                      placeholder="เช่น นายช่างโยธาอาวุโส"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Calculation (Last Salary & Service Years) */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-700" />
                    2. การคำนวณเงินบำเหน็จ (เงินเดือนครั้งสุดท้าย × อายุราชการ)
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    คำนวณอัตโนมัติ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      เงินเดือนที่ได้รับครั้งสุดท้าย (บาท) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.lastSalary ?? ''}
                        onChange={(e) => handleInputChange('lastSalary', e.target.value)}
                        placeholder="เช่น 38400"
                        className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 ${
                          formErrors.lastSalary ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        บาท
                      </span>
                    </div>
                    {formErrors.lastSalary && (
                      <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.lastSalary}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      อายุราชการ (ปี) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.serviceYears ?? ''}
                        onChange={(e) => handleInputChange('serviceYears', e.target.value)}
                        placeholder="เช่น 22"
                        className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 ${
                          formErrors.serviceYears ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        ปี
                      </span>
                    </div>
                    {formErrors.serviceYears && (
                      <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.serviceYears}</p>
                    )}
                  </div>
                </div>

                {/* Live Real-time Calculation Result Card */}
                <div className="p-3.5 bg-white rounded-xl border border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500">ผลการคำนวณเงินบำเหน็จ:</span>
                    <div className="font-mono text-xs text-slate-700">
                      {formatCurrency(formData.lastSalary || 0)} ฿ ×{' '}
                      {formatNumber(formData.serviceYears || 0)} ปี
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-emerald-700 font-medium">ยอดเงินบำเหน็จที่ได้รับ:</span>
                    <div className="text-xl font-extrabold text-emerald-800">
                      {formatCurrency(
                        Math.round((Number(formData.lastSalary) || 0) * (Number(formData.serviceYears) || 0))
                      )}{' '}
                      <span className="text-xs font-normal text-slate-500">บาท</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Living Status & Verification */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  3. สถานะการมีชีวิต และ การยืนยันตัวตน
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Living Status */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-2">
                      สถานะการมีชีวิต
                    </label>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="isAlive"
                          checked={formData.isAlive === true}
                          onChange={() => handleInputChange('isAlive', true)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-slate-800 font-medium">มีชีวิต</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="isAlive"
                          checked={formData.isAlive === false}
                          onChange={() => handleInputChange('isAlive', false)}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-rose-700 font-medium">ถึงแก่กรรม</span>
                      </label>
                    </div>

                    {!formData.isAlive && (
                      <div className="mt-3">
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          วันที่ถึงแก่กรรม <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.deathDate || ''}
                          onChange={(e) => handleInputChange('deathDate', e.target.value)}
                          className={`w-full px-3 py-1.5 bg-white border rounded-lg text-xs ${
                            formErrors.deathDate ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                          }`}
                        />
                        {formErrors.deathDate && (
                          <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.deathDate}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Verification Status */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-2">
                      สถานะการยืนยันตัวตน
                    </label>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="isVerified"
                          checked={formData.isVerified === true}
                          onChange={() => handleInputChange('isVerified', true)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-emerald-700 font-medium">ยืนยันตัวตนแล้ว</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="isVerified"
                          checked={formData.isVerified === false}
                          onChange={() => handleInputChange('isVerified', false)}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-amber-700 font-medium">ยังไม่ยืนยัน</span>
                      </label>
                    </div>

                    {formData.isVerified && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            ช่องทาง
                          </label>
                          <select
                            value={formData.verificationChannel || 'ยืนยันตัวตนออนไลน์'}
                            onChange={(e) =>
                              handleInputChange('verificationChannel', e.target.value)
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          >
                            <option value="ยืนยันตัวตนออนไลน์">ยืนยันตัวตนออนไลน์</option>
                            <option value="แสดงตนที่กองคลัง">แสดงตนที่กองคลัง</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            วันที่ยืนยัน
                          </label>
                          <input
                            type="date"
                            value={formData.verifiedDate || ''}
                            onChange={(e) => handleInputChange('verifiedDate', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          >
                          </input>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Heir Beneficiary Info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-600" />
                  4. ทายาทผู้มีสิทธิขอรับบำเหน็จตกทอด (กรณีถึงแก่กรรม)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      ชื่อ-นามสกุล ทายาท
                    </label>
                    <input
                      type="text"
                      value={formData.heirName || ''}
                      onChange={(e) => handleInputChange('heirName', e.target.value)}
                      placeholder="เช่น นางวิไลลักษณ์ สุวรรณโชติ"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      ความสัมพันธ์
                    </label>
                    <input
                      type="text"
                      value={formData.heirRelation || ''}
                      onChange={(e) => handleInputChange('heirRelation', e.target.value)}
                      placeholder="เช่น คู่สมรส / บุตร / บิดา / มารดา"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      สัดส่วน (%) / เบอร์โทร
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.heirPercentage || 100}
                        onChange={(e) =>
                          handleInputChange('heirPercentage', Number(e.target.value) || 100)
                        }
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={formData.heirPhone || ''}
                        onChange={(e) => handleInputChange('heirPhone', e.target.value)}
                        placeholder="เบอร์โทร"
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingItem ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลผู้รับบำเหน็จ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Full View Modal */}
      {viewingDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">รายละเอียดผู้รับบำเหน็จ (ใบสรุปรายการ)</h3>
              </div>
              <button
                onClick={() => setViewingDetailItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-slate-500 font-medium">ยอดเงินบำเหน็จที่ได้รับ</span>
                <div className="text-2xl font-extrabold text-emerald-800 mt-1">
                  {formatCurrency(viewingDetailItem.gratuityAmount)} บาท
                </div>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  คำนวณจาก: {formatCurrency(viewingDetailItem.lastSalary)} ฿ ×{' '}
                  {viewingDetailItem.serviceYears} ปี
                </p>
              </div>

              <div className="space-y-2 border-t border-b border-slate-100 py-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">ชื่อ-นามสกุล:</span>
                  <span className="font-bold text-slate-800">
                    {viewingDetailItem.title}
                    {viewingDetailItem.firstName} {viewingDetailItem.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">เลขบัตรประชาชน:</span>
                  <span className="font-mono text-slate-800">
                    {viewingDetailItem.idCard.replace(
                      /(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/,
                      '$1-$2-$3-$4-$5'
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ตำแหน่งเดิม:</span>
                  <span className="text-slate-800">{viewingDetailItem.formerPosition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">เงินเดือนครั้งสุดท้าย:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(viewingDetailItem.lastSalary)} บาท
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">อายุราชการ:</span>
                  <span className="font-semibold text-blue-700">
                    {viewingDetailItem.serviceYears} ปี
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">สถานะการมีชีวิต:</span>
                  <span>
                    {viewingDetailItem.isAlive ? (
                      <span className="text-emerald-700 font-semibold">มีชีวิต</span>
                    ) : (
                      <span className="text-rose-700 font-semibold">
                        ถึงแก่กรรม ({formatThaiDate(viewingDetailItem.deathDate)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">สถานะการยืนยันตัวตน:</span>
                  <span>
                    {viewingDetailItem.isVerified ? (
                      <span className="text-emerald-700 font-semibold">
                        ยืนยันแล้ว ({formatThaiDate(viewingDetailItem.verifiedDate)} -{' '}
                        {viewingDetailItem.verificationChannel})
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold">ยังไม่ได้ยืนยันตัวตน</span>
                    )}
                  </span>
                </div>
                {viewingDetailItem.heirName && (
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">ทายาทผู้รับบำเหน็จตกทอด:</span>
                    <span className="text-slate-800 font-medium">
                      {viewingDetailItem.heirName} ({viewingDetailItem.heirRelation}){' '}
                      {viewingDetailItem.heirPercentage}%
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewingDetailItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
