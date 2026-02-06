/**
 * Types pour l'authentification
 */

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'agent';

export type UserType = 'admin' | 'client';

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  passport_number?: string;
  is_active: boolean;
  created_at?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userType: UserType | null;
  admin: Admin | null;
  client: Client | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}


