export interface LoginRequest {
    email: string
    password: string
}

export interface LoginResponse {
    token: string
    usuarioId: number
    nombre: string
}

export interface RegisterRequest {
    nombre: string
    email: string
    password: string
}

export interface RegisterResponse {
    usuarioId: number
    nombre: string
    email: string
}