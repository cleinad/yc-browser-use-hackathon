"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { UserBootstrap } from "./components/UserBootstrap";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required");
}

const convex = new ConvexReactClient(convexUrl);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        variables: {
          colorPrimary: "var(--accent-amber)" as unknown as string,
          colorBackground: "var(--bg-surface)" as unknown as string,
          colorText: "var(--fg-base)" as unknown as string,
          colorTextSecondary: "var(--fg-muted)" as unknown as string,
          colorInputBackground: "var(--bg-subtle)" as unknown as string,
          colorInputText: "var(--fg-base)" as unknown as string,
          colorNeutral: "var(--fg-base)" as unknown as string,
          borderRadius: "0.5rem",
        },
        elements: {
          card: {
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          },
          headerTitle: { color: "var(--fg-base)" },
          headerSubtitle: { color: "var(--fg-muted)" },
          socialButtonsBlockButton: {
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-default)",
            color: "var(--fg-base)",
          },
          dividerLine: { backgroundColor: "var(--border-default)" },
          dividerText: { color: "var(--fg-disabled)" },
          formFieldLabel: { color: "var(--fg-muted)" },
          formFieldInput: {
            backgroundColor: "var(--bg-subtle)",
            borderColor: "var(--border-default)",
            color: "var(--fg-base)",
          },
          formButtonPrimary: {
            backgroundColor: "var(--accent-amber)",
            color: "var(--bg-base)",
          },
          footerActionLink: { color: "var(--accent-amber)" },
          identityPreview: {
            backgroundColor: "var(--bg-subtle)",
            borderColor: "var(--border-default)",
          },
          identityPreviewText: { color: "var(--fg-base)" },
          identityPreviewEditButton: { color: "var(--accent-amber)" },
          formResendCodeLink: { color: "var(--accent-amber)" },
          otpCodeFieldInput: {
            backgroundColor: "var(--bg-subtle)",
            borderColor: "var(--border-default)",
            color: "var(--fg-base)",
          },
          footer: {
            "& + div": { background: "transparent" },
          },
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <UserBootstrap />
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
