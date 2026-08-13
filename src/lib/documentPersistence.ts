/**
 * Document Persistence Utility
 * Provides functions to backup and restore uploaded documents and form data
 * to prevent data loss during form errors or navigation.
 */

export interface DocumentBackup {
  files: Record<string, any[]>;
  formData: Record<string, any>;
  timestamp: number;
}

export interface BackupOptions {
  key?: string;
  includeFormData?: boolean;
  maxAge?: number; // in milliseconds
}

/**
 * Save uploaded documents and optionally form data to localStorage
 */
export function backupDocuments(
  documents: Record<string, any[]>,
  formData?: Record<string, any>,
  options: BackupOptions = {}
): void {
  const {
    key = 'documentBackup',
    includeFormData = true,
    maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days default
  } = options;

  try {
    const backup: DocumentBackup = {
      files: documents,
      formData: includeFormData && formData ? formData : {},
      timestamp: Date.now()
    };

    localStorage.setItem(key, JSON.stringify(backup));
    
    // Clean up old backups
    cleanupOldBackups(maxAge);
  } catch (error) {
    console.warn('Failed to backup documents:', error);
  }
}

/**
 * Restore uploaded documents and form data from localStorage
 */
export function restoreDocuments(options: BackupOptions = {}): DocumentBackup | null {
  const { key = 'documentBackup', maxAge = 7 * 24 * 60 * 60 * 1000 } = options;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const backup: DocumentBackup = JSON.parse(raw);
    
    // Check if backup is still valid (not too old)
    if (Date.now() - backup.timestamp > maxAge) {
      localStorage.removeItem(key);
      return null;
    }

    return backup;
  } catch (error) {
    console.warn('Failed to restore documents:', error);
    return null;
  }
}

/**
 * Clear document backup
 */
export function clearDocumentBackup(key: string = 'documentBackup'): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear document backup:', error);
  }
}

/**
 * Check if there are any backed up documents
 */
export function hasBackedUpDocuments(key: string = 'documentBackup'): boolean {
  try {
    const backup = restoreDocuments({ key });
    return backup !== null && Object.keys(backup.files).length > 0;
  } catch {
    return false;
  }
}

/**
 * Get backed up document count
 */
export function getBackedUpDocumentCount(key: string = 'documentBackup'): number {
  try {
    const backup = restoreDocuments({ key });
    if (!backup) return 0;
    
    return Object.values(backup.files).reduce((total, files) => total + files.length, 0);
  } catch {
    return 0;
  }
}

/**
 * Clean up old document backups from localStorage
 */
function cleanupOldBackups(maxAge: number): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.includes('Backup') || key.includes('Temp')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && (now - data.timestamp > maxAge)) {
            localStorage.removeItem(key);
          }
        } catch {
          // If we can't parse it, it might be old format, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('Failed to cleanup old backups:', error);
  }
}

/**
 * Create a backup-aware error handler for form submissions
 */
export function createDocumentAwareErrorHandler(
  documents: Record<string, any[]>,
  formData?: Record<string, any>,
  options: BackupOptions = {}
) {
  return (error: any, showToast: (message: string, type?: 'error' | 'success' | 'info') => void) => {
    // Backup documents and form data
    backupDocuments(documents, formData, options);
    
    // Show user-friendly error message
    const errorMessage = error?.message || 'An error occurred';
    const documentCount = Object.values(documents).reduce((total, files) => total + files.length, 0);
    
    if (documentCount > 0) {
      showToast(
        `${errorMessage}. Your ${documentCount} uploaded document(s) and form data have been preserved for retry.`,
        'error'
      );
    } else {
      showToast(`${errorMessage}. Your form data has been preserved for retry.`, 'error');
    }
  };
}

/**
 * Create enhanced toast notifications for document preservation
 */
export interface ToastOptions {
  duration?: number;
  style?: React.CSSProperties;
}

export const documentToastStyles = {
  error: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    border: '1px solid #D97706'
  },
  success: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    border: '1px solid #10B981'
  },
  info: {
    backgroundColor: '#DBEAFE',
    color: '#1E3A8A',
    border: '1px solid #3B82F6'
  },
  warning: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    border: '1px solid #F59E0B'
  }
};
