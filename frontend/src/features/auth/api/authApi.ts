import { api } from "../../../shared/lib/axios";
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "../types";

export async function login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data)
    return response.data
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/registro', data)
    return response.data
}