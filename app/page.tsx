"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@heroui/button";

export default function Home() {
  const houses = useQuery(api.houses.list);

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">ProcureSwarm — Stack Verification</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-default-500 uppercase tracking-wider">Convex Connection</h2>
        {houses === undefined ? (
          <p className="text-warning">Connecting to Convex...</p>
        ) : (
          <p className="text-success">Connected. Houses in DB: {houses.length}</p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-default-500 uppercase tracking-wider">HeroUI Component</h2>
        <Button color="primary">Primary Button</Button>
      </section>
    </main>
  );
}
