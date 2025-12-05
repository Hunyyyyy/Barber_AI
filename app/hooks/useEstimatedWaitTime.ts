// hooks/useEstimatedWaitTime.ts
'use client';

import type { ServiceType } from '@/types/queue/types';
import { useEffect, useState } from 'react';

export function useEstimatedWaitTime(services: ServiceType[]) {
  const [estimate, setEstimate] = useState<{ minutes: number; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (services.length === 0) {
      setEstimate(null);
      return;
    }

    setLoading(true);
    fetch('/api/queue/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services }),
    })
      .then((res) => res.json())
      .then((data) => {
        setEstimate(data);
        setLoading(false);
      });
  }, [services]);

  return { estimate, loading };
}