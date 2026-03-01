import { type AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Example: https://your-tenant.clerk.accounts.dev
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
