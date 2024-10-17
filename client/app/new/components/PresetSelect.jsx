const PresetSelect = ({ presets, selectedPreset, onChange }) => (
  <div className="flex items-center gap-2">
    <select
      id="preset"
      className="h-10 w-80 border border-gray-300 px-2 py-1.5 font-sans text-gray-800 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-200 focus:ring-offset-2"
      onChange={onChange}
      value={selectedPreset.value}
    >
      {presets.map((option) => (
        <option key={option.value} value={option.value}>
          {option.name}
        </option>
      ))}
    </select>
    <div className="flex items-center gap-2 px-2 py-1">
      <img
        id="selected-image"
        src={selectedPreset.image}
        alt={selectedPreset.name}
        className="h-4 w-4"
      />
      <span id="selected-name">{selectedPreset.name}</span>
    </div>
  </div>
);

export default PresetSelect;
