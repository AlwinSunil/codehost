import React from "react";

import * as Switch from "@radix-ui/react-switch";

const ConfigField = ({
  field,
  value,
  allowOverride,
  onInputChange,
  onToggleOverride,
}) => (
  <div key={field} className="flex flex-col gap-1">
    <label htmlFor={field} className="font-semibold capitalize">
      {field.replace(/([A-Z])/g, " $1")}
    </label>
    <div className="flex items-center gap-4">
      <input
        type="text"
        id={field}
        className={`w-full border px-3 py-2 font-sans text-sm transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-300 focus:ring-offset-2 ${
          allowOverride
            ? "border-gray-300 text-gray-800 hover:border-gray-400"
            : "border-gray-200 bg-gray-50 text-gray-500"
        }`}
        placeholder={value}
        value={value}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={!allowOverride}
      />

      <div className="flex items-center gap-2">
        <div className="flex h-fit rounded-full border border-gray-200">
          <Switch.Root
            id={`${field}-override`}
            checked={allowOverride}
            onCheckedChange={onToggleOverride}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-300 focus:ring-offset-1 ${
              allowOverride ? "bg-blue-500" : "bg-gray-200"
            }`}
          >
            <Switch.Thumb
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                allowOverride ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </Switch.Root>
        </div>
        <label
          htmlFor={`${field}-override`}
          className="select-none text-xs font-medium"
        >
          Override
        </label>
      </div>
    </div>
  </div>
);

export default ConfigField;
