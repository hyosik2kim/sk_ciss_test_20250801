// src/types/monitoring_status.ts

/**
 * MonitoringEntry 인터페이스 (MongoDB 문서 구조를 기반으로 함)
 * _id와 generatedAt 필드는 클라이언트 전송을 위해 string으로 직렬화됩니다.
 */
export interface MonitoringEntry {
  _id: string; // MongoDB의 ObjectId를 문자열로 변환하여 사용
  serialNo: string;
  "ERR-CODE"?: string; // 에러 코드 (있을 수도, 없을 수도 있음)
  "ING-SEQ-NAME"?: string; // Inverter sequence name (좌측)
  "ING2-SEQ-NAME"?: string; // Inverter 2 sequence name (우측)
  "DP-STATE"?: string; // DP 상태
  generatedAt: string; // 생성 시간 (ISO 8601 문자열)

  // 충전 분석을 위한 추가 필드 (Optional)
  "CP-PINS-SMID"?: string; // Charge Point PINS SMID (왼쪽 충전 시도 ID)
  "CP2-PINS-SMID"?: string; // Charge Point 2 PINS SMID (오른쪽 충전 시도 ID)
  "CP-PINS-SESSION-ID"?: string; // Charge Point PINS Session ID (왼쪽 충전 세션 ID)
  "CP2-PINS-SESSION-ID"?: string; // Charge Point 2 PINS Session ID (오른쪽 충전 세션 ID)

  [key: string]: any; // 다른 필드들도 포함될 수 있음을 나타냄 (유연성을 위해)
}

/**
 * 전반적인 에러 통계 데이터를 위한 인터페이스
 */
export interface MonitoringStatistics {
  totalErrors: number;
  uniqueErrorCodes: number;
  errorCodeCounts: {
    [key: string]: number; // 예: { "1001": 5, "2002": 3 }
  };
}

/**
 * 충전 성공률 데이터를 위한 인터페이스
 */
export interface ChargingSuccessRateData {
  totalAttemptsL: number; // 왼쪽 시도 횟수
  successCountL: number;  // 왼쪽 성공 횟수
  successRateL: number;   // 왼쪽 성공률 (0-100)
  totalAttemptsR: number; // 오른쪽 시도 횟수
  successCountR: number;  // 오른쪽 성공 횟수
  successRateR: number;   // 오른쪽 성공률 (0-100)
  overallTotalAttempts: number; // 전체 시도 횟수 (L + R)
  overallSuccessCount: number;  // 전체 성공 횟수 (L + R)
  overallSuccessRate: number;   // 전체 성공률 (0-100)
}
/**
 * SCAR 데이터를 위한 인터페이스
 */
export interface SCARData {
  totalAttemptsL: number; // 왼쪽 시도 횟수
  successCountL: number;  // 왼쪽 성공 횟수
  successRateL: number;   // 왼쪽 성공률 (0-100)
  totalAttemptsR: number; // 오른쪽 시도 횟수
  successCountR: number;  // 오른쪽 성공 횟수
  successRateR: number;   // 오른쪽 성공률 (0-100)
  overallTotalAttempts: number; // 전체 시도 횟수 (L + R)
  overallSuccessCount: number;  // 전체 성공 횟수 (L + R)
  overallSuccessRate: number;   // 전체 성공률 (0-100)
  UserFailL: number;   // 
  ServerFailL: number;   // 
  EVFailL: number;   //
  EVSEFailL: number;   //
  UserFailR: number;   // 
  ServerFailR: number;   // 
  EVFailR: number;   //
  EVSEFailR: number;   //
}

export type SCARErrorType = "User" | "Server" | "EV" | "EVSE";

export interface SCARErrorCodeEntry {
  code: string;
  label: string;     // "통신 에러" 등 설명
  type: SCARErrorType;   // 분류(User, Server, ...)
}
