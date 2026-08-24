import { isAxiosError } from 'axios'

export function extraerMensajeAxios(error: unknown): string | undefined {
  return isAxiosError<{ mensaje?: string }>(error) ? error.response?.data?.mensaje : undefined
}
