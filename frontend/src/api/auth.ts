import api from './axios';
import { AuthResponse, UserProfile } from '../types';

export async function login(email: string, senha: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, senha });
  return data;
}

export async function register(nome: string, email: string, senha: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', { nome, email, senha });
  return data;
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/users/me');
  return data;
}

export async function updateProfile(nome: string): Promise<UserProfile> {
  const { data } = await api.put<UserProfile>('/users/me', { nome });
  return data;
}
