import { useCallback, useState } from "react";

import * as Accordion from "@radix-ui/react-accordion";
import clsx from "clsx";
import { toast } from "sonner";

import { isValidCommand } from "@/helpers/isValidCommand";
import { isValidPath } from "@/helpers/isValidPath";
import { configDefaults, presets } from "@/helpers/projectPresets";
import ConfigField from "@/app/new/components/ConfigField";
import PresetSelect from "@/app/new/components/PresetSelect";

import { updateProjectConfig } from "../actions/updateProjectConfig";
import { useProject } from "../Context/ProjectContext";

export default function Configuration({ project }) {
  const { refetchProject } = useProject();

  const originalConfig = {
    rootDir: project.rootDir || "./",
    preset: project.preset || presets[0].value,
    buildCommand: project.buildCommand || "",
    installCommand: project.installCommand || "",
    outputDir: project.outputDir || "dist",
  };

  const [formValues, setFormValues] = useState(originalConfig);

  const [pendingChanges, setPendingChanges] = useState({});

  // UI state
  const [fieldOverrides, setFieldOverrides] = useState({
    buildCommand:
      project.buildCommand != configDefaults[project.preset].buildCommand,
    installCommand:
      project.installCommand != configDefaults[project.preset].installCommand,
    outputDir: project.outputDir != configDefaults[project.preset]?.outputDir,
  });

  const [validationState, setValidationState] = useState({});
  const [isEditingRootDir, setIsEditingRootDir] = useState(false);
  const [accordionValue, setAccordionValue] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(
    presets.find((preset) => preset.value === project.preset) || presets[0],
  );

  // Helper function to update pending changes
  const updatePendingChanges = useCallback(
    (field, value) => {
      setPendingChanges((prev) => {
        // If the new value matches the original config, remove it from pending changes
        if (value === originalConfig[field]) {
          const { [field]: _, ...rest } = prev;
          return rest;
        }
        // Otherwise, add/update the pending change
        return { ...prev, [field]: value };
      });
    },
    [originalConfig],
  );

  const validateField = useCallback((field, value) => {
    let error = "";

    switch (field) {
      case "rootDir":
        error = !isValidPath(value) ? "Invalid path for root directory" : "";
        break;

      case "installCommand":

      case "buildCommand":
        const commandValidation = isValidCommand(value);
        if (!commandValidation.valid) {
          error = commandValidation.error;
        }
        break;

      case "outputDir":
        error = !isValidPath(value) ? "Invalid path for Output directory" : "";
        break;
    }

    setValidationState((prev) => ({
      ...prev,
      [field]: error,
    }));

    return !error;
  }, []);

  const handlePresetChange = useCallback(
    (e) => {
      const newPreset = e.target.value;
      setSelectedPreset(presets.find((preset) => preset.value === newPreset));
      setFormValues((prev) => ({ ...prev, preset: newPreset }));
      updatePendingChanges("preset", newPreset);
    },
    [updatePendingChanges],
  );

  const handleRootDirChange = useCallback(
    (e) => {
      const newRootDir = e.target.value;
      setFormValues((prev) => ({ ...prev, rootDir: newRootDir }));

      if (validateField("rootDir", newRootDir)) {
        updatePendingChanges("rootDir", newRootDir);
      }
    },
    [validateField, updatePendingChanges],
  );

  const handleFieldChange = useCallback(
    (field, value) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));

      if (validateField(field, value)) {
        updatePendingChanges(field, value);
      }
    },
    [validateField, updatePendingChanges],
  );

  // Toggle field override
  const toggleOverride = useCallback(
    (field) => {
      setFieldOverrides((prev) => {
        const newOverrideState = !prev[field];
        const newOverrides = {
          ...prev,
          [field]: newOverrideState,
        };

        // If turning OFF override, set to preset default
        if (!newOverrideState) {
          const currentPreset = selectedPreset;

          const presetDefaultValue = currentPreset.config[field];

          // Update form value to preset default
          setFormValues((prevForm) => ({
            ...prevForm,
            [field]: presetDefaultValue,
          }));

          // Add to pending changes if different from project config
          if (presetDefaultValue !== project[field]) {
            setPendingChanges((prevChanges) => ({
              ...prevChanges,
              [field]: presetDefaultValue,
            }));
          }
        }

        return newOverrides;
      });
    },
    [selectedPreset.value, project, presets],
  );

  const handleSaveChanges = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) return;

    setIsSaving(true);
    try {
      const response = await updateProjectConfig(project.id, pendingChanges);
      console.log(response);

      if (response.success) {
        refetchProject();
        toast.success("Configuration updated successfully");

        // Reset pending changes after successful save
        setPendingChanges({});
      } else {
        const errorMessage = response.error || "An unknown error occurred";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update configuration");
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, project.id]);

  // Check if changes are valid
  const areChangesValid = useCallback(() => {
    return Object.keys(validationState).every((key) => !validationState[key]);
  }, [validationState]);

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
              value={formValues.rootDir}
              onChange={handleRootDirChange}
              placeholder="e.g, client"
              className={clsx(
                "h-10 w-full border px-3 py-1.5 font-sans text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-offset-2",
                validationState.rootDir ? "border-red-500" : "border-gray-300",
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
          {validationState.rootDir && (
            <p className="mt-1 text-sm text-red-500">
              {validationState.rootDir}
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
              {["buildCommand", "installCommand", "outputDir"].map((field) => (
                <ConfigField
                  key={field}
                  field={field}
                  value={formValues[field]}
                  allowOverride={fieldOverrides[field]}
                  onInputChange={(value) => handleFieldChange(field, value)}
                  onToggleOverride={() => toggleOverride(field)}
                />
              ))}
            </Accordion.Content>
            {Object.keys(fieldOverrides).some((key) => fieldOverrides[key]) && (
              <div className="flex border-t px-4 py-2.5">
                <div className="rounded-full border border-yellow-300 bg-yellow-100 px-3 py-0.5 font-sans text-xs font-medium tracking-normal text-yellow-700">
                  Overrides are enabled for this project
                </div>
              </div>
            )}
          </Accordion.Item>
        </Accordion.Root>

        {Object.keys(pendingChanges).length > 0 && (
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={
              !areChangesValid() ||
              Object.keys(pendingChanges).length === 0 ||
              isSaving
            }
            className={clsx(
              "mt-3 w-full bg-black px-3 py-2 text-center text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/60",
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
