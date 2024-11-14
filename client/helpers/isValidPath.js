export const isValidPath = (path) => {
  // Basic cleanup - trim whitespace and normalize slashes
  const cleanPath = path.trim().replace(/\\/g, "/");

  // Constants for validation
  const MAX_PATH_LENGTH = 260; // Windows max path length
  const MAX_SEGMENT_LENGTH = 255; // Max length for each directory/file name

  // Validation rules
  const rules = {
    // Updated to allow "./" or "./directory" patterns
    validPathPattern: /^(\.\/|[.]{1,2}\/|\/)?([a-zA-Z0-9_-]+\/?)*$/,

    // Invalid characters in paths
    invalidChars: /[<>:"|?*\\]/,

    // Check for consecutive slashes
    consecutiveSlashes: /\/\/+/,

    // Check for valid segments (directories/files), allow '.' and '..' for root or parent directories
    validSegment: /^([a-zA-Z0-9_-]+|\.{1,2})$/, // Allow "." and ".."
  };

  // Validation checks
  const checks = [
    {
      test: () => cleanPath.length > 0,
      error: "Path cannot be empty",
    },
    {
      test: () => cleanPath.length <= MAX_PATH_LENGTH,
      error: `Path length exceeds maximum of ${MAX_PATH_LENGTH} characters`,
    },
    {
      test: () => !rules.invalidChars.test(cleanPath),
      error: 'Path contains invalid characters (< > : " | ? * \\)',
    },
    {
      test: () => !rules.consecutiveSlashes.test(cleanPath),
      error: "Path contains consecutive slashes",
    },
    {
      test: () => rules.validPathPattern.test(cleanPath),
      error: "Path format is invalid",
    },
  ];

  // Check path segments
  const validateSegments = (path) => {
    const segments = path.split("/").filter(Boolean);

    for (const segment of segments) {
      if (segment.length > MAX_SEGMENT_LENGTH) {
        return {
          valid: false,
          error: `Directory/file name '${segment}' exceeds maximum length of ${MAX_SEGMENT_LENGTH} characters`,
        };
      }

      if (!rules.validSegment.test(segment)) {
        return {
          valid: false,
          error: `Invalid directory/file name: '${segment}'`,
        };
      }
    }

    return { valid: true };
  };

  // Run all validation checks
  for (const check of checks) {
    if (!check.test()) {
      return {
        valid: false,
        error: check.error,
      };
    }
  }

  // Validate individual segments
  const segmentValidation = validateSegments(cleanPath);
  if (!segmentValidation.valid) {
    return segmentValidation;
  }

  return {
    valid: true,
    normalizedPath: cleanPath,
  };
};
