import * as XLSX from 'xlsx';
import {
  EOfficeRecord,
  FinancialFundRecord,
  PensionerRecord,
  GratuityRecipientRecord,
} from '../types';

/**
 * Download entire workbook containing all sheets updated to FY 2570
 */
export function exportAllSheetsToExcel(
  eOfficeData: EOfficeRecord[],
  chkbData: FinancialFundRecord[],
  gbtData: FinancialFundRecord[],
  pensionersData: PensionerRecord[],
  gratuityData: GratuityRecipientRecord[] = []
) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: สรุปภาพรวมและสถิติข้อมูล ปีงบประมาณ 2570
  const totalRegularPension = pensionersData.reduce((s, p) => s + (p.regularPension || 0), 0);
  const totalLivingGratuity = pensionersData.reduce((s, p) => s + (p.livingGratuity || 0), 0);
  const totalBonus25 = pensionersData.reduce((s, p) => s + (p.bonus25Total || 0), 0);
  const totalBonusBudget = pensionersData.reduce((s, p) => s + (p.bonus25Budget || 0), 0);
  const totalBonusDeposit = pensionersData.reduce((s, p) => s + (p.bonus25Deposit || 0), 0);
  const deceasedCount = pensionersData.filter((p) => !p.isAlive).length;
  const verifiedCount = pensionersData.filter((p) => p.isAlive && p.isVerified).length;
  const unverifiedCount = pensionersData.filter((p) => p.isAlive && !p.isVerified).length;

  const totalGratuityAmount = gratuityData.reduce(
    (s, g) => s + (g.gratuityAmount || g.lastSalary * g.serviceYears || 0),
    0
  );
  const gratuityVerified = gratuityData.filter((g) => g.isAlive && g.isVerified).length;
  const gratuityUnverified = gratuityData.filter((g) => g.isAlive && !g.isVerified).length;
  const gratuityDeceased = gratuityData.filter((g) => !g.isAlive).length;

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

  const summarySheetData = [
    ['เทศบาลเมืองมหาสารคาม จังหวัดมหาสารคาม'],
    ['รายงานสรุปภาพรวมและสถิติข้อมูล ประจำปีงบประมาณ 2570'],
    ['วันที่ส่งออกข้อมูล: ' + new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })],
    [''],
    ['ลำดับ', 'หมวดหมู่ / รายการข้อมูล', 'จำนวน (ราย/เรื่อง)', 'จำนวนเงิน (บาท)', 'หน่วยนับ / หมายเหตุ'],
    ['1', 'หนังสือรับในระบบ E-Office ฝ่ายบริหารงานทั่วไป', eOfficeInCount, '-', 'เรื่อง'],
    ['2', 'หนังสือส่งออกในระบบ E-Office ฝ่ายบริหารงานทั่วไป', eOfficeOutCount, '-', 'เรื่อง'],
    ['3', 'รวมหนังสือเข้า-ออก E-Office ทั้งสิ้น', eOfficeInCount + eOfficeOutCount, '-', 'เรื่อง'],
    ['4', 'ทะเบียนเงินช่วยค่าครองชีพผู้รับเบี้ยหวัดบำนาญ (ช.ค.บ.) รับรวม', chkbData.length, chkbTotalReceived, 'บาท'],
    ['5', 'ทะเบียนเงินช่วยค่าครองชีพผู้รับเบี้ยหวัดบำนาญ (ช.ค.บ.) จ่ายรวม', chkbData.length, chkbTotalPaid, 'บาท'],
    ['6', 'เงินช่วยค่าครองชีพ (ช.ค.บ.) คงเหลือสุทธิ', chkbData.length, chkbNet, 'บาท'],
    ['7', 'ทะเบียนกองทุนบำเหน็จบำนาญ (ก.บ.ท.) รับรวม', gbtData.length, gbtTotalReceived, 'บาท'],
    ['8', 'ทะเบียนกองทุนบำเหน็จบำนาญ (ก.บ.ท.) จ่ายรวม', gbtData.length, gbtTotalPaid, 'บาท'],
    ['9', 'กองทุนบำเหน็จบำนาญ (ก.บ.ท.) คงเหลือสุทธิ', gbtData.length, gbtNet, 'บาท'],
    ['10', 'ข้าราชการบำนาญทั้งหมดในทะเบียน', pensionersData.length, '-', 'ราย'],
    ['11', ' - ผู้รับบำนาญที่มีชีวิตและยืนยันตัวตนแล้ว', verifiedCount, '-', 'ราย'],
    ['12', ' - ผู้รับบำนาญที่มีชีวิตและยังไม่ยืนยันตัวตน', unverifiedCount, '-', 'ราย'],
    ['13', ' - ผู้รับบำนาญที่ถึงแก่กรรม (สิทธิบำเหน็จตกทอด)', deceasedCount, '-', 'ราย'],
    ['14', 'ยอดเบิกจ่ายเงินบำนาญปกติ รวม', pensionersData.filter((p) => p.isAlive).length, totalRegularPension, 'บาท/เดือน'],
    ['15', 'ยอดเงินบำเหน็จดำรงชีพ รวม', pensionersData.filter((p) => (p.livingGratuity || 0) > 0).length, totalLivingGratuity, 'บาท'],
    ['16', 'ยอดเงินเพิ่ม 25% รวมทั้งสิ้น', pensionersData.filter((p) => (p.bonus25Total || 0) > 0).length, totalBonus25, 'บาท'],
    ['17', '   - จากงบประมาณ', pensionersData.filter((p) => (p.bonus25Budget || 0) > 0).length, totalBonusBudget, 'บาท'],
    ['18', '   - เงินรับฝาก', pensionersData.filter((p) => (p.bonus25Deposit || 0) > 0).length, totalBonusDeposit, 'บาท'],
    ['19', 'ทะเบียนผู้รับบำเหน็จ & คำนวณเงิน รวม', gratuityData.length, totalGratuityAmount, 'บาท (สูตร: เงินเดือนสุดท้าย × อายุราชการ)'],
    ['20', '   - ผู้รับบำเหน็จที่ยืนยันตัวตนแล้ว', gratuityVerified, '-', 'ราย'],
    ['21', '   - ผู้รับบำเหน็จที่ยังไม่ยืนยันตัวตน', gratuityUnverified, '-', 'ราย'],
    ['22', '   - ผู้รับบำเหน็จที่ถึงแก่กรรม (สิทธิบำเหน็จตกทอด)', gratuityDeceased, '-', 'ราย'],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปภาพรวม 2570');

  // 2. Sheet: ทะเบียนข้าราชการบำนาญทั้งหมด
  const pensionersRows = formatPensionerRows(pensionersData);
  const wsPensioners = XLSX.utils.json_to_sheet(pensionersRows);
  XLSX.utils.book_append_sheet(wb, wsPensioners, 'ทะเบียนข้าราชการบำนาญ 2570');

  // 3. Sheet: รายงานผู้รับบำเหน็จ & คำนวณเงิน
  const gratuityRows = formatGratuityRows(gratuityData);
  const wsGratuity = XLSX.utils.json_to_sheet(gratuityRows);
  XLSX.utils.book_append_sheet(wb, wsGratuity, 'รายงานผู้รับบำเหน็จ 2570');

  // 4. Sheet: E-Office บริหารงานทั่วไป
  const eOfficeRows = formatEOfficeRows(eOfficeData);
  const wsEOffice = XLSX.utils.json_to_sheet(eOfficeRows);
  XLSX.utils.book_append_sheet(wb, wsEOffice, 'E-Office บริหารงานทั่วไป');

  // 5. Sheet: ทะเบียน ช.ค.บ.
  const chkbRows = formatFundRows(chkbData, 'ช.ค.บ.');
  const wsChkb = XLSX.utils.json_to_sheet(chkbRows);
  XLSX.utils.book_append_sheet(wb, wsChkb, 'ทะเบียน ช.ค.บ.');

  // 6. Sheet: ทะเบียน ก.บ.ท.
  const gbtRows = formatFundRows(gbtData, 'ก.บ.ท.');
  const wsGbt = XLSX.utils.json_to_sheet(gbtRows);
  XLSX.utils.book_append_sheet(wb, wsGbt, 'ทะเบียน ก.บ.ท.');

  // 7. Sheet: สรุปบำเหน็จดำรงชีพ 3 งวด
  const livingGratuityRows = pensionersData
    .filter((p) => p.isAlive && (p.livingGratuity || 0) > 0)
    .map((p, idx) => ({
      ลำดับ: idx + 1,
      รหัสบำนาญ: p.code,
      คำนำหน้า: p.title,
      ชื่อ: p.firstName,
      นามสกุล: p.lastName,
      เลขบัตรประชาชน: p.idCard,
      อายุ: p.age,
      'งวดที่ 1 (ครบ 60 ปี) (บาท)': p.livingGratuityInstallment1 || 0,
      'งวดที่ 2 (ครบ 65 ปี) (บาท)': p.livingGratuityInstallment2 || 0,
      'งวดที่ 3 (ครบ 70 ปี) (บาท)': p.livingGratuityInstallment3 || 0,
      'รวมบำเหน็จดำรงชีพ (บาท)': p.livingGratuity || 0,
      สถานะสิทธิ: p.livingGratuityStatus === 'eligible_70' ? 'ครบสิทธิ 70 ปี' : p.livingGratuityStatus === 'eligible_65' ? 'ครบสิทธิ 65 ปี' : 'ครบสิทธิ 60 ปี',
    }));
  const wsLiving = XLSX.utils.json_to_sheet(livingGratuityRows);
  XLSX.utils.book_append_sheet(wb, wsLiving, 'บำเหน็จดำรงชีพ 3 งวด');

  // 8. Sheet: สรุปเงินเพิ่ม 25% (จากงบประมาณ & เงินรับฝาก)
  const bonus25Rows = pensionersData
    .filter((p) => p.isAlive && ((p.bonus25Total || 0) > 0 || (p.bonus25Budget || 0) > 0 || (p.bonus25Deposit || 0) > 0))
    .map((p, idx) => ({
      ลำดับ: idx + 1,
      รหัสบำนาญ: p.code,
      ชื่อสกุล: `${p.title}${p.firstName} ${p.lastName}`,
      เลขบัตรประชาชน: p.idCard,
      ตำแหน่งเดิม: p.formerPosition,
      'เงินเพิ่ม 25% จากงบประมาณ (บาท)': p.bonus25Budget || 0,
      'เงินเพิ่ม 25% เงินรับฝาก (บาท)': p.bonus25Deposit || 0,
      'เงินเพิ่ม 25% รวม (บาท)': p.bonus25Total || ((p.bonus25Budget || 0) + (p.bonus25Deposit || 0)),
    }));
  const wsBonus25 = XLSX.utils.json_to_sheet(bonus25Rows);
  XLSX.utils.book_append_sheet(wb, wsBonus25, 'เงินเพิ่ม 25%');

  // 9. Sheet: ทายาทผู้รับบำเหน็จตกทอด & เงินช่วยพิเศษ 3 เท่า
  const heirsRows = pensionersData
    .filter((p) => p.heirName || (p.heirs && p.heirs.length > 0) || p.special3xHeirName)
    .map((p, idx) => ({
      ลำดับ: idx + 1,
      รหัสบำนาญ: p.code,
      ชื่อข้าราชการบำนาญ: `${p.title}${p.firstName} ${p.lastName}`,
      สถานะชีวิต: p.isAlive ? 'มีชีวิต' : 'ถึงแก่กรรม',
      วันที่ถึงแก่กรรม: p.deathDate || '-',
      'ชื่อทายาทบำเหน็จตกทอด': p.heirs && p.heirs.length > 0
        ? p.heirs.map((h) => h.name).join(', ')
        : p.heirName || '-',
      'ความสัมพันธ์': p.heirs && p.heirs.length > 0
        ? p.heirs.map((h) => h.relation).join(', ')
        : p.heirRelation || '-',
      'สัดส่วนบำเหน็จตกทอด (%)': p.heirs && p.heirs.length > 0
        ? p.heirs.map((h) => `${h.percentage}%`).join(', ')
        : p.heirPercentage !== undefined ? `${p.heirPercentage}%` : '100%',
      'เบอร์โทรศัพท์ทายาท': p.heirs && p.heirs.length > 0
        ? p.heirs.map((h) => h.phone || '-').join(', ')
        : p.heirPhone || '-',
      'ทายาทรับเงินช่วยพิเศษ 3 เท่า': p.special3xHeirName || '-',
      'เงินช่วยพิเศษ 3 เท่า (บาท)': p.special3xAmount ?? (p.regularPension ? p.regularPension * 3 : 0),
      'ความสัมพันธ์ (3 เท่า)': p.special3xRelation || '-',
      'เบอร์โทรศัพท์ (3 เท่า)': p.special3xPhone || '-',
    }));
  const wsHeirs = XLSX.utils.json_to_sheet(heirsRows);
  XLSX.utils.book_append_sheet(wb, wsHeirs, 'ทายาทและสิทธิ 3 เท่า');

  // Trigger download
  XLSX.writeFile(wb, `รายงานสรุปทั้งเล่ม_เทศบาลเมืองมหาสารคาม_ปีงบประมาณ_2570.xlsx`);
}

/**
 * Format Pensioners data into consistent Thai Excel columns
 */
export function formatPensionerRows(pensionersData: PensionerRecord[]) {
  return pensionersData.map((p, index) => ({
    ลำดับ: index + 1,
    รหัสบำนาญ: p.code,
    คำนำหน้า: p.title,
    ชื่อ: p.firstName,
    นามสกุล: p.lastName,
    เลขบัตรประชาชน: p.idCard,
    ตำแหน่งเดิม: p.formerPosition,
    'วันเกิด (YYYY-MM-DD)': p.birthDate || '-',
    อายุ: p.age,
    กลุ่มอายุ:
      p.ageGroup === '60'
        ? 'อายุครบ 60 ปี'
        : p.ageGroup === '65'
        ? 'อายุครบ 65 ปี'
        : p.ageGroup === '70'
        ? 'อายุครบ 70 ปี'
        : p.ageGroup === '75'
        ? 'อายุ 75 ปี'
        : 'กลุ่มอื่น',
    สถานะชีวิต: p.isAlive ? 'มีชีวิต' : 'ถึงแก่กรรม',
    วันที่ถึงแก่กรรม: p.deathDate || '-',
    สถานะการยืนยันตัวตน: p.isVerified ? 'ยืนยันตัวตนแล้ว' : 'ยังไม่ได้ยืนยัน',
    วันที่ยืนยัน: p.verifiedDate || '-',
    ช่องทางยืนยัน: p.verificationChannel || '-',
    'เงินบำนาญปกติ (บาท)': p.regularPension || 0,
    'บำเหน็จดำรงชีพ งวดที่ 1 (อายุครบ 60 ปี) (บาท)': p.livingGratuityInstallment1 || 0,
    'บำเหน็จดำรงชีพ งวดที่ 2 (อายุครบ 65 ปี) (บาท)': p.livingGratuityInstallment2 || 0,
    'บำเหน็จดำรงชีพ งวดที่ 3 (อายุครบ 70 ปี) (บาท)': p.livingGratuityInstallment3 || 0,
    'เงินบำเหน็จดำรงชีพ รวม (บาท)': p.livingGratuity || 0,
    'เงินเพิ่ม 25% รวม (บาท)': p.bonus25Total || ((p.bonus25Budget || 0) + (p.bonus25Deposit || 0)),
    'เงินเพิ่ม 25% จากงบประมาณ (บาท)': p.bonus25Budget || 0,
    'เงินเพิ่ม 25% เงินรับฝาก (บาท)': p.bonus25Deposit || 0,
    'เงิน ช.ค.บ. (บาท)': p.chkbAmount || 0,
    'ชื่อทายาทผู้มีสิทธิรับบำเหน็จตกทอด':
      p.heirs && p.heirs.length > 0
        ? p.heirs.map((h) => h.name).join(', ')
        : p.heirName || '-',
    ความสัมพันธ์:
      p.heirs && p.heirs.length > 0
        ? p.heirs.map((h) => h.relation).join(', ')
        : p.heirRelation || '-',
    'เปอร์เซ็นต์บำเหน็จตกทอด (%)':
      p.heirs && p.heirs.length > 0
        ? p.heirs.map((h) => `${h.percentage}%`).join(', ')
        : p.heirPercentage !== undefined
        ? `${p.heirPercentage}%`
        : '100%',
    เบอร์โทรศัพท์ทายาท:
      p.heirs && p.heirs.length > 0
        ? p.heirs.map((h) => h.phone || '-').join(', ')
        : p.heirPhone || '-',
    'ทายาทผู้มีสิทธิรับเงินช่วยพิเศษ 3 เท่า': p.special3xHeirName || '-',
    'เงินช่วยพิเศษ 3 เท่า (บาท)': p.special3xAmount ?? (p.regularPension ? p.regularPension * 3 : 0),
    'ความสัมพันธ์ (เงินช่วยพิเศษ 3 เท่า)': p.special3xRelation || '-',
    'เบอร์โทรศัพท์ (เงินช่วยพิเศษ 3 เท่า)': p.special3xPhone || '-',
    'สัดส่วนเงินช่วยพิเศษ 3 เท่า': '100% (1 คน)',
    ผู้บันทึกข้อมูลล่าสุด: p.recordedBy || 'User',
    วันที่ปรับปรุงข้อมูล: p.updatedAt || '-',
  }));
}

/**
 * Format Gratuity Recipients data into consistent Thai Excel columns
 */
export function formatGratuityRows(gratuityData: GratuityRecipientRecord[]) {
  return gratuityData.map((r, index) => {
    const salary = r.lastSalary || 0;
    const years = r.serviceYears || 0;
    const computedAmt = r.gratuityAmount || Math.round(salary * years);
    return {
      ลำดับ: index + 1,
      รหัสบำเหน็จ: r.code,
      คำนำหน้า: r.title,
      ชื่อ: r.firstName,
      นามสกุล: r.lastName,
      เลขบัตรประชาชน: r.idCard,
      ตำแหน่งเดิม: r.formerPosition,
      'สังกัด/กอง': r.department || 'เทศบาลเมืองมหาสารคาม',
      'เงินเดือนที่ได้รับครั้งสุดท้าย (บาท)': salary,
      'อายุราชการ (ปี)': years,
      'อายุราชการ (เดือน)': r.serviceMonths || 0,
      'ยอดเงินบำเหน็จ (คำนวณ) (บาท)': computedAmt,
      สูตรการคำนวณ: `${salary.toLocaleString('th-TH')} × ${years} ปี = ${computedAmt.toLocaleString('th-TH')} บาท`,
      สถานะการมีชีวิต: r.isAlive ? 'มีชีวิต' : 'ถึงแก่กรรม',
      วันที่ถึงแก่กรรม: r.deathDate || '-',
      สถานะการยืนยันตัวตน: r.isVerified ? 'ยืนยันตัวตนแล้ว' : 'ยังไม่ได้ยืนยัน',
      วันที่ยืนยัน: r.verifiedDate || '-',
      ช่องทางการยืนยัน: r.verificationChannel || '-',
      ชื่อทายาทผู้มีสิทธิรับบำเหน็จตกทอด: r.heirName || '-',
      ความสัมพันธ์: r.heirRelation || '-',
      'สัดส่วนบำเหน็จตกทอด (%)': r.heirPercentage ? `${r.heirPercentage}%` : '100%',
      เบอร์โทรศัพท์ทายาท: r.heirPhone || '-',
      วันที่จ่ายเงิน: r.paymentDate || '-',
      หมายเหตุ: r.note || '-',
      ผู้บันทึกข้อมูลล่าสุด: r.recordedBy || 'User',
      วันที่ปรับปรุงข้อมูล: r.updatedAt || '-',
    };
  });
}

/**
 * Format E-Office data into consistent Thai Excel columns
 */
export function formatEOfficeRows(eOfficeData: EOfficeRecord[]) {
  return eOfficeData.map((item, index) => ({
    ลำดับ: index + 1,
    วันที่: item.date,
    ประเภท: item.type === 'in' ? 'การรับหนังสือ' : 'การส่งหนังสือออก',
    'จำนวน (เรื่อง)': item.quantity !== undefined ? item.quantity : 1,
    เลขที่หนังสือ: item.docNumber,
    เรื่องสำคัญ: item.title,
    หน่วยงาน: item.department,
    สถานะ: item.status === 'completed' ? 'ดำเนินการเสร็จสิ้น' : item.status === 'urgent' ? 'ด่วนที่สุด' : 'กำลังดำเนินการ',
    หมายเหตุ: item.note || '-',
    ผู้บันทึก: item.recordedBy || 'User',
    อัปเดตล่าสุด: item.updatedAt || '-',
  }));
}

/**
 * Format Financial Fund (CHKB / GBT) into consistent Thai Excel columns
 */
export function formatFundRows(records: FinancialFundRecord[], fundName: 'ช.ค.บ.' | 'ก.บ.ท.') {
  return records.map((item, index) => ({
    ลำดับ: index + 1,
    วันที่: item.date,
    'รับเงินจากที่ไหน / แหล่งที่มา หรือ รายละเอียดการจ่าย': item.source,
    'รับเงินจำนวน (บาท)': item.receivedAmount,
    'จ่ายไปเท่าไหร่ (บาท)': item.paidAmount,
    'คงเหลือสุทธิ (บาท)': item.netBalance,
    'จำนวนราย (คน)': item.beneficiaryCount,
    หมายเหตุ: item.note || '-',
    ผู้บันทึก: item.recordedBy || 'User',
    อัปเดตล่าสุด: item.updatedAt || '-',
  }));
}

/**
 * Export single category to Excel (.xlsx)
 */
export function exportSingleCategoryToExcel(
  categoryName: string,
  fileName: string,
  data: any[]
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, categoryName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Specialized individual exporters
 */
export function exportPensionersToExcel(pensioners: PensionerRecord[]) {
  const rows = formatPensionerRows(pensioners);
  exportSingleCategoryToExcel(
    'ทะเบียนข้าราชการบำนาญ',
    'รายงาน_ทะเบียนข้าราชการบำนาญ_2570_เทศบาลเมืองมหาสารคาม',
    rows
  );
}

export function exportGratuityToExcel(records: GratuityRecipientRecord[]) {
  const rows = formatGratuityRows(records);
  exportSingleCategoryToExcel(
    'รายงานผู้รับบำเหน็จ',
    'รายงาน_ผู้รับบำเหน็จและคำนวณเงิน_2570_เทศบาลเมืองมหาสารคาม',
    rows
  );
}

export function exportEOfficeToExcel(records: EOfficeRecord[]) {
  const rows = formatEOfficeRows(records);
  exportSingleCategoryToExcel(
    'E-Office บริหารงานทั่วไป',
    'รายงาน_EOffice_บริหารงานทั่วไป_2570_เทศบาลเมืองมหาสารคาม',
    rows
  );
}

export function exportChkbToExcel(records: FinancialFundRecord[]) {
  const rows = formatFundRows(records, 'ช.ค.บ.');
  exportSingleCategoryToExcel(
    'ทะเบียน ช.ค.บ.',
    'รายงาน_ทะเบียน_ช.ค.บ._2570_เทศบาลเมืองมหาสารคาม',
    rows
  );
}

export function exportGbtToExcel(records: FinancialFundRecord[]) {
  const rows = formatFundRows(records, 'ก.บ.ท.');
  exportSingleCategoryToExcel(
    'ทะเบียน ก.บ.ท.',
    'รายงาน_ทะเบียน_ก.บ.ท._2570_เทศบาลเมืองมหาสารคาม',
    rows
  );
}

export function exportBonus25BudgetToExcel(records: PensionerRecord[]) {
  const data = records
    .filter((p) => (p.bonus25Budget || 0) > 0)
    .map((p, i) => ({
      ลำดับ: i + 1,
      รหัสบำนาญ: p.code,
      คำนำหน้า: p.title,
      ชื่อ: p.firstName,
      นามสกุล: p.lastName,
      เลขบัตรประชาชน: p.idCard,
      ตำแหน่งเดิม: p.formerPosition,
      อายุ: p.age,
      'เงินเพิ่ม 25% จากงบประมาณ (บาท)': p.bonus25Budget,
      สถานะชีวิต: p.isAlive ? 'มีชีวิต' : 'ถึงแก่กรรม',
      สถานะยืนยันตัวตน: p.isVerified ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน',
    }));
  exportSingleCategoryToExcel(
    'จากงบประมาณ',
    'รายงาน_เงินเพิ่ม25เปอร์เซ็นต์_จากงบประมาณ_2570',
    data
  );
}

export function exportBonus25DepositToExcel(records: PensionerRecord[]) {
  const data = records
    .filter((p) => (p.bonus25Deposit || 0) > 0)
    .map((p, i) => ({
      ลำดับ: i + 1,
      รหัสบำนาญ: p.code,
      คำนำหน้า: p.title,
      ชื่อ: p.firstName,
      นามสกุล: p.lastName,
      เลขบัตรประชาชน: p.idCard,
      ตำแหน่งเดิม: p.formerPosition,
      อายุ: p.age,
      'เงินเพิ่ม 25% เงินรับฝาก (บาท)': p.bonus25Deposit,
      สถานะชีวิต: p.isAlive ? 'มีชีวิต' : 'ถึงแก่กรรม',
      สถานะยืนยันตัวตน: p.isVerified ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน',
    }));
  exportSingleCategoryToExcel(
    'เงินรับฝาก',
    'รายงาน_เงินเพิ่ม25เปอร์เซ็นต์_เงินรับฝาก_2570',
    data
  );
}

export function exportLivingGratuityToExcel(records: PensionerRecord[]) {
  const data = records
    .filter((p) => (p.livingGratuity || 0) > 0 || p.age >= 60)
    .map((p, i) => ({
      ลำดับ: i + 1,
      รหัสบำนาญ: p.code,
      ชื่อสกุล: `${p.title}${p.firstName} ${p.lastName}`,
      เลขบัตรประชาชน: p.idCard,
      อายุ: p.age,
      'งวดที่ 1 (อายุครบ 60 ปี) (บาท)': p.livingGratuityInstallment1 || 0,
      'งวดที่ 2 (อายุครบ 65 ปี) (บาท)': p.livingGratuityInstallment2 || 0,
      'งวดที่ 3 (อายุครบ 70 ปี) (บาท)': p.livingGratuityInstallment3 || 0,
      'เงินบำเหน็จดำรงชีพ รวม (บาท)': p.livingGratuity || 0,
      สถานะสิทธิ:
        p.age >= 70 ? 'อายุครบ 70 ปี' : p.age >= 65 ? 'อายุครบ 65 ปี' : 'อายุครบ 60 ปี',
    }));
  exportSingleCategoryToExcel(
    'บำเหน็จดำรงชีพ',
    'รายงาน_บำเหน็จดำรงชีพ_3งวด_2570',
    data
  );
}

export function exportDeceasedHeirsToExcel(records: PensionerRecord[]) {
  const data = records
    .filter((p) => !p.isAlive || p.heirName || (p.heirs && p.heirs.length > 0))
    .map((p, i) => ({
      ลำดับ: i + 1,
      รหัสบำนาญ: p.code,
      ชื่อข้าราชการบำนาญ: `${p.title}${p.firstName} ${p.lastName}`,
      สถานะชีวิต: p.isAlive ? 'มีชีวิต' : 'ถึงแก่กรรม',
      วันที่ถึงแก่กรรม: p.deathDate || '-',
      'ชื่อทายาทบำเหน็จตกทอด':
        p.heirs && p.heirs.length > 0
          ? p.heirs.map((h) => h.name).join(', ')
          : p.heirName || '-',
      ความสัมพันธ์:
        p.heirs && p.heirs.length > 0
          ? p.heirs.map((h) => h.relation).join(', ')
          : p.heirRelation || '-',
      'สัดส่วนบำเหน็จตกทอด (%)':
        p.heirs && p.heirs.length > 0
          ? p.heirs.map((h) => `${h.percentage}%`).join(', ')
          : p.heirPercentage !== undefined
          ? `${p.heirPercentage}%`
          : '100%',
      เบอร์โทรศัพท์ทายาท:
        p.heirs && p.heirs.length > 0
          ? p.heirs.map((h) => h.phone || '-').join(', ')
          : p.heirPhone || '-',
      'ทายาทรับเงินช่วยพิเศษ 3 เท่า': p.special3xHeirName || '-',
      'เงินช่วยพิเศษ 3 เท่า (บาท)': p.special3xAmount ?? (p.regularPension ? p.regularPension * 3 : 0),
      'ความสัมพันธ์ (3 เท่า)': p.special3xRelation || '-',
      'เบอร์โทรศัพท์ (3 เท่า)': p.special3xPhone || '-',
    }));
  exportSingleCategoryToExcel(
    'บำเหน็จตกทอดและทายาท',
    'รายงาน_ทายาทผู้มีสิทธิรับบำเหน็จตกทอด_2570',
    data
  );
}

/**
 * Generate official ready-to-use blank templates with realistic sample rows
 * for filling in and importing data back into the system (.xlsx)
 */
export function downloadTemplate(
  templateType: 'pensioner' | 'gratuity' | 'eoffice' | 'chkb' | 'gbt' | 'bonus25' | 'living'
) {
  const wb = XLSX.utils.book_new();

  if (templateType === 'pensioner') {
    const templateData = [
      {
        'รหัสบำนาญ': 'บน-2570-001',
        'คำนำหน้า': 'นาย',
        'ชื่อ': 'สมบัติ',
        'นามสกุล': 'ใจดี',
        'เลขบัตรประชาชน': '3440100999999',
        'ตำแหน่งเดิม': 'ผู้อำนวยการกองช่าง',
        'วันเกิด (YYYY-MM-DD)': '1961-05-15',
        'อายุ': 65,
        'กลุ่มอายุ (60/65/70/75/other)': '65',
        'สถานะชีวิต (มีชีวิต/ถึงแก่กรรม)': 'มีชีวิต',
        'วันที่ถึงแก่กรรม (YYYY-MM-DD ถ้ามี)': '',
        'สถานะการยืนยัน (ยืนยันแล้ว/ยังไม่ยืนยัน)': 'ยืนยันแล้ว',
        'วันที่ยืนยัน (YYYY-MM-DD)': '2026-10-15',
        'ช่องทาง (ยืนยันตัวตนออนไลน์/แสดงตนที่กองคลัง)': 'ยืนยันตัวตนออนไลน์',
        'เงินบำนาญปกติ (บาท)': 45000,
        'บำเหน็จดำรงชีพ งวดที่ 1 (อายุครบ 60 ปี) (บาท)': 200000,
        'บำเหน็จดำรงชีพ งวดที่ 2 (อายุครบ 65 ปี) (บาท)': 0,
        'บำเหน็จดำรงชีพ งวดที่ 3 (อายุครบ 70 ปี) (บาท)': 0,
        'เงินบำเหน็จดำรงชีพ รวม (บาท)': 200000,
        'เงินเพิ่ม 25% รวม (บาท)': 11250,
        'จากงบประมาณ (บาท)': 7875,
        'เงินรับฝาก (บาท)': 3375,
        'เงิน ช.ค.บ. (บาท)': 9000,
        'ชื่อทายาทผู้มีสิทธิรับบำเหน็จตกทอด': 'นางสมพร ใจดี',
        'ความสัมพันธ์': 'คู่สมรส',
        'เปอร์เซ็นต์บำเหน็จตกทอด (%)': 100,
        'เบอร์โทรศัพท์ทายาท': '081-234-5678',
        'ทายาทผู้มีสิทธิรับเงินช่วยพิเศษ 3 เท่า': 'นางสมพร ใจดี',
        'เงินช่วยพิเศษ 3 เท่า (บาท)': 135000,
        'ความสัมพันธ์ (เงินช่วยพิเศษ 3 เท่า)': 'คู่สมรส',
        'เบอร์โทรศัพท์ (เงินช่วยพิเศษ 3 เท่า)': '081-234-5678',
      },
      {
        'รหัสบำนาญ': 'บน-2570-002',
        'คำนำหน้า': 'นาง',
        'ชื่อ': 'วิไล',
        'นามสกุล': 'วรรณประเสริฐ',
        'เลขบัตรประชาชน': '3440100888888',
        'ตำแหน่งเดิม': 'หัวหน้าฝ่ายการเงินและบัญชี',
        'วันเกิด (YYYY-MM-DD)': '1956-08-20',
        'อายุ': 70,
        'กลุ่มอายุ (60/65/70/75/other)': '70',
        'สถานะชีวิต (มีชีวิต/ถึงแก่กรรม)': 'มีชีวิต',
        'วันที่ถึงแก่กรรม (YYYY-MM-DD ถ้ามี)': '',
        'สถานะการยืนยัน (ยืนยันแล้ว/ยังไม่ยืนยัน)': 'ยืนยันแล้ว',
        'วันที่ยืนยัน (YYYY-MM-DD)': '2026-10-18',
        'ช่องทาง (ยืนยันตัวตนออนไลน์/แสดงตนที่กองคลัง)': 'แสดงตนที่กองคลัง',
        'เงินบำนาญปกติ (บาท)': 48000,
        'บำเหน็จดำรงชีพ งวดที่ 1 (อายุครบ 60 ปี) (บาท)': 200000,
        'บำเหน็จดำรงชีพ งวดที่ 2 (อายุครบ 65 ปี) (บาท)': 200000,
        'บำเหน็จดำรงชีพ งวดที่ 3 (อายุครบ 70 ปี) (บาท)': 100000,
        'เงินบำเหน็จดำรงชีพ รวม (บาท)': 500000,
        'เงินเพิ่ม 25% รวม (บาท)': 12000,
        'จากงบประมาณ (บาท)': 8400,
        'เงินรับฝาก (บาท)': 3600,
        'เงิน ช.ค.บ. (บาท)': 9500,
        'ชื่อทายาทผู้มีสิทธิรับบำเหน็จตกทอด': 'นายประเสริฐ วรรณประเสริฐ',
        'ความสัมพันธ์': 'บุตร',
        'เปอร์เซ็นต์บำเหน็จตกทอด (%)': 100,
        'เบอร์โทรศัพท์ทายาท': '089-876-5432',
        'ทายาทผู้มีสิทธิรับเงินช่วยพิเศษ 3 เท่า': 'นายประเสริฐ วรรณประเสริฐ',
        'เงินช่วยพิเศษ 3 เท่า (บาท)': 144000,
        'ความสัมพันธ์ (เงินช่วยพิเศษ 3 เท่า)': 'บุตร',
        'เบอร์โทรศัพท์ (เงินช่วยพิเศษ 3 เท่า)': '089-876-5432',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_ผู้รับบำนาญ');
    XLSX.writeFile(wb, 'Template_ทะเบียนผู้รับบำนาญ_มหาสารคาม_2570.xlsx');
  } else if (templateType === 'gratuity') {
    const templateData = [
      {
        'รหัสบำเหน็จ': 'เหน็จ-2570-001',
        'คำนำหน้า': 'นาย',
        'ชื่อ': 'วิชาญ',
        'นามสกุล': 'เจริญสุข',
        'เลขบัตรประชาชน': '3440100889911',
        'ตำแหน่งเดิม': 'นายช่างโยธาชำนาญงาน',
        'สังกัด/กอง': 'กองช่าง เทศบาลเมืองมหาสารคาม',
        'เงินเดือนที่ได้รับครั้งสุดท้าย (บาท)': 38500,
        'อายุราชการ (ปี)': 25,
        'อายุราชการ (เดือน)': 6,
        'ยอดเงินบำเหน็จ (คำนวณ) (บาท)': 962500,
        'สถานะการมีชีวิต (มีชีวิต/ถึงแก่กรรม)': 'มีชีวิต',
        'วันที่ถึงแก่กรรม (YYYY-MM-DD ถ้ามี)': '',
        'สถานะการยืนยันตัวตน (ยืนยันแล้ว/ยังไม่ยืนยัน)': 'ยืนยันแล้ว',
        'วันที่ยืนยัน (YYYY-MM-DD)': '2026-10-18',
        'ช่องทางการยืนยัน (ยืนยันตัวตนออนไลน์/แสดงตนที่กองคลัง)': 'ยืนยันตัวตนออนไลน์',
        'ชื่อทายาทผู้มีสิทธิรับบำเหน็จตกทอด': 'นางสาวพิมพา เจริญสุข',
        'ความสัมพันธ์': 'บุตร',
        'สัดส่วนบำเหน็จตกทอด (%)': 100,
        'เบอร์โทรศัพท์ทายาท': '089-111-2233',
        'วันที่จ่ายเงิน (YYYY-MM-DD)': '2026-10-25',
        'หมายเหตุ': 'คำนวณเงินเดือนครั้งสุดท้าย x อายุราชการ (38,500 x 25)',
      },
      {
        'รหัสบำเหน็จ': 'เหน็จ-2570-002',
        'คำนำหน้า': 'นาง',
        'ชื่อ': 'กานดา',
        'นามสกุล': 'บุญเลิศ',
        'เลขบัตรประชาชน': '3440100776655',
        'ตำแหน่งเดิม': 'เจ้าพนักงานธุรการชำนาญงาน',
        'สังกัด/กอง': 'กองคลัง เทศบาลเมืองมหาสารคาม',
        'เงินเดือนที่ได้รับครั้งสุดท้าย (บาท)': 32000,
        'อายุราชการ (ปี)': 20,
        'อายุราชการ (เดือน)': 0,
        'ยอดเงินบำเหน็จ (คำนวณ) (บาท)': 640000,
        'สถานะการมีชีวิต (มีชีวิต/ถึงแก่กรรม)': 'มีชีวิต',
        'วันที่ถึงแก่กรรม (YYYY-MM-DD ถ้ามี)': '',
        'สถานะการยืนยันตัวตน (ยืนยันแล้ว/ยังไม่ยืนยัน)': 'ยืนยันแล้ว',
        'วันที่ยืนยัน (YYYY-MM-DD)': '2026-10-20',
        'ช่องทางการยืนยัน (ยืนยันตัวตนออนไลน์/แสดงตนที่กองคลัง)': 'แสดงตนที่กองคลัง',
        'ชื่อทายาทผู้มีสิทธิรับบำเหน็จตกทอด': 'นายสมบูรณ์ บุญเลิศ',
        'ความสัมพันธ์': 'คู่สมรส',
        'สัดส่วนบำเหน็จตกทอด (%)': 100,
        'เบอร์โทรศัพท์ทายาท': '087-654-3210',
        'วันที่จ่ายเงิน (YYYY-MM-DD)': '2026-10-28',
        'หมายเหตุ': 'คำนวณเงินเดือนครั้งสุดท้าย x อายุราชการ (32,000 x 20)',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_ผู้รับบำเหน็จ');
    XLSX.writeFile(wb, 'Template_ผู้รับบำเหน็จและคำนวณเงิน_มหาสารคาม_2570.xlsx');
  } else if (templateType === 'eoffice') {
    const templateData = [
      {
        'วันที่ (YYYY-MM-DD)': '2026-10-21',
        'ประเภท (in/out)': 'in',
        'จำนวน (เรื่อง)': 12,
        'เลขที่หนังสือ': 'มค 52001/ว 1001',
        'เรื่องสำคัญ': 'การจัดสรรเงินอุดหนุนทั่วไปด้านสวัสดิการสังคม ประจำปีงบประมาณ 2570',
        'หน่วยงาน': 'กรมส่งเสริมการปกครองท้องถิ่น',
        'สถานะ (completed/urgent/in_progress)': 'completed',
        'หมายเหตุ': 'ลงรับหนังสือเรียบร้อยและแจ้งกองคลังดำเนินการ',
      },
      {
        'วันที่ (YYYY-MM-DD)': '2026-10-22',
        'ประเภท (in/out)': 'out',
        'จำนวน (เรื่อง)': 8,
        'เลขที่หนังสือ': 'มค 52001/1234',
        'เรื่องสำคัญ': 'รายงานสถานะการเบิกจ่ายเงินบำนาญและเงินช่วยค่าครองชีพผู้รับเบี้ยหวัดบำนาญ',
        'หน่วยงาน': 'สำนักงานส่งเสริมการปกครองท้องถิ่นจังหวัดมหาสารคาม',
        'สถานะ (completed/urgent/in_progress)': 'completed',
        'หมายเหตุ': 'ส่งออกหนังสือราชการพร้อมเอกสารแนบ',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_EOffice');
    XLSX.writeFile(wb, 'Template_EOffice_บริหารงานทั่วไป_มหาสารคาม_2570.xlsx');
  } else if (templateType === 'chkb') {
    const templateData = [
      {
        'วันที่ (YYYY-MM-DD)': '2026-10-01',
        'รับเงินจากที่ไหน / แหล่งที่มา หรือ รายละเอียดการจ่าย': 'กรมส่งเสริมการปกครองท้องถิ่น (เงินอุดหนุนทั่วไป งวดที่ 1)',
        'รับเงินจำนวน (บาท)': 1500000,
        'จ่ายไปเท่าไหร่ (บาท)': 0,
        'จำนวนราย (คน)': 45,
        'หมายเหตุ': 'เงินอุดหนุน ช.ค.บ. งวดที่ 1 ไตรมาส 1/2570',
      },
      {
        'วันที่ (YYYY-MM-DD)': '2026-10-25',
        'รับเงินจากที่ไหน / แหล่งที่มา หรือ รายละเอียดการจ่าย': 'จ่ายเงินช่วยค่าครองชีพผู้รับเบี้ยหวัดบำนาญ (ช.ค.บ.) ประจำเดือนตุลาคม 2569',
        'รับเงินจำนวน (บาท)': 0,
        'จ่ายไปเท่าไหร่ (บาท)': 385000,
        'จำนวนราย (คน)': 45,
        'หมายเหตุ': 'โอนเงินเข้าบัญชีธนาคารผู้รับบำนาญเรียบร้อย',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_CHKB');
    XLSX.writeFile(wb, 'Template_ทะเบียน_ช.ค.บ._มหาสารคาม_2570.xlsx');
  } else if (templateType === 'gbt') {
    const templateData = [
      {
        'วันที่ (YYYY-MM-DD)': '2026-10-05',
        'รับเงินจากที่ไหน / แหล่งที่มา หรือ รายละเอียดการจ่าย': 'สำนักงานกองทุนบำเหน็จบำนาญข้าราชการส่วนท้องถิ่น (ก.บ.ท.) ส่วนกลาง',
        'รับเงินจำนวน (บาท)': 2000000,
        'จ่ายไปเท่าไหร่ (บาท)': 0,
        'จำนวนราย (คน)': 52,
        'หมายเหตุ': 'เงินจัดสรร ก.บ.ท. ประจำงวดที่ 1/2570',
      },
      {
        'วันที่ (YYYY-MM-DD)': '2026-10-26',
        'รับเงินจากที่ไหน / แหล่งที่มา หรือ รายละเอียดการจ่าย': 'จ่ายเงินบำเหน็จดำรงชีพผู้รับบำนาญอายุครบ 65 ปี และ 70 ปี',
        'รับเงินจำนวน (บาท)': 0,
        'จ่ายไปเท่าไหร่ (บาท)': 600000,
        'จำนวนราย (คน)': 3,
        'หมายเหตุ': 'จ่ายเงินตามสิทธิผู้มีอายุครบเกณฑ์ 3 ราย',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_GBT');
    XLSX.writeFile(wb, 'Template_ทะเบียน_ก.บ.ท._มหาสารคาม_2570.xlsx');
  } else if (templateType === 'bonus25') {
    const templateData = [
      {
        'รหัสบำนาญ': 'บน-2570-001',
        'คำนำหน้า': 'นาย',
        'ชื่อ': 'สมบัติ',
        'นามสกุล': 'ใจดี',
        'เลขบัตรประชาชน': '3440100999999',
        'ตำแหน่งเดิม': 'ผู้อำนวยการกองช่าง',
        'เงินเพิ่ม 25% จากงบประมาณ (บาท)': 7875,
        'เงินเพิ่ม 25% เงินรับฝาก (บาท)': 3375,
        'เงินเพิ่ม 25% รวม (บาท)': 11250,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_เงินเพิ่ม25');
    XLSX.writeFile(wb, 'Template_เงินเพิ่ม25เปอร์เซ็นต์_มหาสารคาม_2570.xlsx');
  } else if (templateType === 'living') {
    const templateData = [
      {
        'รหัสบำนาญ': 'บน-2570-001',
        'คำนำหน้า': 'นาย',
        'ชื่อ': 'สมบัติ',
        'นามสกุล': 'ใจดี',
        'เลขบัตรประชาชน': '3440100999999',
        'อายุ': 65,
        'งวดที่ 1 (อายุครบ 60 ปี) (บาท)': 200000,
        'งวดที่ 2 (อายุครบ 65 ปี) (บาท)': 200000,
        'งวดที่ 3 (อายุครบ 70 ปี) (บาท)': 0,
        'เงินบำเหน็จดำรงชีพ รวม (บาท)': 400000,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_บำเหน็จดำรงชีพ');
    XLSX.writeFile(wb, 'Template_บำเหน็จดำรงชีพ3งวด_มหาสารคาม_2570.xlsx');
  }
}

/**
 * Parse uploaded Excel/CSV file into raw row objects
 */
export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
