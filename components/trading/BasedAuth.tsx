"use client";

import { basedAuthService } from '@/lib/services/basedAuthService';
import { Logo } from '@/components/Logo';

export function BasedAuth() {
  const handleLogin = () => {
    try {
      basedAuthService.initiateLogin();
    } catch (error) {
      console.error('Error iniciando login:', error);
      // En desarrollo, mostrar mensaje más amigable
      if (process.env.NODE_ENV === 'development') {
        alert('Modo desarrollo: Se creará una sesión simulada. En producción, se usará OAuth real con Based.');
      } else {
        alert('Error iniciando sesión. Verifica la configuración.');
      }
    }
  };

  const currentUser = basedAuthService.getCurrentUser();

  if (currentUser) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-xl border border-emerald-400/40 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-emerald-500/10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="text-emerald-400 text-2xl drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">✓</span>
            <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <div>
            <div className="text-sm font-semibold text-emerald-300">Conectado como</div>
            <div className="text-base font-bold text-white">{currentUser.email}</div>
            <div className="text-xs text-gray-400 mt-1 font-mono">Based ID: {currentUser.id}</div>
          </div>
        </div>
        <button
          onClick={() => {
            basedAuthService.logout();
            window.location.reload();
          }}
          className="text-xs text-gray-300 hover:text-white px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-all border border-gray-700/50 hover:border-gray-600/50 backdrop-blur-sm"
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-900/60 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 relative overflow-hidden">
        {/* Efecto de borde brillante */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-purple-500/0 opacity-50"></div>
        
        <div className="relative z-10">
          {/* Layout de dos columnas en desktop */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Columna izquierda: Logo y Header */}
            <div className="text-center md:text-left">
              <div className="flex justify-center md:justify-start mb-6">
                <div className="relative">
                  <Logo />
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse"></div>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
            Autenticación con Based
          </h2>
              <p className="text-gray-300 text-base md:text-lg font-light tracking-wide mb-6 md:mb-8">
            Inicia sesión con tu cuenta de Based para operar con el bot de trading automático
          </p>

              {/* Botón de Login - Visible en móvil */}
              <div className="md:hidden">
                <button
                  onClick={handleLogin}
                  className="group relative w-full px-8 py-4 overflow-hidden rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                    boxShadow: '0 10px 40px rgba(6, 182, 212, 0.4), 0 0 20px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="relative flex items-center justify-center gap-2 text-white drop-shadow-lg">
                    <span className="text-xl">🚀</span>
                    Iniciar Sesión con Based
                  </span>
                </button>
              </div>
            </div>

            {/* Columna derecha: Features y Botón (Desktop) */}
            <div className="space-y-6">
              {/* Features destacadas */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl p-5 border border-cyan-500/20 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
                  <span className="text-cyan-400 text-2xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] flex-shrink-0">🔐</span>
                  <div>
                    <div className="text-gray-200 font-semibold mb-1">Autenticación Segura</div>
                    <div className="text-gray-400 text-sm font-light">Conecta de forma segura con tu cuenta de Based</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl p-5 border border-cyan-500/20 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
                  <span className="text-cyan-400 text-2xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] flex-shrink-0">⚡</span>
                  <div>
                    <div className="text-gray-200 font-semibold mb-1">Acceso Instantáneo</div>
                    <div className="text-gray-400 text-sm font-light">Comienza a operar inmediatamente después del login</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl p-5 border border-cyan-500/20 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
                  <span className="text-cyan-400 text-2xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] flex-shrink-0">💼</span>
                  <div>
                    <div className="text-gray-200 font-semibold mb-1">Gestión de Capital</div>
                    <div className="text-gray-400 text-sm font-light">Gestiona tu capital directamente desde tu cuenta de Based</div>
                  </div>
                </div>
              </div>

              {/* Botón de Login - Visible en desktop */}
              <div className="hidden md:block">
                <button
                  onClick={handleLogin}
                  className="group relative w-full px-8 py-4 overflow-hidden rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                    boxShadow: '0 10px 40px rgba(6, 182, 212, 0.4), 0 0 20px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="relative flex items-center justify-center gap-2 text-white drop-shadow-lg">
                    <span className="text-xl">🚀</span>
                    Iniciar Sesión con Based
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-cyan-500/20">
            {!process.env.NEXT_PUBLIC_BASED_CLIENT_ID || process.env.NEXT_PUBLIC_BASED_CLIENT_ID.trim() === '' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3">
                  <span>⚠️</span>
                  <p className="font-medium">Modo Simulado: Se creará una sesión de prueba</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <span className="text-cyan-400">ℹ️</span>
                  <p className="font-light">Para usar OAuth real, configura <span className="text-cyan-300 font-medium">NEXT_PUBLIC_BASED_CLIENT_ID</span> en las variables de entorno</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <span className="text-cyan-400">ℹ️</span>
                <p className="font-light">Serás redirigido a <span className="text-cyan-300 font-medium">app.based.one</span> para autenticarte</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

