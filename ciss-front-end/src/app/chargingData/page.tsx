// src/app/charging/page.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { getChargingPageData } from '@/lib/pycissApi';
import { calculateChargingSuccessRate } from '@/lib/analysis_utils';

import ChargingSuccessRateTable from '@/components/ChargingSuccessRateTable';
import DpStateTable from '@/components/DpStateTable';
import { MonitoringEntry, ChargingSuccessRateData } from '@/types/monitoring_status';
import Image from 'next/image';

export default function ChargingDataPage() {
  const [serialNos, setSerialNos] = useState<string[]>(['']);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [chargingStats, setChargingStats] = useState<ChargingSuccessRateData | null>(null);
  const [dpStateEntries, setDpStateEntries] = useState<MonitoringEntry[]>([]);

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // 페이징 관련 상태
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 15;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // 데이터 로드 함수
  const fetchAndCalculateChargingStatistics = useCallback(async () => {
    setLoading(true);
    setGlobalError(null);
    setChargingStats(null);
    setDpStateEntries([]);

    const filteredSerialNos = serialNos.filter(id => id.trim() !== '');
    if (filteredSerialNos.length === 0 && !startDate && !endDate) {
      setGlobalError("조회 조건을 입력해주세요 (충전기 ID 또는 날짜 범위).");
      setLoading(false);
      return;
    }

    try {
      const { entries, totalCount, allEntriesForStats } = await getChargingPageData(
        filteredSerialNos.length > 0 ? filteredSerialNos : null,
        startDate,
        endDate,
        page,
        limit
      );

      setDpStateEntries(entries);
      setTotalCount(totalCount);

      // 충전 성공률은 "전체" 데이터로 계산!
      const stats = calculateChargingSuccessRate(allEntriesForStats);
      setChargingStats(stats);
    } catch (err) {
      setGlobalError("충전 통계를 불러오거나 계산하는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [serialNos, startDate, endDate, page]);

  // 조회조건 변경시 page 초기화
  const handleSearchButtonClick = () => {
    setPage(1);
    fetchAndCalculateChargingStatistics();
  };

  // page 상태 변화시 데이터 로드
  useEffect(() => {
    fetchAndCalculateChargingStatistics();
    // eslint-disable-next-line
  }, [page]);

  const handleAddSerialNo = () => setSerialNos([...serialNos, '']);
  const handleRemoveSerialNo = (idx: number) => {
    if (serialNos.length > 1) setSerialNos(serialNos.filter((_, i) => i !== idx));
  };
  const handleSerialNoChange = (idx: number, value: string) => {
    const next = [...serialNos];
    next[idx] = value;
    setSerialNos(next);
  };

  const handlePrevPage = () => { if (page > 1) setPage(page - 1); };
  const handleNextPage = () => { if (page < totalPages) setPage(page + 1); };

  return (
    <div className="flex flex-col flex-grow bg-gray-50 p-2 rounded-lg shadow-md">
      <div className="container mx-auto 2xl:max-w-screen-xl">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center bg-white p-4 rounded-lg shadow-md">
          <Image src="/sksignet.jpg" alt="SK Signet 로고" width={32} height={32} className="inline-block align-middle mr-2" />
          Charging Data Analysis Dashboard
        </h1>

        {/* 조회 조건 */}
        <div className="bg-white p-3 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-2">조회 조건</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">충전기 ID (Serial No)</label>
              <div className="border border-gray-300 rounded-md p-1 bg-white max-h-24 overflow-y-auto mb-1">
                {serialNos.map((id, idx) => (
                  <div key={idx} className="flex items-center text-sm mb-0.5 last:mb-0">
                    <input type="text" value={id} onChange={e => handleSerialNoChange(idx, e.target.value)}
                      placeholder="충전기 ID 입력"
                      className="block w-full rounded-sm border-gray-200 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-xs p-0.5"
                    />
                    {serialNos.length > 1 && (
                      <button type="button" onClick={() => handleRemoveSerialNo(idx)}
                        className="ml-1 px-1.5 py-0 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors text-xs">
                        삭제
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleAddSerialNo}
                className="mt-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm">
                + 충전기 ID 추가
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">날짜 범위</label>
              <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-1 md:space-y-0 md:space-x-1">
                <DatePicker selected={startDate} onChange={(date: Date | null) => setStartDate(date)}
                  selectsStart startDate={startDate} endDate={endDate}
                  placeholderText="시작일" dateFormat="yyyy/MM/dd"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm p-1"
                  isClearable
                />
                <span className="md:w-auto text-center md:text-left text-sm">~</span>
                <DatePicker selected={endDate} onChange={(date: Date | null) => setEndDate(date)}
                  selectsEnd startDate={startDate} endDate={endDate} minDate={startDate || undefined}
                  placeholderText="종료일" dateFormat="yyyy/MM/dd"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm p-1"
                  isClearable
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={handleSearchButtonClick} disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              {loading ? '조회 중...' : '조회'}
            </button>
          </div>
        </div>
        {globalError && (
          <div className="text-center text-red-600 text-base font-semibold mt-3 p-4 bg-red-100 border border-red-400 rounded-lg shadow-md">
            <p>{globalError}</p>
          </div>
        )}
      </div>

      {/* 데이터 표시 영역 */}
      <div className="container mx-auto 2xl:max-w-screen-xl mt-6">
        {loading ? (
          <div className="text-center text-gray-500 text-lg p-6 bg-white rounded-lg shadow-md">
            데이터를 불러오는 중입니다...
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2 w-full text-center">📈 충전 성공률</h2>
            {chargingStats ? (
              <ChargingSuccessRateTable data={chargingStats} />
            ) : (
              <p className="text-gray-600 text-base text-center p-6 bg-white rounded-lg shadow-md">
                충전 성공률 데이터를 조회해주세요.
              </p>
            )}
            <h2 className="text-2xl font-bold text-gray-700 mt-8 mb-4 border-b pb-2 w-full text-center">📊 DP 상태 시퀀스</h2>
            <DpStateTable entries={dpStateEntries} />
          </>
        )}

        {/* 페이징 컨트롤 */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-4">
            <button onClick={handlePrevPage} disabled={page === 1}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">
              ◀ 이전
            </button>
            <span className="text-sm text-gray-700">
              {page} / {totalPages}
            </span>
            <button onClick={handleNextPage} disabled={page === totalPages}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">
              다음 ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
