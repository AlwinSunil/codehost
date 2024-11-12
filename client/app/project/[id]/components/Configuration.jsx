import { useCallback, useEffect, useState } from "react";

import {
  isValidCommand,
  isValidOutputDir,
  isValidRootDir,
  validateChanges,
} from "@/helpers/configValidation";
import { presets } from "@/helpers/projectPresets";
import * as Accordion from "@radix-ui/react-accordion";
import clsx from "clsx";
import { toast } from "sonner";

import ConfigField from "@/app/new/components/ConfigField";
import PresetSelect from "@/app/new/components/PresetSelect";

import { updateProjectConfig } from "../actions/updateProjectConfig";

export default function Configuration({ project }) {
  const [config, setConfig] = useState({
    rootDir: project.rootDir || "./",
    preset: project.preset || presets[0].value,
    buildCommand: project.buildCommand || "",
    installCommand: project.installCommand || "",
    outputDirectory: project.outputDirectory || "dist",
  });

  const [overrides, setOverrides] = useState({
    buildCommand: false,
    installCommand: false,
    outputDirectory: false,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isEditingRootDir, setIsEditingRootDir] = useState(false);
  const [accordionValue, setAccordionValue] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(
    presets.find((preset) => preset.value === project.preset) || presets[0],
  );

  useEffect(() => {
    const selectedPreset = presets.find((p) => p.value === config.preset);

    if (selectedPreset) {
      setOverrides({
        buildCommand:
          config.buildCommand !== selectedPreset.config.buildCommand,
        installCommand:
          config.installCommand !== selectedPreset.config.installCommand,
        outputDirectory:
          config.outputDirectory !==
          selectedPreset.config.outputDirectoryectory,
      });
    }
  }, [
    config.preset,
    config.buildCommand,
    config.installCommand,
    config.outputDirectory,
  ]);

  // Get only the fields that are either overridden or changed preset
  const getChangedFieldsWithOverrides = useCallback(() => {
    const baseChanges = {};

    // Always check preset changes
    if (config.preset !== project.preset) {
      baseChanges.preset = config.preset;
    }

    // Always check rootDir changes
    if (config.rootDir !== project.rootDir) {
      baseChanges.rootDir = config.rootDir;
    }

    // Only include overridden fields if they're different from original
    if (
      overrides.buildCommand &&
      config.buildCommand !== project.buildCommand
    ) {
      baseChanges.buildCommand = config.buildCommand;
    }

    if (
      overrides.installCommand &&
      config.installCommand !== project.installCommand
    ) {
      baseChanges.installCommand = config.installCommand;
    }

    if (
      overrides.outputDirectory &&
      config.outputDirectory !== project.outputDirectory
    ) {
      baseChanges.outputDirectory = config.outputDirectory;
    }

    return Object.keys(baseChanges).length > 0 ? baseChanges : null;
  }, [config, project, overrides]);

  const changes = getChangedFieldsWithOverrides();
  const validation = validateChanges(changes, config);

  const handlePresetChange = useCallback(
    (event) => {
      const selectedValue = event.target.value;
      const preset = presets.find((p) => p.value === selectedValue);
      setSelectedPreset(preset);

      // Reset overrides when preset changes
      setOverrides({
        buildCommand: false,
        installCommand: false,
        outputDirectory: false,
      });

      setConfig((prev) => ({
        ...prev,
        preset: selectedValue,
        // Reset commands and output dir to preset defaults when changing preset
        buildCommand: "",
        installCommand: "",
        outputDirectory: "dist",
      }));
    },
    [presets],
  );

  const handleRootDirChange = useCallback((event) => {
    const newRootDir = event.target.value;
    setConfig((prev) => ({ ...prev, rootDir: newRootDir }));

    const error = !isValidRootDir(newRootDir)
      ? "Invalid root directory path"
      : null;
    setValidationErrors((prev) => ({
      ...prev,
      rootDir: error,
    }));
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));

    let error = null;
    switch (field) {
      case "buildCommand":
      case "installCommand":
        if (!isValidCommand(value)) {
          error = `Invalid ${field.replace("Command", "")} command`;
        }
        break;
      case "outputDirectory":
        if (!isValidOutputDir(value)) {
          error = "Invalid output directory";
        }
        break;
    }

    setValidationErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const toggleOverride = useCallback(
    (field) => {
      setOverrides((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));

      // Reset field value when disabling override
      if (overrides[field]) {
        setConfig((prev) => ({
          ...prev,
          [field]: project[field] || "", // Reset to original project value or empty string
        }));

        // Clear validation errors for this field
        setValidationErrors((prev) => ({
          ...prev,
          [field]: null,
        }));
      }
    },
    [project, overrides],
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChanges = useCallback(async () => {
    if (!changes || !validation.isValid || isSaving) return;

    try {
      setIsSaving(true);

      // Prepare the changes object with preset details if needed
      let updatedChanges = { ...changes };

      if (changes.preset) {
        const presetDetails = presets.find((p) => p.value === changes.preset);
        updatedChanges.presetDetails = presetDetails;
      }

      const response = await updateProjectConfig(project.id, updatedChanges);

      if (response.success) {
        toast.success(response.message || "Configuration updated successfully");

        // Reset form state
        setOverrides({
          buildCommand: false,
          installCommand: false,
          outputDirectory: false,
        });

        // Update local config to match saved state
        setConfig((prev) => ({
          ...prev,
          ...updatedChanges,
        }));

        // Reset validation state
        setValidationErrors({});
      } else {
        // Handle validation errors from server
        if (response.errors) {
          setValidationErrors((prev) => ({
            ...prev,
            ...response.errors,
          }));
        }
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("An unexpected error occurred while saving");

      // Handle specific error cases if needed
      if (error.response?.data?.errors) {
        setValidationErrors((prev) => ({
          ...prev,
          ...error.response.data.errors,
        }));
      }
    } finally {
      setIsSaving(false);
    }
  }, [changes, validation.isValid, presets, project.id, isSaving]);

  // Add disabled state for save button
  const canSave = changes !== null && validation.isValid && !isSaving;

  return (
    <div className="max-w-lg p-1">
      <div className="mb-3 flex flex-col">
        <span className="text-lg font-semibold">Build settings</span>
        <p className="text-sm leading-4 tracking-tight text-gray-600">
          Select the framework or build settings for your project.
        </p>
      </div>

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
                validationErrors.rootDir ? "border-red-500" : "border-gray-300",
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

        <hr className="mt-5" />

        <Accordion.Root
          type="single"
          collapsible
          value={accordionValue}
          onValueChange={setAccordionValue}
          className="mb-2 mt-5"
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
              {["buildCommand", "installCommand", "outputDirectory"].map(
                (field) => (
                  <ConfigField
                    key={field}
                    field={field}
                    value={config[field]}
                    allowOverride={overrides[field]}
                    placeholder={
                      field === "outputDirectory"
                        ? "dist"
                        : `npm run ${field.replace("Command", "")}`
                    }
                    onInputChange={(value) => handleFieldChange(field, value)}
                    onToggleOverride={() => toggleOverride(field)}
                  />
                ),
              )}
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
            <div className="flex border-t px-4 py-2.5">
              <div className="rounded-full border border-yellow-300 bg-yellow-100 px-3 py-0.5 font-sans text-xs font-medium tracking-normal text-yellow-700">
                Overrides are enabled for this project
              </div>
            </div>
          </Accordion.Item>
        </Accordion.Root>

        {changes && (
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!canSave}
            className={clsx(
              "mt-3 w-full px-3 py-2 text-center text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2",
              canSave ? "bg-black" : "cursor-not-allowed bg-gray-400",
            )}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        )}

        <p className="mb-4 mt-4 font-sans text-sm text-gray-500">
          *A new Deployment is required for your changes to take effect.
        </p>
      </div>
    </div>
  );
}
