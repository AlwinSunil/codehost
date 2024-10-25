import { useCallback, useState } from "react";

import { presets } from "@/helpers/projectPresets";
import * as Accordion from "@radix-ui/react-accordion";
import clsx from "clsx";

import ConfigField from "@/app/new/components/ConfigField";
import PresetSelect from "@/app/new/components/PresetSelect";

const isValidRootDir = (path) => {
  if (!path) return false;

  const invalidChars = /[<>:"/\\|?*]/;
  const allowedPathPattern = /^(\.|\/|\w+)*$/;
  const pathTraversalPatterns = [/(\.\.\/)+/, /(\.\.\\)+/];

  return (
    !path.includes(" ") &&
    !invalidChars.test(path) &&
    allowedPathPattern.test(path) &&
    !pathTraversalPatterns.some((pattern) => pattern.test(path))
  );
};

const isValidCommand = (command) => {
  if (!command) return true;

  const maliciousPatterns = [/;.*$/, /&&.*$/, /(\|\|)/, /(\&\&)/];

  return (
    !command.includes("..") &&
    !maliciousPatterns.some((pattern) => pattern.test(command)) &&
    !command.includes("|")
  );
};

const isValidOutputDir = (dir) => {
  if (!dir) return false;
  return !dir.includes(" ") && !dir.includes("..") && !dir.includes("/");
};

const getChangedFields = (currentConfig, originalProject) => {
  const changes = {};

  if (currentConfig.rootDir !== originalProject.rootDir) {
    changes.rootDir = currentConfig.rootDir;
  }
  if (currentConfig.preset !== originalProject.preset) {
    changes.preset = currentConfig.preset;
  }
  if (currentConfig.buildCommand !== originalProject.buildCommand) {
    changes.buildCommand = currentConfig.buildCommand;
  }
  if (currentConfig.installCommand !== originalProject.installCommand) {
    changes.installCommand = currentConfig.installCommand;
  }
  if (currentConfig.outputDir !== originalProject.outputDir) {
    changes.outputDir = currentConfig.outputDir;
  }

  return Object.keys(changes).length > 0 ? changes : null;
};

const validateChanges = (changes, currentConfig) => {
  if (!changes) return { isValid: true, errors: {} };

  const errors = {};

  if (changes.rootDir && !isValidRootDir(currentConfig.rootDir)) {
    errors.rootDir = "Invalid root directory path";
  }

  if (changes.buildCommand && !isValidCommand(currentConfig.buildCommand)) {
    errors.buildCommand = "Invalid build command";
  }

  if (changes.installCommand && !isValidCommand(currentConfig.installCommand)) {
    errors.installCommand = "Invalid install command";
  }

  if (changes.outputDir && !isValidOutputDir(currentConfig.outputDir)) {
    errors.outputDir = "Invalid output directory";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default function Configuration({ project }) {
  const [config, setConfig] = useState({
    rootDir: project.rootDir || "./",
    preset: project.preset || presets[0].value,
    buildCommand: project.buildCommand || "",
    installCommand: project.installCommand || "",
    outputDir: project.outputDir || "dist",
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isEditingRootDir, setIsEditingRootDir] = useState(false);
  const [accordionValue, setAccordionValue] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(
    presets.find((preset) => preset.value === project.preset) || presets[0],
  );

  const [overrides, setOverrides] = useState({
    buildCommand: false,
    installCommand: false,
    outputDir: false,
  });

  const changes = getChangedFields(config, project);
  const validation = validateChanges(changes, config);

  const handlePresetChange = useCallback((event) => {
    const selectedValue = event.target.value;
    const preset = presets.find((p) => p.value === selectedValue);
    setSelectedPreset(preset);
    setConfig((prev) => ({ ...prev, preset: selectedValue }));
  }, []);

  const handleRootDirChange = useCallback((event) => {
    const newRootDir = event.target.value;
    setConfig((prev) => ({ ...prev, rootDir: newRootDir }));
    setValidationErrors((prev) => ({
      ...prev,
      rootDir: !isValidRootDir(newRootDir)
        ? "Invalid root directory path"
        : null,
    }));
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate the specific field
    let validationError = null;
    if (field.includes("Command")) {
      if (!isValidCommand(value)) {
        validationError = `Invalid ${field.replace("Command", "")} command`;
      }
    } else if (field === "outputDir") {
      if (!isValidOutputDir(value)) {
        validationError = "Invalid output directory";
      }
    }

    setValidationErrors((prev) => ({
      ...prev,
      [field]: validationError,
    }));
  }, []);

  const toggleOverride = useCallback((field) => {
    setOverrides((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  const handleSaveChanges = useCallback(() => {
    if (!changes || !validation.isValid) return;

    console.log("Valid changes to save:", changes);
  }, [changes, validation.isValid]);

  const canSave = changes !== null && validation.isValid;

  return (
    <div className="max-w-lg p-1">
      <div className="mb-5 flex flex-col">
        <span className="text-lg font-semibold">Build settings</span>
        <p className="text-sm leading-4 tracking-tight text-gray-600">
          Select the framework or build settings for your project.
        </p>
      </div>

      <div>
        <div className="flex flex-col">
          <div className="mt-2 flex flex-col gap-1.5">
            <label htmlFor="preset" className="font-semibold">
              Preset
            </label>
            <PresetSelect
              presets={presets}
              selectedPreset={selectedPreset}
              onChange={handlePresetChange}
            />
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="rootDir" className="font-semibold">
              Root Directory
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                id="rootDir"
                value={config.rootDir}
                onChange={handleRootDirChange}
                placeholder="e.g, client"
                className={clsx(
                  "h-10 w-full border px-3 py-1.5 font-sans text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-offset-2",
                  validationErrors.rootDir
                    ? "border-red-500"
                    : "border-gray-300",
                )}
                disabled={!isEditingRootDir}
              />
              <button
                type="button"
                onClick={() => setIsEditingRootDir(!isEditingRootDir)}
                className={clsx(
                  "h-10 w-16 border text-sm font-semibold",
                  isEditingRootDir
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-black",
                )}
              >
                {isEditingRootDir ? "Save" : "Edit"}
              </button>
            </div>
            {validationErrors.rootDir && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors.rootDir}
              </p>
            )}
          </div>
        </div>

        <hr className="mt-6" />

        <Accordion.Root
          type="single"
          collapsible
          value={accordionValue}
          onValueChange={setAccordionValue}
          className="mb-5 mt-6"
        >
          <Accordion.Item
            value="customizeSettings"
            className={clsx({
              "outline-dashed outline-gray-700":
                accordionValue === "customizeSettings",
              "border border-gray-200": accordionValue !== "customizeSettings",
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
                  <path
                    d={
                      accordionValue === "customizeSettings"
                        ? "M5 15l7-7 7 7"
                        : "M19 9l-7 7-7-7"
                    }
                  />
                </svg>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content
              className={clsx("flex flex-col space-y-3 px-5", {
                "pb-6 pt-4": accordionValue === "customizeSettings",
              })}
            >
              {["buildCommand", "installCommand", "outputDir"].map((field) => (
                <ConfigField
                  key={field}
                  field={field}
                  value={config[field]}
                  allowOverride={overrides[field]}
                  placeholder={
                    field === "outputDir"
                      ? "dist"
                      : `npm run ${field.replace("Command", "")}`
                  }
                  onInputChange={(value) => handleFieldChange(field, value)}
                  onToggleOverride={() => toggleOverride(field)}
                />
              ))}
              {Object.entries(validationErrors).map(
                ([field, error]) =>
                  error &&
                  field !== "rootDir" && (
                    <p key={field} className="text-sm text-red-500">
                      {error}
                    </p>
                  ),
              )}
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>

        {changes && (
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!canSave}
            className={clsx(
              "mt-2 w-full px-3 py-2 text-center text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2",
              canSave ? "bg-black" : "cursor-not-allowed bg-gray-400",
            )}
          >
            Save changes
          </button>
        )}
      </div>
    </div>
  );
}
