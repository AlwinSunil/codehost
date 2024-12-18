import { useState } from "react";

import * as Accordion from "@radix-ui/react-accordion";
import clsx from "clsx";

import EnvironmentVariables from "@/app/components/EnvironmentVariables";

import ConfigField from "./ConfigField";
import PresetSelect from "./PresetSelect";

export default function ProjectConfigurator({
  presets,
  repo,
  branch,
  preset,
  setPreset,
  projectConfig,
  setProjectConfig,
  rootDir,
  setRootDir,
  isEnvsValid,
  setIsEnvsValid,
  envVars,
  setEnvVars,
}) {
  const [accordionValue, setAccordionValue] = useState(null);
  const [rootDirValid, setRootDirValid] = useState(true);
  const [isEditingRootDir, setIsEditingRootDir] = useState(false);

  const handlePresetChange = (event) => {
    const selectedValue = event.target.value;
    const selectedPreset = presets.find(
      (preset) => preset.value === selectedValue,
    );
    setPreset(selectedPreset);
  };

  const handleInputChange = (field, value) => {
    setProjectConfig((prevConfig) => ({
      ...prevConfig,
      [field]: { ...prevConfig[field], value },
    }));
  };

  const toggleOverride = (field) => {
    setProjectConfig((prevConfig) => ({
      ...prevConfig,
      [field]: {
        ...prevConfig[field],
        allowOverride: !prevConfig[field].allowOverride,
      },
    }));
  };

  const handleRootDirChange = (event) => {
    const newRootDir = event.target.value;
    validateRootDir(newRootDir);
    setRootDir(newRootDir);
  };

  const validateRootDir = (path) => {
    const isValid = path && !path.includes(" ") && !path.includes("..");
    setRootDirValid(isValid);
  };

  const handleSaveRootDir = () => {
    if (rootDirValid) {
      setIsEditingRootDir(false);
    }
  };

  return (
    <div className="mt-2 max-w-lg">
      <h2 className="mb-4 font-sans text-2xl font-medium">
        Configure your project
      </h2>

      <div className="group relative mt-4">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-violet-500 opacity-20 blur"></div>
        <div className="relative flex flex-col border border-gray-100 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-b-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <svg
                aria-label="github"
                viewBox="0 0 14 14"
                className="h-4 w-4 fill-black"
              >
                <path d="M7 .175c-3.872 0-7 3.128-7 7 0 3.084 2.013 5.71 4.79 6.65.35.066.482-.153.482-.328v-1.181c-1.947.415-2.363-.941-2.363-.941-.328-.81-.787-1.028-.787-1.028-.634-.438.044-.416.044-.416.7.044 1.071.722 1.071.722.635 1.072 1.641.766 2.035.59.066-.459.24-.765.437-.94-1.553-.175-3.193-.787-3.193-3.456 0-.766.262-1.378.721-1.881-.065-.175-.306-.897.066-1.86 0 0 .59-.197 1.925.722a6.754 6.754 0 0 1 1.75-.24c.59 0 1.203.087 1.75.24 1.335-.897 1.925-.722 1.925-.722.372.963.131 1.685.066 1.86.46.48.722 1.115.722 1.88 0 2.691-1.641 3.282-3.194 3.457.24.219.481.634.481 1.29v1.926c0 .197.131.415.481.328C11.988 12.884 14 10.259 14 7.175c0-3.872-3.128-7-7-7z"></path>
              </svg>
              <a
                href={`https://github.com/${repo}`}
                className="font-sans text-sm font-medium hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {repo}
              </a>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-blue-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <line x1="6" x2="6" y1="3" y2="15" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M18 9a9 9 0 0 1-9 9" />
              </svg>
              <p className="font-sans text-xs font-semibold">{branch}</p>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-col gap-2">
              <div className="mt-2 flex flex-col gap-1.5">
                <label htmlFor="preset" className="font-semibold">
                  Preset
                </label>
                <PresetSelect
                  presets={presets}
                  selectedPreset={preset}
                  onChange={handlePresetChange}
                />
              </div>

              <div className="mt-4 flex flex-col gap-1.5">
                <label htmlFor="useCustomRootDir" className="font-semibold">
                  Root Directory
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rootDir}
                    onChange={handleRootDirChange}
                    placeholder="e.g, client"
                    className={`h-10 w-full border px-3 py-1.5 font-sans text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-offset-2 ${rootDirValid ? "border-gray-300" : "border-red-500"}`}
                    disabled={!isEditingRootDir}
                  />
                  {isEditingRootDir ? (
                    <button
                      type="button"
                      onClick={handleSaveRootDir}
                      className="h-10 border border-green-500 px-4 text-sm font-semibold text-green-600 hover:bg-green-50"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingRootDir(true)}
                      className="h-10 border border-black px-4 text-sm font-semibold"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {!rootDirValid && (
                  <p className="mt-1 text-sm text-red-500">
                    Invalid directory path
                  </p>
                )}
              </div>
            </div>
          </div>
          <Accordion.Root
            type="single"
            collapsible
            value={accordionValue}
            onValueChange={setAccordionValue}
            className="mb-5 mt-5 border-gray-200"
          >
            <Accordion.Item
              value="customizeSettings"
              className={clsx({
                "outline-dashed outline-gray-700":
                  accordionValue === "customizeSettings",
                "border-t": accordionValue !== "customizeSettings",
                "mb-3 border-b": accordionValue === "environmentVariables",
              })}
            >
              <Accordion.Header>
                <Accordion.Trigger
                  className={clsx(
                    "flex w-full items-center justify-between px-5 py-3.5 text-left font-semibold",
                    {
                      "border-b": accordionValue === "customizeSettings",
                    },
                  )}
                >
                  Customize build & output settings
                  {accordionValue === "customizeSettings" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content>
                <div className="mb-3 mt-1 flex flex-col gap-5 px-5 py-4">
                  {Object.keys(projectConfig).map((field) => (
                    <ConfigField
                      key={field}
                      field={field}
                      value={projectConfig[field].value}
                      allowOverride={projectConfig[field].allowOverride}
                      onInputChange={(value) => handleInputChange(field, value)}
                      onToggleOverride={() => toggleOverride(field)}
                    />
                  ))}
                </div>
              </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item
              value="environmentVariables"
              className={clsx({
                "outline-dashed outline-gray-700":
                  accordionValue === "environmentVariables",
                "border-b border-t": accordionValue !== "environmentVariables",
              })}
            >
              <Accordion.Header>
                <Accordion.Trigger
                  className={clsx(
                    "flex w-full items-center justify-between px-5 py-3.5 text-left font-semibold",
                    {
                      "border-b": accordionValue === "environmentVariables",
                    },
                  )}
                >
                  Environment Variables
                  {accordionValue === "environmentVariables" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content>
                <EnvironmentVariables
                  isNewProject={true}
                  envVars={envVars}
                  setEnvVars={setEnvVars}
                  isEnvsValid={isEnvsValid}
                  setIsEnvsValid={setIsEnvsValid}
                />
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>
        </div>
      </div>
    </div>
  );
}
