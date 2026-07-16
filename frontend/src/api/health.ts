import { api } from "./client";
import type { HealthStatus } from "../types";

export function fetchHealth(): Promise<HealthStatus> {
  return api.get<HealthStatus>("/health", { skipAuth: true });
}
