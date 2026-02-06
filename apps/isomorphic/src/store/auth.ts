/**
 * Store d'authentification avec Jotai
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { AuthState, Admin, Client, UserType } from '@/types/auth';

// État initial
const initialAuthState: AuthState = {
  isAuthenticated: false,
  userType: null,
  admin: null,
  client: null,
  isLoading: false,
  error: null,
};

// Stockage sûr pour SSR (évite les erreurs quand localStorage n'existe pas)
const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

// Atom pour stocker le type d'utilisateur dans le localStorage
export const userTypeAtom = atomWithStorage<UserType | null>(
  'user_type',
  null,
  safeStorage as any
);

// Atom principal pour l'état d'authentification
export const authStateAtom = atom<AuthState>(initialAuthState);

// Atom pour l'admin connecté
export const adminAtom = atom<Admin | null>(null);

// Atom pour le client connecté
export const clientAtom = atom<Client | null>(null);

// Atom dérivé : est authentifié
export const isAuthenticatedAtom = atom((get) => {
  const authState = get(authStateAtom);
  return authState.isAuthenticated;
});

// Atom dérivé : obtenir l'utilisateur courant (admin ou client)
export const currentUserAtom = atom((get) => {
  const admin = get(adminAtom);
  const client = get(clientAtom);
  const userType = get(userTypeAtom);

  if (userType === 'admin' && admin) {
    return { type: 'admin' as const, user: admin };
  }
  if (userType === 'client' && client) {
    return { type: 'client' as const, user: client };
  }
  return null;
});

// Atom pour le loading state
export const authLoadingAtom = atom<boolean>(false);

// Atom pour les erreurs
export const authErrorAtom = atom<string | null>(null);


