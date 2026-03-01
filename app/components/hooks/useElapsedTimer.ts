"use client";

import { useState, useEffect } from "react";

export function useElapsedTimer(
  startTime: number | null,
  active: boolean
): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime || !active) return;

    setElapsed(Math.floor((Date.now() - startTime) / 1000));

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, active]);

  return elapsed;
}
