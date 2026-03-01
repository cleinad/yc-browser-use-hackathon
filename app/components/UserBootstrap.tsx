"use client";

import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function UserBootstrap() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.users.me);
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || isLoading || me === undefined || attemptedRef.current) {
      return;
    }

    if (me !== null) {
      return;
    }

    attemptedRef.current = true;
    upsertCurrentUser({}).catch(() => {
      attemptedRef.current = false;
    });
  }, [isAuthenticated, isLoading, me, upsertCurrentUser]);

  return null;
}
