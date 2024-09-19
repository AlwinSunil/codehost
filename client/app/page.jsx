import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authConfig } from "@/lib/auth";

import SignInButton from "./components/SignInButton";

export default async function Home() {
  const session = await getServerSession(authConfig);

  if (session) redirect("/dashboard");

  return (
    <main className="flex flex-col justify-center gap-1.5 px-4 py-28 md:px-10">
      <h1 className="text-4xl font-bold tracking-tighter">
        Deploy your frontend with ease
      </h1>
      <span className="mb-2 flex items-center justify-between text-gray-700">
        Sign in with github to get started
      </span>
      <SignInButton />
    </main>
  );
}
