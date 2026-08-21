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
    preguntaSeguridad: string
    respuestaSeguridad: string
}

export interface RegisterResponse {
    usuarioId: number
    nombre: string
    email: string
}

export interface PreguntaSeguridadRequest {
    email: string
}

export interface PreguntaSeguridadResponse {
    pregunta: string
}

export interface RestaurarPasswordRequest {
    email: string
    respuestaSeguridad: string
    nuevaPassword: string
}