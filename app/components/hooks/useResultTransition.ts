"use client";

import { useState, useEffect, useRef } from "react";

export type ResultTransitionPhase = "searching" | "complete";

export interface ResultTransitionState {
  phase: ResultTransitionPhase;
  cardOpacity: number;
  cardScale: number;
}

export function useResultTransition(
  done: boolean,
  hasPlan: boolean
): ResultTransitionState {
  const [phase, setPhase] = useState<ResultTransitionPhase>("searching");
  const triggered = useRef(false);

  useEffect(() => {
    if (!done || !hasPlan || triggered.current) return;
    triggered.current = true;

    // Clean, immediate transition — no bounce
    const t = setTimeout(() => setPhase("complete"), 300);
    return () => clearTimeout(t);
  }, [done, hasPlan]);

  switch (phase) {
    case "searching":
      return { phase, cardOpacity: 1, cardScale: 1 };
    case "complete":
      return { phase, cardOpacity: 0.5, cardScale: 1 };
  }
}
