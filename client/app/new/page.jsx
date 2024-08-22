"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { validateAndFetchBranches } from "./actions/validateRepo";
import { createProject } from "./actions/createProject";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";

const initialStateValidation = {
  branches: [],
  error: null,
  success: false,
};

const initialStateCreate = {
  error: null,
  success: false,
  ongoingJobId: null,
};

function ActionButton({ label, pendingLabel, disabled, ...props }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex justify-center bg-black px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/50"
      {...props}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function NewProject() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [currentForm, setCurrentForm] = useState("validate");

  const [showUrlWarning, setShowUrlWarning] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [validateState, validateFormAction] = useFormState(
    validateAndFetchBranches,
    initialStateValidation,
  );
  const [createProjectState, createProjectFormAction] = useFormState(
    createProject,
    initialStateCreate,
  );

  const router = useRouter();

  const validateGithubUrl = (url) => {
    const githubUrlPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
    return githubUrlPattern.test(url);
  };

  useEffect(() => {
    const isValid = validateGithubUrl(repoUrl);
    setIsValidUrl(isValid);
    setShowUrlWarning(repoUrl !== "" && !isValid);
  }, [repoUrl]);

  useEffect(() => {
    if (validateState.error) {
      setCurrentForm("validate");
    } else if (validateState.branches.length > 0) {
      setCurrentForm("create");
    }
  }, [validateState]);

  const resetForm = () => {
    // Reset form action states
    validateFormAction.error = null;
    validateFormAction.success = false;
    validateFormAction.branch = null;

    createProjectFormAction.error = null;
    createProjectFormAction.success = false;
    createProjectFormAction.ongoingJobProjectId = null;

    // Reset all relevant component state variables
    setRepoUrl("");
    setSelectedBranch("");
    setIsValidUrl(false);
    setShowUrlWarning(false);
    setCurrentForm("validate");
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-1 px-4 py-3 md:px-10">
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
        <span className="font-sans text-gray-500">
          To deploy a new Project, enter an existing github repo url and select
          a branch.
        </span>

        {currentForm === "validate" && (
          <form action={validateFormAction} className="mt-5 max-w-96">
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
                        showUrlWarning || validateState.error,
                      "border-gray-300 focus:border-gray-500 focus:ring-blue-200":
                        !showUrlWarning && !validateState.error && !isValidUrl,
                      "border-green-500 focus:border-green-500 focus:ring-green-200":
                        !showUrlWarning &&
                        validateState.branches.length > 0 &&
                        !validateState.error,
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
            </div>
            <div className="mt-4 flex justify-end">
              <ActionButton
                label="Validate Repo"
                pendingLabel="Validating..."
              />
            </div>
            {validateState.error && (
              <p className="mt-6 w-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-500">
                {validateState.error}
              </p>
            )}
          </form>
        )}

        {currentForm === "create" && (
          <form action={createProjectFormAction} className="mt-5 max-w-96">
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
                        showUrlWarning || validateState.error,
                      "border-gray-300 focus:border-gray-500 focus:ring-blue-200":
                        !showUrlWarning && !validateState.error && !isValidUrl,
                      "border-green-500 focus:border-green-500 focus:ring-green-200":
                        !showUrlWarning &&
                        validateState.branches.length > 0 &&
                        !validateState.error,
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
              {validateState.branches.length > 0 && (
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
                    {validateState.branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {createProjectState.error ? (
              <>
                <p className="mt-6 w-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-500">
                  {createProjectState.error}
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <Link
                    href={`/project/${createProjectState.ongoingJobProjectId}`}
                    className="inline-flex justify-center border border-black bg-white px-4 py-2 text-sm font-medium tracking-tight text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  >
                    Go to on going job
                  </Link>
                  <button
                    className="inline-flex justify-center border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/50"
                    onClick={resetForm}
                  >
                    Reset form
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4 flex justify-end">
                <ActionButton
                  label="Create Project"
                  pendingLabel="Creating..."
                />
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
