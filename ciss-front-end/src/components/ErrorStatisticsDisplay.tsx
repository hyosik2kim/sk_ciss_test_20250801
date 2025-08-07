'use client';

import React from 'react';
import { MonitoringStatistics } from '@/types/monitoring_status';

interface Props {
  statistics: MonitoringStatistics;
  selectedCodes: string[];
  setSelectedCodes: React.Dispatch<React.SetStateAction<string[]>>; // ✅ 정확한 타입
}

export default function ErrorStatisticsDisplay({
  statistics,
  selectedCodes,
  setSelectedCodes,
}: Props) {
  const toggleErrorCode = (code: string) => {
    setSelectedCodes((prev: string[]) =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const clearSelectedCodes = () => {
    setSelectedCodes([]);
  };

  const sortedEntries = Object.entries(statistics?.errorCodeCounts || {}).sort(
    (a, b) => b[1] - a[1]
  );

  const selectedTotal = selectedCodes.reduce(
    (acc, code) => acc + (statistics.errorCodeCounts[code] || 0),
    0
  );

  const renderPercentage = (code: string) => {
    const count = statistics.errorCodeCounts[code] || 0;
    if (selectedTotal === 0 || !selectedCodes.includes(code)) return '';
    const percent = ((count / selectedTotal) * 100).toFixed(2);
    return `(${percent}%)`;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md text-sm">
      <p className="mb-2 font-semibold text-gray-700">
        총 에러 수: {statistics.totalErrors.toLocaleString()}건 / 고유 에러 코드: {statistics.uniqueErrorCodes}개
      </p>

      {sortedEntries.length === 0 ? (
        <p className="text-gray-500 mt-2">에러 통계 데이터가 없습니다.</p>
      ) : (
        <div className="max-h-[300px] overflow-y-auto border-t pt-2 mt-2">
          {sortedEntries.map(([code, count]) => (
            <div key={code} className="flex justify-between items-center py-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedCodes.includes(code)}
                  onChange={() => toggleErrorCode(code)}
                  className="form-checkbox h-4 w-4 text-indigo-600"
                />
                <span className="text-gray-800">{code}</span>
              </label>
              <div className="text-right">
                <span className="text-gray-600">{count.toLocaleString()}건</span>{' '}
                <span className="text-xs text-gray-500">{renderPercentage(code)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCodes.length > 0 && selectedTotal > 0 && (
        <div className="mt-4 bg-gray-100 p-2 rounded-md border text-gray-700">
          <p className="font-semibold">선택된 에러 총합: {selectedTotal.toLocaleString()}건</p>
          <p className="text-xs text-gray-600">
            ※ 아래 (%)는 선택한 에러코드 간의 비중입니다 (합계 = 100%)
          </p>
          <button
            onClick={clearSelectedCodes}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
          >
            선택 초기화
          </button>
        </div>
      )}
    </div>
  );
}
