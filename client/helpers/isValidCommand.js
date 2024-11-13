export const isValidCommand = (command) => {
  // Trim whitespace from the command
  const sanitizedCommand = command.trim();

  // Check if the command is empty
  if (!sanitizedCommand) {
    return { valid: false, error: "Command cannot be empty" };
  }

  // Disallow dangerous patterns (e.g., ;, &, |, <, >, or ` for command injection)
  const dangerousPatterns = /[;&|<>`]/;
  if (dangerousPatterns.test(sanitizedCommand)) {
    return {
      valid: false,
      error: "Command contains potentially dangerous characters",
    };
  }

  // Pattern to allow only valid characters (alphanumeric, spaces, dashes, underscores)
  const safeCommandPattern = /^[a-zA-Z0-9\s\-\_]+(\s[a-zA-Z0-9\-\_]+)*$/;
  if (!safeCommandPattern.test(sanitizedCommand)) {
    return {
      valid: false,
      error: "Command contains invalid characters or format",
    };
  }

  // Allow any valid npm command:
  // - "npm install"
  // - "npm run <script>"
  // - other npm command structures
  const validNpmCommandsPattern = /^npm\s(install|run\s[a-zA-Z0-9\-\_]+)$/;
  if (!validNpmCommandsPattern.test(sanitizedCommand)) {
    return { valid: false, error: "Command is not a valid npm command" };
  }

  return { valid: true, sanitizedCommand };
};
