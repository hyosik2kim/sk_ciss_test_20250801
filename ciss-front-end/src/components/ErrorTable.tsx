// src/components/ErrorTable.tsx
import React from 'react';
import { MonitoringEntry } from '@/types/monitoring_status';

interface ErrorTableProps {
  errors: MonitoringEntry[];
}

const ErrorTable: React.FC<ErrorTableProps> = ({ errors }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md">
      {/*  테이블 컨테이너에 최대 높이 및 스크롤바 추가 */}
      <div className="max-h-[60vh] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10"> {/*  헤더 고정 */}
            <tr>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" /*  폰트/패딩 조정 */
              >
                SERIAL NO
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" /*  폰트/패딩 조정 */
              >
                ERROR CODE
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" /*  폰트/패딩 조정 */
              >
                ING SEQ NAME
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" /*  폰트/패딩 조정 */
              >
                ING2 SEQ NAME
              </th>
                            <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" /*  폰트/패딩 조정 */
              >
                DP STATE
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" /*  폰트/패딩 조정 */
              >
                GENERATED AT
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {errors.map((error) => (
              <tr key={error._id?.toString()}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"> {/*  폰트/패딩 조정 */}
                  {error.serialNo}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"> {/*  폰트/패딩 조정 */}
                  {error["ERR-CODE"]}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"> {/*  폰트/패딩 조정 */}
                  {error["ING-SEQ-NAME"]}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"> {/*  폰트/패딩 조정 */}
                  {error["ING2-SEQ-NAME"]}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"> {/*  폰트/패딩 조정 */}
                  {error["DP-STATE"]}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"> {/*  폰트/패딩 조정 */}
                  {new Date(error.generatedAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ErrorTable;