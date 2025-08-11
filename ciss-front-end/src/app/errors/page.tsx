// src/app/error/page.tsx
'use client'; // 클라이언트 컴포넌트로 지정

import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { exportErrorDataToExcel } from '@/lib/exportExcel';

// 백엔드 API를 호출하는 함수들 (src/lib/pycissApi.ts에 정의됨)
import { getErrors, getOverallErrorStatistics } from '@/lib/pycissApi';

// 타입 정의 (src/types/monitoring_status.ts에 정의됨)
import { MonitoringEntry, MonitoringStatistics } from '@/types/monitoring_status';

// 컴포넌트 임포트
import ErrorTable from '@/components/ErrorTable';
import ErrorStatisticsDisplay from '@/components/ErrorStatisticsDisplay';

import Image from 'next/image'; // Next.js Image 컴포넌트

export default function ErrorsPage() {
  // 상태 변수 정의
  const [serialNos, setSerialNos] = useState<string[]>(['']); // 충전기 ID 입력 배열
  const [startDate, setStartDate] = useState<Date | null>(null); // 시작 날짜
  const [endDate, setEndDate] = useState<Date | null>(null);     // 종료 날짜
  const [errors, setErrors] = useState<MonitoringEntry[]>([]); // 조회된 에러 목록
  const [overallStatistics, setOverallStatistics] = useState<MonitoringStatistics>({
    totalErrors: 0,
    uniqueErrorCodes: 0,
    errorCodeCounts: {},
  }); // 에러 통계

  // 로딩 상태 및 에러 메시지
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // 페이지네이션 관련 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const ITEMS_PER_PAGE = 50; // 한 페이지당 표시할 항목 수

  // 페이지네이션을 포함한 에러 데이터 조회 함수
  const handlePaginatedErrorsSearch = useCallback(async (page: number = currentPage) => {
    setLoadingErrors(true);
    setGlobalError(null);

    const filteredSerialNos = serialNos.filter(id => id.trim() !== '');

    // 조회 조건이 없을 경우 사용자에게 메시지 표시
    if (filteredSerialNos.length === 0 && !startDate && !endDate) {
      setErrors([]);
      setTotalPages(0);
      setGlobalError("조회 조건을 입력해주세요 (충전기 ID 또는 날짜 범위).");
      setLoadingErrors(false);
      return;
    }

    try {
      // pycissApi.ts의 getErrors 함수 호출
      const { errors: fetchedErrors, totalCount } = await getErrors(
        filteredSerialNos.length > 0 ? filteredSerialNos : null,
        startDate,
        endDate,
        page,
        ITEMS_PER_PAGE
      );

      setErrors(fetchedErrors);
      setTotalPages(Math.ceil(totalCount / ITEMS_PER_PAGE));
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to fetch paginated errors:", err);
      setGlobalError("에러 데이터를 불러오는 데 실패했습니다. 백엔드 연결 또는 쿼리 조건을 확인하세요.");
    } finally {
      setLoadingErrors(false);
    }
  }, [currentPage, serialNos, startDate, endDate]); // 의존성 배열

  // 전체 에러 통계 조회 함수
  const handleOverallStatisticsSearch = useCallback(async () => {
    setLoadingStatistics(true);

    const filteredSerialNos = serialNos.filter(id => id.trim() !== '');

    // 조회 조건이 없을 경우 통계 초기화
    if (filteredSerialNos.length === 0 && !startDate && !endDate) {
        setOverallStatistics({ totalErrors: 0, uniqueErrorCodes: 0, errorCodeCounts: {} });
        setLoadingStatistics(false);
        return;
    }

    try {
      // lib/pycissApi.ts의 getOverallErrorStatistics 함수 호출
      const stats = await getOverallErrorStatistics(
        filteredSerialNos.length > 0 ? filteredSerialNos : null,
        startDate,
        endDate
      );
      setOverallStatistics(stats);
    } catch (err) {
      console.error("Failed to fetch overall statistics:", err);
      setGlobalError("에러 통계를 불러오는 데 실패했습니다."); // 통계 에러도 사용자에게 알림
    } finally {
      setLoadingStatistics(false);
    }
  }, [serialNos, startDate, endDate]); // 의존성 배열

  // 컴포넌트 마운트 시 초기 조회 (에러 테이블만 먼저 로드)
  // (통계는 '조회' 버튼 클릭 시 함께 로드되도록 분리)
  useEffect(() => {
    handlePaginatedErrorsSearch(1); // 첫 페이지 로드
  }, []); // 빈 배열: 컴포넌트 첫 렌더링 시 한 번만 실행

  // '조회' 버튼 클릭 시 실행될 핸들러
  const handleSearchButtonClick = () => {
    handlePaginatedErrorsSearch(1); // 에러 테이블 첫 페이지부터 다시 조회
    handleOverallStatisticsSearch(); // 통계도 다시 조회
  };

  // 충전기 ID 입력 필드 추가
  const handleAddSerialNo = () => {
    setSerialNos([...serialNos, '']);
  };

  // 충전기 ID 입력 필드 제거
  const handleRemoveSerialNo = (index: number) => {
    if (serialNos.length > 1) { // 최소 1개는 유지
      setSerialNos(serialNos.filter((_, i) => i !== index));
    }
  };

  // 충전기 ID 입력 값 변경
  const handleSerialNoChange = (index: number, value: string) => {
    const newSerialNos = [...serialNos];
    newSerialNos[index] = value;
    setSerialNos(newSerialNos);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return; // 유효하지 않은 페이지 번호 예외 처리
    setCurrentPage(pageNumber);
    handlePaginatedErrorsSearch(pageNumber); // 변경된 페이지 번호로 재조회
  };

  // 페이지네이션 번호 배열 생성 (최대 5개 표시)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPageNumbersToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbersToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPageNumbersToShow - 1);

    // 표시될 페이지 번호 개수가 maxPageNumbersToShow보다 적을 경우 시작 페이지 조정
    if (endPage - startPage + 1 < maxPageNumbersToShow) {
      startPage = Math.max(1, endPage - maxPageNumbersToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  // 선택된 코드 상태도 여기로 끌어올림
const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
const [fullErrorList, setFullErrorList] = useState<MonitoringEntry[]>([]);

// 전체 에러 리스트 로딩 함수
const fetchFullErrorList = useCallback(async () => {
  try {
    const filteredSerialNos = serialNos.filter(id => id.trim() !== '');
    const { errors: allErrors } = await getErrors(
      filteredSerialNos.length > 0 ? filteredSerialNos : null,
      startDate,
      endDate,
      0,   // page
      0,   // limit
      true    // fetchAll=true
    );
    setFullErrorList(allErrors);
    return allErrors;
  } catch (err) {
    console.error("전체 에러 목록 조회 실패:", err);
    setGlobalError("전체 에러 목록 조회 중 오류가 발생했습니다.");
    return [];
  }
}, [serialNos, startDate, endDate]);

// 다운로드 핸들러
const handleExportExcel = async () => {
  const allErrors = await fetchFullErrorList();
  await exportErrorDataToExcel(overallStatistics, selectedCodes, allErrors);
};

  return (
    // 레이아웃 파일(app/layout.tsx)에서 전체 높이를 관리하므로,
    // 여기 최상위 div에는 h-screen이나 min-h-screen을 사용하지 않습니다.
    // flex-grow를 사용하여 부모 컨테이너(main 태그)의 남은 공간을 채우도록 합니다.
    <div className="flex flex-col flex-grow bg-gray-50 p-2 rounded-lg shadow-md">
      <div className="container  mx-auto w-full max-w-[1800px] pr-80">
        {/* 대시보드 타이틀 */}
        {/* 전체 시스템 타이틀은 layout.tsx에서 관리하고, 각 페이지의 특정 대시보드 타이틀은 여기서 표시 */}
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center bg-white p-4 rounded-lg shadow-md">
          <Image
            src="/sksignet.jpg" // public 폴더 기준 경로
            alt="SK Signet 로고"
            width={32}
            height={32}
            className="inline-block align-middle mr-2"
          />
          Error Analysis Dashboard
        </h1>

        {/* 조회 조건 영역 */}
        <div className="bg-white p-3 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-2">조회 조건</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
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
              onClick={handleSearchButtonClick}
              disabled={loadingErrors || loadingStatistics}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loadingErrors || loadingStatistics ? '조회 중...' : '조회'}
            </button>
          </div>
        </div>

        {globalError && (
          <div className="text-center text-red-600 text-base font-semibold mt-3 p-4 bg-red-100 border border-red-400 rounded-lg shadow-md">
            <p>{globalError}</p>
          </div>
        )}
      </div>

      {/* 주 컨텐츠 영역 - 통계 및 에러 테이블 */}
      <div className="flex flex-grow flex-col 2xl:flex-row 2xl:space-x-4 overflow-hidden container  mx-auto w-full max-w-[1800px] pr-80">
        {/* Error Statistics 섹션 */}
        <section className="mb-6 2xl:mb-0 2xl:flex-none 2xl:w-1/3 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">📊 Error Statistics</h2>
          {loadingStatistics ? (
            <div className="bg-white p-6 rounded-lg shadow-md animate-pulse flex-grow">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mt-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/5 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/5"></div>
            </div>
          ) : (
            <ErrorStatisticsDisplay 
                  statistics={overallStatistics}
                  selectedCodes={selectedCodes}
                  setSelectedCodes={setSelectedCodes}/>
          )}
          <button   onClick={handleExportExcel} className="mt-3 px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-md">엑셀로 다운로드</button>
        </section>

        {/* Recent Errors 섹션 */}
        <section className="2xl:flex-grow flex flex-col">
          <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">📋 Recent Errors</h2>
          {loadingErrors ? (
            <div className="bg-white rounded-lg shadow-md p-4 animate-pulse flex-grow">
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ) : errors.length === 0 && totalPages === 0 ? (
            <p className="text-gray-600 text-base text-center p-6 bg-white rounded-lg shadow-md flex-grow flex items-center justify-center">
              조회된 에러가 없습니다. 조건을 변경하여 다시 조회해 보세요.
            </p>
          ) : (
            // ErrorTable 컴포넌트에 flex-grow를 적용하여 남은 공간을 채우도록 합니다.
            // ErrorTable 내부에서 테이블 본문에 max-height와 overflow-y-auto가 적용되어야 합니다.
            <div className="flex-grow">
              <ErrorTable errors={errors} />
            </div>
          )}
        </section>
      </div>

      {/* 페이지네이션 영역 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-1 mt-6 container  mx-auto w-full max-w-[1800px] pr-80">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1 || loadingErrors}
            className="px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            첫 페이지
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loadingErrors}
            className="px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            이전
          </button>

          {getPageNumbers().map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              disabled={loadingErrors}
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
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loadingErrors}
            className="px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            다음
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || loadingErrors}
            className="px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            마지막
          </button>
        </div>
      )}
    </div>
  );
}