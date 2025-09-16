/**
 * Centralized localStorage utilities for NotebookLM
 */

interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'txt' | 'url';
  content: string;
  uploadedAt: Date;
  pageCount?: number;
}

const STORAGE_PREFIX = 'notebook-sources';

/**
 * Get storage key for a subject
 */
const getStorageKey = (subjectId: string): string => {
  return `${STORAGE_PREFIX}-${subjectId}`;
};

/**
 * Load sources from localStorage
 */
export const loadSources = (subjectId: string): Source[] => {
  try {
    const key = getStorageKey(subjectId);
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load sources from localStorage:', error);
    return [];
  }
};

/**
 * Save sources to localStorage
 */
export const saveSources = (subjectId: string, sources: Source[]): void => {
  try {
    const key = getStorageKey(subjectId);
    localStorage.setItem(key, JSON.stringify(sources));
  } catch (error) {
    console.error('Failed to save sources to localStorage:', error);
  }
};

/**
 * Remove sources from localStorage
 */
export const removeSources = (subjectId: string): void => {
  try {
    const key = getStorageKey(subjectId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove sources from localStorage:', error);
  }
};

/**
 * Add sources to existing storage
 */
export const addSources = (subjectId: string, newSources: Source[]): Source[] => {
  const existing = loadSources(subjectId);
  const updated = [...existing, ...newSources];
  saveSources(subjectId, updated);
  return updated;
};

/**
 * Remove a specific source by ID
 */
export const removeSourceById = (subjectId: string, sourceId: string): Source[] => {
  const existing = loadSources(subjectId);
  const updated = existing.filter(s => s.id !== sourceId);
  
  if (updated.length === 0) {
    removeSources(subjectId);
  } else {
    saveSources(subjectId, updated);
  }
  
  return updated;
};