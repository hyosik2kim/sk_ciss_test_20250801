'use server';

import { MongoClient, ObjectId } from 'mongodb';
import { MonitoringEntry, MonitoringStatistics,SCARErrorCodeEntry } from '@/types/monitoring_status';
import { reportWebVitals } from 'next/dist/build/templates/pages';

// --- MongoDB 연결 기본 세팅 ---
const uri = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.MONGODB_DATABASE_NAME || 'ciss';
const COLLECTION_NAME = process.env.MONGODB_COLLECTION_NAME || 'monitoring_status';

if (!uri) throw new Error('Please add your MONGODB_URI to .env.local');

const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient>;
if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

// --- 날짜 처리 ---
function getUtcStartOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}
function getUtcStartOfNextDay(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1));
}
function mapToMonitoringEntry(doc: any): MonitoringEntry {
  return {
    _id: doc._id?.toString() || new ObjectId().toString(),
    serialNo: doc.serialNo,
    "ERR-CODE": doc["ERR-CODE"] || undefined,
    "ING-SEQ-NAME": doc["ING-SEQ-NAME"] || undefined,
    "ING2-SEQ-NAME": doc["ING2-SEQ-NAME"] || undefined,
    "DP-STATE": doc["DP-STATE"] || undefined,
    generatedAt: (doc.generatedAt instanceof Date ? doc.generatedAt : new Date(doc.generatedAt)).toISOString(),
    "CP-PINS-SMID": doc["CP-PINS-SMID"] || undefined,
    "CP2-PINS-SMID": doc["CP2-PINS-SMID"] || undefined,
    "CP-PINS-SESSION-ID": doc["CP-PINS-SESSION-ID"] || undefined,
    "CP2-PINS-SESSION-ID": doc["CP2-PINS-SESSION-ID"] || undefined,
    ...Object.fromEntries(Object.entries(doc).filter(([key]) => ![
      '_id', 'serialNo', 'ERR-CODE', 'ING-SEQ-NAME', 'ING2-SEQ-NAME', 'DP-STATE', 'generatedAt',
      'CP-PINS-SMID', 'CP2-PINS-SMID', 'CP-PINS-SESSION-ID', 'CP2-PINS-SESSION-ID'
    ].includes(key)))
  };
}

export async function getChargingPageData(
  serialNos: string[] | null,
  startDate: Date | null,
  endDate: Date | null,
  page = 1,
  limit = 15
): Promise<{
  entries: MonitoringEntry[];     // 페이징된 15건 (테이블 용)
  totalCount: number;
  allEntriesForStats: MonitoringEntry[]; // 조건 전체 (성공률 용)
}> {
  const db = (await clientPromise).db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

const query: any = {};
if (serialNos?.length) query.serialNo = { $in: serialNos };
if (startDate || endDate) {
  query.generatedAt = {};
  if (startDate) query.generatedAt.$gte = getUtcStartOfDay(startDate);
  if (endDate) query.generatedAt.$lt = getUtcStartOfNextDay(endDate);
}
query["$or"] = [
  { "CP-PINS-SMID": { $exists: true, $nin: [null, ""] } },
  { "CP2-PINS-SMID": { $exists: true, $nin: [null, ""] } },
  { "CP-PINS-SESSION-ID": { $exists: true, $nin: [null, ""] } },
  { "CP2-PINS-SESSION-ID": { $exists: true, $nin: [null, ""] } },
  { "DP-STATE": { $exists: true, $nin: [null, ""] } }
];

  const totalCount = await collection.countDocuments(query);

  const entries = await collection.find(query)
    .sort({ generatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  // 성공률용 전체 데이터는 projection 사용 권장 (필요시)
  const allEntriesForStats = await collection.find(query).toArray();

  return {
    entries: entries.map(mapToMonitoringEntry),
    totalCount,
    allEntriesForStats: allEntriesForStats.map(mapToMonitoringEntry),
  };
}


export async function getSessionPageData(
  serialNos: string[] | null,
  startDate: Date | null,
  endDate: Date | null,
  page = 1,
  limit = 15
): Promise<{
  entries: MonitoringEntry[];     // 페이징된 15건 (테이블 용)
  totalCount: number;
  allEntriesForStats: any[]; // 조건 전체 (성공률 용)
}> {
  const db = (await clientPromise).db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

const query: any = {};
if (serialNos?.length) query.serialNo = { $in: serialNos };
if (startDate || endDate) {
  query.generatedAt = {};
  if (startDate) query.generatedAt.$gte = getUtcStartOfDay(startDate);
  if (endDate) query.generatedAt.$lt = getUtcStartOfNextDay(endDate);
}
query["$or"] = [
  { "CP-PINS-SMID": { $exists: true, $nin: [null, ""] } },
  { "CP2-PINS-SMID": { $exists: true, $nin: [null, ""] } },
  { "CP-PINS-SESSION-ID": { $exists: true, $nin: [null, ""] } },
  { "CP2-PINS-SESSION-ID": { $exists: true, $nin: [null, ""] } },
  { "DP-STATE": { $exists: true, $nin: [null, ""] } }
];

  const totalCount = await collection.countDocuments(query);

  const entries = await collection.find(query)
    .sort({ generatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  // 성공률용 전체 데이터는 projection 사용 권장 (필요시)
  const allEntriesForStats = await collection.find(query).toArray();

  return {
    entries: entries.map(mapToMonitoringEntry),
    totalCount,
    allEntriesForStats: allEntriesForStats.map(mapToMonitoringEntry),
  };
}


// --- 2. 오류 목록 (페이징) ---
export async function getErrors(
  serialNos: string[] | null,
  startDate: Date | null,
  endDate: Date | null,
  page? : number,
  limit? : number,
  fetchAll : boolean = false
): Promise<{ errors: MonitoringEntry[]; totalCount: number }> {
  const db = (await clientPromise).db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const query: any = { "ERR-CODE": { $ne: '0', $nin: [null, undefined, ""] } };
  if (serialNos?.length) query.serialNo = { $in: serialNos };
  if (startDate || endDate) {
    query.generatedAt = {};
    if (startDate) query.generatedAt.$gte = getUtcStartOfDay(startDate);
    if (endDate) query.generatedAt.$lt = getUtcStartOfNextDay(endDate);
  }

  const totalCount = await collection.countDocuments(query);
  
  /*const rawErrors = await collection.find(query)
    .sort({ generatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();
  */
  let cursor = collection.find(query).sort({ generatedAt: -1 });
  
  if(!fetchAll)
  {
    const safePage = page ?? 1;
    const safeLimit = limit ?? 50;
    cursor = cursor.skip((safePage - 1) * safeLimit).limit(safeLimit);
  }

  const rawErrors = await cursor.toArray();
  return {
    errors: rawErrors.map(mapToMonitoringEntry),
    totalCount
  };
}

// --- 3. 전체 에러 통계 ---
export async function getOverallErrorStatistics(
  serialNos: string[] | null,
  startDate: Date | null,
  endDate: Date | null
): Promise<MonitoringStatistics> {
  const db = (await clientPromise).db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const matchQuery: any = { "ERR-CODE": { $ne: '0', $nin: [null, undefined, ""] },
                           "DP-STATE":  { $ne: '0', $nin: [null, undefined, ""] }  } ;
  if (serialNos?.length) matchQuery.serialNo = { $in: serialNos };
  if (startDate || endDate) {
    matchQuery.generatedAt = {};
    if (startDate) matchQuery.generatedAt.$gte = getUtcStartOfDay(startDate);
    if (endDate) matchQuery.generatedAt.$lt = getUtcStartOfNextDay(endDate);
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $addFields: {
        "cleanedERR-CODE": {
          $replaceAll: {
            input: "$ERR-CODE",
            find: "\u0000",
            replacement: ""
          }
        }
      }
    },
    {
      $group: {
        _id: "$cleanedERR-CODE",
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        totalErrors: { $sum: "$count" },
        errorCodeCounts: {
          $push: { k: "$_id", v: "$count" }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalErrors: 1,
        errorCodeCounts: { $arrayToObject: "$errorCodeCounts" },
        uniqueErrorCodes: { $size: "$errorCodeCounts" }
      }
    }
  ];

  const result = await collection.aggregate<MonitoringStatistics>(pipeline).toArray();
  return result[0] || { totalErrors: 0, uniqueErrorCodes: 0, errorCodeCounts: {} };
}

// --- 4. 충전 세션별 구간 구하기 (ready~finish) ---
export async function getChargingSessions(
  serialNos: string[] | null,
  startDate: Date | null,
  endDate: Date | null,
  errorCodes?: SCARErrorCodeEntry[]
): Promise<any[][]> {
  const db = (await clientPromise).db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

const query: any = {};
if (serialNos?.length) query.serialNo = { $in: serialNos };
if (startDate || endDate) {
  query.generatedAt = {};
  if (startDate) query.generatedAt.$gte = getUtcStartOfDay(startDate);
  if (endDate) query.generatedAt.$lt = getUtcStartOfNextDay(endDate);
}
  let UserFailL = false;
  let ServerFailL = false;
  let EVFailL = false;
  let EVSEFailL = false;

  let UserFailR = false;
  let ServerFailR = false;
  let EVFailR = false;
  let EVSEFailR = false;

  // 2. 전체 데이터 조회 (시간 오름차순)
  const rawEntries = await collection.find(query).sort({ generatedAt: 1 }).toArray();
  const entries = rawEntries.map(mapToMonitoringEntry);//rawEntries as any[];

    // 2. 세션 분리 (L/R 각각 독립)
  const sessions: any[][] = [];
  let sessionStartIdxL: number | null = null;
  let sessionStartIdxR: number | null = null;

  for (let i = 0; i < entries.length; i++) {
    const state = (entries[i]["DP-STATE"] ?? "").toLowerCase();
    const errorCode = (entries[i]["ERR-CODE"] ?? "").toLowerCase();
    
    UserFailL = false;
    ServerFailL = false;
    EVFailL = false;
    EVSEFailL = false;

    UserFailR = false;
    ServerFailR = false;
    EVFailR = false;
    EVSEFailR = false;

    // L 세션 시작
    if (
      sessionStartIdxL === null &&
      state.includes("ready_start_to_use") &&
      state.endsWith(" l")
    ) {
      sessionStartIdxL = i;
    }

    // R 세션 시작
    if (
      sessionStartIdxR === null &&
      state.includes("ready_start_to_use") &&
      state.endsWith(" r")
    ) {
      sessionStartIdxR = i;
    }

    // L 세션 끝
    if (
      sessionStartIdxL !== null &&
      (state.includes("finish") || state.includes("thankyou") || state.includes("fault")|| state.includes("thankyou")) &&
      state.endsWith(" l")
    ) {
      if (state.includes("fault") && errorCodes?.length) {
        for(let i = 0; i< errorCodes.length; ++i)
        {
          console.log(
    "비교", errorCode, errorCodes[i].code, 
    errorCode === errorCodes[i].code, errorCodes[i].type
  );
          if(errorCode === errorCodes[i].code)
          {
            switch(errorCodes[i].type)
            {
              case "User" : 
              {
                UserFailL = true;
                break;
              }
               case "Server" : 
              {
                ServerFailL = true;
                break;
              }
               case "EV" : 
              {
                EVFailL = true;
                break;
              }
               case "EVSE" : 
              {
                EVSEFailL = true;
                break;
              }
            }
          }
        }
      }

      const startTimeStr = entries[sessionStartIdxL].generatedAt;
      const endTimeStr = entries[i].generatedAt;
      const startTime = new Date(startTimeStr);
      const endTime = new Date(endTimeStr);

      const diffMin = (endTime.getTime() - startTime.getTime()) / 1000 / 60;
       const sessionRows = entries.slice(sessionStartIdxL, i + 1).map(row => ({
        ...row,
        isShortSession: diffMin < 5,
        isUserFailL: UserFailL,
        isServerFailL: ServerFailL,
        isEVFailL: EVFailL,
        isEVSEFailL: EVSEFailL
      }));
      //const sessionRows = entries.slice(sessionStartIdxL, i + 1).map(row => ({ ...row, }));
      //if (diffMin < 5) sessionRows.forEach(row => row.isShortSession = true);

      sessions.push(sessionRows);
      sessionStartIdxL = null;
    }

    // R 세션 끝
    if (
      sessionStartIdxR !== null &&
      (state.includes("finish") || state.includes("thankyou") || state.includes("fault")) &&
      state.endsWith(" r")
    ) {
           if (state.includes("fault") && errorCodes?.length) {
        for(let i = 0; i< errorCodes.length; ++i)
        {
          console.log(
    "비교", errorCode, errorCodes[i].code, 
    errorCode === errorCodes[i].code, errorCodes[i].type
  );
          if(errorCode === errorCodes[i].code)
          {
            switch(errorCodes[i].type)
            {
              case "User" : 
              {
                UserFailR = true;
                break;
              }
               case "Server" : 
              {
                ServerFailR = true;
                break;
              }
               case "EV" : 
              {
                EVFailR = true;
                break;
              }
               case "EVSE" : 
              {
                EVSEFailR = true;
                break;
              }
            }
          }
        }
      }

      const startTimeStr = entries[sessionStartIdxR].generatedAt;
      const endTimeStr = entries[i].generatedAt;
      const startTime = new Date(startTimeStr);
      const endTime = new Date(endTimeStr);

      const diffMin = (endTime.getTime() - startTime.getTime()) / 1000 / 60;
       const sessionRows = entries.slice(sessionStartIdxR, i + 1).map(row => ({
        ...row,
        isShortSession: diffMin < 5,
        isUserFailR: UserFailR,
        isServerFailR: ServerFailR,
        isEVFailR: EVFailR,
        isEVSEFailR: EVSEFailR
      }));
      //const sessionRows = entries.slice(sessionStartIdxR, i + 1).map(row => ({ ...row }));
      //if (diffMin < 5) sessionRows.forEach(row => row.isShortSession = true);

      sessions.push(sessionRows);
      sessionStartIdxR = null;
    }
    // 기타 케이스는 따로 처리 불필요
  }

  return sessions;
}
