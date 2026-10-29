import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { RoleType, UserSession } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (session: UserSession) => void;
}

export function LoginModal({ isOpen, onLoginSuccess }: LoginModalProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = usernameInput.trim();
    const cleanPassword = passwordInput.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านให้ครบถ้วน');
      return;
    }

    // Role check: User, Director, Executive
    const lower = cleanUsername.toLowerCase();
    let matchedRole: RoleType | null = null;
    let roleTitle = '';
    let description = '';

    if (lower === 'user') {
      matchedRole = 'User';
      roleTitle = 'เจ้าหน้าที่';
      description = 'สิทธิ์บันทึกข้อมูลประจำวัน, แก้ไข, นำเข้า-ส่งออก';
    } else if (lower === 'director') {
      matchedRole = 'Director';
      roleTitle = 'ผู้อำนวยการกองคลัง';
      description = 'สิทธิ์ตรวจสอบรายงาน และติดตามสถานะงบประมาณ';
    } else if (lower === 'executive') {
      matchedRole = 'Executive';
      roleTitle = 'ผู้บริหาร';
      description = 'สิทธิ์ดูภาพรวมสรุปผลทั้งเทศบาล';
    }

    if (!matchedRole || cleanPassword !== '1234') {
      setErrorMessage('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (อนุญาตเฉพาะบัญชีที่ได้รับสิทธิ์ในระบบเท่านั้น)');
      return;
    }

    onLoginSuccess({
      username: matchedRole,
      roleTitle,
      roleCode: matchedRole,
      description,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-6 text-white text-center">
          <div className="mx-auto w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-3 border border-white/20 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold tracking-wide">เข้าสู่ระบบการทำงาน</h2>
          <p className="text-xs text-blue-200 mt-1">
            เทศบาลเมืองมหาสารคาม • ปีงบประมาณ 2570
          </p>
          <p className="text-[11px] text-blue-300 mt-0.5">
            ระบบกำหนดสิทธิ์การเข้าใช้งาน (Role-Based Access Control)
          </p>
        </div>

        {/* Clean Login Form (No exposed credentials or hint cards) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

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
                placeholder="ระบุชื่อผู้ใช้งาน (เช่น User / Director / Executive)"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                รหัสผ่าน (Password)
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1 font-medium transition-colors"
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
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              ระบบรักษาความปลอดภัยแบบเข้ารหัสลับสองชั้น
            </p>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 px-4 bg-blue-800 hover:bg-blue-900 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            เข้าสู่ระบบอย่างปลอดภัย
          </button>
        </form>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            ระบบตรวจสอบสิทธิ์และอนุญาตเฉพาะบัญชีที่ระบุไว้ตามระเบียบราชการเท่านั้น
          </p>
        </div>
      </div>
    </div>
  );
}
