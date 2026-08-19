import { api } from "../../../shared/lib/axios";
import type { LoginRequest, LoginResponse } from "../types";

export async function login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data)
    return response.data
}