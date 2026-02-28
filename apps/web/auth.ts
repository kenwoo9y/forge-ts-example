import NextAuth from "next-auth";
import { createAuthConfig } from "./lib/auth-config";

const apiUrl = process.env.API_URL ?? "http://localhost:3000";

export const { handlers, auth, signIn, signOut } = NextAuth(
  createAuthConfig(apiUrl),
);
