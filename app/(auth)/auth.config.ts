import type { NextAuthConfig } from "next-auth";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const authConfig = {
  basePath: "/api/auth",
  callbacks: {},
  // The v0 preview runs over HTTPS inside an iframe, so cookies must be SameSite=None + Secure.
  cookies: {
    callbackUrl: {
      name: "__Secure-authjs.callback-url",
      options: { path: "/", sameSite: "none", secure: true },
    },
    csrfToken: {
      name: "__Host-authjs.csrf-token",
      options: { httpOnly: true, path: "/", sameSite: "none", secure: true },
    },
    sessionToken: {
      name: "__Secure-authjs.session-token",
      options: { httpOnly: true, path: "/", sameSite: "none", secure: true },
    },
  },
  pages: {
    newUser: `${base}/`,
    signIn: `${base}/login`,
  },
  providers: [],
  trustHost: true,
  useSecureCookies: true,
} satisfies NextAuthConfig;
