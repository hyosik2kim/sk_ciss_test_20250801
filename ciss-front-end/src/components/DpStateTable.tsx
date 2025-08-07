import React from 'react';
import { MonitoringEntry } from '@/types/monitoring_status';

interface DpStateTableProps {
  entries: MonitoringEntry[];
}

const DpStateTable: React.FC<DpStateTableProps> = ({ entries }) => {
  const filteredEntries = entries.filter(
    entry =>
      entry['CP-PINS-SMID'] ||
      entry['CP2-PINS-SMID'] ||
      entry['CP-PINS-SESSION-ID'] ||
      entry['CP2-PINS-SESSION-ID'] ||
      entry['DP-STATE']
  );

  if (!filteredEntries.length) {
    return (
      <p className="text-gray-600 text-base text-center p-3 bg-white rounded-lg shadow-md">
        조회된 시퀀스 데이터가 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md mb-6">
      <div className="max-h-[40vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-2">시리얼 ID별 상태 시퀀스</h3>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시리얼 ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DP 상태</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L-시도 ID (SMID)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R-시도 ID (SMID)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L-세션 ID (SID)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R-세션 ID (SID)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <tr key={entry._id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.serialNo}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry["DP-STATE"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {new Date(entry.generatedAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  })}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry["CP-PINS-SMID"] || '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry["CP2-PINS-SMID"] || '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry["CP-PINS-SESSION-ID"] || '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry["CP2-PINS-SESSION-ID"] || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DpStateTable;
