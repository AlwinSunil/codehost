import { useEffect, useState } from "react";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { toast } from "sonner";

import EnvironmentVariables from "@/app/components/EnvironmentVariables";

import { addEnvsForProject } from "../actions/addEnvsForProject";
import { editEnvForProject } from "../actions/editEnvForProject";
import { fetchEnvs } from "../actions/fetchEnvs";
import { removeEnvFromProject } from "../actions/removeEnvForProject";

export default function Envs({ project }) {
  const [envs, setEnvs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleEnvKeys, setVisibleEnvKeys] = useState({});
  const [editingEnv, setEditingEnv] = useState(null);
  const [editedValues, setEditedValues] = useState({ key: "", value: "" });

  const [newEnvs, setNewEnvs] = useState([]);
  const [isNewEnvsValid, setIsNewEnvsValid] = useState(false);
  const [isAddingEnvs, setIsAddingEnvs] = useState(false);

  const toggleVisibility = (key) => {
    setVisibleEnvKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard!");
    }
  };

  const handleRemoveEnv = async (env) => {
    try {
      setIsLoading(true);
      const response = await removeEnvFromProject(env.id, project.id);
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove env");
    } finally {
      loadEnvs();
    }
  };

  const handleEditEnv = (env) => {
    setEditingEnv(env.id);
    setEditedValues({ key: env.key, value: env.value });
  };

  const handleChangeEnv = (e, field) => {
    setEditedValues((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSaveEnv = async (env) => {
    try {
      setIsLoading(true);
      const response = await editEnvForProject(
        env.id,
        project.id,
        editedValues,
      );

      if (response.success) {
        toast.success("Environment variable updated successfully");
        setEditingEnv(null);
        setEditedValues({ key: "", value: "" });
      } else {
        toast.error(
          response.message || "Failed to update environment variable",
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update environment variable");
    } finally {
      loadEnvs();
    }
  };

  const handleAddEnv = async (projectId) => {
    try {
      setIsAddingEnvs(true);
      setIsLoading(true);
      const response = await addEnvsForProject(projectId, newEnvs);

      if (response.success) {
        toast.success("Environment variable added successfully");
        setIsNewEnvsValid(false);
        setNewEnvs([]);
      } else {
        toast.error(response.message || "Failed to add environment variable");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add environment variable");
    } finally {
      loadEnvs();
      setIsAddingEnvs(false);
    }
  };

  const loadEnvs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchEnvs(project.id);
      if (response.success) {
        setEnvs(response.envs);
      } else {
        setError(response.message || "Failed to fetch environment variables");
      }
    } catch (err) {
      console.error("Error fetching environment variables:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEnvs();
  }, [project.id]);

  return (
    <div className="mb-5 flex flex-col bg-white">
      <span className="text-lg font-semibold">Environment Variables</span>
      <p className="text-sm text-gray-600">
        Environment Variables will be exposed on Build, you may enter them right
        here.
      </p>

      <EnvironmentVariables
        isNewProject={false}
        envVars={newEnvs}
        setEnvVars={setNewEnvs}
        isEnvsValid={isNewEnvsValid}
        setIsEnvsValid={setIsNewEnvsValid}
      />
      <div className="mb-2 flex max-w-lg px-1">
        {newEnvs.length > 0 && isNewEnvsValid && (
          <button
            className="mt-2 w-full bg-black px-3 py-2 text-center font-sans text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/60"
            onClick={() => handleAddEnv(project.id)}
            disabled={isAddingEnvs}
          >
            {isAddingEnvs ? "Saving..." : "Save"}
          </button>
        )}
      </div>

      <p className="mb-5 mt-2 font-sans text-sm text-gray-500">
        *A new Deployment is required for your changes to take effect.
      </p>

      <hr className="border-2" />

      <div className="mt-2">
        {isLoading ? (
          <div className="mt-4">Loading...</div>
        ) : error ? (
          <div className="mt-4 text-red-500">Error: {error}</div>
        ) : envs && envs.length > 0 ? (
          <div className="mt-4 flex flex-col border">
            {envs.map((env) => (
              <div key={env.id} className="border-b last:border-b-0">
                <div
                  className={clsx(
                    "flex items-center justify-between px-5 py-4",
                    { "border-b": editingEnv === env.id },
                  )}
                >
                  <span className="flex-1 text-sm font-semibold">
                    {env.key}
                  </span>
                  <div className="flex flex-1 items-center gap-3 text-sm">
                    <button
                      className="rounded px-1 py-0.5 hover:bg-gray-100"
                      onClick={() => toggleVisibility(env.key)}
                    >
                      {visibleEnvKeys[env.key] ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 text-gray-700"
                        >
                          <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                          <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                          <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                          <path d="m2 2 20 20" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 text-gray-700"
                        >
                          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={clsx("font-mono text-gray-700", {
                        "cursor-pointer rounded border bg-gray-100 px-1 tracking-tight !text-black":
                          visibleEnvKeys[env.key] === true,
                      })}
                      onClick={() => {
                        if (visibleEnvKeys[env.key] === true) {
                          handleCopy(env.value);
                        }
                      }}
                    >
                      {visibleEnvKeys[env.key] ? env.value : "••••••••"}
                    </span>
                  </div>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <button className="rounded p-1 hover:bg-gray-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5 text-black"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="z-50 flex w-40 flex-col gap-2 border bg-white px-1 py-1 font-sans text-xs font-medium shadow-sm"
                        align="end"
                      >
                        <DropdownMenu.Item>
                          <button
                            className="w-full px-2 py-1 text-left text-black hover:bg-gray-100"
                            onClick={() => handleEditEnv(env)}
                          >
                            Edit
                          </button>
                          <button
                            className="w-full px-2 py-1 text-left text-red-500 hover:bg-red-50"
                            onClick={() => handleRemoveEnv(env)}
                          >
                            Remove
                          </button>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
                {editingEnv === env.id && (
                  <div className="flex flex-col gap-1.5 border-b px-5 py-4 last:border-b-0">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="key" className="font-sans text-xs">
                        Key
                      </label>
                      <input
                        type="text"
                        name="key"
                        value={editedValues.key}
                        onChange={(e) => handleChangeEnv(e, "key")}
                        className="h-10 w-full border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-offset-2"
                      />
                    </div>
                    <div className="mb-3 mt-2 flex flex-col gap-1">
                      <label htmlFor="value" className="font-sans text-xs">
                        Value
                      </label>
                      <input
                        type="text"
                        name="value"
                        value={editedValues.value}
                        onChange={(e) => handleChangeEnv(e, "value")}
                        className="h-10 w-full border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-offset-2"
                      />
                    </div>
                    <div className="ml-auto mt-2 flex gap-2">
                      <button
                        onClick={() => setEditingEnv(null)}
                        className="flex w-fit items-center border border-black px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEnv(env)}
                        className="flex w-fit items-center bg-black px-3 py-1 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/60"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 tracking-tight">
            No environment variables found for this project.
          </div>
        )}
      </div>
    </div>
  );
}
