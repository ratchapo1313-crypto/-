import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  AlertCircle,
  Building2,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { RoleType, UserSession } from '../types';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = usernameInput.trim();
    const cleanPassword = passwordInput.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านให้ครบถ้วน');
      return;
    }

    const lower = cleanUsername.toLowerCase();
    let matchedRole: RoleType | null = null;
    let usernameDisplay = '';
    let roleTitle = '';
    let description = '';
    let expectedPassword = '';

    if (lower === 'user' || lower === 'เจ้าหน้าที่') {
      matchedRole = 'User';
      usernameDisplay = 'User';
      roleTitle = 'เจ้าหน้าที่ (User)';
      description =
        'สิทธิ์บันทึกข้อมูลประจำวัน สามารถเข้าสู่ระบบพร้อมกันได้ โดยใช้ ผู้ใช้ User | รหัสผ่าน: 1234 , User1 | รหัสผ่าน: 4567 , User2 | รหัสผ่าน: 8910 ได้ สามารถกรอกข้อมูลแล้วเห็นข้อมูลที่แต่ละผู้ใช้งานได้ และอัพเดทอัตโนมัติให้เห็นข้อมูลทั้งหมดที่กรอกลงไปได้และจัดเก็บฐานข้อมูลไว้ , นำเข้า-ส่งออก';
      expectedPassword = '1234';
    } else if (lower === 'user1' || lower === 'เจ้าหน้าที่ 1' || lower === 'เจ้าหน้าที่1') {
      matchedRole = 'User';
      usernameDisplay = 'User1';
      roleTitle = 'เจ้าหน้าที่ (User1)';
      description =
        'สิทธิ์บันทึกข้อมูลประจำวัน สามารถเข้าสู่ระบบพร้อมกันได้ โดยใช้ ผู้ใช้ User | รหัสผ่าน: 1234 , User1 | รหัสผ่าน: 4567 , User2 | รหัสผ่าน: 8910 ได้ สามารถกรอกข้อมูลแล้วเห็นข้อมูลที่แต่ละผู้ใช้งานได้ และอัพเดทอัตโนมัติให้เห็นข้อมูลทั้งหมดที่กรอกลงไปได้และจัดเก็บฐานข้อมูลไว้ , นำเข้า-ส่งออก';
      expectedPassword = '4567';
    } else if (lower === 'user2' || lower === 'เจ้าหน้าที่ 2' || lower === 'เจ้าหน้าที่2') {
      matchedRole = 'User';
      usernameDisplay = 'User2';
      roleTitle = 'เจ้าหน้าที่ (User2)';
      description =
        'สิทธิ์บันทึกข้อมูลประจำวัน สามารถเข้าสู่ระบบพร้อมกันได้ โดยใช้ ผู้ใช้ User | รหัสผ่าน: 1234 , User1 | รหัสผ่าน: 4567 , User2 | รหัสผ่าน: 8910 ได้ สามารถกรอกข้อมูลแล้วเห็นข้อมูลที่แต่ละผู้ใช้งานได้ และอัพเดทอัตโนมัติให้เห็นข้อมูลทั้งหมดที่กรอกลงไปได้และจัดเก็บฐานข้อมูลไว้ , นำเข้า-ส่งออก';
      expectedPassword = '8910';
    } else if (
      lower === 'director' ||
      lower === 'กองคลัง' ||
      lower === 'ผู้อำนวยการกองคลัง' ||
      lower === 'ยังไงก็กองคลัง'
    ) {
      matchedRole = 'Director';
      usernameDisplay = 'Director';
      roleTitle = 'ผู้อำนวยการกองคลัง';
      description = 'ตรวจสอบรายงาน สามารถเข้าสู่ระบบพร้อมกันได้หลายครั้ง';
      expectedPassword = '1234';
    } else if (
      lower === 'executive' ||
      lower === 'ผู้บริหาร' ||
      lower === 'นายกเทศมนตรี'
    ) {
      matchedRole = 'Executive';
      usernameDisplay = 'Executive';
      roleTitle = 'ผู้บริหารเทศบาล';
      description = 'สิทธิ์ดูสรุปผลทั้งเทศบาล สามารถเข้าสู่ระบบพร้อมกันได้หลายครั้ง';
      expectedPassword = '1234';
    }

    if (!matchedRole || cleanPassword !== expectedPassword) {
      setErrorMessage(
        'ระบบตรวจสอบสิทธิ์: บัญชีผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง — อนุญาตเฉพาะบัญชีที่ระบุไว้เท่านั้น (หากไม่ใช่จะไม่สามารถเข้าใช้งานได้)'
      );
      return;
    }

    onLoginSuccess({
      username: usernameDisplay,
      roleTitle,
      roleCode: matchedRole,
      description,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 flex flex-col justify-between text-slate-100 font-sans antialiased relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Top Banner / Gov Brand Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-amber-300 shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-amber-300 tracking-wide">
              เทศบาลเมืองมหาสารคาม จังหวัดมหาสารคาม
            </div>
            <div className="text-[11px] text-blue-200">ฝ่ายบริหารงานทั่วไป กองคลัง</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            ปีงบประมาณ 2570
          </span>
        </div>
      </header>

      {/* Centered Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-6 text-white text-center relative">
              <div className="mx-auto w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-2.5 border border-white/20 shadow-inner">
                <ShieldCheck className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold tracking-wide">เข้าสู่ระบบการทำงาน</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                เทศบาลเมืองมหาสารคาม • ปีงบประมาณ 2570
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อผู้ใช้งาน (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="ระบุชื่อผู้ใช้งาน (เช่น User, Director, Executive)"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    รหัสผ่าน (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> ซ่อนรหัสผ่าน
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> แสดงรหัสผ่าน
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-end mt-1 text-[11px] text-slate-400">
                  <span className="text-slate-500 font-medium">ระดับความปลอดภัยราชการ</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-blue-800 hover:bg-blue-900 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                เข้าสู่ระบบการทำงาน
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick 1-Click Login Selection (ตามเงื่อนไขผู้ใช้งาน) */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    เลือกเข้าสู่ระบบด่วน 1-Click (ดึงฐานข้อมูลล่าสุด):
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Auto-Sync
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {/* Option 1: User */}
                  <button
                    type="button"
                    onClick={() => {
                      setUsernameInput('User');
                      setPasswordInput('1234');
                      onLoginSuccess({
                        username: 'User',
                        roleTitle: 'เจ้าหน้าที่ (User)',
                        roleCode: 'User',
                        description:
                          'สิทธิ์บันทึกข้อมูลประจำวัน สามารถเข้าสู่ระบบพร้อมกันได้ โดยใช้ ผู้ใช้ User | รหัสผ่าน: 1234 , User1 | รหัสผ่าน: 4567 , User2 | รหัสผ่าน: 8910 ได้ สามารถกรอกข้อมูลแล้วเห็นข้อมูลที่แต่ละผู้ใช้งานได้ และอัพเดทอัตโนมัติให้เห็นข้อมูลทั้งหมดที่กรอกลงไปได้และจัดเก็บฐานข้อมูลไว้ , นำเข้า-ส่งออก',
                      });
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/60 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        👤
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                          เจ้าหน้าที่ : User
                        </div>
                        <div className="text-[11px] text-slate-500">รหัสผ่าน: 1234 • สิทธิ์บันทึก/แก้ไขข้อมูล</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                      เข้าสู่ระบบ →
                    </span>
                  </button>

                  {/* Option 2: Director */}
                  <button
                    type="button"
                    onClick={() => {
                      setUsernameInput('Director');
                      setPasswordInput('1234');
                      onLoginSuccess({
                        username: 'Director',
                        roleTitle: 'ผู้อำนวยการกองคลัง',
                        roleCode: 'Director',
                        description: 'ตรวจสอบรายงาน สามารถเข้าสู่ระบบพร้อมกันได้หลายครั้ง',
                      });
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/60 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        🏛️
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-amber-900">
                          ผู้อำนวยการกองคลัง : Director
                        </div>
                        <div className="text-[11px] text-slate-500">รหัสผ่าน: 1234 • สิทธิ์ตรวจสอบและอนุมัติรายงาน</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                      เข้าสู่ระบบ →
                    </span>
                  </button>

                  {/* Option 3: Executive */}
                  <button
                    type="button"
                    onClick={() => {
                      setUsernameInput('Executive');
                      setPasswordInput('1234');
                      onLoginSuccess({
                        username: 'Executive',
                        roleTitle: 'ผู้บริหารเทศบาล',
                        roleCode: 'Executive',
                        description: 'สิทธิ์ดูสรุปผลทั้งเทศบาล สามารถเข้าสู่ระบบพร้อมกันได้หลายครั้ง',
                      });
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/60 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        🎖️
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-purple-900">
                          ผู้บริหาร : Executive / ผู้บริหาร
                        </div>
                        <div className="text-[11px] text-slate-500">รหัสผ่าน: 1234 • สิทธิ์ติดตามและสรุปผลทั้งเทศบาล</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-purple-700 group-hover:translate-x-0.5 transition-transform">
                      เข้าสู่ระบบ →
                    </span>
                  </button>
                </div>

                {/* Additional accounts */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>บัญชีเจ้าหน้าที่เพิ่มเติม:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUsernameInput('User1');
                        setPasswordInput('4567');
                        onLoginSuccess({
                          username: 'User1',
                          roleTitle: 'เจ้าหน้าที่ (User1)',
                          roleCode: 'User',
                          description: 'สิทธิ์บันทึกข้อมูลประจำวัน รหัสผ่าน 4567',
                        });
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium cursor-pointer"
                    >
                      User1 (4567)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUsernameInput('User2');
                        setPasswordInput('8910');
                        onLoginSuccess({
                          username: 'User2',
                          roleTitle: 'เจ้าหน้าที่ (User2)',
                          roleCode: 'User',
                          description: 'สิทธิ์บันทึกข้อมูลประจำวัน รหัสผ่าน 8910',
                        });
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium cursor-pointer"
                    >
                      User2 (8910)
                    </button>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>
                    เมื่อเข้าสู่ระบบ ทุกบทบาทจะดึงฐานข้อมูล เพิ่ม-ลบ-แก้ไข ล่าสุดจาก Firebase Firestore & Server อัตโนมัติทุกครั้ง
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-black/20 py-4 text-center text-xs text-slate-400 px-4">
        <p>
          ระบบรายงานผลและสถิติของผู้ดูแลระบบบำนาญ • ฝ่ายบริหารงานทั่วไป กองคลัง เทศบาลเมืองมหาสารคาม จังหวัดมหาสารคาม
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          สงวนลิขสิทธิ์ตามระเบียบงานสารบรรณและการบริหารงานคลังท้องถิ่น ประจำปีงบประมาณ 2570
        </p>
      </footer>
    </div>
  );
}
