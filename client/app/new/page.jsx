"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { presets } from "@/helpers/projectPresets";
import { validateConfig } from "@/helpers/validateConfig";
import clsx from "clsx";

import { createProject } from "./actions/createProject";
import { validateAndFetchBranches } from "./actions/validateRepo";
import ProjectConfigurator from "./components/ProjectConfigurator";

const initialStateValidation = {
  branches: [],
  error: null,
  success: false,
};

const initialStateCreate = {
  error: null,
  success: false,
  ongoingJobProjectId: null,
};

const initialConfig = {
  buildCommand: {
    value: "",
    allowOverride: false,
    placeholder: "npm run build",
  },
  installCommand: {
    value: "",
    allowOverride: false,
    placeholder: "npm run install",
  },
  outputDirectory: { value: "", allowOverride: false, placeholder: "dist" },
};

export default function NewProject() {
  const [currentForm, setCurrentForm] = useState("validate");
  const [showUrlWarning, setShowUrlWarning] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [validateState, setValidateState] = useState(initialStateValidation);

  const [createProjectState, setCreateProjectState] =
    useState(initialStateCreate);
  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [rootDir, setRootDir] = useState("./");
  const [projectConfig, setProjectConfig] = useState(initialConfig);

  const [envVars, setEnvVars] = useState([]);
  const [isEnvsValid, setIsEnvsValid] = useState(false);

  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();

  const validateGithubUrl = (url) => {
    const githubUrlPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
    return githubUrlPattern.test(url);
  };

  useEffect(() => {
    const isValid = validateGithubUrl(repoUrl);
    setIsValidUrl(isValid);
    setShowUrlWarning(repoUrl !== "" && !isValid);
    if (isValid) {
      setValidateState(initialStateValidation);
      setSelectedBranch("");
      setCurrentForm("validate");
    }
  }, [repoUrl]);

  useEffect(() => {
    if (validateState.error) {
      setCurrentForm("validate");
    } else if (validateState.branches.length > 0) {
      setCurrentForm("selectBranch");
    }
  }, [validateState]);

  const handleBranchSelection = () => {
    if (selectedBranch) {
      setCurrentForm("configurator");
    }
  };

  const validateFormAction = async () => {
    setIsValidating(true);

    try {
      const result = await validateAndFetchBranches(repoUrl);
      setValidateState(result);
      setCurrentForm("selectBranch");
    } catch (error) {
      setValidateState({ ...initialStateValidation, error: error.message });
    } finally {
      setIsValidating(false);
    }
  };

  const createProjectFormAction = async () => {
    const { config, rootDir: validatedRootDir } = validateConfig(
      projectConfig,
      rootDir,
    );

    if (!config) return;
    if (!validatedRootDir) return;

    console.log(config, validatedRootDir);

    setIsCreating(true);

    try {
      const projectPreset = selectedPreset.value;
      const result = await createProject(
        repoUrl,
        selectedBranch,
        validatedRootDir,
        projectPreset,
        config,
        envVars,
      );
      if (result.success) {
        router.push(`/project/${result.id}`);
      } else {
        setCreateProjectState({
          ...initialStateCreate,
          error: result.error,
          ongoingJobProjectId: result.ongoingJobProjectId,
        });
      }
    } catch (error) {
      setCreateProjectState({
        ...initialStateCreate,
        error: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setValidateState(initialStateValidation);
    setCreateProjectState(initialStateCreate);
    setRepoUrl("");
    setSelectedBranch("");
    setIsValidUrl(false);
    setShowUrlWarning(false);
    setCurrentForm("validate");
  };

  return (
    <div className="mb-8 flex min-h-[calc(100vh-7rem)] flex-col gap-1 px-4 py-3 md:px-10">
      <div className="py-5">
        <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
        <span className="font-sans text-gray-500">
          To deploy a new Project, enter an existing GitHub repo URL and select
          a branch.
        </span>
      </div>

      {currentForm === "validate" && (
        <form action={validateFormAction} className="mt-2 max-w-96">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="repo" className="font-semibold">
                GitHub Repo
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
                    "border-gray-300 focus:border-gray-500 focus:ring-blue-300":
                      !showUrlWarning && !validateState.error && !isValidUrl,
                    "border-green-500 focus:border-green-500 focus:ring-green-200":
                      !showUrlWarning &&
                      validateState.branches.length > 0 &&
                      !validateState.error,
                  },
                )}
                placeholder="Enter GitHub Repo URL"
              />
              {showUrlWarning && (
                <p className="mt-1 text-xs font-semibold text-red-500">
                  Please enter a valid GitHub repository URL
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center bg-black px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/50"
              disabled={isValidating}
            >
              {isValidating ? "Validating..." : "Validate Repo"}
            </button>
          </div>
          {validateState.error && (
            <p className="mt-6 w-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-500">
              {validateState.error}
            </p>
          )}
        </form>
      )}

      {currentForm === "selectBranch" && (
        <div className="mt-4 max-w-96">
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
                    "border-gray-300 focus:border-gray-500 focus:ring-blue-300":
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
                  className="h-10 border border-gray-300 px-2 py-1.5 font-sans text-sm text-gray-800 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:ring-offset-2"
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
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleBranchSelection}
              className="inline-flex justify-center bg-black px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/50"
              disabled={!selectedBranch}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {currentForm === "configurator" && (
        <>
          <ProjectConfigurator
            presets={presets}
            repo={validateState.repo}
            branch={selectedBranch}
            preset={selectedPreset}
            setPreset={(preset) => setSelectedPreset(preset)}
            projectConfig={projectConfig}
            setProjectConfig={setProjectConfig}
            rootDir={rootDir}
            setRootDir={setRootDir}
            isEnvsValid={isEnvsValid}
            setIsEnvsValid={setIsEnvsValid}
            envVars={envVars}
            setEnvVars={setEnvVars}
          />
          {!createProjectState.error && (
            <div className="mt-4 flex max-w-lg justify-between gap-2">
              <button
                type="button"
                className="inline-flex justify-center border border-black px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                onClick={resetForm}
              >
                Reset
              </button>
              {isEnvsValid ? (
                <button
                  type="button"
                  className="inline-flex justify-center bg-black px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/50"
                  onClick={createProjectFormAction}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating Project..." : "Create Project"}
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex justify-center bg-black px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/50"
                  disabled={true}
                >
                  Create Project
                </button>
              )}
            </div>
          )}
        </>
      )}

      {createProjectState.error && (
        <div className="mb-6 max-w-lg">
          <p className="mt-8 w-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-500">
            {createProjectState.error}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Link
              href={`/project/${createProjectState.ongoingJobProjectId}`}
              className="inline-flex justify-center border border-black bg-white px-4 py-2 text-sm font-medium tracking-tight text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              Go to ongoing job
            </Link>
            <button
              type="button"
              className="inline-flex justify-center border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/50"
              onClick={resetForm}
            >
              Reset form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
