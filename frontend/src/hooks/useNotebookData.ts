import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { sanitizeForLogging } from '@/utils/sanitization';
import { loadSources, saveSources, addSources, removeSourceById } from '@/utils/notebookStorage';

interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'txt' | 'url';
  content: string;
  uploadedAt: Date;
  pageCount?: number;
}

interface UseNotebookDataReturn {
  sources: Source[];
  isLoading: boolean;
  error: string | null;
  addNewSources: (newSources: Source[]) => void;
  removeSource: (sourceId: string) => void;
  refreshSources: () => Promise<void>;
}

/**
 * Custom hook for managing notebook data with performance optimizations
 */
export const useNotebookData = (subjectId: string): UseNotebookDataReturn => {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sources with concurrent API calls for better performance
  const loadNotesFromSubject = useCallback(async (subjectId: string): Promise<Source[]> => {
    if (subjectId === 'default') return [];
    
    try {
      const { data } = await api.get(`/subjects/${subjectId}`);
      const notes = data.notes || [];
      
      if (notes.length === 0) return [];
      
      // Use Promise.all for concurrent API calls instead of sequential
      const notePromises = notes.map(async (note: any) => {
        try {
          const { data: noteData } = await api.get(`/notes/${note._id}`);
          return {
            id: `note-${note._id}`,
            name: note.title,
            type: 'txt' as const,
            content: noteData.content || noteData.summary || 'Note content not available',
            uploadedAt: new Date(note.createdAt)
          };
        } catch (error) {
          console.error(`Failed to load content for note ${sanitizeForLogging(note._id)}:`, error);
          // Skip failed notes instead of adding error placeholders
          return null;
        }
      });
      
      const results = await Promise.all(notePromises);
      return results.filter((note): note is Source => note !== null);
      
    } catch (error) {
      console.error('Failed to load subject notes:', error);
      throw error;
    }
  }, []);

  // Initialize sources
  const refreshSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load from localStorage first
      const existingSources = loadSources(subjectId);
      setSources(existingSources);
      
      // Load notes from subject if not default
      if (subjectId !== 'default') {
        const noteSources = await loadNotesFromSubject(subjectId);
        
        // Filter out notes that are already in localStorage
        const existingIds = new Set(existingSources.map(s => s.id));
        const newNoteSources = noteSources.filter(note => !existingIds.has(note.id));
        
        if (newNoteSources.length > 0) {
          const allSources = [...existingSources, ...newNoteSources];
          setSources(allSources);
          saveSources(subjectId, allSources);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sources');
    } finally {
      setIsLoading(false);
    }
  }, [subjectId, loadNotesFromSubject]);

  // Add new sources
  const addNewSources = useCallback((newSources: Source[]) => {
    const updated = addSources(subjectId, newSources);
    setSources(updated);
  }, [subjectId]);

  // Remove source
  const removeSource = useCallback((sourceId: string) => {
    const updated = removeSourceById(subjectId, sourceId);
    setSources(updated);
  }, [subjectId]);

  // Load sources on mount and when subjectId changes
  useEffect(() => {
    refreshSources();
  }, [refreshSources]);

  return {
    sources,
    isLoading,
    error,
    addNewSources,
    removeSource,
    refreshSources
  };
};