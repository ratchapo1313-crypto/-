import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const delta = 1; // Number of pages before and after current
    const range: (number | string)[] = [];

    for (
      let i = Math.max(2, safeCurrentPage - delta);
      i <= Math.min(totalPages - 1, safeCurrentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (safeCurrentPage - delta > 2) {
      range.unshift('...');
    }
    if (safeCurrentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <div
      className={`bg-white px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700 ${className}`}
    >
      {/* Left: Summary text & Page size selector */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">แสดงหน้าละ:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                if (onPageSizeChange) onPageSizeChange(newSize);
                onPageChange(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} รายการ
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="text-slate-500 font-medium">
          แสดงรายการที่{' '}
          <span className="font-semibold text-slate-900 font-mono">
            {formatNumber(startIndex)}
          </span>{' '}
          -{' '}
          <span className="font-semibold text-slate-900 font-mono">
            {formatNumber(endIndex)}
          </span>{' '}
          จากทั้งหมด{' '}
          <span className="font-bold text-blue-900 font-mono">
            {formatNumber(totalItems)}
          </span>{' '}
          รายการ
        </div>
      </div>

      {/* Right: Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            title="หน้าแรก"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Prev Page */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1"
            title="หน้าก่อนหน้า"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">ก่อนหน้า</span>
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`dots-${idx}`} className="px-1 text-slate-400 select-none">
                    ...
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = pageNum === safeCurrentPage;
              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1"
            title="หน้าถัดไป"
          >
            <span className="hidden md:inline text-[11px]">ถัดไป</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safeCurrentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            title="หน้าสุดท้าย"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
