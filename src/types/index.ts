export type RoleType = 'User' | 'Director' | 'Executive';

export interface UserSession {
  username: string; // 'User' | 'User1' | 'User2' | 'Director' | 'Executive'
  roleTitle: string; // "เจ้าหน้าที่ (User)" | "ผู้อำนวยการกองคลัง" | "ผู้บริหาร"
  roleCode: RoleType;
  description: string;
}

export interface EOfficeRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'in' | 'out'; // การรับหนังสือ, การส่งหนังสือออก (มีแค่ 2 ประเภท)
  docNumber: string; // เลขที่รับ-ส่งล่าสุด
  title: string; // เรื่องสำคัญ
  department: string; // หน่วยงาน
  note: string; // หมายเหตุ
  status: 'completed' | 'in_progress' | 'urgent';
  quantity?: number; // จำนวนตัวเลขที่บวกเพิ่มในประจำวัน (เรื่อง)
  recordedBy?: string; // ผู้บันทึก/ปรับยอด เช่น 'User', 'User1', 'User2'
  updatedAt?: string;
}

export interface FinancialFundRecord {
  id: string;
  date: string; // YYYY-MM-DD
  source: string; // รับเงินจากที่ไหน
  receivedAmount: number; // รับเงินจำนวนเท่าไหร่ (บาท)
  paidAmount: number; // จ่ายไปเท่าไหร่ (บาท)
  netBalance: number; // คงเหลือสุทธิ (คำนวณอัตโนมัติ)
  note: string; // หมายเหตุ
  beneficiaryCount: number; // จำนวนราย
  recordedBy?: string;
  updatedAt?: string;
}

export interface HeirBeneficiary {
  id: string;
  name: string; // ชื่อ-นามสกุล ทายาท
  relation: string; // ความสัมพันธ์ เช่น บุตร, คู่สมรส, บิดา, มารดา
  percentage: number; // เปอร์เซ็นต์การได้รับบำเหน็จตกทอด (%)
  phone?: string; // เบอร์โทรศัพท์
}

export type AgeFilterGroup = 'all' | '60' | '65' | '70' | '75' | 'deceased';

export interface PensionerRecord {
  id: string;
  code: string; // รหัสบำนาญ บน-2570-xxx
  title: string; // นาย / นาง / นางสาว / ว่าที่ ร.ต.
  firstName: string;
  lastName: string;
  idCard: string; // 13 หลัก
  formerPosition: string; // ตำแหน่งเดิมก่อนเกษียณ
  birthDate: string; // วันเกิด
  age: number; // อายุ
  ageGroup: '60' | '65' | '70' | '75' | 'other'; // กลุ่มอายุตามเกณฑ์
  isAlive: boolean; // มีชีวิต / ถึงแก่กรรม
  deathDate?: string; // วันที่ถึงแก่กรรม (ถ้ามี)
  
  // ทายาทผู้มีสิทธิขอรับบำเหน็จตกทอด
  heirName?: string; // ชื่อทายาทหลัก
  heirRelation?: string; // ความสัมพันธ์
  heirPercentage?: number; // เปอร์เซ็นต์การได้รับบำเหน็จตกทอด (%)
  heirPhone?: string; // เบอร์โทรศัพท์ทายาท
  heirs?: HeirBeneficiary[]; // รายการทายาทผู้มีสิทธิ (รองรับกรณีมีทายาทมากกว่า 1 คน)
  
  // ทายาทผู้มีสิทธิรับเงินช่วยพิเศษ 3 เท่า (กำหนดให้รับแค่ 1 คน ได้ 100%)
  special3xHeirName?: string; // ชื่อ-สกุล ทายาทผู้มีสิทธิรับเงินช่วยพิเศษ 3 เท่า
  special3xAmount?: number; // จำนวนเงินช่วยพิเศษ 3 เท่า (บาท)
  special3xRelation?: string; // ความสัมพันธ์
  special3xPhone?: string; // เบอร์โทรศัพท์ทายาทเงินช่วยพิเศษ 3 เท่า
  
  // สถานะการยืนยันตัวตน
  isVerified: boolean;
  verifiedDate?: string;
  verificationChannel?: 'ยืนยันตัวตนออนไลน์' | 'แสดงตนที่กองคลัง';

  // ข้อมูลการเงินบำนาญ
  regularPension: number; // เงินบำนาญปกติ (บาท/เดือน)
  
  // เงินบำเหน็จดำรงชีพ (ตามเกณฑ์ 60/65/70 ปี)
  livingGratuityInstallment1?: number; // งวดที่ 1 (อายุครบ 60 ปี) สูงสุด 200,000 บาท
  livingGratuityInstallment2?: number; // งวดที่ 2 (อายุครบ 65 ปี) สูงสุด 200,000 บาท
  livingGratuityInstallment3?: number; // งวดที่ 3 (อายุครบ 70 ปี) ส่วนที่เหลือ รวมไม่เกิน 500,000 บาท
  livingGratuity: number; // เงินบำเหน็จดำรงชีพรวม (บาท)
  livingGratuityStatus: 'eligible_60' | 'eligible_65' | 'eligible_70' | 'claimed' | 'not_eligible';
  
  bonus25Total: number; // เงินเพิ่ม 25% รวม
  bonus25Budget: number; // จากงบประมาณ
  bonus25Deposit: number; // เงินรับฝาก
  
  chkbAmount: number; // เงิน ช.ค.บ.
  recordedBy?: string; // บันทึกโดยผู้ใช้ เช่น 'User', 'User1', 'User2'
  updatedAt?: string;
}

export interface GratuityRecipientRecord {
  id: string; // เช่น 'GRAT-2570-001'
  code: string; // รหัสบำเหน็จ เช่น เหน็จ-2570-001
  title: string; // นาย / นาง / นางสาว / ว่าที่ ร.ต.
  firstName: string; // ชื่อ
  lastName: string; // นามสกุล
  idCard: string; // เลขประจำตัวประชาชน 13 หลัก
  formerPosition: string; // ตำแหน่งเดิมก่อนลาออก/เกษียณ
  department?: string; // สังกัด/กอง
  
  // การคำนวณเงินบำเหน็จ
  lastSalary: number; // เงินเดือนที่ได้รับครั้งสุดท้าย (บาท)
  serviceYears: number; // อายุราชการ (ปี)
  serviceMonths?: number; // เศษเดือนราชการ
  gratuityAmount: number; // ยอดเงินบำเหน็จคำนวณได้ = เงินเดือนที่ได้รับครั้งสุดท้าย × อายุราชการ
  
  // สถานะการมีชีวิต
  isAlive: boolean; // มีชีวิต / ถึงแก่กรรม
  deathDate?: string; // วันที่ถึงแก่กรรม (ถ้ามี)
  
  // สถานะการยืนยันตัวตน
  isVerified: boolean; // ยืนยันตัวตนแล้ว / ยังไม่ได้ยืนยันตัวตน
  verifiedDate?: string; // วันที่ยืนยันตัวตน
  verificationChannel?: 'ยืนยันตัวตนออนไลน์' | 'แสดงตนที่กองคลัง';
  
  // ทายาทผู้มีสิทธิขอรับบำเหน็จตกทอด (กรณีถึงแก่กรรม หรือระบุไว้ล่วงหน้า)
  heirName?: string; // ชื่อ-นามสกุลทายาท
  heirRelation?: string; // ความสัมพันธ์
  heirPercentage?: number; // เปอร์เซ็นต์การได้รับบำเหน็จตกทอด (%)
  heirPhone?: string; // เบอร์โทรศัพท์ทายาท
  
  paymentDate?: string; // วันที่อนุมัติ/จ่ายเงินบำเหน็จ
  note?: string; // หมายเหตุ
  recordedBy?: string; // บันทึกโดยผู้ใช้ เช่น 'User', 'User1', 'User2'
  updatedAt?: string;
}

export interface ArticleRecord {
  id: string;
  title: string; // ชื่อบทความ / งานวิจัย
  category: 'บำเหน็จบำนาญ' | 'กองทุน ช.ค.บ./ก.บ.ท.' | 'สารบรรณ E-Office' | 'วิจัยและนวัตกรรมการคลัง' | 'ระเบียบกฎหมายท้องถิ่น';
  summary: string; // สรุปย่อสาระสำคัญ
  content: string; // เนื้อหาบทความ / ผลการวิจัย
  author: string; // ผู้จัดทำ / คณะผู้วิจัย / แหล่งอ้างอิง
  publishDate: string; // วันที่เผยแพร่ YYYY-MM-DD
  readTimeMinutes: number; // เวลาอ่านโดยประมาณ (นาที)
  tags: string[]; // คำค้นหา
  isPinned?: boolean; // ปักหมุดบทความสำคัญ
  recordedBy?: string;
  updatedAt?: string;
}

