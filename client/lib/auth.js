import { PrismaAdapter } from "@auth/prisma-adapter"; // Fixed import path for PrismaAdapter
import { PrismaClient } from "@prisma/client";
import GitHubProvider from "next-auth/providers/github"; // Fixed import for GitHubProvider

const prisma = new PrismaClient();

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
};
