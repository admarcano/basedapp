"use client";

import { basedAuthService } from '@/lib/services/basedAuthService';

export function BasedAuth() {
  const handleLogin = () => {
    try {
      basedAuthService.initiateLogin();
    } catch (error) {
      console.error('Error iniciando login:', error);
      alert('Error iniciando sesión. Verifica la configuración.');
    }
  };

  const currentUser = basedAuthService.getCurrentUser();

  if (currentUser) {
    return (
      <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-green-400">✓</span>
          <div>
            <div className="text-sm font-medium">Conectado como {currentUser.email}</div>
            <div className="text-xs text-gray-400">Based ID: {currentUser.id}</div>
          </div>
        </div>
        <button
          onClick={() => {
            basedAuthService.logout();
            window.location.reload();
          }}
          className="text-xs text-gray-400 hover:text-white px-3 py-1 bg-gray-800 rounded-lg"
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-700/50">
      <h2 className="text-2xl font-bold mb-4">Autenticación con Based</h2>
      <p className="text-gray-400 text-sm mb-6">
        Inicia sesión con tu cuenta de Based para operar con el bot
      </p>

      <button
        onClick={handleLogin}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors font-medium"
      >
        Iniciar Sesión con Based
      </button>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Serás redirigido a app.based.one para autenticarte</p>
      </div>
    </div>
  );
}

