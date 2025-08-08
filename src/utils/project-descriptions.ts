import projectDescriptionsData from '../data/project-descriptions.json';

export interface ProjectDescription {
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export interface ProjectDescriptionsData {
  descriptions: Record<string, ProjectDescription>;
}

// Load project descriptions from JSON file
const projectDescriptions: ProjectDescriptionsData = projectDescriptionsData as ProjectDescriptionsData;

/**
 * Get project description by project ID
 * @param projectId - The project ID to look up
 * @returns Project description or null if not found
 */
export const getProjectDescription = (projectId: string): ProjectDescription | null => {
  return projectDescriptions.descriptions[projectId] || null;
};

/**
 * Get project description text by project ID
 * @param projectId - The project ID to look up
 * @returns Description text or "No project description" if not found
 */
export const getProjectDescriptionText = (projectId: string): string => {
  const project = getProjectDescription(projectId);
  return project?.description || "No project description";
};

/**
 * Get all available project IDs
 * @returns Array of project IDs that have descriptions
 */
export const getAvailableProjectIds = (): string[] => {
  return Object.keys(projectDescriptions.descriptions);
};

/**
 * Check if a project has a description
 * @param projectId - The project ID to check
 * @returns True if description exists, false otherwise
 */
export const hasProjectDescription = (projectId: string): boolean => {
  return projectId in projectDescriptions.descriptions;
};