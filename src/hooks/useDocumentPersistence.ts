import { useState, useEffect, useCallback } from 'react';
import { 
  backupDocuments, 
  restoreDocuments, 
  clearDocumentBackup, 
  hasBackedUpDocuments,
  getBackedUpDocumentCount,
  DocumentBackup,
  BackupOptions
} from '@/lib/documentPersistence';

export interface UseDocumentPersistenceOptions extends BackupOptions {
  autoBackup?: boolean;
  onRestore?: (backup: DocumentBackup) => void;
  onBackup?: (documentCount: number) => void;
}

export interface UseDocumentPersistenceReturn {
  // State
  isRestoring: boolean;
  hasBackup: boolean;
  backupCount: number;
  
  // Actions
  backup: (documents: Record<string, any[]>, formData?: Record<string, any>) => void;
  restore: () => DocumentBackup | null;
  clear: () => void;
  
  // Utilities
  createErrorHandler: (documents: Record<string, any[]>, formData?: Record<string, any>) => (error: any) => void;
}

/**
 * React hook for managing document persistence in forms
 * Automatically handles backup and restoration of uploaded documents and form data
 */
export function useDocumentPersistence(
  options: UseDocumentPersistenceOptions = {}
): UseDocumentPersistenceReturn {
  const {
    key = 'documentBackup',
    autoBackup = true,
    includeFormData = true,
    maxAge = 7 * 24 * 60 * 60 * 1000, // 7 days
    onRestore,
    onBackup
  } = options;

  const [isRestoring, setIsRestoring] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [backupCount, setBackupCount] = useState(0);

  // Check for existing backups on mount
  useEffect(() => {
    const checkBackup = () => {
      const exists = hasBackedUpDocuments(key);
      const count = getBackedUpDocumentCount(key);
      setHasBackup(exists);
      setBackupCount(count);
    };

    checkBackup();
    
    // Check periodically in case user has multiple tabs
    const interval = setInterval(checkBackup, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [key]);

  // Backup function
  const backup = useCallback((documents: Record<string, any[]>, formData?: Record<string, any>) => {
    try {
      backupDocuments(documents, formData, { key, includeFormData, maxAge });
      
      const count = Object.values(documents).reduce((total, files) => total + files.length, 0);
      setBackupCount(count);
      setHasBackup(count > 0);
      
      onBackup?.(count);
    } catch (error) {
      console.warn('Failed to backup documents:', error);
    }
  }, [key, includeFormData, maxAge, onBackup]);

  // Restore function
  const restore = useCallback(() => {
    setIsRestoring(true);
    try {
      const backup = restoreDocuments({ key, maxAge });
      if (backup) {
        setHasBackup(true);
        setBackupCount(Object.values(backup.files).reduce((total, files) => total + files.length, 0));
        onRestore?.(backup);
        return backup;
      } else {
        setHasBackup(false);
        setBackupCount(0);
      }
      return backup;
    } catch (error) {
      console.warn('Failed to restore documents:', error);
      return null;
    } finally {
      setIsRestoring(false);
    }
  }, [key, maxAge, onRestore]);

  // Clear function
  const clear = useCallback(() => {
    clearDocumentBackup(key);
    setHasBackup(false);
    setBackupCount(0);
  }, [key]);

  // Create error handler that automatically backs up documents
  const createErrorHandler = useCallback((
    documents: Record<string, any[]>, 
    formData?: Record<string, any>
  ) => {
    return (error: any) => {
      if (autoBackup) {
        backup(documents, formData);
      }
      throw error; // Re-throw so calling code can handle it
    };
  }, [backup, autoBackup]);

  return {
    isRestoring,
    hasBackup,
    backupCount,
    backup,
    restore,
    clear,
    createErrorHandler
  };
}

/**
 * Hook for creating document-aware error handlers with toast notifications
 */
export function useDocumentAwareErrorHandler(
  showToast: (message: string, options?: any) => void,
  options: UseDocumentPersistenceOptions = {}
) {
  const { backup } = useDocumentPersistence(options);

  return useCallback((
    documents: Record<string, any[]>,
    formData?: Record<string, any>,
    error?: any
  ) => {
    // Backup documents and form data
    backup(documents, formData);
    
    // Show user-friendly error message
    const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'An error occurred');
    const documentCount = Object.values(documents).reduce((total, files) => total + files.length, 0);
    
    if (documentCount > 0) {
      showToast(
        `${errorMessage}. Your ${documentCount} uploaded document(s) and form data have been preserved for retry.`,
        {
          duration: 6000,
          style: {
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #D97706'
          }
        }
      );
    } else {
      showToast(
        `${errorMessage}. Your form data has been preserved for retry.`,
        {
          duration: 5000,
          style: {
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #D97706'
          }
        }
      );
    }
  }, [backup, showToast]);
}
