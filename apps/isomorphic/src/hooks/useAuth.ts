/**
 * Hook personnalisé pour l'authentification
 */

import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  authStateAtom,
  adminAtom,
  clientAtom,
  userTypeAtom,
  currentUserAtom,
  authLoadingAtom,
  authErrorAtom,
} from '@/store/auth';
import api from '@/services/api';
import { setAuthToken } from '@/lib/auth-storage';
import type { LoginCredentials, RegisterData, UserType } from '@/types/auth';

export function useAuth() {
  const router = useRouter();

  // Atoms
  const [authState, setAuthState] = useAtom(authStateAtom);
  const [admin, setAdmin] = useAtom(adminAtom);
  const [client, setClient] = useAtom(clientAtom);
  const [userType, setUserType] = useAtom(userTypeAtom);
  const [isLoading, setIsLoading] = useAtom(authLoadingAtom);
  const [error, setError] = useAtom(authErrorAtom);
  const currentUser = useAtomValue(currentUserAtom);

  /**
   * Connexion administrateur
   */
  const loginAdmin = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.adminLogin(
          credentials.email,
          credentials.password
        );

        if (response.success && response.data) {
          const data = response.data as { token?: string; access_token?: string; admin?: unknown };
          const token = (data?.token ?? data?.access_token ?? (response as { token?: string }).token)?.trim?.();
          if (typeof token === 'string' && token.length > 0 && typeof window !== 'undefined') {
            setAuthToken(token);
            localStorage.setItem('user_type', 'admin');
          }
          setAdmin(response.data.admin);
          setUserType('admin');
          setAuthState({
            isAuthenticated: true,
            userType: 'admin',
            admin: response.data.admin,
            client: null,
            isLoading: false,
            error: null,
          });

          // Forcer le layout selon le type d'utilisateur
          localStorage.setItem('isomorphic-layout', 'helium');
          
          toast.success(response.message || 'Connexion réussie');

          const searchParams = new URLSearchParams(window.location.search);
          const redirectUrl = searchParams.get('redirect') || '/';
          router.push(redirectUrl);
        }
      } catch (err: any) {
        const errorMessage =
          err.message || 'Une erreur est survenue lors de la connexion';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [router, setAdmin, setAuthState, setError, setIsLoading, setUserType]
  );

  /**
   * Connexion client
   */
  const loginClient = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.clientLogin(
          credentials.email,
          credentials.password
        );

        if (response.success && response.data) {
          const data = response.data as { token?: string; access_token?: string; client?: unknown };
          const token = (data?.token ?? data?.access_token ?? (response as { token?: string }).token)?.trim?.();
          if (typeof token === 'string' && token.length > 0 && typeof window !== 'undefined') {
            setAuthToken(token);
            localStorage.setItem('user_type', 'client');
          }
          setClient(response.data.client);
          setUserType('client');
          setAuthState({
            isAuthenticated: true,
            userType: 'client',
            admin: null,
            client: response.data.client,
            isLoading: false,
            error: null,
          });

          // Forcer le layout Lithium pour les clients
          localStorage.setItem('isomorphic-layout', 'lithium');

          toast.success(response.message || 'Connexion réussie');

          const searchParams = new URLSearchParams(window.location.search);
          const redirectUrl = searchParams.get('redirect') || '/';
          router.push(redirectUrl);
        }
      } catch (err: any) {
        const errorMessage =
          err.message || 'Une erreur est survenue lors de la connexion';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [router, setClient, setAuthState, setError, setIsLoading, setUserType]
  );

  /**
   * Inscription client
   */
  const registerClient = useCallback(
    async (data: RegisterData) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.clientRegister(data);

        if (response.success && response.data) {
          setClient(response.data.client);
          setUserType('client');
          setAuthState({
            isAuthenticated: true,
            userType: 'client',
            admin: null,
            client: response.data.client,
            isLoading: false,
            error: null,
          });

          // Forcer le layout Lithium pour les clients
          localStorage.setItem('isomorphic-layout', 'lithium');

          toast.success(response.message || 'Inscription réussie');
          router.push('/');
        }
      } catch (err: any) {
        const errorMessage =
          err.message || "Une erreur est survenue lors de l'inscription";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [router, setClient, setAuthState, setError, setIsLoading, setUserType]
  );

  /**
   * Déconnexion
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Sauvegarder le type d'utilisateur avant de le réinitialiser
      const currentUserType = userType;

      // Appeler l'API de déconnexion selon le type d'utilisateur
      if (currentUserType === 'admin') {
        await api.adminLogout();
      } else if (currentUserType === 'client') {
        await api.clientLogout();
      }

      // Réinitialiser l'état
      setAdmin(null);
      setClient(null);
      setUserType(null);
      setAuthState({
        isAuthenticated: false,
        userType: null,
        admin: null,
        client: null,
        isLoading: false,
        error: null,
      });

      toast.success('Déconnexion réussie');
      
      // Rediriger vers la page de connexion correspondante
      const redirectUrl = currentUserType === 'admin' 
        ? '/auth/admin-signin' 
        : '/auth/client-signin';
      router.push(redirectUrl);
    } catch (err: any) {
      console.error('Logout error:', err);
      // Sauvegarder le type d'utilisateur avant de le réinitialiser
      const currentUserType = userType;
      
      // Même en cas d'erreur, on déconnecte l'utilisateur côté client
      api.clearAuth();
      setAdmin(null);
      setClient(null);
      setUserType(null);
      setAuthState({
        isAuthenticated: false,
        userType: null,
        admin: null,
        client: null,
        isLoading: false,
        error: null,
      });
      
      // Rediriger vers la page de connexion correspondante
      const redirectUrl = currentUserType === 'admin' 
        ? '/auth/admin-signin' 
        : '/auth/client-signin';
      router.push(redirectUrl);
    } finally {
      setIsLoading(false);
    }
  }, [
    userType,
    router,
    setAdmin,
    setClient,
    setUserType,
    setAuthState,
    setIsLoading,
  ]);

  /**
   * Charger le profil utilisateur au démarrage
   */
  const loadUserProfile = useCallback(async () => {
    if (!api.isAuthenticated() || !userType) {
      return;
    }

    try {
      setIsLoading(true);

      if (userType === 'admin') {
        const response = await api.getAdminProfile();
        if (response.success && response.data) {
          setAdmin(response.data);
          setAuthState((prev) => ({
            ...prev,
            isAuthenticated: true,
            userType: 'admin',
            admin: response.data,
          }));
        }
      } else if (userType === 'client') {
        const response = await api.getClientProfile();
        if (response.success && response.data) {
          setClient(response.data);
          setAuthState((prev) => ({
            ...prev,
            isAuthenticated: true,
            userType: 'client',
            client: response.data,
          }));
        }
      }
    } catch (err: any) {
      console.error('Failed to load user profile:', err);
      const msg = err?.message ?? '';
      const isNetworkError = msg.includes('Impossible de joindre') || msg.includes('fetch') || msg.includes('NetworkError');
      if (isNetworkError) {
        // API injoignable : ne pas déconnecter, l'utilisateur a peut‑être un token valide
        return;
      }
      if (err?.message?.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        api.clearAuth();
        setUserType(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userType, setAdmin, setClient, setAuthState, setIsLoading, setUserType]);

  // Charger le profil au montage du composant
  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // État
    isAuthenticated: authState.isAuthenticated,
    userType,
    admin,
    client,
    currentUser: currentUser?.user || null, // Extraire juste le user
    isLoading,
    error,

    // Actions
    loginAdmin,
    loginClient,
    registerClient,
    logout,
    loadUserProfile,
  };
}

export default useAuth;

