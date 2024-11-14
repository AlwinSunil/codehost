export const validateConfig = (config, rootDir) => {
  const maliciousPatterns = [/;.*$/, /&&.*$/, /(\|\|)/, /(\&\&)/]; // Basic patterns for malicious content

  const isMalicious = (command) =>
    maliciousPatterns.some((pattern) => pattern.test(command));

  // Check for potentially malicious content in installCommand, buildCommand, and outputDir
  const fieldsToCheck = ["installCommand", "buildCommand", "outputDir"];
  for (const field of fieldsToCheck) {
    if (config[field]?.value && isMalicious(config[field].value)) {
      alert(`${field} contains potentially malicious content.`);
      return { config: null, rootDir };
    }
  }

  // Check if override fields have values
  for (const [key, { override, value }] of Object.entries(config)) {
    if (override && !value) {
      alert(`The field '${key}' must have a value if 'override' is true.`);
      return { config: null, rootDir };
    }
  }

  // Validate rootDir
  const invalidChars = /[<>:"/\\|?*]/;
  const allowedPathPattern = /^(\.|\/|\w+)*$/;

  if (invalidChars.test(rootDir) && !allowedPathPattern.test(rootDir)) {
    alert("The specified rootDir contains invalid characters.");
    return { config: null, rootDir: null };
  }

  const pathTraversalPatterns = [/(\.\.\/)+/, /(\.\.\\)+/];
  if (pathTraversalPatterns.some((pattern) => pattern.test(rootDir))) {
    alert("The specified rootDir contains potentially unsafe path patterns.");
    return { config: null, rootDir: null };
  }

  return { config, rootDir };
};
