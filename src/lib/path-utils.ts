// src/lib/path-utils.ts
import path from "path";

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
