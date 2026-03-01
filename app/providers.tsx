"use client";
import { HeroUIProvider } from "@heroui/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// CRITICAL: module scope — NOT inside the component function
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <HeroUIProvider>
        {children}
      </HeroUIProvider>
    </ConvexProvider>
  );
}
