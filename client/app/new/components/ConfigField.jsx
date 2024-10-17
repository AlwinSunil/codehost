const ConfigField = ({
  field,
  placeholder,
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
        className={`w-full border px-2 py-1.5 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 focus:ring-offset-2 ${
          allowOverride
            ? "border-gray-300 text-gray-800 focus:border-gray-500"
            : "border-gray-200 bg-gray-100 text-gray-500"
        }`}
        placeholder={`e.g, ${placeholder}`}
        value={value}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={!allowOverride}
      />
      <label htmlFor={`${field}-override`} className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`${field}-override`}
          checked={allowOverride}
          onChange={onToggleOverride}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium tracking-tight">Override</span>
      </label>
    </div>
  </div>
);

export default ConfigField;
