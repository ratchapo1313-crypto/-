import { EOfficeRecord, FinancialFundRecord, PensionerRecord, GratuityRecipientRecord } from '../types';
import { formatCurrency, formatNumber, formatThaiDate } from './formatters';

export function downloadOfficialMemoAsWord(
  eOfficeData: EOfficeRecord[],
  chkbData: FinancialFundRecord[],
  gbtData: FinancialFundRecord[],
  pensionersData: PensionerRecord[],
  memoDate: string = '2026-10-21',
  gratuityData: GratuityRecipientRecord[] = []
) {
  // Statistics calculations (เฉพาะการรับหนังสือ และการส่งหนังสือออก)
  const eOfficeIn = eOfficeData.filter(d => d.type === 'in').reduce((s, d) => s + (d.quantity || 1), 0);
  const eOfficeOut = eOfficeData.filter(d => d.type === 'out').reduce((s, d) => s + (d.quantity || 1), 0);

  const chkbTotalReceived = chkbData.reduce((s, r) => s + r.receivedAmount, 0);
  const chkbTotalPaid = chkbData.reduce((s, r) => s + r.paidAmount, 0);
  const chkbBalance = chkbTotalReceived - chkbTotalPaid;

  const gbtTotalReceived = gbtData.reduce((s, r) => s + r.receivedAmount, 0);
  const gbtTotalPaid = gbtData.reduce((s, r) => s + r.paidAmount, 0);
  const gbtBalance = gbtTotalReceived - gbtTotalPaid;

  const totalPensioners = pensionersData.length;
  const livingPensioners = pensionersData.filter(p => p.isAlive);
  const verifiedCount = livingPensioners.filter(p => p.isVerified).length;
  const verifiedOnline = livingPensioners.filter(p => p.isVerified && p.verificationChannel === 'ยืนยันตัวตนออนไลน์').length;
  const verifiedInPerson = livingPensioners.filter(p => p.isVerified && p.verificationChannel === 'แสดงตนที่กองคลัง').length;
  const unverifiedCount = livingPensioners.filter(p => !p.isVerified).length;
  const deceasedCount = pensionersData.filter(p => !p.isAlive).length;

  const regularPensionTotal = livingPensioners.reduce((s, p) => s + (p.regularPension || 0), 0);
  const livingGratuityCount = livingPensioners.filter(p => (p.livingGratuity || 0) > 0).length;
  const livingGratuityTotal = livingPensioners.reduce((s, p) => s + (p.livingGratuity || 0), 0);

  const bonus25Count = livingPensioners.filter(p => (p.bonus25Total || 0) > 0).length;
  const bonus25Total = livingPensioners.reduce((s, p) => s + (p.bonus25Total || 0), 0);
  const bonus25Budget = livingPensioners.reduce((s, p) => s + (p.bonus25Budget || 0), 0);
  const bonus25Deposit = livingPensioners.reduce((s, p) => s + (p.bonus25Deposit || 0), 0);
  const bonus25BudgetCount = livingPensioners.filter(p => (p.bonus25Budget || 0) > 0).length;
  const bonus25DepositCount = livingPensioners.filter(p => (p.bonus25Deposit || 0) > 0).length;

  const age60Count = livingPensioners.filter(p => p.age === 60 || p.ageGroup === '60').length;
  const age65Count = livingPensioners.filter(p => p.age === 65 || p.ageGroup === '65').length;
  const age70Count = livingPensioners.filter(p => p.age === 70 || p.ageGroup === '70').length;

  // Gratuity statistics
  const gratuityTotalCount = gratuityData.length;
  const gratuityLiving = gratuityData.filter(g => g.isAlive);
  const gratuityDeceased = gratuityData.filter(g => !g.isAlive);
  const gratuityVerified = gratuityLiving.filter(g => g.isVerified).length;
  const gratuityUnverified = gratuityLiving.filter(g => !g.isVerified).length;
  const totalGratuityCalculated = gratuityData.reduce(
    (s, g) => s + (g.gratuityAmount || Math.round((g.lastSalary || 0) * (g.serviceYears || 0)) || 0),
    0
  );
  const gratuityVerifiedAmount = gratuityLiving
    .filter(g => g.isVerified)
    .reduce((s, g) => s + (g.gratuityAmount || Math.round((g.lastSalary || 0) * (g.serviceYears || 0)) || 0), 0);
  const gratuityUnverifiedAmount = gratuityLiving
    .filter(g => !g.isVerified)
    .reduce((s, g) => s + (g.gratuityAmount || Math.round((g.lastSalary || 0) * (g.serviceYears || 0)) || 0), 0);
  const gratuityDeceasedAmount = gratuityDeceased.reduce(
    (s, g) => s + (g.gratuityAmount || Math.round((g.lastSalary || 0) * (g.serviceYears || 0)) || 0),
    0
  );

  const formattedDate = formatThaiDate(memoDate, true);

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>บันทึกข้อความราชการ เทศบาลเมืองมหาสารคาม</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: 210mm 297mm; /* A4 */
    margin: 25mm 20mm 20mm 25mm;
    mso-page-orientation: portrait;
  }
  body {
    font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', CordiaUPC, AngsanaUPC, sans-serif;
    font-size: 16pt;
    line-height: 1.25;
    color: #000;
  }
  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12pt;
  }
  .header-table td {
    padding: 0;
    vertical-align: top;
  }
  .memo-title {
    font-size: 29pt;
    font-weight: bold;
    text-align: center;
    letter-spacing: 2px;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10pt;
    font-size: 16pt;
  }
  .meta-table td {
    padding: 2pt 0;
    vertical-align: top;
  }
  .bold {
    font-weight: bold;
  }
  .dotted {
    border-bottom: 1px dotted #000;
  }
  p {
    margin: 0 0 8pt 0;
    text-align: justify;
    text-justify: inter-cluster;
    text-indent: 2.5cm;
  }
  p.no-indent {
    text-indent: 0;
  }
  .section-title {
    font-weight: bold;
    margin-top: 10pt;
    margin-bottom: 4pt;
    text-indent: 1.5cm;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8pt 0 12pt 0;
    font-size: 15pt;
  }
  .data-table th, .data-table td {
    border: 1px solid #000;
    padding: 4pt 6pt;
    text-align: left;
  }
  .data-table th {
    background-color: #f2f2f2;
    text-align: center;
    font-weight: bold;
  }
  .text-right {
    text-align: right;
  }
  .text-center {
    text-align: center;
  }
  .signatures-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 30pt;
    page-break-inside: avoid;
  }
  .signatures-table td {
    width: 33.33%;
    text-align: center;
    vertical-align: top;
    padding: 8pt;
    font-size: 15pt;
  }
</style>
</head>
<body>

<table class="header-table">
  <tr>
    <td style="width: 100%; text-align: center;">
      <div class="memo-title">บันทึกข้อความ</div>
    </td>
  </tr>
</table>

<table class="meta-table">
  <tr>
    <td style="width: 55%;"><span class="bold">ส่วนราชการ</span> เทศบาลเมืองมหาสารคาม กองคลัง โทร. 043-711-423</td>
    <td style="width: 45%;"><span class="bold">ที่</span> มค 52004/ว 2570</td>
  </tr>
  <tr>
    <td><span class="bold">วันที่</span> ${formattedDate}</td>
    <td><span class="bold">เรื่อง</span> รายงานผลการดำเนินงานระบบ E-Office กองทุน ช.ค.บ., ก.บ.ท. และสถิติข้าราชการบำนาญ ปีงบประมาณ 2570</td>
  </tr>
</table>

<p class="no-indent" style="margin-bottom: 12pt;"><span class="bold">เรียน</span> นายกเทศมนตรีเมืองมหาสารคาม</p>

<p>
ตามที่เทศบาลเมืองมหาสารคาม ได้ดำเนินงานบริหารจัดการงานสารบรรณอิเล็กทรอนิกส์ (E-Office) การเบิกจ่ายเงินช่วยค่าครองชีพผู้รับเบี้ยหวัดบำนาญ (ช.ค.บ.) กองทุนบำเหน็จบำนาญข้าราชการส่วนท้องถิ่น (ก.บ.ท.) ตลอดจนการติดตามและดูแลสิทธิประโยชน์ของข้าราชการบำนาญ ประจำปีงบประมาณ 2570 นั้น
</p>

<p>
กองคลัง ร่วมกับฝ่ายบริหารงานทั่วไป สำนักปลัดเทศบาล ขอรายงานผลการดำเนินงานและสถิติข้อมูลสำคัญ จำแนกตาม ๔ ส่วนงาน ดังนี้
</p>

<!-- ส่วนที่ ๑ -->
<div class="section-title">ส่วนที่ ๑ สรุปการใช้งานระบบ E-Office ฝ่ายบริหารงานทั่วไป</div>
<p>
ในการปฏิบัติงานสารบรรณอิเล็กทรอนิกส์ ได้มีการรับหนังสือ และการส่งหนังสือออกราชการประจำวัน สรุปรวมได้ดังนี้:
</p>
<table class="data-table">
  <thead>
    <tr>
      <th style="width: 10%;">ลำดับ</th>
      <th style="width: 60%;">ประเภทการดำเนินงาน E-Office</th>
      <th style="width: 30%;">จำนวน (เรื่อง)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="text-center">1</td>
      <td>การรับหนังสือเข้าสู่ระบบ</td>
      <td class="text-center bold">${formatNumber(eOfficeIn)}</td>
    </tr>
    <tr>
      <td class="text-center">2</td>
      <td>การส่งหนังสือออก</td>
      <td class="text-center bold">${formatNumber(eOfficeOut)}</td>
    </tr>
    <tr style="background-color: #fafafa;">
      <td colspan="2" class="text-center bold">รวมการดำเนินงานหนังสือทั้งสิ้น</td>
      <td class="text-center bold">${formatNumber(eOfficeIn + eOfficeOut)} เรื่อง</td>
    </tr>
  </tbody>
</table>

<!-- ส่วนที่ ๒ -->
<div class="section-title">ส่วนที่ ๒ สรุปสถานะการเงินกองทุน ช.ค.บ. และ ก.บ.ท.</div>
<p>
สถานะการรับ-จ่ายเงินและการคงเหลือสุทธิของกองทุนช่วยเหลือและสิทธิประโยชน์ มีรายละเอียดดังนี้:
</p>
<table class="data-table">
  <thead>
    <tr>
      <th>รายการกองทุน</th>
      <th>รับเงินรวม (บาท)</th>
      <th>จ่ายเงินรวม (บาท)</th>
      <th>คงเหลือสุทธิ (บาท)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1. เงินช่วยค่าครองชีพผู้รับเบี้ยหวัดบำนาญ (ช.ค.บ.)</td>
      <td class="text-right">${formatCurrency(chkbTotalReceived)}</td>
      <td class="text-right">${formatCurrency(chkbTotalPaid)}</td>
      <td class="text-right bold">${formatCurrency(chkbBalance)}</td>
    </tr>
    <tr>
      <td>2. กองทุนบำเหน็จบำนาญข้าราชการส่วนท้องถิ่น (ก.บ.ท.)</td>
      <td class="text-right">${formatCurrency(gbtTotalReceived)}</td>
      <td class="text-right">${formatCurrency(gbtTotalPaid)}</td>
      <td class="text-right bold">${formatCurrency(gbtBalance)}</td>
    </tr>
  </tbody>
</table>

<!-- ส่วนที่ ๓ -->
<div class="section-title">ส่วนที่ ๓ รายงานจำนวนผู้รับบำนาญและการยืนยันตัวตน ปีงบประมาณ 2570</div>
<p>
จำนวนข้าราชการบำนาญในสังกัดเทศบาลเมืองมหาสารคามทั้งหมด ${formatNumber(totalPensioners)} ราย (มีชีวิต ${formatNumber(livingPensioners.length)} ราย, ถึงแก่กรรม ${formatNumber(deceasedCount)} ราย) โดยสถานะการยืนยันตัวตนของผู้ที่มีชีวิต สรุปได้ดังนี้:
</p>
<table class="data-table">
  <thead>
    <tr>
      <th>สถานะการยืนยันตัวตน</th>
      <th>จำนวน (ราย)</th>
      <th>ร้อยละ</th>
      <th>หมายเหตุ</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1. ยืนยันตัวตนแล้ว</td>
      <td class="text-center bold">${formatNumber(verifiedCount)}</td>
      <td class="text-center">${livingPensioners.length ? ((verifiedCount / livingPensioners.length) * 100).toFixed(2) : 0}%</td>
      <td>ออนไลน์ ${formatNumber(verifiedOnline)} ราย / ณ กองคลัง ${formatNumber(verifiedInPerson)} ราย</td>
    </tr>
    <tr>
      <td>2. ยังไม่ได้ยืนยันตัวตน</td>
      <td class="text-center bold" style="color: #c00;">${formatNumber(unverifiedCount)}</td>
      <td class="text-center">${livingPensioners.length ? ((unverifiedCount / livingPensioners.length) * 100).toFixed(2) : 0}%</td>
      <td>อยู่ระหว่างติดตามสิทธิและประสานงานโดยตรง</td>
    </tr>
    <tr style="background-color: #fafafa;">
      <td class="bold">รวมผู้รับบำนาญที่มีชีวิต</td>
      <td class="text-center bold">${formatNumber(livingPensioners.length)}</td>
      <td class="text-center bold">100.00%</td>
      <td>-</td>
    </tr>
  </tbody>
</table>

<!-- ส่วนที่ ๔ -->
<div class="section-title">ส่วนที่ ๔ สรุปข้าราชการบำนาญจำแนกประเภทและเกณฑ์อายุ</div>
<p>
การจำแนกประเภทเงินสิทธิประโยชน์และสถิติตามเกณฑ์อายุ มีรายละเอียดดังต่อไปนี้:
</p>
<table class="data-table">
  <thead>
    <tr>
      <th>หมวดหมู่รายงานเฉพาะ</th>
      <th>จำนวน (ราย)</th>
      <th>จำนวนเงินรวม (บาท)</th>
      <th>รายละเอียดแหล่งเงินทุน</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1. เงินบำนาญปกติ</td>
      <td class="text-center">${formatNumber(livingPensioners.length)}</td>
      <td class="text-right bold">${formatCurrency(regularPensionTotal)}</td>
      <td>ยอดจ่ายประจำเดือน</td>
    </tr>
    <tr>
      <td>2. เงินบำเหน็จดำรงชีพ</td>
      <td class="text-center">${formatNumber(livingGratuityCount)}</td>
      <td class="text-right bold">${formatCurrency(livingGratuityTotal)}</td>
      <td>ตามเกณฑ์อายุครบ 60 ปี, 65 ปี และ 70 ปี</td>
    </tr>
    <tr>
      <td>3. เงินเพิ่ม 25% (จากงบประมาณ)</td>
      <td class="text-center">${formatNumber(bonus25BudgetCount)}</td>
      <td class="text-right bold">${formatCurrency(bonus25Budget)}</td>
      <td>เบิกจ่ายจากงบประมาณเทศบาล / เงินอุดหนุน</td>
    </tr>
    <tr>
      <td>4. ช.ค.บ (งบประมาณ)</td>
      <td class="text-center">${formatNumber(bonus25DepositCount)}</td>
      <td class="text-right bold">${formatCurrency(bonus25Deposit)}</td>
      <td>เบิกจ่ายจากงบประมาณเงินช่วยค่าครองชีพ ช.ค.บ</td>
    </tr>
    <tr>
      <td>5. ผู้รับบำนาญเสียชีวิต</td>
      <td class="text-center bold">${formatNumber(deceasedCount)}</td>
      <td class="text-center">-</td>
      <td>บันทึกข้อมูลทายาทผู้มีสิทธิรับบำเหน็จตกทอดครบถ้วน</td>
    </tr>
  </tbody>
</table>

<p>
สถิติจำแนกกลุ่มอายุตามเงื่อนไขที่กำหนด:
<br/>
• กลุ่มอายุครบ 60 ปี: จำนวน ${formatNumber(age60Count)} ราย
<br/>
• กลุ่มอายุครบ 65 ปี: จำนวน ${formatNumber(age65Count)} ราย
<br/>
• กลุ่มอายุครบ 70 ปี: จำนวน ${formatNumber(age70Count)} ราย
</p>

<!-- ส่วนที่ ๕ -->
<div class="section-title">ส่วนที่ ๕ สรุปรายงานผู้รับบำเหน็จและระบบคำนวณเงิน</div>
<p>
ตามระเบียบเงินบำเหน็จลูกจ้างและข้าราชการส่วนท้องถิ่น กำหนดให้คำนวณจาก <u>เงินเดือนที่ได้รับครั้งสุดท้าย × อายุราชการ</u> ผู้รับบำเหน็จในทะเบียนทั้งสิ้น ${formatNumber(gratuityTotalCount)} ราย ยอดเงินคำนวณรวมทั้งสิ้น ${formatCurrency(totalGratuityCalculated)} บาท มีสถานะการมีชีวิตและการยืนยันตัวตน ดังนี้:
</p>
<table class="data-table">
  <thead>
    <tr>
      <th>กลุ่มสถานะผู้รับบำเหน็จ</th>
      <th>จำนวน (ราย)</th>
      <th>ยอดเงินบำเหน็จรวม (บาท)</th>
      <th>รายละเอียดการยืนยันตัวตน / ทายาท</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1. ผู้รับบำเหน็จมีชีวิต (ยืนยันตัวตนแล้ว)</td>
      <td class="text-center bold">${formatNumber(gratuityVerified)}</td>
      <td class="text-right bold">${formatCurrency(gratuityVerifiedAmount)}</td>
      <td>ยืนยันตัวตนและตรวจสอบสิทธิเรียบร้อย พร้อมดำเนินการเบิกจ่าย</td>
    </tr>
    <tr>
      <td>2. ผู้รับบำเหน็จมีชีวิต (ยังไม่ยืนยันตัวตน)</td>
      <td class="text-center bold" style="color: #b45309;">${formatNumber(gratuityUnverified)}</td>
      <td class="text-right bold" style="color: #b45309;">${formatCurrency(gratuityUnverifiedAmount)}</td>
      <td>อยู่ระหว่างประสานงานให้เข้ายืนยันตัวตนออนไลน์หรือแสดงตน ณ กองคลัง</td>
    </tr>
    <tr>
      <td>3. ถึงแก่กรรม (บำเหน็จตกทอดแก่ทายาท)</td>
      <td class="text-center bold" style="color: #c00;">${formatNumber(gratuityDeceased.length)}</td>
      <td class="text-right bold" style="color: #c00;">${formatCurrency(gratuityDeceasedAmount)}</td>
      <td>บันทึกข้อมูลทายาทผู้มีสิทธิรับเงินบำเหน็จตกทอดและสัดส่วนครบถ้วน</td>
    </tr>
    <tr style="background-color: #f2f2f2;">
      <td class="bold">รวมผู้รับบำเหน็จทั้งสิ้น</td>
      <td class="text-center bold">${formatNumber(gratuityTotalCount)}</td>
      <td class="text-right bold">${formatCurrency(totalGratuityCalculated)}</td>
      <td>สูตรคำนวณ: เงินเดือนที่ได้รับครั้งสุดท้าย × อายุราชการ</td>
    </tr>
  </tbody>
</table>

<p style="margin-top: 16pt;">
จึงเรียนมาเพื่อโปรดทราบและพิจารณาอนุมัติ
</p>

<!-- Signature Section (3 Positions, NO NAMES) -->
<table class="signatures-table">
  <tr>
    <td>
      <br/><br/>
      ลงชื่อ......................................................<br/><br/>
      (......................................................)<br/><br/>
      <span class="bold">เจ้าหน้าที่ฝ่ายบริหารงานทั่วไป</span><br/>
      ผู้รายงาน
    </td>
    <td>
      <br/><br/>
      ลงชื่อ......................................................<br/><br/>
      (......................................................)<br/><br/>
      <span class="bold">ผู้อำนวยการกองคลัง</span><br/>
      ผู้ตรวจสอบ
    </td>
    <td>
      <br/><br/>
      ลงชื่อ......................................................<br/><br/>
      (......................................................)<br/><br/>
      <span class="bold">นายกเทศมนตรีเมืองมหาสารคาม</span><br/>
      ผู้พิจารณาอนุมัติ
    </td>
  </tr>
</table>

</body>
</html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `บันทึกข้อความ_เทศบาลเมืองมหาสารคาม_ปีงบประมาณ_2570.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
