"use client";

import { useState } from "react";

interface RetailerBadgeProps {
  retailer: string;
  size?: "sm" | "md";
}

export default function RetailerBadge({
  retailer,
  size = "sm",
}: RetailerBadgeProps) {
  const [imgError, setImgError] = useState(false);
  const iconSize = size === "sm" ? 14 : 18;
  const textClass =
    size === "sm" ? "text-[11px]" : "text-xs";

  const domain = retailer.includes(".")
    ? retailer
    : `${retailer}.com`;

  return (
    <span className="inline-flex items-center gap-1.5">
      {!imgError && (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          width={iconSize}
          height={iconSize}
          className="shrink-0"
          onError={() => setImgError(true)}
        />
      )}
      <span
        className={`${textClass} text-[var(--fg-muted)] truncate`}
      >
        {retailer}
      </span>
    </span>
  );
}
