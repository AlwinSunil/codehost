"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import clsx from "clsx";
import { toast } from "sonner";

import { deleteProject } from "@/app/project/[id]/actions/deleteProject";

import Configuration from "./Configuration";
import Envs from "./Envs";
import { copyToClipboard, deployedURL, displayURL } from "./ProjectHeader";
import { changeStatus } from "../actions/changeStatus";
import { updateSubdomain } from "../actions/updateSubdomain";

const ProjectStatus = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
};

function ProfileMenu({ project }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("general");

  // Function to delete the project
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
          router.push(`/dashboard`);
          toast.success(response.message);
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        toast.error("Error deleting project. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Function to update the subdomain
  const handleEditSubdomain = async () => {
    const newSubdomain = prompt(
      "Please enter the new subdomain name:",
      project.subdomain,
    );
    if (newSubdomain) {
      setIsLoading(true);
      try {
        const response = await updateSubdomain(project.id, newSubdomain);
        if (response.success) {
          toast.success(response.message);
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        console.error("Error updating project:", error);
        toast.error("Error updating project. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChangeStatus = async () => {
    const isProjectActive = project.status === ProjectStatus.ACTIVE;
    const actionText = isProjectActive ? "pause" : "activate";
    const newStatus = isProjectActive
      ? ProjectStatus.PAUSED
      : ProjectStatus.ACTIVE;

    const action = window.prompt(
      `If you're sure about changing the status of this project, type "${actionText}"`,
    );

    if (action === actionText) {
      setIsLoading(true);
      try {
        const response = await changeStatus(project.id, newStatus);

        if (response.success) {
          toast.success(
            `Project ${isProjectActive ? "paused" : "activated"} successfully`,
          );
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        console.error(`Error changing project status:`, error);
        toast.error("Error changing project status. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!session) return null;

  if (!session) return null;

  return (
    <Dialog.Root className="relative flex items-center gap-2">
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
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex h-[calc(100vh-5rem)] w-[90vw] max-w-screen-xl -translate-x-1/2 -translate-y-1/2 transform flex-col gap-2 bg-white p-4 sm:p-6"
          modal={false}
        >
          <Dialog.Title className="flex items-center justify-between px-1 font-medium">
            <span className="flex items-center gap-1 font-medium leading-4 tracking-tight">
              <span>{project?.name}</span>
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
            <Tabs.Root
              defaultValue="tab1"
              className="mt-4 flex h-full w-full gap-8 overflow-hidden px-1"
              value={currentTab}
              onValueChange={setCurrentTab}
            >
              <Tabs.List
                className="mt-1 flex !w-56 flex-col justify-start gap-1 font-sans text-sm font-normal"
                aria-label="Manage Project"
              >
                <Tabs.Trigger
                  className={clsx(
                    "w-full px-3 py-2 text-left hover:bg-gray-100",
                    {
                      "font-medium outline-dashed outline-1 outline-black":
                        currentTab === "general",
                    },
                  )}
                  value="general"
                >
                  General
                </Tabs.Trigger>
                <Tabs.Trigger
                  className={clsx(
                    "w-full px-3 py-2 text-left hover:bg-gray-100",
                    {
                      "font-medium outline-dashed outline-1 outline-black":
                        currentTab === "config",
                    },
                  )}
                  value="config"
                >
                  Configuration
                </Tabs.Trigger>
                <Tabs.Trigger
                  className={clsx(
                    "w-full px-3 py-2 text-left hover:bg-gray-100",
                    {
                      "font-medium outline-dashed outline-1 outline-black":
                        currentTab === "envs",
                    },
                  )}
                  value="envs"
                >
                  Environment Variables
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content
                className="w-full overflow-y-scroll pr-6"
                value="general"
              >
                <>
                  <div className="mb-5 flex flex-col">
                    <span className="text-lg font-semibold">Domain</span>
                    <p className="text-sm leading-4 tracking-tight text-gray-600">
                      This domain is assigned to your Production Deployment.
                    </p>
                    <div className="mt-4 flex items-center gap-1.5">
                      <a
                        href={deployedURL(project?.subdomain)}
                        className="flex h-6 items-center justify-center rounded-sm border border-gray-200 bg-gray-50 px-2 font-sans text-sm hover:cursor-pointer hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {displayURL(project?.subdomain)}
                      </a>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 cursor-pointer items-center justify-center rounded-sm border border-gray-200 p-1 text-black shadow-inner hover:bg-gray-100"
                        onClick={() => copyToClipboard(deployedURL)}
                      >
                        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                        <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                        <path d="M16 4h2a2 2 0 0 1 2 2v4" />
                        <path d="M21 14H11" />
                        <path d="m15 10-4 4 4 4" />
                      </svg>
                    </div>
                    <button
                      className="mt-4 w-fit bg-black px-3 py-1 text-sm font-semibold text-white hover:cursor-pointer"
                      onClick={handleEditSubdomain}
                    >
                      Edit subdomain
                    </button>
                    <p className="mt-2 font-sans text-sm text-gray-500">
                      *Once updated, the previous domain will no longer be
                      accessible.
                    </p>
                  </div>
                  <hr />
                  <div className="mb-5 mt-4 flex flex-col">
                    <span className="text-lg font-semibold">
                      {project?.status === "ACTIVE" ? "Pause" : "Enable"}{" "}
                      Project
                    </span>
                    <p className="text-sm leading-4 tracking-tight text-gray-600">
                      This will make your project{" "}
                      {project?.status === "ACTIVE"
                        ? "inaccessible via URL and block any further deployments until re-enabled."
                        : "accessible and allow future deployments."}
                    </p>
                    <button
                      className={`mt-3 w-fit border px-3 py-1 text-sm font-semibold ${
                        project?.status === "ACTIVE"
                          ? "border-yellow-300 bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                          : "border-green-300 bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                      onClick={handleChangeStatus}
                    >
                      {project?.status === "ACTIVE" ? "Pause" : "Activate"}{" "}
                      Project
                    </button>
                  </div>
                  <hr className="border-2" />
                  <div className="mt-4 flex flex-col">
                    <span className="text-lg font-semibold">Danger Zone</span>
                    <p className="text-sm leading-4 tracking-tight text-gray-600">
                      This action cannot be undone.
                    </p>
                    <button
                      className="mt-3 w-fit bg-red-500 px-3 py-1 text-sm font-semibold text-white hover:cursor-pointer hover:bg-red-600"
                      onClick={handleDeleteProject}
                    >
                      Delete project
                    </button>
                  </div>
                </>
              </Tabs.Content>
              <Tabs.Content
                className="w-full overflow-y-scroll pr-6"
                value="config"
              >
                <Configuration project={project} />
              </Tabs.Content>
              <Tabs.Content
                className="w-full overflow-y-scroll pr-6"
                value="envs"
              >
                <Envs project={project} />
              </Tabs.Content>
            </Tabs.Root>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default ProfileMenu;
