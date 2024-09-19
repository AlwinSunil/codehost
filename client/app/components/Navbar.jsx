"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

import ProfileMenu from "./ProfileMenu";
import SignInButton from "./SignInButton";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <div className="flex h-fit items-center justify-between border-b px-4 py-3 md:px-10">
      <Link
        href="/dashboard"
        className="mt-auto text-2xl font-extrabold leading-7"
      >
        CodeHost
      </Link>
      <div className="flex gap-3 font-medium">
        {session ? <ProfileMenu /> : <SignInButton />}
      </div>
    </div>
  );
}
