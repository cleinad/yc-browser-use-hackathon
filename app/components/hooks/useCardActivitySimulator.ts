"use client";

import { useState, useEffect, useRef } from "react";

const genericActions = [
  "Scanning search results...",
  "Extracting price info...",
  "Checking availability...",
  "Loading product page...",
  "Reading product specs...",
  "Checking delivery options...",
  "Parsing DOM elements...",
  "Scrolling to product listing...",
  "Comparing product variants...",
  "Collecting product data...",
  "Verifying stock levels...",
  "Extracting SKU info...",
  "Checking cart availability...",
  "Reading customer reviews...",
  "Analyzing price breakdown...",
];

function buildPhrasePipeline(retailer: string): string[] {
  const domain = retailer.includes(".") ? retailer : `${retailer}.com`;
  const name = retailer.replace(/\.com$/, "");

  // Shuffle generic actions
  const shuffled = [...genericActions].sort(() => Math.random() - 0.5);

  return [
    `Opening ${domain}...`,
    "Waiting for page load...",
    `Searching ${name} catalog...`,
    ...shuffled.slice(0, 8),
    "Finalizing results...",
  ];
}

export function useCardActivitySimulator(
  retailer: string,
  status: string
): string[] {
  const [lines, setLines] = useState<string[]>([]);
  const pipelineRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "searching") {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    pipelineRef.current = buildPhrasePipeline(retailer);
    indexRef.current = 0;

    // Emit first line immediately
    setLines([pipelineRef.current[0]]);
    indexRef.current = 1;

    const scheduleNext = () => {
      const pipeline = pipelineRef.current;
      if (pipeline.length === 0) {
        return;
      }

      const idx = indexRef.current % pipeline.length;
      indexRef.current++;
      setLines((prev) => [...prev.slice(-3), pipeline[idx]]);

      // Deterministic cadence keeps lint happy and still feels dynamic.
      const delay = 900 + (indexRef.current % 5) * 160;
      timerRef.current = setTimeout(scheduleNext, delay);
    };

    timerRef.current = setTimeout(scheduleNext, 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, retailer]);

  return lines;
}
