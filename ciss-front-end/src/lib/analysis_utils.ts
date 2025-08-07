// src/lib/analysis_utils.ts

import { MonitoringEntry, ChargingSuccessRateData, SCARData } from '@/types/monitoring_status';

export interface SessionRow {
  [key: string]: any;
  isShortSession?: boolean;
  isUserFailL?: boolean;
  isServerFailL?: boolean;
  isEVailL?: boolean;
  isEVSEFailL?: boolean;
  isUserFailR?: boolean;
  isServerFailR?: boolean;
  isEVailLR: boolean;
  isEVSEFailLR: boolean;
}

/**
 * 주어진 모니터링 엔트리 배열로부터 충전 성공률을 계산합니다.
 * 시도 횟수는 CP-PINS-SMID 또는 CP2-PINS-SMID 필드가 존재하는 경우로,
 * 성공 횟수는 DP-STATE가 'CHARGING_START L' 또는 'CHARGING_START R'을 포함하고 끝나는 경우로 판단합니다.
 *
 * @param entries MonitoringEntry 배열
 * @returns ChargingSuccessRateData 객체
 */
export function calculateChargingSuccessRate(entries: MonitoringEntry[]): ChargingSuccessRateData {
  let totalAttemptsL = 0;
  let successCountL = 0;
  let totalAttemptsR = 0;
  let successCountR = 0;

  console.log("--- Starting Charging Success Rate Calculation (in analysis_utils) ---");
  console.log(`Processing ${entries.length} entries.`);

  if (entries.length === 0) {
    console.log("No entries provided to calculateChargingSuccessRate. Returning all zeros.");
  }

  for (const entry of entries) {
    // 각 entry를 로깅하여 필드 값 확인 (초기 디버깅 시에만 사용, 데이터 많으면 느려짐)
    // console.log("Processing entry:", entry.serialNo, entry["CP-PINS-SMID"], entry["CP2-PINS-SMID"], entry["DP-STATE"]);

    // 1. 시도 카운트 (CP-PINS-SMID / CP2-PINS-SMID 기준)
    // 이 필드는 충전 시도가 발생했음을 나타내는 ID로 사용됩니다.
    if (entry['CP-PINS-SMID']) {
      totalAttemptsL++;
      // console.log(`  -> ${entry.serialNo} L Attempt (SMID exists). totalAttemptsL: ${totalAttemptsL}`);
    }
    if (entry['CP2-PINS-SMID']) {
      totalAttemptsR++;
      // console.log(`  -> ${entry.serialNo} R Attempt (SMID exists). totalAttemptsR: ${totalAttemptsR}`);
    }

    // 2. 성공 카운트 (DP-STATE 기준)
    // DP-STATE 필드가 존재하고, 'CHARGING_START'를 포함하며 특정 암을 나타내는 'L' 또는 'R'로 끝나는 경우를 성공으로 간주
    if (entry['DP-STATE']) {
      const dpState = entry['DP-STATE'].toUpperCase().trim(); // 대소문자 무시, 공백 제거

      if (dpState.includes('CHARGING_START') && dpState.endsWith('L')) {
        successCountL++;
        // console.log(`  -> ${entry.serialNo} L Success (DP-STATE: ${entry["DP-STATE"]}). successCountL: ${successCountL}`);
      }
      else if (dpState.includes('CHARGING_START') && dpState.endsWith('R')) {
        successCountR++;
        // console.log(`  -> ${entry.serialNo} R Success (DP-STATE: ${entry["DP-STATE"]}). successCountR: ${successCountR}`);
      }
    }
  }

  // 성공률 계산 (0으로 나누는 오류 방지)
  const successRateL = totalAttemptsL > 0 ? (successCountL / totalAttemptsL) * 100 : 0;
  const successRateR = totalAttemptsR > 0 ? (successCountR / totalAttemptsR) * 100 : 0;

  const overallTotalAttempts = totalAttemptsL + totalAttemptsR;
  const overallSuccessCount = successCountL + successCountR;
  const overallSuccessRate = overallTotalAttempts > 0 ? (overallSuccessCount / overallTotalAttempts) * 100 : 0;

  console.log(`--- Finished Charging Success Rate Calculation ---`);
  console.log({ totalAttemptsL, successCountL, successRateL, totalAttemptsR, successCountR, successRateR, overallTotalAttempts, overallSuccessCount, overallSuccessRate });

  return {
    totalAttemptsL,
    successCountL,
    successRateL: parseFloat(successRateL.toFixed(2)), // 소수점 둘째 자리까지 반올림
    totalAttemptsR,
    successCountR,
    successRateR: parseFloat(successRateR.toFixed(2)),
    overallTotalAttempts,
    overallSuccessCount,
    overallSuccessRate: parseFloat(overallSuccessRate.toFixed(2)),
  };
}

export function calculateSCAR(sessions: SessionRow[][]): SCARData {
  let totalAttemptsL = 0, successCountL = 0;
  let totalAttemptsR = 0, successCountR = 0;
  let shortSessionL = 0, shortSessionR = 0;
  let UserFailL = 0, ServerFailL = 0;
  let EVFailL = 0, EVSEFailL = 0;
  let UserFailR = 0, ServerFailR = 0;
  let EVFailR = 0, EVSEFailR = 0;

  let isFailActiveL = false;
  let isFailActiveR = false;

  // 전체 세션 개수
  console.log('[SCAR] 전체 세션 수:', sessions.length);

  for (const session of sessions) {
    if (!session.length) continue;
    const dpState = (session[0]["DP-STATE"] ?? "").toUpperCase().trim();
    isFailActiveL = false;
    isFailActiveR = false;
    // L 세션
    if (dpState.includes("READY_START_TO_USE") && dpState.endsWith("L")) {
      totalAttemptsL++;
      if (session.some(row => row.isShortSession)) {
        shortSessionL++;
        console.log('[SCAR] 숏 L 세션:', session);
        if(!isFailActiveL)
        {
          if(session.some(row => row.isUserFailL)) {
            UserFailL++;
          }
          if(session.some(row => row.isServerFailL)) {
            ServerFailL++;
          }
          if (session.some(row => row.isEVFailL)) {
            EVFailL++;
          }
          if(session.some(row => row.isEVSEFailL)) {
            EVSEFailL++;
          }
          isFailActiveL = true;
        }
      } else {
        successCountL++;
      }
    }
    // R 세션
    else if (dpState.includes("READY_START_TO_USE") && dpState.endsWith("R")) {
      totalAttemptsR++;
      if (session.some(row => row.isShortSession)) {
        shortSessionR++;
        console.log('[SCAR] 숏 R 세션:', session);
        if(!isFailActiveR)
        {
          if(session.some(row => row.isUserFailR)) {
            UserFailR++;
          }
          if (session.some(row => row.isServerFailR)) {
            ServerFailR++;
          }
          if (session.some(row => row.isEVFailR)) {
            EVFailR++;
          }
          if(session.some(row => row.isEVSEFailR)) {
            EVSEFailR++;
          }
          isFailActiveR = true;
        }  
      } else {
        successCountR++;
      } 
    }
  }

  // L/R 세션, 숏세션, 성공세션 수 로그
  console.log(`[SCAR] L 세션: 전체 ${totalAttemptsL} / 성공 ${successCountL} / 숏 ${shortSessionL}`);
  console.log(`[SCAR] R 세션: 전체 ${totalAttemptsR} / 성공 ${successCountR} / 숏 ${shortSessionR}`);

  const successRateL = totalAttemptsL > 0 ? (successCountL / totalAttemptsL) * 100 : 0;
  const successRateR = totalAttemptsR > 0 ? (successCountR / totalAttemptsR) * 100 : 0;
  const overallTotalAttempts = totalAttemptsL + totalAttemptsR;
  const overallSuccessCount = successCountL + successCountR;
  const overallSuccessRate = overallTotalAttempts > 0 ? (overallSuccessCount / overallTotalAttempts) * 100 : 0;

  return {
    totalAttemptsL,
    successCountL,
    successRateL: parseFloat(successRateL.toFixed(2)),
    totalAttemptsR,
    successCountR,
    successRateR: parseFloat(successRateR.toFixed(2)),
    overallTotalAttempts,
    overallSuccessCount,
    overallSuccessRate: parseFloat(overallSuccessRate.toFixed(2)),
    UserFailL, 
    ServerFailL, 
    EVFailL,
    EVSEFailL,
    UserFailR, 
    ServerFailR, 
    EVFailR,
    EVSEFailR
  };
}


/*export function calculateSCAR(sessions: SessionRow[][]): ChargingSuccessRateData {
  let totalAttemptsL = 0, successCountL = 0;
  let totalAttemptsR = 0, successCountR = 0;

  for (const session of sessions) {
    if (!session.length) continue;
    const dpState = (session[0]["DP-STATE"] ?? "").toUpperCase().trim();

    if (dpState.includes("READY_START_TO_USE") && dpState.endsWith("L")) {
      totalAttemptsL++;
      if (!session.some(row => row.isShortSession)) successCountL++;
    }
    else if (dpState.includes("READY_START_TO_USE") && dpState.endsWith("R")) {
      totalAttemptsR++;
      if (!session.some(row => row.isShortSession)) successCountR++;
    }
  }

  const successRateL = totalAttemptsL > 0 ? (successCountL / totalAttemptsL) * 100 : 0;
  const successRateR = totalAttemptsR > 0 ? (successCountR / totalAttemptsR) * 100 : 0;
  const overallTotalAttempts = totalAttemptsL + totalAttemptsR;
  const overallSuccessCount = successCountL + successCountR;
  const overallSuccessRate = overallTotalAttempts > 0 ? (overallSuccessCount / overallTotalAttempts) * 100 : 0;

  return {
    totalAttemptsL,
    successCountL,
    successRateL: parseFloat(successRateL.toFixed(2)),
    totalAttemptsR,
    successCountR,
    successRateR: parseFloat(successRateR.toFixed(2)),
    overallTotalAttempts,
    overallSuccessCount,
    overallSuccessRate: parseFloat(overallSuccessRate.toFixed(2)),
  };
}
*/