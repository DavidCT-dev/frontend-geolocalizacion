import { logger } from '@/lib/default-logger';
import { setCookie } from 'cookies-next';

export interface AuthResponse {
  data?: {
    user?: any;
    token?: string;
  };
  error?: string;
}
export const setToken = (token: string): void => {
    setCookie('auth-token', token, {
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
  };

export const authClient = {

  async signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResponse> {
    try {
      // Aquí iría tu llamada real al API
      console.log(`${process.env.NEXT_PUBLIC_API_URL_BACK}auth/login`)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json()
        return { error: errorData.message || 'Error al iniciar sesión' };
      }

      const data = await response.json();
      setToken(data.token);

      return { data: { user: data.usuario, token: data.token } };


    } catch (err) {
      return { error: 'Error de conexión' };
    }
  },

  async getUser(token?: string): Promise<AuthResponse> {
    try {
      if (!token) {
        return { error: 'No hay token' };
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}auth/decoded`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({token}),
      });

      if (!response.ok) {
        return { error: 'Sesión inválida o expirada' };
      }

      const data = await response.json();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACK}user/${data.payload.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        return { error: 'Sesión inválida o expirada' };
      }
      const user = await res.json();
      return { data: { user } };
    } catch (err) {
      logger.error(err);
      return { error: 'Error al verificar sesión' };
    }
  },


};
