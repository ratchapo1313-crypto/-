import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Minus,
  Edit2,
  Inbox,
  Send,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { EOfficeRecord, UserSession } from '../types';
import { formatNumber } from '../utils/formatters';

interface EOfficeViewProps {
  currentSession: UserSession;
  records: EOfficeRecord[];
  onAddRecord: (record: EOfficeRecord) => void;
  onUpdateRecord: (record: EOfficeRecord) => void;
  onDeleteRecord: (id: string) => void;
  onSetAllRecords?: (records: EOfficeRecord[]) => void;
}

export function EOfficeView({
  currentSession,
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onSetAllRecords,
}: EOfficeViewProps) {
  const canEdit = currentSession.roleCode === 'User';

  // Feedback Notification Toast
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Edit Modal State (Focused only on modifying the number)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTargetType, setEditTargetType] = useState<'in' | 'out'>('in');
  const [editQuantity, setEditQuantity] = useState<number>(0);

  // Custom step inputs for each card
  const [stepInputIn, setStepInputIn] = useState<number>(1);
  const [stepInputOut, setStepInputOut] = useState<number>(1);

  // Calculate Totals (sum of quantities)
  const totalIn = useMemo(
    () =>
      records
        .filter((r) => r.type === 'in')
        .reduce((s, r) => s + (r.quantity !== undefined ? r.quantity : 1), 0),
    [records]
  );

  const totalOut = useMemo(
    () =>
      records
        .filter((r) => r.type === 'out')
        .reduce((s, r) => s + (r.quantity !== undefined ? r.quantity : 1), 0),
    [records]
  );

  const totalAll = totalIn + totalOut;

  // Function to Increase or Decrease Counts
  const handleAdjustCount = (type: 'in' | 'out', delta: number) => {
    if (!canEdit) return;
    const typeLabel = type === 'in' ? 'การรับหนังสือ' : 'การส่งหนังสือออก';
    const currentTotal = type === 'in' ? totalIn : totalOut;

    if (delta < 0 && currentTotal + delta < 0) {
      setFeedbackMsg({
        text: `ไม่สามารถลดยอด${typeLabel} ต่ำกว่า 0 ได้ (ปัจจุบันมี ${formatNumber(currentTotal)} เรื่อง)`,
        type: 'error',
      });
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }

    const newTotal = Math.max(0, currentTotal + delta);
    const otherTypeRecords = records.filter((r) => r.type !== type);
    const updatedRecord: EOfficeRecord = {
      id: `EO-2570-${type}`,
      date: new Date().toISOString().split('T')[0],
      type,
      quantity: newTotal,
      docNumber: '-',
      title: type === 'in' ? 'การรับหนังสือ' : 'การส่งหนังสือออก',
      department: 'เทศบาลเมืองมหาสารคาม',
      note: '',
      status: 'completed',
      recordedBy: currentSession.username,
      updatedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    const newRecords = [updatedRecord, ...otherTypeRecords];

    if (onSetAllRecords) {
      onSetAllRecords(newRecords);
    } else {
      onAddRecord(updatedRecord);
    }

    const actionText = delta >= 0 ? `เพิ่มยอด (+${formatNumber(delta)})` : `ลดยอด (${delta})`;
    setFeedbackMsg({
      text: `${actionText} ${typeLabel} สำเร็จโดย ${currentSession.username} (ยอดรวมเป็น ${formatNumber(newTotal)} เรื่อง)`,
      type: 'success',
    });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Open Edit Modal for a specific category ('in' or 'out')
  const handleOpenEditModal = (type: 'in' | 'out') => {
    setEditTargetType(type);
    setEditQuantity(type === 'in' ? totalIn : totalOut);
    setIsEditModalOpen(true);
  };

  // Save changes from Edit Modal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const typeLabel = editTargetType === 'in' ? 'การรับหนังสือ' : 'การส่งหนังสือออก';
    const newTotal = Math.max(0, Number(editQuantity) || 0);

    const otherTypeRecords = records.filter((r) => r.type !== editTargetType);
    const updatedRecord: EOfficeRecord = {
      id: `EO-2570-${editTargetType}`,
      date: new Date().toISOString().split('T')[0],
      type: editTargetType,
      quantity: newTotal,
      docNumber: '-',
      title: editTargetType === 'in' ? 'การรับหนังสือ' : 'การส่งหนังสือออก',
      department: 'เทศบาลเมืองมหาสารคาม',
      note: '',
      status: 'completed',
      recordedBy: currentSession.username,
      updatedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    const newRecords = [updatedRecord, ...otherTypeRecords];

    if (onSetAllRecords) {
      onSetAllRecords(newRecords);
    } else {
      onAddRecord(updatedRecord);
    }

    setIsEditModalOpen(false);
    setFeedbackMsg({
      text: `บันทึกการแก้ไขข้อมูล${typeLabel} สำเร็จ (ยอดรวม ${formatNumber(newTotal)} เรื่อง)`,
      type: 'success',
    });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              <Calendar className="w-3.5 h-3.5" />
              ปีงบประมาณ 2570
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ซิงค์ฐานข้อมูลอัตโนมัติ (User, User1, User2)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              เฉพาะการรับหนังสือ และการส่งหนังสือออก
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-800" />
            การใช้งานระบบ E-Office ฝ่ายบริหารงานทั่วไป (ปีงบประมาณ 2570)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            ระบบบริหารจัดการงานสารบรรณราชการ เทศบาลเมืองมหาสารคาม ควบคุมและปรับปรุงยอด{' '}
            <strong>การรับหนังสือ</strong> และ <strong>การส่งหนังสือออก</strong> สามารถเพิ่ม/ลด
            และแก้ไขข้อมูลได้โดยตรง
          </p>
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TWO PRIMARY INTERACTIVE CARDS: การรับหนังสือ & การส่งหนังสือออก */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: การรับหนังสือ (Blue Theme) */}
        <div className="bg-white rounded-2xl border-2 border-blue-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Card Header (No 'รหัส IN') */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-950">
                  การรับหนังสือ
                </h3>
                <span className="text-xs text-blue-600 font-medium">
                  หนังสือราชการรับเข้าสู่ระบบงานสารบรรณ
                </span>
              </div>
            </div>

            {/* Total Number Display */}
            <div className="bg-gradient-to-br from-blue-50/90 to-slate-50 p-6 rounded-2xl border border-blue-100 flex items-baseline justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ยอดจำนวนหนังสือรับรวมทั้งสิ้น
                </div>
                <div className="text-5xl font-extrabold text-blue-950 font-mono mt-1">
                  {formatNumber(totalIn)}{' '}
                  <span className="text-base font-normal text-slate-500 font-sans">
                    เรื่อง
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500 font-medium">
                <div>ปีงบประมาณ 2570</div>
                {records.find((r) => r.type === 'in')?.recordedBy && (
                  <div className="text-[10px] text-blue-700 mt-1 flex items-center justify-end gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>ปรับยอดโดย: {records.find((r) => r.type === 'in')?.recordedBy}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Controls: เพิ่ม/ลด และ แก้ไขข้อมูล */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>ปรับปรุงจำนวน (เพิ่ม / ลด):</span>
              <span className="text-[11px] text-blue-600 font-normal">กดปุ่มเพื่อปรับยอดทันที</span>
            </div>

            {canEdit ? (
              <div className="space-y-3">
                {/* Preset Quick Buttons */}
                <div className="grid grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustCount('in', -10)}
                    className="py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95"
                    title="ลดยอดรับหนังสือ -10 เรื่อง"
                  >
                    <Minus className="w-3 h-3" /> 10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCount('in', -5)}
                    className="py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95"
                    title="ลดยอดรับหนังสือ -5 เรื่อง"
                  >
                    <Minus className="w-3 h-3" /> 5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCount('in', -1)}
                    className="py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95"
                    title="ลดยอดรับหนังสือ -1 เรื่อง"
                  >
                    <Minus className="w-3 h-3" /> 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCount('in', 1)}
                    className="py-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95 shadow-2xs"
                    title="เพิ่มยอดรับหนังสือ +1 เรื่อง"
                  >
                    <Plus className="w-3 h-3" /> 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCount('in', 5)}
                    className="py-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95 shadow-2xs"
                    title="เพิ่มยอดรับหนังสือ +5 เรื่อง"
                  >
                    <Plus className="w-3 h-3" /> 5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCount('in', 10)}
                    className="py-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95 shadow-2xs"
                    title="เพิ่มยอดรับหนังสือ +10 เรื่อง"
                  >
                    <Plus className="w-3 h-3" /> 10
                  </button>
                </div>

                {/* Custom Step Input & Edit Button */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0">
                    <span className="text-[11px] text-slate-500">จำนวน:</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={stepInputIn}
                      onChange={(e) => setStepInputIn(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <span className="text-[11px] text-slate-500">เรื่อง</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdjustCount('in', -stepInputIn)}
                    className="py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    title={`ลดยอดรับหนังสือ -${stepInputIn} เรื่อง`}
                  >
                    <Minus className="w-3 h-3" /> ลด
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustCount('in', stepInputIn)}
                    className="py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    title={`เพิ่มยอดรับหนังสือ +${stepInputIn} เรื่อง`}
                  >
                    <Plus className="w-3 h-3" /> เพิ่ม
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal('in')}
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-blue-900 font-semibold text-xs rounded-xl border border-blue-300 shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
                    title="แก้ไขตัวเลขยอดรับหนังสือโดยตรง"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-700" />
                    แก้ไขข้อมูล
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-2">
                * สิทธิ์การใช้งานของท่านสำหรับดูรายงานสถิติเท่านั้น
              </p>
            )}
          </div>
        </div>

        {/* CARD 2: การส่งหนังสือออก (Emerald Theme) */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Card Header (No 'รหัส OUT') */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-950">
                  การส่งหนังสือออก
                </h3>
                <span className="text-xs text-emerald-600 font-medium">
                  หนังสือราชการส่งออกจากเทศบาลเมืองมหาสารคาม
                </span>
              </div>
            </div>

            {/* Total Number Display */}
            <div className="bg-gradient-to-br from-emerald-50/90 to-slate-50 p-6 rounded-2xl border border-emerald-100 flex items-baseline justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ยอดจำนวนหนังสือส่งออกรวมทั้งสิ้น
                </div>
                <div className="text-5xl font-extrabold text-emerald-950 font-mono mt-1">
                  {formatNumber(totalOut)}{' '}
                  <span className="text-base font-normal text-slate-500 font-sans">
                    เรื่อง
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500 font-medium">
                <div>ปีงบประมาณ 2570</div>
                {records.find((r) => r.type === 'out')?.recordedBy && (
                  <div className="text-[10px] text-emerald-700 mt-1 flex items-center justify-end gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>ปรับยอดโดย: {records.find((r) => r.type === 'out')?.recordedBy}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Controls: เพิ่ม/ลด และ แก้ไขข้อมูล */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>ปรับปรุงจำนวน (เพิ่ม / ลด):</span>
              <span className="text-[11px] text-emerald-600 font-normal">
                กดปุ่มเพื่อปรับยอดทันที
              </span>
            </div>

            {canEdit ? (
              <div className="space-y-3">
                {/* Preset Quick Buttons */}
                <div className="grid grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustCount('out', -10)}
                    className="py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95"
                    title="ลดยอดส่งหนังสือออก -10 เรื่อง"
                  >
                    <Minus className="w-3 h-3" /> 10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCount('out', -5)}
                    className="py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95"
                    title="ลดยอดส่งหนังสือออก -5 เรื่อง"
                  >
                    <Minus className="w-3 h-3" /> 5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCount('out', -1)}
                    className="py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95"
                    title="ลดยอดส่งหนังสือออก -1 เรื่อง"
                  >
                    <Minus className="w-3 h-3" /> 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCount('out', 1)}
                    className="py-2.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95 shadow-2xs"
                    title="เพิ่มยอดส่งหนังสือออก +1 เรื่อง"
                  >
                    <Plus className="w-3 h-3" /> 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCount('out', 5)}
                    className="py-2.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95 shadow-2xs"
                    title="เพิ่มยอดส่งหนังสือออก +5 เรื่อง"
                  >
                    <Plus className="w-3 h-3" /> 5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCount('out', 10)}
                    className="py-2.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95 shadow-2xs"
                    title="เพิ่มยอดส่งหนังสือออก +10 เรื่อง"
                  >
                    <Plus className="w-3 h-3" /> 10
                  </button>
                </div>

                {/* Custom Step Input & Edit Button */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0">
                    <span className="text-[11px] text-slate-500">จำนวน:</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={stepInputOut}
                      onChange={(e) => setStepInputOut(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                    <span className="text-[11px] text-slate-500">เรื่อง</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdjustCount('out', -stepInputOut)}
                    className="py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    title={`ลดยอดส่งหนังสือออก -${stepInputOut} เรื่อง`}
                  >
                    <Minus className="w-3 h-3" /> ลด
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustCount('out', stepInputOut)}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    title={`เพิ่มยอดส่งหนังสือออก +${stepInputOut} เรื่อง`}
                  >
                    <Plus className="w-3 h-3" /> เพิ่ม
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal('out')}
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-emerald-900 font-semibold text-xs rounded-xl border border-emerald-300 shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
                    title="แก้ไขตัวเลขยอดส่งหนังสือออกโดยตรง"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                    แก้ไขข้อมูล
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-2">
                * สิทธิ์การใช้งานของท่านสำหรับดูรายงานสถิติเท่านั้น
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Aggregate Box */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">
              สรุปปริมาณงานสารบรรณราชการรวมทั้งสิ้น (ปีงบประมาณ 2570)
            </h4>
            <p className="text-xs text-slate-500">
              เทศบาลเมืองมหาสารคาม จังหวัดมหาสารคาม
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
            รับหนังสือ: <strong className="font-bold font-mono text-sm">{formatNumber(totalIn)}</strong> เรื่อง
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            ส่งหนังสือออก: <strong className="font-bold font-mono text-sm">{formatNumber(totalOut)}</strong> เรื่อง
          </div>
          <div className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold">
            รวมทั้งสิ้น: <strong className="font-bold font-mono text-amber-300 text-sm">{formatNumber(totalAll)}</strong> เรื่อง
          </div>
        </div>
      </div>

      {/* EDIT MODAL: แก้ไขยอดจำนวนตัวเลขโดยตรง (ไม่มีเลขที่ล่าสุด, เรื่อง, หน่วยงาน, หมายเหตุ) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div
              className={`p-4 text-white flex items-center justify-between ${
                editTargetType === 'in' ? 'bg-blue-900' : 'bg-emerald-900'
              }`}
            >
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-300" />
                แก้ไขข้อมูล{editTargetType === 'in' ? 'การรับหนังสือ' : 'การส่งหนังสือออก'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 text-sm mb-2">
                  ยอดจำนวนหนังสือรวม (เรื่อง) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={editQuantity}
                  onChange={(e) =>
                    setEditQuantity(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-2xl text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none text-center"
                  required
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  ระบุตัวเลขยอดรวมที่ต้องการบันทึกสำหรับ
                  <strong> {editTargetType === 'in' ? 'การรับหนังสือ' : 'การส่งหนังสือออก'}</strong>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-medium rounded-xl shadow-xs cursor-pointer ${
                    editTargetType === 'in'
                      ? 'bg-blue-800 hover:bg-blue-900'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
