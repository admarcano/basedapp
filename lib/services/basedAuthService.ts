// Servicio de autenticación OAuth con Based

export interface BasedUser {
  email: string;
  id: string;
  name?: string;
  walletAddress?: string;
}

export class BasedAuthService {
  private readonly BASED_OAUTH_URL = 'https://app.based.one/oauth'; // Ajustar según la URL real
  private readonly CLIENT_ID = process.env.NEXT_PUBLIC_BASED_CLIENT_ID || '';
  private readonly REDIRECT_URI = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/based/callback`
    : '';

  /**
   * Inicia el flujo de OAuth con Based
   * En desarrollo o si no hay CLIENT_ID configurado, permite simular login sin OAuth
   */
  initiateLogin(): void {
    // Si no hay CLIENT_ID configurado, usar modo simulado (desarrollo o producción sin OAuth)
    if (!this.CLIENT_ID || this.CLIENT_ID.trim() === '') {
      // Crear usuario simulado
      const devUser: BasedUser = {
        email: 'albertodiazmarcano@gmail.com',
        id: 'dev-user-' + Date.now(),
        name: 'Usuario Desarrollo',
        walletAddress: '0x0000000000000000000000000000000000000000',
      };

      // Guardar en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('based_user', JSON.stringify(devUser));
        localStorage.setItem('based_access_token', 'dev-token-' + Date.now());
        // Recargar para actualizar el estado
        window.location.reload();
      }
      return;
    }

    // Producción con OAuth configurado: usar OAuth real
    try {
      const params = new URLSearchParams({
        client_id: this.CLIENT_ID,
        redirect_uri: this.REDIRECT_URI,
        response_type: 'code',
        scope: 'read write',
        state: this.generateState(),
      });

      // Guardar state en sessionStorage para verificación
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('based_oauth_state', params.get('state') || '');
        window.location.href = `${this.BASED_OAUTH_URL}/authorize?${params.toString()}`;
      }
    } catch (error) {
      console.error('Error iniciando OAuth:', error);
      // Si falla OAuth, usar modo simulado como fallback
      const devUser: BasedUser = {
        email: 'albertodiazmarcano@gmail.com',
        id: 'dev-user-' + Date.now(),
        name: 'Usuario Desarrollo',
        walletAddress: '0x0000000000000000000000000000000000000000',
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('based_user', JSON.stringify(devUser));
        localStorage.setItem('based_access_token', 'dev-token-' + Date.now());
        window.location.reload();
      }
    }
  }

  /**
   * Maneja el callback de OAuth
   */
  async handleCallback(code: string, state: string): Promise<BasedUser | null> {
    // Verificar state
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('based_oauth_state');
      if (savedState !== state) {
        throw new Error('Estado OAuth inválido');
      }
      sessionStorage.removeItem('based_oauth_state');
    }

    try {
      // Intercambiar código por token (esto debe hacerse en el backend)
      const response = await fetch('/api/auth/based/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        throw new Error('Error en autenticación');
      }

      const data = await response.json();
      
      // Guardar usuario en localStorage
      if (typeof window !== 'undefined' && data.user) {
        localStorage.setItem('based_user', JSON.stringify(data.user));
        localStorage.setItem('based_access_token', data.accessToken);
      }

      return data.user;
    } catch (error) {
      console.error('Error en callback OAuth:', error);
      return null;
    }
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): BasedUser | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('based_user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Obtiene el token de acceso
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('based_access_token');
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null && this.getAccessToken() !== null;
  }

  /**
   * Cierra sesión
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('based_user');
      localStorage.removeItem('based_access_token');
    }
  }

  /**
   * Genera un state aleatorio para OAuth
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Verifica si un email tiene acceso gratis
   */
  isFreeUser(email: string): boolean {
    const FREE_EMAILS = ['albertodiazmarcano@gmail.com'];
    return FREE_EMAILS.includes(email.toLowerCase());
  }
}

export const basedAuthService = new BasedAuthService();

