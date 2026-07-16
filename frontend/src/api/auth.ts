import { api } from "./client";
import type { LoginResponse, User } from "../types";

export function login(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>(
    "/auth/login",
    { email, password },
    { skipAuth: true },
  );
}

export function fetchCurrentUser(): Promise<User> {
  return api.get<User>("/auth/me");
}
