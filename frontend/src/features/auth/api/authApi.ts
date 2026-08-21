import { api } from "../../../shared/lib/axios";
import type {
    LoginRequest,
    LoginResponse,
    PreguntaSeguridadRequest,
    PreguntaSeguridadResponse,
    RegisterRequest,
    RegisterResponse,
    RestaurarPasswordRequest,
} from "../types";

export async function login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data)
    return response.data
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/registro', data)
    return response.data
}

export async function obtenerPreguntaSeguridad(data: PreguntaSeguridadRequest): Promise<PreguntaSeguridadResponse> {
    const response = await api.post<PreguntaSeguridadResponse>('/auth/pregunta-seguridad', data)
    return response.data
}

export async function restaurarPassword(data: RestaurarPasswordRequest): Promise<void> {
    await api.post('/auth/restaurar-password', data)
}