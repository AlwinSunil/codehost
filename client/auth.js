// import NextAuth from "next-auth";
// import { PrismaAdapter } from "@auth/prisma-adapter"; // Fixed import path for PrismaAdapter
// import { PrismaClient } from "@prisma/client";
// import GitHubProvider from "next-auth/providers/github"; // Fixed import for GitHubProvider

// const prisma = new PrismaClient();

// export const { handlers, auth } = NextAuth({
//   secret: process.env.NEXTAUTH_SECRET,
//   adapter: PrismaAdapter(prisma),
//   providers: [
//     GitHubProvider({
//       clientId: process.env.GITHUB_ID,
//       clientSecret: process.env.GITHUB_SECRET,
//     }),
//   ],
// });
