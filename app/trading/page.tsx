"use client";

import { useEffect } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { BotDashboard } from '@/components/trading/BotDashboard';

export default function TradingPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return <BotDashboard />;
}

