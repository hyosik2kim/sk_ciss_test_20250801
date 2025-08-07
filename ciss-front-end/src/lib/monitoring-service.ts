// src/types/monitoring_status.d.ts

import { ObjectId } from 'mongodb'; // ObjectId가 사용될 경우 필요

//  기존 MonitoringEntry 인터페이스 유지 및 필드 추가 
export interface MonitoringEntry {
  _id?: ObjectId; // MongoDB에서 사용되는 실제 ObjectId 타입
  serialNo: string;
  "ERR-CODE"?: string; // Optional (원본 데이터에 따라 존재하지 않을 수 있음)
  "ING-SEQ-NAME"?: string; // Optional
  "ING2-SEQ-NAME"?: string; // Optional
  "DP-STATE"?: string; // Optional, 백엔드에서 null일 수 있으므로 ?
  generatedAt: Date; // MongoDB에서 Date 객체로 저장될 경우 Date 타입

  //  충전 성공률 계산에 사용되는 새로운 필드들 (선택적) 
  "CP-PINS-SMID"?: string;     // 왼쪽 충전 시도 ID (선택적)
  "CP2-PINS-SMID"?: string;    // 오른쪽 충전 시도 ID (선택적)
  "CP-PINS-SESSION-ID"?: string; // 왼쪽 충전 성공 세션 ID (선택적)
  "CP2-PINS-SESSION-ID"?: string; // 오른쪽 충전 성공 세션 ID (선택적)
  [key: string]: any; // 인덱스 시그니처 (다른 필드들을 유연하게 허용)
}

//  클라이언트 컴포넌트로 전달하기 위한 직렬화된 MonitoringEntry 인터페이스 유지 및 필드 추가 
// _id와 generatedAt 필드가 문자열로 변환되며, 새로운 ID 필드도 포함됩니다.
export interface SerializedMonitoringEntry {
  _id: string; // ObjectId가 string으로 직렬화됩니다.
  serialNo: string;
  "ERR-CODE"?: string;
  "ING-SEQ-NAME"?: string;
  "ING2-SEQ-NAME"?: string;
  "DP-STATE"?: string;
  generatedAt: string; // Date 객체가 ISO 8601 문자열로 직렬화됩니다.

  //  새로운 필드 추가 
  "CP-PINS-SMID"?: string;
  "CP2-PINS-SMID"?: string;
  "CP-PINS-SESSION-ID"?: string;
  "CP2-PINS-SESSION-ID"?: string;
  [key: string]: any; // 인덱스 시그니처 유지
}

// 기존 MonitoringStatistics 인터페이스 유지 
export interface MonitoringStatistics {
  totalErrors: number;
  uniqueErrorCodes: number;
  errorCodeCounts: { [key: string]: number };
}

//  새로 추가된 ChargingSuccessRateData 인터페이스 
export interface ChargingSuccessRateData {
  totalAttemptsL: number; // 왼쪽 시도 횟수
  successCountL: number;  // 왼쪽 성공 횟수
  successRateL: number;   // 왼쪽 성공률
  totalAttemptsR: number; // 오른쪽 시도 횟수
  successCountR: number;  // 오른쪽 성공 횟수
  successRateR: number;   // 오른쪽 성공률
  overallTotalAttempts: number; // 전체 시도 횟수 (L + R)
  overallSuccessCount: number;  // 전체 성공 횟수 (L + R)
  overallSuccessRate: number;   // 전체 성공률
}