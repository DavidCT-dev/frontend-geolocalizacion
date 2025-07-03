'use client';

import * as React from 'react';
import type { User, Permiso } from '@/types/user';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';
import { useCallback } from 'react';

export interface UserContextValue {
  user: User | null;
  error: string | null;
  isLoading: boolean;
  permissions: string[];
  checkSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  rolUser:string;
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [state, setState] = React.useState<{
    user: User | null;
    error: string | null;
    isLoading: boolean;
    permissions: string[];
  }>({
    user: null,
    error: null,
    isLoading: true,
    permissions: [],
  });

  const [rolUser, setRolUser] = React.useState('')

  const [isMounted, setIsMounted] = React.useState(false);

  // Función para extraer los permisos
  const extractPermissions = React.useCallback((user: User | null): string[] => {
    if (!user?.rol) return [];
    return Array.isArray(user.rol.permisoIds)
      ? user.rol.permisoIds.map((permiso: any) =>
          typeof permiso === 'string' ? permiso : permiso.nombre
        )
      : [];
  }, []);

  // Manejo de cookies
  const getToken = (): string | null => {
    return getCookie('auth-token')?.toString() || null;
  };

  const setToken = (token: string): void => {
    setCookie('auth-token', token, {
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
  };

  const removeToken = (): void => {
    deleteCookie('auth-token');
  };

  const checkSession = React.useCallback(async (): Promise<void> => {
    try {
      const token = getToken();
      if (!token) {
        setState((prev) => ({ ...prev, user: null, permissions: [], error: null, isLoading: false }));
        return;
      }

      const { data, error } = await authClient.getUser(token);

      if (error) {
        removeToken();
        setState((prev) => ({ ...prev, user: null, permissions: [], error: 'Sesión expirada', isLoading: false }));
        return;
      }

      const user = data?.user ?? null;
      setRolUser(user.rol.nombre)
      const permissions = extractPermissions(user);
      setState((prev) => ({
        ...prev,
        user,
        permissions,
        error: null,
        isLoading: false
      }));
    } catch (err) {
      logger.error(err);
      removeToken();
      setState((prev) => ({ ...prev, user: null, permissions: [], error: 'Error al verificar sesión', isLoading: false }));
    }
  }, [extractPermissions]);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
  setState((prev) => ({ ...prev, isLoading: true, error: null }));
  try {
    const { data, error } = await authClient.signInWithPassword({ email, password });

    if (error) {
      setState((prev) => ({
        ...prev,
        error ,
        isLoading: false
      }));
      // console.log('context',error)
      return;
    }

    if (!data?.token) {
      setState((prev) => ({
        ...prev,
        error: 'No se recibió token de autenticación',
        isLoading: false
      }));
      return;
    }

    setToken(data.token);
    setRolUser(data.user.rol.nombre);
    const permissions = extractPermissions(data.user ?? null);

    setState((prev) => ({
      ...prev,
      user: data.user ?? null,
      permissions,
      error: null,
      isLoading: false
    }));
  } catch (err: any) {
    setState((prev) => ({
      ...prev,
      error: err || 'Error al iniciar sesión',
      isLoading: false
    }));
  }
}, [extractPermissions]);

  const signOut = React.useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      removeToken();
      setState({ user: null, permissions: [], error: null, isLoading: false });
    } catch (err) {
      logger.error(err);
      setState((prev) => ({ ...prev, error: 'Error al cerrar sesión', isLoading: false }));
    }
  }, []);

  const hasPermission = React.useCallback((permission: string): boolean => {
    return state.permissions.includes(permission);
  }, [state.permissions]);

  const hasAnyPermission = React.useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => state.permissions.includes(permission));
  }, [state.permissions]);

  React.useEffect(() => {
    setIsMounted(true);
    return () => { setIsMounted(false); };
  }, []);

  React.useEffect(() => {
    if (isMounted) {
      const verifySession = async () => {
        try {
          const token = getToken();
          if (token) {
            await checkSession();
          } else {
            setState(prev => ({...prev, isLoading: false}));
          }
        } catch (err) {
          logger.error('Error verifying session:', err);
          setState(prev => ({...prev, isLoading: false}));
        }
      };

      verifySession();
    }
  }, [isMounted, checkSession]);

  const value = React.useMemo(() => ({
    ...state,
    checkSession,
    signIn,
    signOut,
    hasPermission,
    hasAnyPermission,
    rolUser
  }), [state, checkSession, signIn, signOut, hasPermission, hasAnyPermission,rolUser]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
