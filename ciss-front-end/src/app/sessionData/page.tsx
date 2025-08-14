'use client';

import React, { useState, useCallback, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getChargingSessions } from '@/lib/pycissApi';
import ChargingSessionTable from '@/components/ChargingSessionTable';
import { SCARData, SCARErrorCodeEntry} from '@/types/monitoring_status';
import { calculateSCAR, SessionRow } from '@/lib/analysis_utils';
import SCARTable from '@/components/SCARTable';
import SCARErrorCodeSidebar from '@/components/SCARErrorCodeSidebar';


// ----------- Main 페이지 ----------
export default function ChargingAnalysisPage() {
  // 조회 조건
  const [serialNos, setSerialNos] = useState<string[]>(['']);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // 데이터/상태
  const [allRows, setAllRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [chargingStats, setChargingStats] = useState<SCARData | null>(null);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const totalPages = Math.ceil(allRows.length / ITEMS_PER_PAGE);
  const pagedRows = allRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // 조회 핸들러
  const handleSessionsSearch = useCallback(async () => {
    setLoading(true);
    setGlobalError(null);
    setAllRows([]);
    setCurrentPage(1);

    const filteredSerialNos = serialNos.filter(id => id.trim() !== '');
    if (filteredSerialNos.length === 0 && !startDate && !endDate) {
      setGlobalError('조회 조건을 입력해주세요 (충전기 ID 또는 날짜 범위).');
      setLoading(false);
      return;
    }

    try {
      const data = await getChargingSessions(
        filteredSerialNos.length > 0 ? filteredSerialNos : null,
        startDate,
        endDate,
        errorCodes
      ) as SessionRow[][];
      setAllRows(data.flat());
      setChargingStats(calculateSCAR(data));
    } catch (err: unknown) {
      console.error(err);
      setGlobalError('세션 데이터를 불러오는 데 실패했습니다. 백엔드 연결 또는 쿼리 조건을 확인하세요.');
    } finally {
      setLoading(false);
    }
  }, [serialNos, startDate, endDate]);

  // CSV 다운로드 핸들러
  const handleExportToCSV = () => {
    const rows = allRows;
    if (!rows || rows.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv =
      headers.join(',') +
      '\n' +
      rows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'session_history.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 충전기 ID 입력 핸들러
  const handleAddSerialNo = () => setSerialNos([...serialNos, '']);
  const handleRemoveSerialNo = (index: number) => {
    if (serialNos.length > 1) setSerialNos(serialNos.filter((_, i) => i !== index));
  };
  const handleSerialNoChange = (index: number, value: string) => {
    const newSerialNos = [...serialNos];
    newSerialNos[index] = value;
    setSerialNos(newSerialNos);
  };

  // 페이지 번호 구하기
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPageNumbersToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbersToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPageNumbersToShow - 1);
    if (endPage - startPage + 1 < maxPageNumbersToShow) {
      startPage = Math.max(1, endPage - maxPageNumbersToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

   // 초기값을 localStorage에서 읽음
  //const [errorCodes, setErrorCodes] = useState<SCARErrorCodeEntry[]>(() => {
  //  if (typeof window === "undefined") return [];
  //  const raw = localStorage.getItem("error-codes");
  //  return raw
  //    ? JSON.parse(raw)
  //    : [
  //
  //      ];
  //});
  const [errorCodes, setErrorCodes] = useState<SCARErrorCodeEntry[]>([]);
  useEffect(() => {
    const raw = localStorage.getItem("error-codes");
    if (raw) setErrorCodes(JSON.parse(raw));
  }, []);
  
  // errorCodes 변경 시 localStorage에 반영
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("error-codes", JSON.stringify(errorCodes));
    }
  }, [errorCodes]);

  return (
    <div className="flex flex-col flex-grow bg-gray-50 p-2 rounded-lg shadow-md relative min-h-screen">
      {/* 에러 코드 사이드바 */}
      <SCARErrorCodeSidebar errorCodes={errorCodes} setErrorCodes={setErrorCodes} />

      <div className="container mx-auto w-full max-w-[1800px] pr-80">
        {/* 제목 */}
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center bg-white p-4 rounded-lg shadow-md">
          충전 데이터 분석 (모든 세션 한 테이블)
        </h1>

        {/* 조회 조건 + CSV */}
        <div className="bg-white p-3 rounded-lg shadow-md mb-6">
          <div className="flex flex-row justify-between items-center">
            <h2 className="text-lg font-bold text-gray-700 mb-2">조회 조건</h2>
            <button
              onClick={handleExportToCSV}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-4 rounded-lg shadow-md transition duration-200 ml-2"
            >
              CSV 다운로드
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {/* 충전기 ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">충전기 ID (Serial No)</label>
              <div className="border border-gray-300 rounded-md p-1 bg-white max-h-24 overflow-y-auto mb-1">
                {serialNos.map((id, index) => (
                  <div key={index} className="flex items-center text-sm mb-0.5 last:mb-0">
                    <input
                      type="text"
                      value={id}
                      onChange={(e) => handleSerialNoChange(index, e.target.value)}
                      placeholder="충전기 ID 입력"
                      className="block w-full rounded-sm border-gray-200 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-xs p-0.5"
                    />
                    {serialNos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSerialNo(index)}
                        className="ml-1 px-1.5 py-0 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors text-xs"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddSerialNo}
                className="mt-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                + 충전기 ID 추가
              </button>
            </div>
            {/* 날짜 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">날짜 범위</label>
              <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-1 md:space-y-0 md:space-x-1">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="시작일"
                  dateFormat="yyyy/MM/dd"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm p-1"
                  isClearable
                />
                <span className="md:w-auto text-center md:text-left text-sm">~</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy/MM/dd"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm p-1"
                  isClearable
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={handleSessionsSearch}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? '조회 중...' : '조회'}
            </button>
          </div>
        </div>

        {/* 에러 알림 */}
        {globalError && (
          <div className="text-center text-red-600 text-base font-semibold mt-3 p-4 bg-red-100 border border-red-400 rounded-lg shadow-md">
            <p>{globalError}</p>
          </div>
        )}

        {/* 데이터 표시 */}
        <div>
          {loading ? (
            <div className="text-center text-gray-500 text-lg p-6 bg-white rounded-lg shadow-md">
              데이터를 불러오는 중입니다...
            </div>
          ) : (
            <>
              {/* SCAR 통계 */}
              <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2 w-full text-center">📈 SCAR</h2>
              {chargingStats ? (
                <SCARTable data={chargingStats} />
              ) : (
                <p className="text-gray-600 text-base text-center p-6 bg-white rounded-lg shadow-md">
                  충전 성공률 데이터를 조회해주세요.
                </p>
              )}

              {/* 세션 테이블 */}
              <h2 className="text-2xl font-bold text-gray-700 mt-8 mb-4 border-b pb-2 w-full text-center">📊 세션 이력</h2>
              <ChargingSessionTable sessionEntries={pagedRows}/>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-1 mt-6">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs"
                  >
                    첫 페이지
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs"
                  >
                    이전
                  </button>
                  {getPageNumbers().map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      disabled={currentPage === pageNumber}
                      className={`px-2 py-1 rounded-md ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      } text-xs`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs"
                  >
                    다음
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs"
                  >
                    마지막
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
