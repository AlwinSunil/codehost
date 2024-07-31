import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen">
      <div className="flex h-fit px-10 py-4 border-b w-screen justify-between items-center">
        <Link href="/" className="font-bold tracking-tight text-2xl">
          CodeHost
        </Link>
        <div className="flex gap-3 font-medium">
          <Link href="/login" className="px-2 underline py-1 hover:bg-gray-200">
            login
          </Link>
          <Link
            href="/signup"
            className="bg-emerald-500 hover:text-white py-1 px-2"
          >
            signup
          </Link>
        </div>
      </div>
    </main>
  );
}
