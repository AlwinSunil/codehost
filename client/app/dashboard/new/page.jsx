"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { validateAndFetchBranches } from "./actions/validateRepo";
import { createProject } from "./actions/createProject";
import { useRouter } from "next/navigation";
import clsx from "clsx";

const initialState = {
  branches: [],
  error: null,
};

function ValidateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex justify-center border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-400"
    >
      {pending ? "Validating..." : "Validate Repo"}
    </button>
  );
}

export default function NewProject() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [showUrlWarning, setShowUrlWarning] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [state, formAction] = useFormState(
    validateAndFetchBranches,
    initialState,
  );
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const router = useRouter();

  const validateGithubUrl = (url) => {
    const githubUrlPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
    state.branches = [];
    state.error = null;
    return githubUrlPattern.test(url);
  };

  useEffect(() => {
    const isValid = validateGithubUrl(repoUrl);
    setIsValidUrl(isValid);
    setShowUrlWarning(repoUrl !== "" && !isValid);
  }, [repoUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreatingProject(true);
    try {
      const response = await createProject(repoUrl, selectedBranch);
      if (response.id) {
        router.push(`/project/${response.id}`);
      } else {
        throw new Error("Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsCreatingProject(false);
    }
  };

  return (
    <div className="py-4">
      <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
      <span className="font-sans text-gray-500">
        To deploy a new Project, enter existing github repo url and select a
        branch.
      </span>

      <form action={formAction} className="mt-5 max-w-96">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="repo" className="font-semibold">
              Github Repo
            </label>
            <input
              type="text"
              id="repo"
              name="repoUrl"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className={clsx(
                "h-10 w-full border px-3 py-1.5 font-sans text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-offset-2",
                {
                  "border-red-500 focus:border-red-500 focus:ring-red-200":
                    showUrlWarning || state.error,
                  "border-gray-300 focus:border-gray-500 focus:ring-blue-200":
                    !showUrlWarning && !state.error && !isValidUrl,
                  "border-green-500 focus:border-green-500 focus:ring-green-200":
                    !showUrlWarning &&
                    state.branches.length > 0 &&
                    !state.error,
                },
              )}
              placeholder="Enter Github Repo URL"
            />
            {showUrlWarning && (
              <p className="mt-1 text-xs font-semibold text-red-500">
                Please enter a valid GitHub repository URL
              </p>
            )}
          </div>
          {state.branches.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="branch" className="text-sm font-medium">
                Branch
              </label>
              <select
                id="branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="h-10 border border-gray-300 px-2 py-1.5 font-sans text-sm text-gray-800 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-200 focus:ring-offset-2"
              >
                <option value="">Select a branch</option>
                {state.branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          {isValidUrl && state.branches.length === 0 ? (
            <ValidateButton />
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                !state.branches.length || !selectedBranch || isCreatingProject
              }
              className="inline-flex justify-center border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/50"
            >
              {isCreatingProject ? "Creating Project..." : "Create Project"}
            </button>
          )}
        </div>
        {state.error && (
          <p className="mt-6 w-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-500">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
