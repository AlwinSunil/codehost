"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import * as Dialog from "@radix-ui/react-dialog";

import { deleteProject } from "@/app/project/[id]/actions/deleteProject";

function ProfileMenu({ project }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteProject = async () => {
    const deleteCommand = `delete ${project.name}`;
    const action = window.prompt(
      `If you're sure about deleting this project, type "${deleteCommand}"`,
    );
    if (action === deleteCommand) {
      setIsLoading(true);
      try {
        const response = await deleteProject(project.id);
        if (response.success) {
          router.push("/dashboard");
        } else {
          alert(response.message);
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("Error deleting project. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!session) return null;

  return (
    <div className="relative flex items-center gap-2">
      {/* Show loading component during any async action */}
      <Dialog.Root>
        <Dialog.Trigger className="my-auto flex h-fit w-fit rounded-full border p-2 text-xs font-medium hover:bg-gray-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15-.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/20 shadow-sm backdrop-blur-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[calc(100vh-4rem)] w-[90vw] -translate-x-1/2 -translate-y-1/2 transform flex-col gap-2 bg-white p-4 sm:p-6">
            <Dialog.Title className="flex items-center justify-between px-1 font-medium">
              <span className="flex items-center gap-1 font-medium leading-4 tracking-tight">
                <span>{project.name}</span>
                <span>/</span>
                <span className="text-gray-500">settings</span>
              </span>
              <Dialog.Close>
                <button className="w-fit border border-black px-3 py-1 text-xs font-semibold text-black hover:bg-gray-100">
                  Close
                </button>
              </Dialog.Close>
            </Dialog.Title>
            <hr className="mt-2 h-px bg-gray-200" />
            {isLoading ? (
              <div className="mt-4 border">
                <p className="px-6 py-4 text-lg font-semibold">Loading...</p>
              </div>
            ) : (
              <div className="mt-2 px-1">
                <div className="flex flex-col">
                  <span className="text-lg font-semibold">Danger Zone</span>
                  <p className="text-sm leading-4 text-gray-600">
                    This action cannot be undone.
                  </p>
                  <button
                    className="mt-3 w-fit bg-red-500 px-3 py-1 text-sm font-semibold text-white hover:cursor-pointer hover:bg-red-600"
                    onClick={handleDeleteProject}
                  >
                    Delete project
                  </button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default ProfileMenu;
