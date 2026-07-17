import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth, APIError } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/db/schema";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const adminEmails = getAdminEmails();

          if (!adminEmails.includes(user.email.toLowerCase())) {
            throw new APIError("UNPROCESSABLE_ENTITY", {
              message: "You are not authorized to access this resource.",
            });
          }

          return {
            data: {
              ...user,
              role: "admin",
            },
          };
        },
      },
    },
  },
  plugins: [admin(), nextCookies()],
});
