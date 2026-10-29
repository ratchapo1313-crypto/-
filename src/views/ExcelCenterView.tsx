import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Layers,
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Banknote,
  Users,
  Wallet,
  PiggyBank,
  FileText,
  HeartHandshake,
  HeartCrack,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  EOfficeRecord,
  FinancialFundRecord,
  PensionerRecord,
  GratuityRecipientRecord,
  UserSession,
} from '../types';
import {
  exportAllSheetsToExcel,
  exportPensionersToExcel,
  exportGratuityToExcel,
  exportEOfficeToExcel,
  exportChkbToExcel,
  exportGbtToExcel,
  exportBonus25BudgetToExcel,
  exportBonus25DepositToExcel,
  exportLivingGratuityToExcel,
  exportDeceasedHeirsToExcel,
  downloadTemplate,
  parseExcelFile,
} from '../utils/excel';
import { formatNumber, formatCurrency } from '../utils/formatters';

interface ExcelCenterViewProps {
  currentSession: UserSession;
  eOfficeData: EOfficeRecord[];
  chkbData: FinancialFundRecord[];
  gbtData: FinancialFundRecord[];
  pensionersData: PensionerRecord[];
  gratuityData: GratuityRecipientRecord[];
  onImportEOffice: (data: EOfficeRecord[], mode: 'append' | 'replace') => void;
  onImportChkb: (data: FinancialFundRecord[], mode: 'append' | 'replace') => void;
  onImportGbt: (data: FinancialFundRecord[], mode: 'append' | 'replace') => void;
  onImportPensioners: (data: PensionerRecord[], mode: 'append' | 'replace') => void;
  onImportGratuity: (data: GratuityRecipientRecord[], mode: 'append' | 'replace') => void;
}

export function ExcelCenterView({
  currentSession,
  eOfficeData,
  chkbData,
  gbtData,
  pensionersData,
  gratuityData,
  onImportEOffice,
  onImportChkb,
  onImportGbt,
  onImportPensioners,
  onImportGratuity,
}: ExcelCenterViewProps) {
  const canImport = currentSession.roleCode === 'User';

  const [importCategory, setImportCategory] = useState<
    'pensioner' | 'gratuity' | 'eoffice' | 'chkb' | 'gbt'
  >('pensioner');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Summary counts
  const eOfficeInCount = eOfficeData
    .filter((e) => e.type === 'in')
    .reduce((s, e) => s + (e.quantity !== undefined ? e.quantity : 1), 0);
  const eOfficeOutCount = eOfficeData
    .filter((e) => e.type === 'out')
    .reduce((s, e) => s + (e.quantity !== undefined ? e.quantity : 1), 0);

  const chkbTotalReceived = chkbData.reduce((s, r) => s + r.receivedAmount, 0);
  const chkbTotalPaid = chkbData.reduce((s, r) => s + r.paidAmount, 0);
  const chkbNet = chkbTotalReceived - chkbTotalPaid;

  const gbtTotalReceived = gbtData.reduce((s, r) => s + r.receivedAmount, 0);
  const gbtTotalPaid = gbtData.reduce((s, r) => s + r.paidAmount, 0);
  const gbtNet = gbtTotalReceived - gbtTotalPaid;

  const livingPensioners = pensionersData.filter((p) => p.isAlive);
  const deceasedPensioners = pensionersData.filter((p) => !p.isAlive);
  const bonusBudgetCount = pensionersData.filter((p) => (p.bonus25Budget || 0) > 0).length;
  const bonusDepositCount = pensionersData.filter((p) => (p.bonus25Deposit || 0) > 0).length;
  const livingGratuityCount = pensionersData.filter((p) => (p.livingGratuity || 0) > 0 || p.age >= 60).length;
  const totalGratuityAmount = gratuityData.reduce(
    (s, g) => s + (g.gratuityAmount || g.lastSalary * g.serviceYears || 0),
    0
  );

  // Handle Full Workbook Export
  const handleExportAll = () => {
    exportAllSheetsToExcel(eOfficeData, chkbData, gbtData, pensionersData, gratuityData);
  };

  // Handle file selection and parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus(null);

    try {
      const rawRows = await parseExcelFile(file);
      if (!rawRows || rawRows.length === 0) {
        throw new Error('ไม่พบแถวข้อมูลในไฟล์ที่เลือก');
      }

      if (importCategory === 'eoffice') {
        const parsed: EOfficeRecord[] = rawRows.map((row: any, i: number) => {
          const typeRaw = String(row['ประเภท (in/out)'] || row['ประเภท'] || 'in').toLowerCase();
          const isOut = typeRaw.includes('ออก') || typeRaw.includes('ส่ง') || typeRaw.includes('out');
          return {
            id: `EO-IMP-${Date.now()}-${i + 1}`,
            date: row['วันที่'] || row['วันที่ (YYYY-MM-DD)'] || new Date().toISOString().split('T')[0],
            type: isOut ? 'out' : 'in',
            quantity: Math.max(1, Number(row['จำนวน (เรื่อง)'] || row['จำนวน'] || 1)),
            docNumber: row['เลขที่หนังสือ'] || row['เลขที่รับ-ส่งล่าสุด'] || `มค 52001/ว ${i + 100}`,
            title: row['เรื่องสำคัญ'] || row['เรื่อง'] || (isOut ? 'การส่งหนังสือออก' : 'การรับหนังสือ'),
            department: row['หน่วยงาน'] || 'เทศบาลเมืองมหาสารคาม',
            note: row['หมายเหตุ'] || '',
            status: 'completed',
            recordedBy: currentSession.username,
            updatedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          };
        });
        onImportEOffice(parsed, importMode);
        setImportStatus({
          type: 'success',
          message: `นำเข้าข้อมูลระบบ E-Office เรียบร้อยแล้ว จำนวน ${formatNumber(parsed.length)} รายการ (${
            importMode === 'append' ? 'เพิ่มต่อท้าย' : 'แทนที่ข้อมูลเดิม'
          })`,
        });
      } else if (importCategory === 'chkb') {
        const parsed: FinancialFundRecord[] = rawRows.map((row: any, i: number) => {
          const recAmt = Number(row['รับเงินจำนวน (บาท)'] || row['รับเงินจำนวน'] || 0);
          const pdAmt = Number(row['จ่ายไปเท่าไหร่ (บาท)'] || row['จ่ายไปเท่าไหร่'] || 0);
          return {
            id: `CHKB-IMP-${Date.now()}-${i + 1}`,
            date: row['วันที่'] || row['วันที่ (YYYY-MM-DD)'] || new Date().toISOString().split('T')[0],
            source:
              row['รับเงินจากที่ไหน / แหล่งที่มา หรือ รายละเอียดการจ่าย'] ||
              row['รับเงินจากที่ไหน'] ||
              row['แหล่งที่มา'] ||
              'รายการ ช.ค.บ. นำเข้า',
            receivedAmount: recAmt,
            paidAmount: pdAmt,
            netBalance: recAmt - pdAmt,
            beneficiaryCount: Number(row['จำนวนราย (คน)'] || row['จำนวนราย'] || 1),
            note: row['หมายเหตุ'] || '',
            recordedBy: currentSession.username,
            updatedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          };
        });
        onImportChkb(parsed, importMode);
        setImportStatus({
          type: 'success',
          message: `นำเข้าข้อมูลทะเบียน ช.ค.บ. เรียบร้อยแล้ว จำนวน ${formatNumber(parsed.length)} รายการ (${
            importMode === 'append' ? 'เพิ่มต่อท้าย' : 'แทนที่ข้อมูลเดิม'
          })`,
        });
      } else if (importCategory === 'gbt') {
        const parsed: FinancialFundRecord[] = rawRows.map((row: any, i: number) => {
          const recAmt = Number(row['รับเงินจำนวน (บาท)'] || row['รับเงินจำนวน'] || 0);
          const pdAmt = Number(row['จ่ายไปเท่าไหร่ (บาท)'] || row['จ่ายไปเท่าไหร่'] || 0);
          return {
            id: `GBT-IMP-${Date.now()}-${i + 1}`,
            date: row['วันที่'] || row['วันที่ (YYYY-MM-DD)'] || new Date().toISOString().split('T')[0],
            source:
              row['รับเงินจากที่ไหน / แหล่งที่มา หรือ รายละเอียดการจ่าย'] ||
              row['รับเงินจากที่ไหน'] ||
              row['แหล่งที่มา'] ||
              'รายการ ก.บ.ท. นำเข้า',
            receivedAmount: recAmt,
            paidAmount: pdAmt,
            netBalance: recAmt - pdAmt,
            beneficiaryCount: Number(row['จำนวนราย (คน)'] || row['จำนวนราย'] || 1),
            note: row['หมายเหตุ'] || '',
            recordedBy: currentSession.username,
            updatedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          };
        });
        onImportGbt(parsed, importMode);
        setImportStatus({
          type: 'success',
          message: `นำเข้าข้อมูลทะเบียน ก.บ.ท. เรียบร้อยแล้ว จำนวน ${formatNumber(parsed.length)} รายการ (${
            importMode === 'append' ? 'เพิ่มต่อท้าย' : 'แทนที่ข้อมูลเดิม'
          })`,
        });
      } else if (importCategory === 'pensioner') {
        const parsed: PensionerRecord[] = rawRows.map((row: any, i: number) => {
          const budget25 = Number(row['จากงบประมาณ (บาท)'] || row['เงินเพิ่ม 25% จากงบประมาณ (บาท)'] || row['จากงบประมาณ'] || 0);
          const deposit25 = Number(row['เงินรับฝาก (บาท)'] || row['เงินเพิ่ม 25% เงินรับฝาก (บาท)'] || row['เงินรับฝาก'] || 0);
          const total25 = Number(row['เงินเพิ่ม 25% รวม (บาท)'] || row['เงินเพิ่ม 25% รวม'] || budget25 + deposit25);
          const ageVal = Number(row['อายุ'] || 65);
          let ageG: any =
            row['กลุ่มอายุ (60/65/70/75/other)'] ||
            row['กลุ่มอายุ'] ||
            '65';
          if (!['60', '65', '70', '75'].includes(ageG)) {
            if (ageVal === 60) ageG = '60';
            else if (ageVal === 65) ageG = '65';
            else if (ageVal === 70) ageG = '70';
            else if (ageVal === 75) ageG = '75';
            else ageG = 'other';
          }

          const isD =
            (row['สถานะชีวิต (มีชีวิต/ถึงแก่กรรม)'] || row['สถานะชีวิต'] || '').includes('ถึงแก่กรรม') ||
            (row['สถานะชีวิต'] || '').includes('เสียชีวิต') ||
            Boolean(row['วันที่ถึงแก่กรรม'] || row['วันที่ถึงแก่กรรม (YYYY-MM-DD ถ้ามี)']);

          const isVer =
            (row['สถานะการยืนยัน (ยืนยันแล้ว/ยังไม่ยืนยัน)'] ||
              row['สถานะการยืนยันตัวตน'] ||
              '').includes('ยืนยันแล้ว') ||
            (row['สถานะการยืนยัน'] || '').includes('แล้ว');

          const inst1 = Number(
            row['บำเหน็จดำรงชีพ งวดที่ 1 (อายุครบ 60 ปี) (บาท)'] ||
              row['บำเหน็จดำรงชีพ งวดที่ 1 (อายุครบ 60 ปี)'] ||
              (ageVal >= 60 ? Math.min(200000, Number(row['เงินบำเหน็จดำรงชีพ รวม (บาท)'] || 0)) : 0)
          );
          const inst2 = Number(
            row['บำเหน็จดำรงชีพ งวดที่ 2 (อายุครบ 65 ปี) (บาท)'] ||
              row['บำเหน็จดำรงชีพ งวดที่ 2 (อายุครบ 65 ปี)'] ||
              0
          );
          const inst3 = Number(
            row['บำเหน็จดำรงชีพ งวดที่ 3 (อายุครบ 70 ปี) (บาท)'] ||
              row['บำเหน็จดำรงชีพ งวดที่ 3 (อายุครบ 70 ปี)'] ||
              0
          );
          const totalLiving =
            Number(row['เงินบำเหน็จดำรงชีพ รวม (บาท)'] || row['เงินบำเหน็จดำรงชีพ'] || 0) ||
            inst1 + inst2 + inst3;

          const regularPensionVal = Number(row['เงินบำนาญปกติ (บาท)'] || row['เงินบำนาญปกติ'] || 0);

          return {
            id: `PEN-IMP-${Date.now()}-${i + 1}`,
            code: row['รหัสบำนาญ'] || `บน-2570-${String(pensionersData.length + i + 1).padStart(3, '0')}`,
            title: row['คำนำหน้า'] || 'นาย',
            firstName: row['ชื่อ'] || `ผู้รับบำนาญที่ ${i + 1}`,
            lastName: row['นามสกุล'] || '',
            idCard: String(row['เลขบัตรประชาชน'] || '3440100000000').replace(/[^0-9]/g, ''),
            formerPosition: row['ตำแหน่งเดิม'] || 'ข้าราชการส่วนท้องถิ่น',
            birthDate: row['วันเกิด (YYYY-MM-DD)'] || '1961-01-01',
            age: ageVal,
            ageGroup: ageG,
            isAlive: !isD,
            deathDate: row['วันที่ถึงแก่กรรม (YYYY-MM-DD ถ้ามี)'] || row['วันที่ถึงแก่กรรม'] || undefined,
            heirName:
              row['ชื่อทายาทผู้มีสิทธิรับบำเหน็จตกทอด'] ||
              row['ชื่อทายาท'] ||
              undefined,
            heirRelation: row['ความสัมพันธ์'] || undefined,
            heirPercentage: row['เปอร์เซ็นต์บำเหน็จตกทอด (%)'] !== undefined
              ? Number(String(row['เปอร์เซ็นต์บำเหน็จตกทอด (%)']).replace('%', ''))
              : 100,
            heirPhone: row['เบอร์โทรศัพท์ทายาท'] || undefined,
            heirs: row['ชื่อทายาทผู้มีสิทธิรับบำเหน็จตกทอด']
              ? [
                  {
                    id: `h-imp-${Date.now()}-${i + 1}`,
                    name: row['ชื่อทายาทผู้มีสิทธิรับบำเหน็จตกทอด'],
                    relation: row['ความสัมพันธ์'] || 'คู่สมรส',
                    percentage: Number(String(row['เปอร์เซ็นต์บำเหน็จตกทอด (%)'] || '100').replace('%', '')),
                    phone: row['เบอร์โทรศัพท์ทายาท'] || '',
                  },
                ]
              : undefined,
            special3xHeirName: row['ทายาทผู้มีสิทธิรับเงินช่วยพิเศษ 3 เท่า'] || undefined,
            special3xAmount: row['เงินช่วยพิเศษ 3 เท่า (บาท)']
              ? Number(row['เงินช่วยพิเศษ 3 เท่า (บาท)'])
              : regularPensionVal * 3,
            special3xRelation: row['ความสัมพันธ์ (เงินช่วยพิเศษ 3 เท่า)'] || undefined,
            special3xPhone: row['เบอร์โทรศัพท์ (เงินช่วยพิเศษ 3 เท่า)'] || undefined,
            isVerified: isVer,
            verifiedDate: row['วันที่ยืนยัน (YYYY-MM-DD)'] || row['วันที่ยืนยัน'] || undefined,
            verificationChannel: row['ช่องทาง (ยืนยันตัวตนออนไลน์/แสดงตนที่กองคลัง)'] || row['ช่องทางยืนยัน'] || undefined,
            regularPension: regularPensionVal,
            livingGratuityInstallment1: inst1,
            livingGratuityInstallment2: inst2,
            livingGratuityInstallment3: inst3,
            livingGratuity: totalLiving,
            livingGratuityStatus:
              ageVal >= 70
                ? 'eligible_70'
                : ageVal >= 65
                ? 'eligible_65'
                : ageVal >= 60
                ? 'eligible_60'
                : 'claimed',
            bonus25Total: total25,
            bonus25Budget: budget25,
            bonus25Deposit: deposit25,
            chkbAmount: Number(row['เงิน ช.ค.บ. (บาท)'] || row['เงิน ช.ค.บ.'] || 0),
            recordedBy: currentSession.username,
            updatedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          };
        });
        onImportPensioners(parsed, importMode);
        setImportStatus({
          type: 'success',
          message: `นำเข้าข้อมูลทะเบียนข้าราชการบำนาญเรียบร้อยแล้ว จำนวน ${formatNumber(parsed.length)} ราย (${
            importMode === 'append' ? 'เพิ่มต่อท้าย' : 'แทนที่ข้อมูลเดิม'
          })`,
        });
      } else if (importCategory === 'gratuity') {
        const parsed: GratuityRecipientRecord[] = rawRows.map((row: any, i: number) => {
          const salary = Number(
            row['เงินเดือนที่ได้รับครั้งสุดท้าย (บาท)'] ||
              row['เงินเดือนที่ได้รับครั้งสุดท้าย'] ||
              row['เงินเดือนครั้งสุดท้าย'] ||
              0
          );
          const years = Number(row['อายุราชการ (ปี)'] || row['อายุราชการ'] || 0);
          const months = Number(row['อายุราชการ (เดือน)'] || 0);
          const calculatedGratuity = Math.round(salary * years);
          const explicitGratuity = Number(row['ยอดเงินบำเหน็จ (คำนวณ) (บาท)'] || row['ยอดเงินบำเหน็จ'] || 0);

          const isD =
            (row['สถานะการมีชีวิต (มีชีวิต/ถึงแก่กรรม)'] || row['สถานะการมีชีวิต'] || row['สถานะชีวิต'] || '').includes('ถึงแก่กรรม') ||
            (row['สถานะการมีชีวิต'] || row['สถานะชีวิต'] || '').includes('เสียชีวิต');

          const isVer =
            (row['สถานะการยืนยันตัวตน (ยืนยันแล้ว/ยังไม่ยืนยัน)'] ||
              row['สถานะการยืนยันตัวตน'] ||
              row['สถานะการยืนยัน'] ||
              '').includes('ยืนยันแล้ว') ||
            (row['สถานะการยืนยัน'] || '').includes('แล้ว');

          return {
            id: `GRAT-IMP-${Date.now()}-${i + 1}`,
            code: row['รหัสบำเหน็จ'] || `เหน็จ-2570-${String(gratuityData.length + i + 1).padStart(3, '0')}`,
            title: row['คำนำหน้า'] || 'นาย',
            firstName: row['ชื่อ'] || `ผู้รับบำเหน็จที่ ${i + 1}`,
            lastName: row['นามสกุล'] || '',
            idCard: String(row['เลขบัตรประชาชน'] || '3440100000000').replace(/[^0-9]/g, ''),
            formerPosition: row['ตำแหน่งเดิม'] || 'ข้าราชการส่วนท้องถิ่น',
            department: row['สังกัด/กอง'] || 'เทศบาลเมืองมหาสารคาม',
            lastSalary: salary,
            serviceYears: years,
            serviceMonths: months,
            gratuityAmount: explicitGratuity > 0 ? explicitGratuity : calculatedGratuity,
            isAlive: !isD,
            deathDate: isD ? row['วันที่ถึงแก่กรรม (YYYY-MM-DD ถ้ามี)'] || row['วันที่ถึงแก่กรรม'] || '' : undefined,
            isVerified: isVer,
            verifiedDate: isVer ? row['วันที่ยืนยัน (YYYY-MM-DD)'] || row['วันที่ยืนยัน'] || new Date().toISOString().split('T')[0] : undefined,
            verificationChannel: isVer ? row['ช่องทางการยืนยัน (ยืนยันตัวตนออนไลน์/แสดงตนที่กองคลัง)'] || row['ช่องทางการยืนยัน'] || 'ยืนยันตัวตนออนไลน์' : undefined,
            heirName: row['ชื่อทายาทผู้มีสิทธิรับบำเหน็จตกทอด'] || row['ชื่อทายาท'] || '',
            heirRelation: row['ความสัมพันธ์'] || '',
            heirPercentage: Number(String(row['สัดส่วนบำเหน็จตกทอด (%)'] || row['สัดส่วน'] || '100').replace('%', '')),
            heirPhone: row['เบอร์โทรศัพท์ทายาท'] || '',
            paymentDate: row['วันที่จ่ายเงิน (YYYY-MM-DD)'] || row['วันที่จ่ายเงิน'] || '',
            note: row['หมายเหตุ'] || '',
            recordedBy: currentSession.username,
            updatedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          };
        });
        onImportGratuity(parsed, importMode);
        setImportStatus({
          type: 'success',
          message: `นำเข้าข้อมูลรายงานผู้รับบำเหน็จ & คำนวณเงิน เรียบร้อยแล้ว จำนวน ${formatNumber(parsed.length)} ราย (${
            importMode === 'append' ? 'เพิ่มต่อท้าย' : 'แทนที่ข้อมูลเดิม'
          })`,
        });
      }
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: `เกิดข้อผิดพลาดในการนำเข้าไฟล์: ${err.message || 'โปรดตรวจสอบรูปแบบไฟล์'}`,
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-7 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                ปีงบประมาณ 2570
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                อัพเดทตรงกับฐานข้อมูลอัตโนมัติ
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Excel (.xlsx) เต็มรูปแบบ
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ระบบดาวน์โหลดและนำเข้าข้อมูลเป็น Excel (.xlsx)
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              เทศบาลเมืองมหาสารคาม • ดาวน์โหลดรายงานทั้งเล่มสมบูรณ์ หรือเลือกดาวน์โหลดแยกตารางตามหมวดหมู่
              พร้อม Template สำเร็จรูปมาตรฐานสำหรับกรอกและนำเข้าข้อมูล (.xlsx) ที่อัปเดตตรงกับระบบข้อมูลล่าสุด
            </p>
          </div>

          <button
            onClick={handleExportAll}
            className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลดทั้งเล่มทุกชีต (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Section 1: Template สำเร็จรูปสำหรับกรอกและนำเข้าข้อมูล (.xlsx) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileDown className="w-4 h-4 text-emerald-700" />
              Template สำเร็จรูปสำหรับกรอกและนำเข้าข้อมูล (.xlsx)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ไฟล์ Excel (.xlsx) แม่แบบที่มีหัวคอลัมน์มาตรฐานครบถ้วน พร้อมตัวอย่างข้อมูลจริง สามารถดาวน์โหลดไปกรอกแล้วอัปโหลดกลับเข้าสู่ระบบได้ทันที
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            อัปเดตตามโครงสร้าง 2570
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Pensioner Template */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <Users className="w-4 h-4 text-blue-700" />
                Template ทะเบียนข้าราชการบำนาญ
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                คอลัมน์ครบถ้วน: ข้อมูลบุคคล, บำนาญปกติ, บำเหน็จดำรงชีพ 3 งวด, เงินเพิ่ม 25%, ทายาท, เงินช่วยพิเศษ 3 เท่า
              </p>
            </div>
            <button
              onClick={() => downloadTemplate('pensioner')}
              className="mt-3.5 w-full py-2 px-3 bg-white hover:bg-blue-700 hover:text-white text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด Template (.xlsx)</span>
            </button>
          </div>

          {/* 2. Gratuity Template */}
          <div className="p-4 rounded-xl border border-emerald-200 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-950">
                <Banknote className="w-4 h-4 text-emerald-700" />
                Template ผู้รับบำเหน็จ & คำนวณเงิน
              </div>
              <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                คอลัมน์: เงินเดือนครั้งสุดท้าย, อายุราชการ, คำนวณบำเหน็จก้อนเดียวอัตโนมัติ, สถานะชีวิต, ทายาท, วันที่จ่าย
              </p>
            </div>
            <button
              onClick={() => downloadTemplate('gratuity')}
              className="mt-3.5 w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด Template (.xlsx)</span>
            </button>
          </div>

          {/* 3. E-Office Template */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <FileText className="w-4 h-4 text-blue-800" />
                Template E-Office บริหารงานทั่วไป
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                คอลัมน์: วันที่, ประเภท (in/out การรับ-การส่งหนังสือ), จำนวนเรื่อง, เลขที่หนังสือ, เรื่องสำคัญ, หน่วยงาน
              </p>
            </div>
            <button
              onClick={() => downloadTemplate('eoffice')}
              className="mt-3.5 w-full py-2 px-3 bg-white hover:bg-slate-900 hover:text-white text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด Template (.xlsx)</span>
            </button>
          </div>

          {/* 4. CHKB & GBT Templates */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <Wallet className="w-4 h-4 text-amber-700" />
                Template ช.ค.บ. และ ก.บ.ท.
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                คอลัมน์: วันที่, แหล่งที่มา/รายละเอียดจ่าย, รับเงินจำนวน, จ่ายไปเท่าไหร่, จำนวนราย, หมายเหตุ
              </p>
            </div>
            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <button
                onClick={() => downloadTemplate('chkb')}
                className="py-1.5 px-2 bg-white hover:bg-emerald-700 hover:text-white text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Template ช.ค.บ."
              >
                <Download className="w-3 h-3" />
                <span>ช.ค.บ.</span>
              </button>
              <button
                onClick={() => downloadTemplate('gbt')}
                className="py-1.5 px-2 bg-white hover:bg-blue-800 hover:text-white text-blue-800 border border-blue-300 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Template ก.บ.ท."
              >
                <Download className="w-3 h-3" />
                <span>ก.บ.ท.</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: เลือกดาวน์โหลดแยกตารางตามหมวดหมู่ (.xlsx) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-emerald-700" />
              เลือกดาวน์โหลดแยกตารางตามหมวดหมู่ (.xlsx) (อัพเดทให้ตรงกับข้อมูลจริง)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              กดดาวน์โหลดตารางข้อมูลเฉพาะหมวดที่ต้องการ ข้อมูลจะถูกดึงจากฐานข้อมูลล่าสุดแบบ Real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              สถานะ: ข้อมูลตรงกับฐานข้อมูลระบบ
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Category 1: ทะเบียนข้าราชการบำนาญทั้งหมด */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-700" />
                1. ทะเบียนข้าราชการบำนาญทั้งหมด
              </div>
              <div className="text-[11px] text-slate-500">
                ข้อมูลปัจจุบัน: <strong className="text-blue-700">{formatNumber(pensionersData.length)}</strong> ราย
              </div>
              <div className="text-[10px] text-slate-400">
                มีชีวิต {formatNumber(livingPensioners.length)} | ถึงแก่กรรม {formatNumber(deceasedPensioners.length)}
              </div>
            </div>
            <button
              onClick={() => exportPensionersToExcel(pensionersData)}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-semibold transition-all border border-blue-200 flex items-center gap-1 cursor-pointer shrink-0"
              title="ดาวน์โหลดทะเบียนข้าราชการบำนาญ"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>

          {/* Category 2: รายงานผู้รับบำเหน็จ & คำนวณเงิน */}
          <div className="p-4 rounded-xl border border-emerald-200 hover:border-emerald-400 bg-emerald-50/20 hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-700" />
                2. รายงานผู้รับบำเหน็จ & คำนวณเงิน
              </div>
              <div className="text-[11px] text-emerald-800 font-semibold">
                {formatNumber(gratuityData.length)} ราย • รวม {formatCurrency(totalGratuityAmount)} บาท
              </div>
              <div className="text-[10px] text-slate-400">
                สูตร: เงินเดือนสุดท้าย × อายุราชการ
              </div>
            </div>
            <button
              onClick={() => exportGratuityToExcel(gratuityData)}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
              title="ดาวน์โหลดรายงานผู้รับบำเหน็จ"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>

          {/* Category 3: E-Office บริหารงานทั่วไป */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-800" />
                3. E-Office บริหารงานทั่วไป
              </div>
              <div className="text-[11px] text-slate-600">
                รับ: <strong className="text-blue-800">{formatNumber(eOfficeInCount)}</strong> | ส่งออก: <strong className="text-indigo-800">{formatNumber(eOfficeOutCount)}</strong> เรื่อง
              </div>
              <div className="text-[10px] text-slate-400">
                รวมทั้งหมด {formatNumber(eOfficeInCount + eOfficeOutCount)} เรื่อง
              </div>
            </div>
            <button
              onClick={() => exportEOfficeToExcel(eOfficeData)}
              className="px-3 py-2 bg-slate-100 hover:bg-blue-800 text-slate-700 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-200 flex items-center gap-1 cursor-pointer shrink-0"
              title="ดาวน์โหลดชีต E-Office"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>

          {/* Category 4: ทะเบียน ช.ค.บ. */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-700" />
                4. ทะเบียน ช.ค.บ.
              </div>
              <div className="text-[11px] text-emerald-800 font-semibold">
                คงเหลือสุทธิ: {formatCurrency(chkbNet)} บาท
              </div>
              <div className="text-[10px] text-slate-400">
                รับ {formatCurrency(chkbTotalReceived)} | จ่าย {formatCurrency(chkbTotalPaid)}
              </div>
            </div>
            <button
              onClick={() => exportChkbToExcel(chkbData)}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white rounded-xl text-xs font-semibold transition-all border border-emerald-200 flex items-center gap-1 cursor-pointer shrink-0"
              title="ดาวน์โหลดทะเบียน ช.ค.บ."
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>

          {/* Category 5: ทะเบียน ก.บ.ท. */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-blue-700" />
                5. ทะเบียน ก.บ.ท.
              </div>
              <div className="text-[11px] text-blue-800 font-semibold">
                คงเหลือสุทธิ: {formatCurrency(gbtNet)} บาท
              </div>
              <div className="text-[10px] text-slate-400">
                รับ {formatCurrency(gbtTotalReceived)} | จ่าย {formatCurrency(gbtTotalPaid)}
              </div>
            </div>
            <button
              onClick={() => exportGbtToExcel(gbtData)}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-800 text-blue-800 hover:text-white rounded-xl text-xs font-semibold transition-all border border-blue-200 flex items-center gap-1 cursor-pointer shrink-0"
              title="ดาวน์โหลดทะเบียน ก.บ.ท."
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>

          {/* Category 6: บำเหน็จดำรงชีพ 3 งวด */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 bg-white hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-700" />
                6. บำเหน็จดำรงชีพ 3 งวด (60/65/70 ปี)
              </div>
              <div className="text-[11px] text-teal-800 font-semibold">
                ผู้มีสิทธิ: {formatNumber(livingGratuityCount)} ราย
              </div>
              <div className="text-[10px] text-slate-400">
                แยกงวดที่ 1, งวดที่ 2, งวดที่ 3 ชัดเจน
              </div>
            </div>
            <button
              onClick={() => exportLivingGratuityToExcel(pensionersData)}
              className="px-3 py-2 bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white rounded-xl text-xs font-semibold transition-all border border-teal-200 flex items-center gap-1 cursor-pointer shrink-0"
              title="ดาวน์โหลดรายงานบำเหน็จดำรงชีพ 3 งวด"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>

          {/* Category 7: เงินเพิ่ม 25% จากงบประมาณ */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-700" />
                7. เงินเพิ่ม 25% (จากงบประมาณ)
              </div>
              <div className="text-[11px] text-indigo-800 font-semibold">
                จำนวนผู้รับสิทธิ: {formatNumber(bonusBudgetCount)} ราย
              </div>
              <div className="text-[10px] text-slate-400">
                หมวดงบประมาณเทศบาลเมืองมหาสารคาม
              </div>
            </div>
            <button
              onClick={() => exportBonus25BudgetToExcel(pensionersData)}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-700 text-indigo-800 hover:text-white rounded-xl text-xs font-semibold transition-all border border-indigo-200 flex items-center gap-1 cursor-pointer shrink-0"
              title="ดาวน์โหลดเงินเพิ่ม 25% จากงบประมาณ"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>

          {/* Category 8: เงินเพิ่ม 25% เงินรับฝาก */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 bg-white hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-700" />
                8. เงินเพิ่ม 25% (เงินรับฝาก)
              </div>
              <div className="text-[11px] text-amber-800 font-semibold">
                จำนวนผู้รับสิทธิ: {formatNumber(bonusDepositCount)} ราย
              </div>
              <div className="text-[10px] text-slate-400">
                หมวดเงินรับฝาก ช.ค.บ.
              </div>
            </div>
            <button
              onClick={() => exportBonus25DepositToExcel(pensionersData)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-700 text-amber-900 hover:text-white rounded-xl text-xs font-semibold transition-all border border-amber-200 flex items-center gap-1 cursor-pointer shrink-0"
              title="ดาวน์โหลดเงินเพิ่ม 25% เงินรับฝาก"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>

          {/* Category 9: ทายาทบำเหน็จตกทอด & เงินช่วยพิเศษ 3 เท่า */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-rose-400 bg-white hover:shadow-2xs transition-all flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-rose-700" />
                9. ทายาทบำเหน็จตกทอด & 3 เท่า
              </div>
              <div className="text-[11px] text-rose-800 font-semibold">
                ถึงแก่กรรม: {formatNumber(deceasedPensioners.length)} ราย
              </div>
              <div className="text-[10px] text-slate-400">
                สิทธิเงินช่วยพิเศษ 3 เท่า และเปอร์เซ็นต์ทายาท
              </div>
            </div>
            <button
              onClick={() => exportDeceasedHeirsToExcel(pensionersData)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-700 text-rose-800 hover:text-white rounded-xl text-xs font-semibold transition-all border border-rose-200 flex items-center gap-1 cursor-pointer shrink-0"
              title="ดาวน์โหลดทะเบียนทายาทและสิทธิ 3 เท่า"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: ระบบนำเข้าข้อมูลจากไฟล์ Excel (.xlsx, .xls, .csv) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-700" />
              นำเข้าข้อมูลจากไฟล์ Excel (.xlsx, .xls, .csv)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              นำเข้าข้อมูลจากตาราง Excel หรือ Template มาตรฐาน สามารถเลือกเพิ่มต่อท้ายหรือแทนที่ข้อมูลเดิมได้
            </p>
          </div>
          {!canImport ? (
            <span className="text-xs text-amber-800 bg-amber-50 px-3 py-1 rounded-full font-medium border border-amber-200">
              เฉพาะสิทธิ์เจ้าหน้าที่ (User, User1, User2) เท่านั้นที่นำเข้าข้อมูลได้
            </span>
          ) : (
            <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full font-medium border border-emerald-200">
              พร้อมนำเข้าข้อมูลโดย {currentSession.username}
            </span>
          )}
        </div>

        {importStatus && (
          <div
            className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs animate-in fade-in ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed font-medium">{importStatus.message}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. เลือกหมวดข้อมูลที่ต้องการนำเข้า
            </label>
            <select
              value={importCategory}
              disabled={!canImport}
              onChange={(e) => setImportCategory(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
            >
              <option value="pensioner">ทะเบียนข้าราชการบำนาญ (พร้อมเงินบำนาญ/บำเหน็จ/เงินเพิ่ม 25%/ทายาท)</option>
              <option value="gratuity">รายงานผู้รับบำเหน็จ & ระบบคำนวณเงิน (เงินเดือนครั้งสุดท้าย × อายุราชการ)</option>
              <option value="eoffice">ข้อมูลหนังสือ E-Office ฝ่ายบริหารงานทั่วไป (รับหนังสือ / ส่งหนังสือออก)</option>
              <option value="chkb">ทะเบียนเงินช่วยค่าครองชีพผู้รับเบี้ยหวัดบำนาญ (ช.ค.บ.)</option>
              <option value="gbt">ทะเบียนกองทุนบำเหน็จบำนาญข้าราชการส่วนท้องถิ่น (ก.บ.ท.)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              2. โหมดการนำเข้าข้อมูล
            </label>
            <div className="flex items-center gap-5 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  disabled={!canImport}
                  onChange={() => setImportMode('append')}
                  className="text-blue-600"
                />
                <span>เพิ่มต่อท้าย (Append)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-rose-800 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  disabled={!canImport}
                  onChange={() => setImportMode('replace')}
                  className="text-rose-600"
                />
                <span>แทนที่ข้อมูลเดิม (Replace)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Upload Trigger Area */}
        <div className="pt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            disabled={!canImport || isProcessing}
            onChange={handleFileChange}
            className="hidden"
            id="excel-file-upload"
          />
          <label
            htmlFor="excel-file-upload"
            className={`flex flex-col items-center justify-center p-7 border-2 border-dashed rounded-2xl transition-all ${
              canImport
                ? 'border-blue-300 hover:border-blue-600 hover:bg-blue-50/50 cursor-pointer bg-slate-50'
                : 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
            }`}
          >
            <Upload className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-xs font-bold text-slate-800">
              {isProcessing ? 'กำลังประมวลผลไฟล์...' : 'คลิกเพื่อเลือกไฟล์ .xlsx, .xls หรือ .csv เพื่อนำเข้าข้อมูล'}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              ระบบจะแปลงหัวคอลัมน์ภาษาไทย จัดรูปแบบตัวเลข และบันทึกลงฐานข้อมูลเทศบาลเมืองมหาสารคามทันที
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
