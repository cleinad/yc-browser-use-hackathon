"use client";

import { useState, useEffect, useRef } from "react";

const activityPhrases = [
  "Navigating to site...",
  "Scanning search results...",
  "Extracting price info...",
  "Checking availability...",
  "Loading product pages...",
  "Comparing options...",
  "Reading product details...",
  "Checking delivery options...",
  "Verifying stock levels...",
  "Collecting product data...",
];

function getRetailerPhrases(retailer: string): string[] {
  const domain = retailer.replace(/\.com$/, "");
  return [
    `Navigating to ${retailer}...`,
    `Searching ${domain} catalog...`,
    "Scanning search results...",
    "Extracting price info...",
    "Checking availability...",
    "Loading product page...",
    "Reading product details...",
    "Checking delivery options...",
    "Verifying stock levels...",
    "Collecting product data...",
  ];
}

export function useCardActivitySimulator(
  retailer: string,
  status: string
): string[] {
  const [lines, setLines] = useState<string[]>([]);
  const phrasesRef = useRef<string[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    if (retailer) {
      phrasesRef.current = getRetailerPhrases(retailer);
    } else {
      phrasesRef.current = [...activityPhrases];
    }
  }, [retailer]);

  useEffect(() => {
    if (status !== "searching") return;

    // Start with the first phrase immediately
    const firstPhrase =
      phrasesRef.current[0] || activityPhrases[0];
    setLines([firstPhrase]);
    indexRef.current = 1;

    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 2000; // 2-4s
      return setTimeout(() => {
        const phrases = phrasesRef.current.length
          ? phrasesRef.current
          : activityPhrases;
        const idx = indexRef.current % phrases.length;
        indexRef.current++;

        setLines((prev) => [...prev.slice(-2), phrases[idx]]);
        timerRef = scheduleNext();
      }, delay);
    };

    let timerRef = scheduleNext();
    return () => clearTimeout(timerRef);
  }, [status]);

  return lines;
}
