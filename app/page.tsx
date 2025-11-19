"use client";
import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const router = useRouter();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Redirigir directamente al bot de trading
  useEffect(() => {
    router.push("/trading");
  }, [router]);
  // Mostrar loading mientras redirige
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem' }}>🤖 Trading Bot With Marcano</h1>
        <p>Cargando bot de trading...</p>
      </div>
    </div>
  );
}
