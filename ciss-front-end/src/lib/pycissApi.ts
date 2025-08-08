// ciss-front-end/src/lib/cissApi.ts
import api from "./pyApiClient";

export const getHealth = () => api.get<string>("/health");

export const enqueueMessage = (message: string) =>
  api.post("/enqueue", message);
