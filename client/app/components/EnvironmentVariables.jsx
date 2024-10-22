import { useState } from "react";

import clsx from "clsx";
import { toast } from "sonner";

import { validateEnvs } from "../new/actions/validateEnvs";

const isValidEnvKey = (key) => {
  const envKeyRegex = /^[A-Za-z_][A-Za-z0-9_]{0,99}$/;
  return envKeyRegex.test(key);
};

const isValidEnvValue = (value) => {
  return (
    value?.trim() === value &&
    value.length > 0 &&
    !/[\x00-\x1F\x7F]/.test(value)
  );
};

export default function EnvironmentVariables({
  isNewProject,
  envVars,
  setEnvVars,
  isEnvsValid,
  setIsEnvsValid,
}) {
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleKeyChange = (e) => setKeyInput(e.target.value);
  const handleValueChange = (e) => setValueInput(e.target.value);

  const handleAddEnvVar = () => {
    setError("");

    const trimmedKey = keyInput.trim();
    const trimmedValue = valueInput.trim();

    if (!isValidEnvKey(trimmedKey)) {
      setError("Invalid key format");
      return;
    }

    if (envVars.some((env) => env.key === trimmedKey)) {
      setError("Key already exists");
      return;
    }

    if (!isValidEnvValue(trimmedValue)) {
      setError("Invalid value format");
      return;
    }

    setEnvVars([...envVars, { key: trimmedKey, value: trimmedValue }]);
    setIsEnvsValid(true);

    setKeyInput("");
    setValueInput("");
  };

  const handleRemoveEnvVar = (index) => {
    const updatedVars = envVars.filter((_, idx) => idx !== index);
    setEnvVars(updatedVars);
  };

  const handleUpdateEnvVars = (e, index, type) => {
    const updatedEnvVars = [...envVars];
    if (type === "key") {
      updatedEnvVars[index].key = e.target.value;
    } else if (type === "value") {
      updatedEnvVars[index].value = e.target.value;
    }
    setEnvVars(updatedEnvVars);
    setIsEnvsValid(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && keyInput && valueInput) {
      handleAddEnvVar();
    }
  };

  const handleValidateEnvs = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await validateEnvs(envVars);
      if (response.success) {
        toast.success(response.message, { duration: 2000 });
        setIsEnvsValid(true);
        setError(null);
      } else {
        setError(response.message);
        setIsEnvsValid(false);
      }
    } catch (error) {
      console.error(error);
      setError(error.message);
      setIsEnvsValid(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={clsx("mt-1 flex flex-col gap-5", {
        "mb-3 px-5 py-4": isNewProject,
        "max-w-lg px-1 pb-2 pt-4": !isNewProject,
      })}
    >
      <div className="flex w-full gap-2.5">
        <div className="flex w-full flex-col gap-1">
          <label htmlFor="key" className="font-sans text-xs">
            Key
          </label>
          <input
            type="text"
            value={keyInput}
            onChange={handleKeyChange}
            onKeyDown={handleKeyDown}
            className="h-10 w-full border border-gray-300 px-3 py-1.5 font-sans text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-offset-2"
          />
        </div>
        <div className="flex w-full flex-col gap-1">
          <label htmlFor="value" className="font-sans text-xs">
            Value
          </label>
          <input
            type="text"
            value={valueInput}
            onChange={handleValueChange}
            onKeyDown={handleKeyDown}
            className="h-10 w-full border border-gray-300 px-3 py-1.5 font-sans text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-offset-2"
          />
        </div>
        <button
          onClick={handleAddEnvVar}
          disabled={!keyInput || !valueInput}
          className="mt-auto flex h-10 items-center bg-black px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/60"
        >
          Add
        </button>
      </div>

      <div className="ml-auto flex w-fit items-center gap-2 rounded-full border py-1 pl-1.5 pr-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-black"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <p className="font-sans text-xs">
          Certain keys for environment variables are reserved and cannot be
          used.
        </p>
      </div>

      {error && (
        <p className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">
          {error}
        </p>
      )}

      <hr />

      {envVars.length > 0 && (
        <>
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full gap-2 border bg-gray-50 px-2 py-2 font-sans text-xs text-gray-700">
              <p className="w-full">Key</p>
              <p className="mr-8 w-full">Value</p>
            </div>
            {envVars.map((env, index) => (
              <div key={index} className="flex w-full gap-2">
                <input
                  type="text"
                  value={env.key}
                  onChange={(e) => handleUpdateEnvVars(e, index, "key")}
                  className="h-10 w-full border px-3 py-1.5 font-sans text-sm text-gray-800 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-offset-2"
                />
                <input
                  type="text"
                  value={env.value}
                  onChange={(e) => handleUpdateEnvVars(e, index, "value")}
                  className="h-10 w-full border px-3 py-1.5 font-sans text-sm text-gray-800 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-offset-2"
                />
                <button
                  onClick={() => handleRemoveEnvVar(index)}
                  className="mt-auto flex h-10 items-center border border-gray-300 px-2 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-offset-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-black"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {!isEnvsValid && (
            <button
              className="ml-auto w-fit justify-center bg-black px-4 py-1 font-sans text-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-black/50"
              onClick={handleValidateEnvs}
              disabled={loading}
            >
              {loading ? "Validating..." : "Validate env"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
