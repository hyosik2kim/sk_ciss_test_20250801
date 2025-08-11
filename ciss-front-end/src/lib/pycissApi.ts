import api from "./pyApiClient";

export const getHealth = () => api.get<string>("/health");

export const enqueueMessage = (message: string) =>
  api.post("/enqueue", message);

export const getChargingPageData = (
  serialNos: string[] | null,
  startDate: Date | null,
  endDate: Date | null,
  page = 1,
  limit = 15
) =>
  api
    .post("/monitoring/charging-page", {
      serialNos,
      startDate,
      endDate,
      page,
      limit,
    })
    .then(res => res.data);

export const getChargingSessions = (
  serialNos: string[] | null,
  startDate: Date | null,
  endDate: Date | null,
  errorCodes?: any[]
) =>
  api
    .post("/monitoring/sessions", {
      serialNos,
      startDate,
      endDate,
      errorCodes,
    })
    .then(res => res.data);

export const getErrors = (
  serialNos: string[] | null,
  startDate: Date | null,
  endDate: Date | null,
  page?: number,
  limit?: number,
  fetchAll = false
) =>
  api
    .post("/monitoring/errors", {
      serialNos,
      startDate,
      endDate,
      page,
      limit,
      fetchAll,
    })
    .then(res => res.data);

export const getOverallErrorStatistics = (
  serialNos: string[] | null,
  startDate: Date | null,
  endDate: Date | null
) =>
  api
    .post("/monitoring/error-stats", {
      serialNos,
      startDate,
      endDate,
    })
    .then(res => res.data);