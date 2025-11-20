"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { basedAuthService } from '@/lib/services/basedAuthService';

function BasedCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      setStatus('error');
      setMessage('Código de autorización no recibido');
      return;
    }

    const handleCallback = async () => {
      try {
        const user = await basedAuthService.handleCallback(code, state);
        if (user) {
          setStatus('success');
          setMessage('Autenticación exitosa');
          setTimeout(() => {
            router.push('/trading');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Error en autenticación');
        }
      } catch {
        setStatus('error');
        setMessage('Error procesando autenticación');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Procesando autenticación...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-400 text-4xl mb-4">✓</div>
            <p className="text-green-400">{message}</p>
            <p className="text-gray-400 text-sm mt-2">Redirigiendo...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-400 text-4xl mb-4">✗</div>
            <p className="text-red-400">{message}</p>
            <button
              onClick={() => router.push('/trading')}
              className="mt-4 px-4 py-2 bg-blue-600 rounded-xl"
            >
              Volver
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function BasedCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    }>
      <BasedCallbackContent />
    </Suspense>
  );
}

