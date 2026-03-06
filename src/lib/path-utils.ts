// src/lib/path-utils.ts
import path from "path";

/**
 * Generates a business prefix from the business name
 * Takes first 3 letters of first 3 words, converts to uppercase
 * Example: "Test Company Blah Inc" → "TCB"
 * Example: "Acme Corp" → "ACC"
 * Example: "Microsoft" → "MIC"
 */
export function generateBusinessPrefix(businessName: string): string {
  // Split by spaces and filter out empty strings
  const words = businessName.split(/\s+/).filter(word => word.length > 0);
  
  // Take first 3 words (or fewer if not enough words)
  const wordsToUse = words.slice(0, 3);
  
  // Take first 3 letters of each word and convert to uppercase
  const prefix = wordsToUse
    .map(word => word.substring(0, 3).toUpperCase())
    .join('');
  
  // If prefix is less than 3 characters, pad with X
  if (prefix.length < 3) {
    return prefix.padEnd(3, 'X');
  }
  
  return prefix;
}

/**
 * Sanitizes a name for use in container names and directory paths
 * - Converts to lowercase
 * - Replaces spaces and non-alphanumeric characters with dashes
 * - Removes consecutive dashes
 * - Removes leading and trailing dashes
 */
export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generates a container name from business prefix and assistant name
 * Format: {businessPrefix}-{sanitizedAssistantName}
 */
export function generateContainerName(
  businessPrefix: string,
  assistantName: string
): string {
  const sanitizedAssistantName = sanitizeName(assistantName);
  return `${businessPrefix}-${sanitizedAssistantName}`;
}

/**
 * Generates a business directory name from business prefix and business name
 * Format: {businessPrefix}-{sanitizedBusinessName}
 */
export function generateBusinessDirName(
  businessPrefix: string,
  businessName: string
): string {
  const sanitizedBusinessName = sanitizeName(businessName);
  return `${businessPrefix}-${sanitizedBusinessName}`;
}

/**
 * Get the base path for assistant data
 */
export function getAssistantsDataPath(): string {
  return process.env.ASSISTANTS_DATA_PATH || "/opt/data/crewclaw-assistants";
}

/**
 * Constructs the full path for an assistant's workspace directory
 * Format: /opt/data/crewclaw-assistants/{businessPrefix}-{sanitizedBusinessName}/{businessPrefix}-{sanitizedAssistantName}/workspace
 */
export function getAssistantWorkspacePath(
  businessPrefix: string,
  businessName: string,
  assistantName: string
): string {
  const basePath = getAssistantsDataPath();
  const businessDirName = generateBusinessDirName(businessPrefix, businessName);
  const containerName = generateContainerName(businessPrefix, assistantName);
  
  return path.join(basePath, businessDirName, containerName, "workspace");
}

/**
 * Constructs the full base path for an assistant (without workspace subdirectory)
 * Format: /opt/data/crewclaw-assistants/{businessPrefix}-{sanitizedBusinessName}/{businessPrefix}-{sanitizedAssistantName}
 */
export function getAssistantBasePath(
  businessPrefix: string,
  businessName: string,
  assistantName: string
): string {
  const basePath = getAssistantsDataPath();
  const businessDirName = generateBusinessDirName(businessPrefix, businessName);
  const containerName = generateContainerName(businessPrefix, assistantName);
  
  return path.join(basePath, businessDirName, containerName);
}
