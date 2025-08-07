import React from 'react';
import { ChargingSuccessRateData } from '@/types/monitoring_status';

interface ChargingSuccessRateTableProps {
  data: ChargingSuccessRateData | null;
}

const ChargingSuccessRateTable: React.FC<ChargingSuccessRateTableProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md mb-6">
      <div className="max-h-[30vh] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 시도 횟수</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성공 횟수</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성공률 (%)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Arm L</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.totalAttemptsL}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.successCountL}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.successRateL.toFixed(2)}%</td>
            </tr>
            <tr>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Arm R</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.totalAttemptsR}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.successCountR}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.successRateR.toFixed(2)}%</td>
            </tr>
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">전체</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.overallTotalAttempts}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.overallSuccessCount}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.overallSuccessRate.toFixed(2)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChargingSuccessRateTable;
