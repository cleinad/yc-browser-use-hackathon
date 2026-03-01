"use client";

import { useState, useEffect, useRef } from "react";

export type ResultTransitionPhase = "searching" | "completing" | "complete";

export interface ResultTransitionState {
  phase: ResultTransitionPhase;
  cardOpacity: number;
  cardScale: number;
  showButton: boolean;
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

    const t1 = setTimeout(() => setPhase("completing"), 600);
    const t2 = setTimeout(() => setPhase("complete"), 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [done, hasPlan]);

  switch (phase) {
    case "searching":
      return { phase, cardOpacity: 1, cardScale: 1, showButton: false };
    case "completing":
      return { phase, cardOpacity: 0.5, cardScale: 0.97, showButton: false };
    case "complete":
      return { phase, cardOpacity: 0.4, cardScale: 0.97, showButton: true };
  }
}
