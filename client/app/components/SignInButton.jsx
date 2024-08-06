"use client";

import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <div>
      <button
        onClick={() => signIn("github")}
        className="border bg-emerald-500 px-3 py-1 font-semibold text-white hover:bg-emerald-600"
      >
        Sign in with Github
      </button>
    </div>
  );
}
