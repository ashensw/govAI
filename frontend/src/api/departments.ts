import { api } from "./client";
import type { Department } from "../types";

export function fetchDepartments(): Promise<Department[]> {
  return api.get<Department[]>("/departments");
}
