"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { signOut, useSession } from "next-auth/react";

function ProfileMenu() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-2 tracking-tight">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <img
              src={session.user.image}
              alt="Profile menu"
              className="h-8 w-8 rounded-full border"
            />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="flex w-64 flex-col gap-2 border bg-white/75 px-2 py-2 text-sm backdrop:blur-lg"
              align="end"
            >
              <DropdownMenu.Label className="flex flex-col px-2 font-medium">
                <span className="text-lg tracking-tight">
                  {session.user.name}
                </span>
                <span className="text-gray-500">{session.user.email}</span>
              </DropdownMenu.Label>
              <DropdownMenu.Separator className="mx-1 h-px bg-gray-100" />
              <DropdownMenu.Item>
                <button
                  className="w-full bg-red-500 px-3 py-1 font-semibold text-white hover:bg-red-600"
                  onClick={() => signOut()}
                >
                  Sign out
                </button>
              </DropdownMenu.Item>
              <DropdownMenu.Arrow />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    );
  }
}

export default ProfileMenu;
