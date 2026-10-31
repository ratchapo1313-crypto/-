import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Edit2,
  Trash2,
  X,
  Building,
} from 'lucide-react';
import { FinancialFundRecord, UserSession } from '../types';
import { formatCurrency, formatNumber, formatThaiDate } from '../utils/formatters';
import { Pagination } from '../components/Pagination';

interface ChkbViewProps {
  currentSession: UserSession;
  records: FinancialFundRecord[];
  onAddRecord: (record: FinancialFundRecord) => void;
  onUpdateRecord: (record: FinancialFundRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export function ChkbView({
  currentSession,
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
}: ChkbViewProps) {
  const canEdit = currentSession.roleCode === 'User';

  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = React.useDeferredValue(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialFundRecord | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<FinancialFundRecord | null>(null);

  const totalReceived = useMemo(() => records.reduce((s, r) => s + r.receivedAmount, 0), [records]);
  const totalPaid = useMemo(() => records.reduce((s, r) => s + r.paidAmount, 0), [records]);
  const netBalance = totalReceived - totalPaid;
  const totalBeneficiaries = useMemo(() => records.reduce((s, r) => s + r.beneficiaryCount, 0), [records]);

  const filteredRecords = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase();
    return records.filter((r) => {
      return (
        term === '' ||
        r.source.toLowerCase().includes(term) ||
        r.note.toLowerCase().includes(term)
      );
    });
  }, [records, deferredSearchTerm]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: FinancialFundRecord) => {
    setEditingRecord(rec);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data: {
    date: string;
    source: string;
    receivedAmount: number;
    paidAmount: number;
    beneficiaryCount: number;
    note: string;
  }) => {
    const computedNet = data.receivedAmount - data.paidAmount;

    if (editingRecord) {
      onUpdateRecord({
        ...editingRecord,
        date: data.date,
        source: data.source,
        receivedAmount: data.receivedAmount,
        paidAmount: data.paidAmount,
        netBalance: computedNet,
        beneficiaryCount: data.beneficiaryCount,
        note: data.note,
      });
    } else {
      const newId = `CHKB-2570-${String(records.length + 1).padStart(2, '0')}`;
      onAddRecord({
        id: newId,
        date: data.date,
        source: data.source,
        receivedAmount: data.receivedAmount,
        paidAmount: data.paidAmount,
        netBalance: computedNet,
        beneficiaryCount: data.beneficiaryCount,
        note: data.note,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-700" />
            การรายงานทะเบียนเงินช่วยค่าครองชีพผู้รับเบี้ยหวัดบำนาญ (ช.ค.บ.)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            บันทึกรับเงินจากแหล่งต่างๆ และการจ่ายเงิน พร้อมคำนวณยอดคงเหลือสุทธิอัตโนมัติ ประจำปีงบประมาณ 2570
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            บันทึกรายการ ช.ค.บ.
          </button>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Received */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ยอดรับเงินรวม (บาท)</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ArrowDownCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-950">
            {formatCurrency(totalReceived)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">งบจัดสรรและเงินสมทบ</div>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ยอดจ่ายเงินรวม (บาท)</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <ArrowUpCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-rose-950">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-[11px] text-rose-600 mt-1">จ่ายให้ผู้รับเบี้ยหวัดบำนาญ</div>
        </div>

        {/* Net Balance (Calculated automatically) */}
        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">คงเหลือสุทธิ (คำนวณอัตโนมัติ)</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-blue-950">
            {formatCurrency(netBalance)}
          </div>
          <div className="text-[11px] text-blue-600 mt-1">รับลบจ่าย สะสมคงเหลือ</div>
        </div>

        {/* Beneficiaries Count */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">จำนวนครั้ง/รายการ</span>
            <span className="p-2 rounded-xl bg-slate-50 text-slate-700">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {formatNumber(totalBeneficiaries)}{' '}
            <span className="text-xs font-normal text-slate-500">รายการ</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">ครอบคลุมผู้รับสิทธิทั้งปี</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาแหล่งที่มาของเงิน, หมายเหตุ..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
        <span className="text-xs text-slate-500">
          รายการทั้งหมด {formatNumber(filteredRecords.length)} รายการ
        </span>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                <th className="py-3 px-4 w-28">วันที่</th>
                <th className="py-3 px-4">รับเงินจากที่ไหน / รายละเอียดการจ่าย</th>
                <th className="py-3 px-4 w-36 text-right">รับเงินจำนวน (บาท)</th>
                <th className="py-3 px-4 w-36 text-right">จ่ายไปเท่าไหร่ (บาท)</th>
                <th className="py-3 px-4 w-36 text-right font-bold text-blue-900">คงเหลือสุทธิ (บาท)</th>
                <th className="py-3 px-4 w-24 text-center">จำนวนรายการ</th>
                <th className="py-3 px-4 w-48">หมายเหตุ</th>
                {canEdit && <th className="py-3 px-4 w-20 text-center">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลรายการเงินช่วยค่าครองชีพ (ช.ค.บ.)
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item, idx) => {
                  const itemIndex = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {formatNumber(itemIndex)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        {formatThaiDate(item.date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div>{item.source}</div>
                        {item.recordedBy && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            ผู้บันทึก: {item.recordedBy}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700">
                        {item.receivedAmount > 0 ? `+${formatCurrency(item.receivedAmount)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-rose-700">
                        {item.paidAmount > 0 ? `-${formatCurrency(item.paidAmount)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-950 bg-blue-50/30">
                        {formatCurrency(item.netBalance)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{formatNumber(item.beneficiaryCount)}</td>
                      <td className="py-3 px-4 text-slate-500 italic">{item.note || '-'}</td>
                      {canEdit && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="แก้ไข"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmTarget(item)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredRecords.length > 0 && (
              <tfoot className="bg-slate-100/80 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right text-slate-700">
                    รวมทั้งสิ้น:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-800">
                    +{formatCurrency(totalReceived)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-800">
                    -{formatCurrency(totalPaid)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-blue-950 bg-blue-100/50">
                    {formatCurrency(netBalance)}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{formatNumber(totalBeneficiaries)}</td>
                  <td colSpan={canEdit ? 2 : 1}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {filteredRecords.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredRecords.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        )}
      </div>

      {/* Add/Edit Modal (Isolated internal state for zero-latency 60fps typing) */}
      {isModalOpen && (
        <ChkbRecordModal
          record={editingRecord}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveModal}
        />
      )}

      {/* Delete Confirmation Modal (Smooth & Non-blocking) */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              ยืนยันการลบรายการ ช.ค.บ.
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              ต้องการลบรายการ <span className="font-bold text-slate-900">{deleteConfirmTarget.source}</span> ใช่หรือไม่? ข้อมูลจะถูกลบออกจากฐานข้อมูลทันที
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
    </div>
  );
}

interface ChkbRecordModalProps {
  record: FinancialFundRecord | null;
  onClose: () => void;
  onSave: (data: {
    date: string;
    source: string;
    receivedAmount: number;
    paidAmount: number;
    beneficiaryCount: number;
    note: string;
  }) => void;
}

function ChkbRecordModal({ record, onClose, onSave }: ChkbRecordModalProps) {
  const [formData, setFormData] = useState({
    date: record ? record.date : new Date().toISOString().split('T')[0],
    source: record ? record.source : '',
    receivedAmount: record ? record.receivedAmount.toString() : '',
    paidAmount: record ? record.paidAmount.toString() : '',
    beneficiaryCount: record ? record.beneficiaryCount.toString() : '1',
    note: record ? record.note : '',
  });

  const previewReceived = parseFloat(formData.receivedAmount) || 0;
  const previewPaid = parseFloat(formData.paidAmount) || 0;
  const previewNet = previewReceived - previewPaid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.source) return;
    onSave({
      date: formData.date,
      source: formData.source,
      receivedAmount: previewReceived,
      paidAmount: previewPaid,
      beneficiaryCount: parseInt(formData.beneficiaryCount, 10) || 1,
      note: formData.note,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-300" />
            {record ? 'แก้ไขรายการเงิน ช.ค.บ.' : 'บันทึกรายการเงิน ช.ค.บ. ใหม่'}
          </h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">วันที่ทำรายการ</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">จำนวนรายการ</label>
              <input
                type="number"
                min="1"
                value={formData.beneficiaryCount}
                onChange={(e) => setFormData({ ...formData, beneficiaryCount: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              รับเงินจากที่ไหน / แหล่งที่มา หรือ รายละเอียดการจ่าย
            </label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="เช่น กรมส่งเสริมการปกครองท้องถิ่น (เงินอุดหนุนทั่วไป), จ่ายเงิน ช.ค.บ. ประจำเดือน"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                รับเงินจำนวน (บาท)
              </label>
              <input
                type="number"
                step="any"
                value={formData.receivedAmount}
                onChange={(e) => setFormData({ ...formData, receivedAmount: e.target.value })}
                placeholder="0.00"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                จ่ายไปเท่าไหร่ (บาท)
              </label>
              <input
                type="number"
                step="any"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                placeholder="0.00"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Automatic Calculation Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>คงเหลือสุทธิ (คำนวณอัตโนมัติ):</span>
              <span className={`font-mono text-sm ${previewNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(previewNet)} บาท
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ระบบคำนวณจาก [รับเงินจำนวน] ลบด้วย [จ่ายไปเท่าไหร่] โดยอัตโนมัติ
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">หมายเหตุ</label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="เช่น งวดจัดสรรไตรมาส 1, ตกเบิกย้อนหลัง"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-medium shadow-xs cursor-pointer"
            >
              {record ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
