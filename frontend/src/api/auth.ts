import { api } from './client'

export interface TokenResponseDTO {
  access_token: string
  token_type: string
  expires_in: number
}

export const loginRequest = (username: string, password: string) =>
  api.post<TokenResponseDTO>('/auth/login', { username, password })
