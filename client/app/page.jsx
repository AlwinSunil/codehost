import SignInButton from "./components/SignInButton";
import { getServerSession } from "next-auth";

export default async function Home() {
  const session = await getServerSession();

  return (
    <main className="flex flex-col justify-center gap-1.5 px-4 py-28 md:px-10">
      <h1 className="text-4xl font-bold tracking-tighter">
        Deploy your frontend code with ease
      </h1>
      <span className="mb-2 flex items-center justify-between tracking-tight text-gray-700">
        Sign in with github to get started
      </span>
      <SignInButton />
    </main>
  );
}
