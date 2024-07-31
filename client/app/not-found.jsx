import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-4 sm:p-6 md:p-10">
      <h2 className="text-2xl font-semibold">404 - Not Found</h2>
      <p className="mb-3">Could not find requested page.</p>
      <Link href="/" className="bg-black px-2 py-1 text-white">
        Return Home
      </Link>
    </div>
  );
}
