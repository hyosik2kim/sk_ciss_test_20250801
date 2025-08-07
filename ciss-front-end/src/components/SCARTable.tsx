import React from 'react';
import { SCARData } from '@/types/monitoring_status';

interface SCARTableProps {
  data: SCARData | null;
}

const SCARTable: React.FC<SCARTableProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md mb-6">
        {/* 통계 박스: 이 부분에 추가 */}
      <div className="grid grid-cols-4 gap-4 p-4">
        {/* User */}
        <div className="bg-gray-100 rounded-xl p-4 flex flex-col items-center">
          <span className="text-xs font-semibold mb-1">User</span>
          <div className="flex gap-8">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">L</span>
              <span className="text-xl font-bold text-blue-600">{data.UserFailL}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">R</span>
              <span className="text-xl font-bold text-blue-600">{data.UserFailR}</span>
            </div>
          </div>
          {/* Total row */}
          <div className="mt-2 text-xs text-gray-700">
            Total: <span className="font-bold">{data.UserFailL + data.UserFailR}</span>
          </div>
        </div>
        {/* Server */}
        <div className="bg-gray-100 rounded-xl p-4 flex flex-col items-center">
          <span className="text-xs font-semibold mb-1">Server</span>
          <div className="flex gap-8">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">L</span>
              <span className="text-xl font-bold text-green-600">{data.ServerFailL}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">R</span>
              <span className="text-xl font-bold text-green-600">{data.ServerFailR}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-700">
            Total: <span className="font-bold">{data.ServerFailL + data.ServerFailR}</span>
          </div>
        </div>
        {/* EV */}
        <div className="bg-gray-100 rounded-xl p-4 flex flex-col items-center">
          <span className="text-xs font-semibold mb-1">EV</span>
          <div className="flex gap-8">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">L</span>
              <span className="text-xl font-bold text-purple-600">{data.EVFailL}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">R</span>
              <span className="text-xl font-bold text-purple-600">{data.EVFailR}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-700">
            Total: <span className="font-bold">{data.EVFailL + data.EVFailR}</span>
          </div>
        </div>
        {/* EVSE */}
        <div className="bg-gray-100 rounded-xl p-4 flex flex-col items-center">
          <span className="text-xs font-semibold mb-1">EVSE</span>
          <div className="flex gap-8">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">L</span>
              <span className="text-xl font-bold text-orange-600">{data.EVSEFailL}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">R</span>
              <span className="text-xl font-bold text-orange-600">{data.EVSEFailR}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-700">
            Total: <span className="font-bold">{data.EVSEFailL + data.EVSEFailR}</span>
          </div>
        </div>
      </div>

      <div className="max-h-[30vh] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 시도 횟수</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성공 횟수</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성공률 (%)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SCAR Case(User, EV)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SCAR(%)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Arm L</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.totalAttemptsL}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.successCountL}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.successRateL.toFixed(2)}%</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.UserFailL + data.EVFailL}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{parseFloat((data.totalAttemptsL > 0 ? 
                                                                                (data.successCountL + data.UserFailL + data.EVFailL)
                                                                                / data.totalAttemptsL * 100 : 0).toFixed(2)).toFixed(2)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Arm R</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.totalAttemptsR}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.successCountR}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.successRateR.toFixed(2)}%</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.UserFailR + data.EVFailR}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{parseFloat((data.totalAttemptsR > 0 ? 
                                                                                (data.successCountR + data.UserFailR + data.EVFailR) 
                                                                                / data.totalAttemptsR * 100 : 0).toFixed(2)).toFixed(2)}</td>
            </tr> 
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">전체</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.overallTotalAttempts}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.overallSuccessCount}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.overallSuccessRate.toFixed(2)}%</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{data.UserFailL + data.EVFailL + data.UserFailR + data.EVFailR}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{parseFloat((data.overallTotalAttempts > 0 ? 
                                                                                (data.overallSuccessCount + data.UserFailL + data.EVFailL + data.UserFailR + data.EVFailR) 
                                                                                / data.overallTotalAttempts * 100 : 0).toFixed(2)).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SCARTable;
