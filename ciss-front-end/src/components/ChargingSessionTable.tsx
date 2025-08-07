// components/ChargingSessionTable.tsx
import { SCARErrorCodeEntry } from '@/types/monitoring_status';
import React from 'react';
type Entry = {
  [key: string]: any;
};

type ChargingSessionTableProps = {
  sessionEntries: Entry[];
};

const ChargingSessionTable: React.FC<ChargingSessionTableProps> = ({ sessionEntries}) =>  {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md">
      {/*  테이블 컨테이너에 최대 높이 및 스크롤바 추가 */}
      <div className="max-h-[60vh] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DP-STATE</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SEQ NAME 1</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EV TAR VOLT 1</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EV TAR CURR 1</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EV MAX POWER LIMIT 1</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SOC 1</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EVSE PRSNT VOLT 1</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EVSE PRSNT CURR 1</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CP STATUS 1</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BULK SOC 1</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FULL SOC 1</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SEQ-NAME 2</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EV TAR VOLT 2</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EV TAR CURR 2</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EV MAX POWER LIMIT 2</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SOC 2</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EVSE PRSNT VOLT 2</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EVSE PRSNT CURR 2</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CP STATUS 2</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BULK SOC 2</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FULL SOC 2</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ERR CODE</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TIME</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessionEntries.map((item, idx) => (
                <tr key={`${idx}-${item._id?.toString() || ''}`} className={item.isShortSession ? "text-red-500 bg-red-100" : ""}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{idx + 1}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["DP-STATE"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING-SEQ-NAME"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING-EV-TAR-VOLT"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING-EV-TAR-CURR"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING-EV-MAX-POWER-LIMIT"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING-SOC"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING-EVSE-PRSNT-VOLT"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING-EVSE-PRSNT-CURR"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING-CP-STATUS"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING-BULK-SOC"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING-FULL-SOC"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING2-SEQ-NAME"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING2-EV-TAR-VOLT"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING2-EV-TAR-CURR"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING2-EV-MAX-POWER-LIMIT"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING2-SOC"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING2-EVSE-PRSNT-VOLT"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING2-EVSE-PRSNT-CURR"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING2-CP-STATUS"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING2-BULK-SOC"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ING2-FULL-SOC"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item["ERR-CODE"]}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{new Date(item.generatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChargingSessionTable;