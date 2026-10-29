import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Building2,
  FileCheck2,
} from 'lucide-react';
import { EOfficeRecord, FinancialFundRecord, PensionerRecord, GratuityRecipientRecord, UserSession } from '../types';
import { formatCurrency, formatNumber, formatThaiDate } from '../utils/formatters';
import { downloadOfficialMemoAsWord } from '../utils/wordExport';

interface OfficialMemoViewProps {
  currentSession: UserSession;
  eOfficeData: EOfficeRecord[];
  chkbData: FinancialFundRecord[];
  gbtData: FinancialFundRecord[];
  pensionersData: PensionerRecord[];
  gratuityData: GratuityRecipientRecord[];
}

export function OfficialMemoView({
  currentSession,
  eOfficeData,
  chkbData,
  gbtData,
  pensionersData,
  gratuityData,
}: OfficialMemoViewProps) {
  const [memoDate, setMemoDate] = useState('2026-10-21');

  // Statistics (เฉพาะการรับหนังสือ และการส่งหนังสือออก)
  const eOfficeIn = eOfficeData.filter((d) => d.type === 'in').reduce((s, d) => s + (d.quantity || 1), 0);
  const eOfficeOut = eOfficeData.filter((d) => d.type === 'out').reduce((s, d) => s + (d.quantity || 1), 0);

  const chkbTotalReceived = chkbData.reduce((s, r) => s + r.receivedAmount, 0);
  const chkbTotalPaid = chkbData.reduce((s, r) => s + r.paidAmount, 0);
  const chkbBalance = chkbTotalReceived - chkbTotalPaid;

  const gbtTotalReceived = gbtData.reduce((s, r) => s + r.receivedAmount, 0);
  const gbtTotalPaid = gbtData.reduce((s, r) => s + r.paidAmount, 0);
  const gbtBalance = gbtTotalReceived - gbtTotalPaid;

  const totalPensioners = pensionersData.length;
  const livingPensioners = pensionersData.filter((p) => p.isAlive);
  const verifiedCount = livingPensioners.filter((p) => p.isVerified).length;
  const verifiedOnline = livingPensioners.filter(
    (p) => p.isVerified && p.verificationChannel === 'ยืนยันตัวตนออนไลน์'
  ).length;
  const verifiedInPerson = livingPensioners.filter(
    (p) => p.isVerified && p.verificationChannel === 'แสดงตนที่กองคลัง'
  ).length;
  const unverifiedCount = livingPensioners.filter((p) => !p.isVerified).length;
  const deceasedCount = pensionersData.filter((p) => !p.isAlive).length;

  // 4 Special Categories
  const regularPensionTotal = livingPensioners.reduce((s, p) => s + (p.regularPension || 0), 0);
  const livingGratuityCount = livingPensioners.filter((p) => (p.livingGratuity || 0) > 0).length;
  const livingGratuityTotal = livingPensioners.reduce((s, p) => s + (p.livingGratuity || 0), 0);

  const bonus25Count = livingPensioners.filter((p) => (p.bonus25Total || 0) > 0).length;
  const bonus25Budget = livingPensioners.reduce((s, p) => s + (p.bonus25Budget || 0), 0);
  const bonus25Deposit = livingPensioners.reduce((s, p) => s + (p.bonus25Deposit || 0), 0);
  const bonus25BudgetCount = livingPensioners.filter((p) => (p.bonus25Budget || 0) > 0).length;
  const bonus25DepositCount = livingPensioners.filter((p) => (p.bonus25Deposit || 0) > 0).length;

  const age60Count = livingPensioners.filter((p) => p.age === 60 || p.ageGroup === '60').length;
  const age65Count = livingPensioners.filter((p) => p.age === 65 || p.ageGroup === '65').length;
  const age70Count = livingPensioners.filter((p) => p.age === 70 || p.ageGroup === '70').length;

  // Gratuity Statistics
  const gratuityTotalCount = gratuityData.length;
  const gratuityLiving = gratuityData.filter((g) => g.isAlive);
  const gratuityDeceased = gratuityData.filter((g) => !g.isAlive);
  const gratuityVerified = gratuityLiving.filter((g) => g.isVerified).length;
  const gratuityUnverified = gratuityLiving.filter((g) => !g.isVerified).length;
  const totalGratuityCalculated = gratuityData.reduce(
    (s, g) => s + (g.gratuityAmount || Math.round((g.lastSalary || 0) * (g.serviceYears || 0)) || 0),
    0
  );
  const gratuityVerifiedAmount = gratuityLiving
    .filter((g) => g.isVerified)
    .reduce((s, g) => s + (g.gratuityAmount || Math.round((g.lastSalary || 0) * (g.serviceYears || 0)) || 0), 0);
  const gratuityUnverifiedAmount = gratuityLiving
    .filter((g) => !g.isVerified)
    .reduce((s, g) => s + (g.gratuityAmount || Math.round((g.lastSalary || 0) * (g.serviceYears || 0)) || 0), 0);
  const gratuityDeceasedAmount = gratuityDeceased.reduce(
    (s, g) => s + (g.gratuityAmount || Math.round((g.lastSalary || 0) * (g.serviceYears || 0)) || 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    downloadOfficialMemoAsWord(eOfficeData, chkbData, gbtData, pensionersData, memoDate, gratuityData);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden when printing) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-1 border border-slate-200">
            <FileText className="w-3.5 h-3.5 text-blue-700" />
            แบบรายงานทางการราชการ (Official Memorandum)
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            บันทึกข้อความราชการ เทศบาลเมืองมหาสารคาม
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            โครงสร้างระเบียบงานสารบรรณ เนื้อหา ๔ ส่วนงาน และช่องลงนาม 3 ตำแหน่ง (ไม่ต้องใส่ชื่อบุคคล)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">วันที่ออกหนังสือ:</span>
            <input
              type="date"
              value={memoDate}
              onChange={(e) => setMemoDate(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs"
            />
          </div>

          <button
            onClick={handleDownloadWord}
            className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
            title="ดาวน์โหลดเป็นไฟล์ Microsoft Word (.doc)"
          >
            <Download className="w-4 h-4 text-amber-300" />
            ดาวน์โหลดเป็นไฟล์ Word (.doc)
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
            title="สั่งพิมพ์หรือบันทึกเป็น PDF"
          >
            <Printer className="w-4 h-4" />
            พิมพ์รายงาน / บันทึก PDF
          </button>
        </div>
      </div>

      {/* Official Government Memorandum Paper Layout */}
      <div className="bg-slate-200/60 p-4 sm:p-8 rounded-2xl flex justify-center overflow-x-auto">
        <div
          id="official-memo-print-area"
          className="bg-white shadow-xl rounded-sm p-8 sm:p-14 max-w-[210mm] w-full text-black font-sarabun text-[15px] sm:text-[16px] leading-relaxed border border-slate-200 print:border-none print:shadow-none print:p-0"
        >
          {/* Header 'บันทึกข้อความ' (ไม่มีโลโก้) */}
          <div className="relative mb-6 pb-2">
            <div className="text-center pt-2 pb-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-widest text-slate-950">
                บันทึกข้อความ
              </h1>
            </div>

            {/* Official Header Meta */}
            <div className="mt-4 space-y-1.5 border-b border-black pb-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold whitespace-nowrap">ส่วนราชการ</span>
                  <span>เทศบาลเมืองมหาสารคาม กองคลัง โทร. 043-711-423</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold whitespace-nowrap">ที่</span>
                  <span className="font-mono">มค 52004/ว 2570</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold whitespace-nowrap">วันที่</span>
                  <span>{formatThaiDate(memoDate, true)}</span>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="font-bold whitespace-nowrap">เรื่อง</span>
                <span className="font-medium">
                  รายงานผลการดำเนินงานระบบ E-Office กองทุน ช.ค.บ., ก.บ.ท. และสถิติข้าราชการบำนาญ ปีงบประมาณ 2570
                </span>
              </div>
            </div>
          </div>

          {/* Salutation */}
          <div className="mb-4">
            <span className="font-bold">เรียน</span> นายกเทศมนตรีเมืองมหาสารคาม
          </div>

          {/* Opening Paragraph */}
          <p className="indent-10 text-justify mb-4">
            ตามที่เทศบาลเมืองมหาสารคาม ได้ดำเนินงานบริหารจัดการงานสารบรรณอิเล็กทรอนิกส์ (E-Office)
            การบริหารเงินช่วยค่าครองชีพผู้รับเบี้ยหวัดบำนาญ (ช.ค.บ.) และกองทุนบำเหน็จบำนาญข้าราชการส่วนท้องถิ่น (ก.บ.ท.)
            ตลอดจนการติดตามและดูแลสิทธิประโยชน์ของข้าราชการบำนาญ ประจำปีงบประมาณ 2570 นั้น
          </p>

          <p className="indent-10 text-justify mb-4">
            กองคลัง ร่วมกับฝ่ายบริหารงานทั่วไป ขอรายงานผลการดำเนินงานและสถิติข้อมูลสำคัญ สรุปตามโครงสร้าง ๔ ส่วนงาน ดังนี้
          </p>

          {/* ส่วนที่ ๑ */}
          <div className="mb-5">
            <h3 className="font-bold indent-6 mb-2 text-slate-950">
              ส่วนที่ ๑ สรุปการใช้งานระบบ E-Office ฝ่ายบริหารงานทั่วไป
            </h3>
            <p className="indent-10 text-justify mb-2 text-sm">
              ได้ดำเนินการบริหารงานสารบรรณประจำวันผ่านระบบอิเล็กทรอนิกส์ มีรายละเอียดการรับหนังสือ และการส่งหนังสือออก ดังนี้:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse border border-black my-2">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black p-2 w-12 text-center">ลำดับ</th>
                    <th className="border border-black p-2 text-left">ประเภทการดำเนินงาน E-Office</th>
                    <th className="border border-black p-2 text-center w-36">จำนวน (เรื่อง)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 text-center font-mono">1</td>
                    <td className="border border-black p-2">การรับหนังสือ (เรื่อง)</td>
                    <td className="border border-black p-2 text-center font-bold font-mono">
                      {formatNumber(eOfficeIn)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 text-center font-mono">2</td>
                    <td className="border border-black p-2">การส่งหนังสือออก (เรื่อง)</td>
                    <td className="border border-black p-2 text-center font-bold font-mono">
                      {formatNumber(eOfficeOut)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="border border-black p-2 text-center">
                      รวมปริมาณงานหนังสือราชการทั้งสิ้น
                    </td>
                    <td className="border border-black p-2 text-center font-mono">
                      {formatNumber(eOfficeIn + eOfficeOut)} เรื่อง
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ส่วนที่ ๒ */}
          <div className="mb-5">
            <h3 className="font-bold indent-6 mb-2 text-slate-950">
              ส่วนที่ ๒ สรุปสถานะการเงินกองทุน ช.ค.บ. และ ก.บ.ท.
            </h3>
            <p className="indent-10 text-justify mb-2 text-sm">
              สรุปยอดรับเงิน ยอดจ่ายเงิน และยอดคงเหลือสุทธิของกองทุนช่วยเหลือและสิทธิประโยชน์ มีรายละเอียดดังนี้:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse border border-black my-2">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black p-2 text-left">รายการกองทุน</th>
                    <th className="border border-black p-2 text-right">รับเงินรวม (บาท)</th>
                    <th className="border border-black p-2 text-right">จ่ายไปรวม (บาท)</th>
                    <th className="border border-black p-2 text-right font-bold">คงเหลือสุทธิ (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-medium">
                      1. เงินช่วยค่าครองชีพผู้รับเบี้ยหวัดบำนาญ (ช.ค.บ.)
                    </td>
                    <td className="border border-black p-2 text-right font-mono">
                      {formatCurrency(chkbTotalReceived)}
                    </td>
                    <td className="border border-black p-2 text-right font-mono">
                      {formatCurrency(chkbTotalPaid)}
                    </td>
                    <td className="border border-black p-2 text-right font-mono font-bold bg-slate-50">
                      {formatCurrency(chkbBalance)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-medium">
                      2. กองทุนบำเหน็จบำนาญข้าราชการส่วนท้องถิ่น (ก.บ.ท.)
                    </td>
                    <td className="border border-black p-2 text-right font-mono">
                      {formatCurrency(gbtTotalReceived)}
                    </td>
                    <td className="border border-black p-2 text-right font-mono">
                      {formatCurrency(gbtTotalPaid)}
                    </td>
                    <td className="border border-black p-2 text-right font-mono font-bold bg-slate-50">
                      {formatCurrency(gbtBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ส่วนที่ ๓ */}
          <div className="mb-5">
            <h3 className="font-bold indent-6 mb-2 text-slate-950">
              ส่วนที่ ๓ รายงานจำนวนผู้รับบำนาญและการยืนยันตัวตน ปีงบประมาณ 2570
            </h3>
            <p className="indent-10 text-justify mb-2 text-sm">
              ข้าราชการบำนาญทั้งหมด {formatNumber(totalPensioners)} ราย (มีชีวิต {formatNumber(livingPensioners.length)} ราย, ถึงแก่กรรม {formatNumber(deceasedCount)} ราย)
              ผลการแสดงตนเพื่อรับเงินบำนาญ สรุปได้ดังนี้:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse border border-black my-2">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black p-2 text-left">สถานะการยืนยันตัวตน</th>
                    <th className="border border-black p-2 text-center w-28">จำนวน (ราย)</th>
                    <th className="border border-black p-2 text-center w-28">ร้อยละ</th>
                    <th className="border border-black p-2 text-left">รายละเอียดช่องทาง</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-medium">1. ยืนยันตัวตนแล้ว</td>
                    <td className="border border-black p-2 text-center font-bold font-mono">
                      {formatNumber(verifiedCount)}
                    </td>
                    <td className="border border-black p-2 text-center font-mono">
                      {livingPensioners.length
                        ? ((verifiedCount / livingPensioners.length) * 100).toFixed(2)
                        : 0}%
                    </td>
                    <td className="border border-black p-2">
                      ออนไลน์ {formatNumber(verifiedOnline)} ราย / แสดงตนที่กองคลัง {formatNumber(verifiedInPerson)} ราย
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-medium text-rose-900">
                      2. ยังไม่ได้ยืนยันตัวตน
                    </td>
                    <td className="border border-black p-2 text-center font-bold font-mono text-rose-900">
                      {formatNumber(unverifiedCount)}
                    </td>
                    <td className="border border-black p-2 text-center font-mono text-rose-900">
                      {livingPensioners.length
                        ? ((unverifiedCount / livingPensioners.length) * 100).toFixed(2)
                        : 0}%
                    </td>
                    <td className="border border-black p-2 text-slate-600">
                      อยู่ระหว่างส่งหนังสือแจ้งเตือนและติดตามสิทธิ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ส่วนที่ ๔ */}
          <div className="mb-6">
            <h3 className="font-bold indent-6 mb-2 text-slate-950">
              ส่วนที่ ๔ สรุปข้าราชการบำนาญจำแนกประเภทและเกณฑ์อายุ
            </h3>
            <p className="indent-10 text-justify mb-2 text-sm">
              สรุปตัวเลข 4 หมวดหมู่สำคัญ และสถิติตามเกณฑ์อายุ มีรายละเอียดดังนี้:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse border border-black my-2">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black p-2 text-left">หมวดหมู่เฉพาะ</th>
                    <th className="border border-black p-2 text-center w-28">จำนวน (ราย)</th>
                    <th className="border border-black p-2 text-right w-36">จำนวนเงินรวม (บาท)</th>
                    <th className="border border-black p-2 text-left">รายละเอียดแหล่งเงิน / เงื่อนไข</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-medium">1. เงินบำนาญปกติ</td>
                    <td className="border border-black p-2 text-center font-mono">
                      {formatNumber(livingPensioners.length)}
                    </td>
                    <td className="border border-black p-2 text-right font-mono font-bold">
                      {formatCurrency(regularPensionTotal)}
                    </td>
                    <td className="border border-black p-2">ยอดเบิกจ่ายประจำเดือน</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-medium">2. เงินบำเหน็จดำรงชีพ</td>
                    <td className="border border-black p-2 text-center font-mono">
                      {formatNumber(livingGratuityCount)}
                    </td>
                    <td className="border border-black p-2 text-right font-mono font-bold">
                      {formatCurrency(livingGratuityTotal)}
                    </td>
                    <td className="border border-black p-2">
                      ตามเกณฑ์อายุครบ 60 ปี, อายุครบ 65 ปี และอายุครบ 70 ปี
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-medium">3. เงินเพิ่ม 25% (จากงบประมาณ)</td>
                    <td className="border border-black p-2 text-center font-mono">
                      {formatNumber(bonus25BudgetCount)}
                    </td>
                    <td className="border border-black p-2 text-right font-mono font-bold">
                      {formatCurrency(bonus25Budget)}
                    </td>
                    <td className="border border-black p-2 text-xs">
                      เบิกจ่ายจากงบประมาณเทศบาล / เงินอุดหนุน
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-medium">4. ช.ค.บ (งบประมาณ)</td>
                    <td className="border border-black p-2 text-center font-mono">
                      {formatNumber(bonus25DepositCount)}
                    </td>
                    <td className="border border-black p-2 text-right font-mono font-bold">
                      {formatCurrency(bonus25Deposit)}
                    </td>
                    <td className="border border-black p-2 text-xs">
                      เบิกจ่ายจากงบประมาณเงินช่วยค่าครองชีพ ช.ค.บ
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-medium">5. ผู้รับบำนาญเสียชีวิต</td>
                    <td className="border border-black p-2 text-center font-mono font-bold text-rose-900">
                      {formatNumber(deceasedCount)}
                    </td>
                    <td className="border border-black p-2 text-center">-</td>
                    <td className="border border-black p-2">
                      ระบุวันที่ถึงแก่กรรม และบันทึกข้อมูลทายาทผู้มีสิทธิครบถ้วน
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
              <span className="font-bold text-slate-900">สถิติจำแนกกลุ่มอายุตามเงื่อนไขที่กำหนด:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-medium">
                <div>• อายุครบ 60 ปี: <span className="font-bold font-mono">{formatNumber(age60Count)}</span> ราย</div>
                <div>• อายุครบ 65 ปี: <span className="font-bold font-mono">{formatNumber(age65Count)}</span> ราย</div>
                <div>• อายุครบ 70 ปี: <span className="font-bold font-mono">{formatNumber(age70Count)}</span> ราย</div>
              </div>
            </div>
          </div>

          {/* ส่วนที่ ๕ */}
          <div className="mb-6">
            <h3 className="font-bold indent-6 mb-2 text-slate-950">
              ส่วนที่ ๕ สรุปรายงานผู้รับบำเหน็จและระบบคำนวณเงิน
            </h3>
            <p className="indent-10 text-justify mb-2 text-sm">
              ตามระเบียบเงินบำเหน็จลูกจ้างและข้าราชการส่วนท้องถิ่น กำหนดให้คำนวณจาก <span className="font-semibold underline">เงินเดือนที่ได้รับครั้งสุดท้าย × อายุราชการ</span> ผู้รับบำเหน็จในทะเบียนทั้งสิ้น {formatNumber(gratuityTotalCount)} ราย ยอดเงินคำนวณรวมทั้งสิ้น {formatCurrency(totalGratuityCalculated)} บาท มีสถานะการมีชีวิตและการยืนยันตัวตน ดังนี้:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse border border-black my-2">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black p-2 text-left">กลุ่มสถานะผู้รับบำเหน็จ</th>
                    <th className="border border-black p-2 text-center w-28">จำนวน (ราย)</th>
                    <th className="border border-black p-2 text-right w-40">ยอดเงินบำเหน็จรวม (บาท)</th>
                    <th className="border border-black p-2 text-left">รายละเอียดการยืนยันตัวตน / ทายาท</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-medium">1. ผู้รับบำเหน็จมีชีวิต (ยืนยันตัวตนแล้ว)</td>
                    <td className="border border-black p-2 text-center font-mono font-bold text-emerald-900">
                      {formatNumber(gratuityVerified)}
                    </td>
                    <td className="border border-black p-2 text-right font-mono font-bold">
                      {formatCurrency(gratuityVerifiedAmount)}
                    </td>
                    <td className="border border-black p-2">
                      ยืนยันตัวตนและตรวจสอบสิทธิเรียบร้อย พร้อมดำเนินการเบิกจ่าย
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-medium text-amber-900">
                      2. ผู้รับบำเหน็จมีชีวิต (ยังไม่ยืนยันตัวตน)
                    </td>
                    <td className="border border-black p-2 text-center font-mono font-bold text-amber-900">
                      {formatNumber(gratuityUnverified)}
                    </td>
                    <td className="border border-black p-2 text-right font-mono font-bold text-amber-900">
                      {formatCurrency(gratuityUnverifiedAmount)}
                    </td>
                    <td className="border border-black p-2 text-slate-600">
                      อยู่ระหว่างประสานงานให้เข้ายืนยันตัวตนออนไลน์หรือแสดงตน ณ กองคลัง
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-medium text-rose-900">
                      3. ถึงแก่กรรม (บำเหน็จตกทอดแก่ทายาท)
                    </td>
                    <td className="border border-black p-2 text-center font-mono font-bold text-rose-900">
                      {formatNumber(gratuityDeceased.length)}
                    </td>
                    <td className="border border-black p-2 text-right font-mono font-bold text-rose-900">
                      {formatCurrency(gratuityDeceasedAmount)}
                    </td>
                    <td className="border border-black p-2">
                      บันทึกข้อมูลทายาทผู้มีสิทธิรับเงินบำเหน็จตกทอดและสัดส่วนครบถ้วน
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="border border-black p-2 text-center">รวมผู้รับบำเหน็จทั้งสิ้น</td>
                    <td className="border border-black p-2 text-center font-mono font-bold">
                      {formatNumber(gratuityTotalCount)} ราย
                    </td>
                    <td className="border border-black p-2 text-right font-mono font-bold text-emerald-950">
                      {formatCurrency(totalGratuityCalculated)}
                    </td>
                    <td className="border border-black p-2 text-xs">
                      สูตรคำนวณ: เงินเดือนที่ได้รับครั้งสุดท้าย × จำนวนปีอายุราชการ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Concluding Request */}
          <p className="indent-10 text-justify mb-8">
            จึงเรียนมาเพื่อโปรดทราบและพิจารณาอนุมัติ
          </p>

          {/* Official Signature Section (3 Positions, NO PERSONAL NAMES) */}
          <div className="pt-6 border-t border-slate-200 print:border-none break-inside-avoid">
            <div className="grid grid-cols-3 gap-4 text-center text-xs sm:text-sm">
              {/* Position 1: ผู้รายงาน */}
              <div className="flex flex-col items-center">
                <div className="h-10"></div>
                <div className="w-full text-slate-700">ลงชื่อ......................................................</div>
                <div className="mt-2 text-slate-700">(......................................................)</div>
                <div className="font-bold mt-1 text-slate-900">เจ้าหน้าที่ฝ่ายบริหารงานทั่วไป</div>
                <div className="text-slate-600 text-xs mt-0.5">ผู้รายงาน</div>
              </div>

              {/* Position 2: ผู้ตรวจสอบ */}
              <div className="flex flex-col items-center">
                <div className="h-10"></div>
                <div className="w-full text-slate-700">ลงชื่อ......................................................</div>
                <div className="mt-2 text-slate-700">(......................................................)</div>
                <div className="font-bold mt-1 text-slate-900">ผู้อำนวยการกองคลัง</div>
                <div className="text-slate-600 text-xs mt-0.5">ผู้ตรวจสอบ</div>
              </div>

              {/* Position 3: ผู้พิจารณาอนุมัติ */}
              <div className="flex flex-col items-center">
                <div className="h-10"></div>
                <div className="w-full text-slate-700">ลงชื่อ......................................................</div>
                <div className="mt-2 text-slate-700">(......................................................)</div>
                <div className="font-bold mt-1 text-slate-900">นายกเทศมนตรีเมืองมหาสารคาม</div>
                <div className="text-slate-600 text-xs mt-0.5">ผู้พิจารณาอนุมัติ</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
