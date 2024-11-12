const isValidRootDir = (path) => {
  if (!path?.trim()) return false;

  // Combine patterns for better readability and performance
  const invalidPattern = /[\s<>:"|?*]|\.{2,}|^\.$/;
  const validPathFormat = /^[a-zA-Z0-9_./-]+$/;

  return validPathFormat.test(path) && !invalidPattern.test(path);
};

const isValidCommand = (command) => {
  if (!command?.trim()) return true; // Empty commands are allowed

  // Single pattern to catch all dangerous characters and sequences
  const dangerousPattern = /[;&|]|\.{2,}/;

  return !dangerousPattern.test(command);
};

const isValidOutputDir = (dir) => {
  if (!dir?.trim()) return false;
  return /^[a-zA-Z0-9_-]+$/.test(dir); // Only allow alphanumeric, underscore, and hyphen
};

const validateChanges = (changes, currentConfig) => {
  if (!changes) return { isValid: true, errors: {} };

  const errors = {};

  // Check each field with its corresponding validator
  if (changes.rootDir && !isValidRootDir(currentConfig.rootDir)) {
    errors.rootDir = "Invalid root directory";
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

export { isValidRootDir, isValidCommand, isValidOutputDir, validateChanges };
