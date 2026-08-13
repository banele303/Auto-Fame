import React from 'react';
import { CheckCircle, Shield, AlertTriangle, Info } from 'lucide-react';

export interface DocumentPreservationIndicatorProps {
  documentCount: number;
  hasBackup?: boolean;
  isUploading?: boolean;
  className?: string;
  showProtectionNotice?: boolean;
}

/**
 * Component to show users that their documents are safely preserved
 */
export function DocumentPreservationIndicator({
  documentCount,
  hasBackup = false,
  isUploading = false,
  className = '',
  showProtectionNotice = true
}: DocumentPreservationIndicatorProps) {
  if (documentCount === 0 && !hasBackup && !showProtectionNotice) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Document count indicator */}
      {documentCount > 0 && (
        <div className='text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded px-3 py-2 flex items-center gap-2'>
          <div className={`w-2 h-2 bg-green-500 rounded-full ${isUploading ? 'animate-pulse' : ''}`}></div>
          <CheckCircle className='w-4 h-4 text-green-500' />
          <span className='font-medium'>
            ✓ {documentCount} document{documentCount !== 1 ? 's' : ''} uploaded and safely preserved
          </span>
        </div>
      )}

      {/* Backup restoration indicator */}
      {hasBackup && documentCount === 0 && (
        <div className='text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded px-3 py-2 flex items-center gap-2'>
          <AlertTriangle className='w-4 h-4 text-blue-500' />
          <span className='font-medium'>
            Previous documents restored from backup. You can continue where you left off.
          </span>
        </div>
      )}

      {/* Protection notice */}
      {showProtectionNotice && (
        <div className='text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded px-3 py-2 flex items-center gap-2'>
          <Shield className='w-4 h-4 text-blue-500 flex-shrink-0' />
          <div>
            <span className='font-medium'>Document Protection Active:</span> All uploaded files and form data are automatically saved. If any errors occur, your documents and information will be preserved for retry.
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple inline document counter
 */
export function DocumentCounter({ 
  count, 
  className = '' 
}: { 
  count: number; 
  className?: string; 
}) {
  if (count === 0) return null;

  return (
    <div className={`inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 ${className}`}>
      <CheckCircle className='w-3 h-3' />
      <span>{count} doc{count !== 1 ? 's' : ''}</span>
    </div>
  );
}

/**
 * Document upload status badge
 */
export function DocumentUploadStatus({
  isUploading,
  documentCount,
  hasErrors = false,
  className = ''
}: {
  isUploading: boolean;
  documentCount: number;
  hasErrors?: boolean;
  className?: string;
}) {
  if (hasErrors) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200 ${className}`}>
        <AlertTriangle className='w-3 h-3' />
        <span>Upload Error - Files Preserved</span>
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
        <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse'></div>
        <span>Uploading...</span>
      </div>
    );
  }

  if (documentCount > 0) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-50 text-green-700 border border-green-200 ${className}`}>
        <CheckCircle className='w-3 h-3' />
        <span>{documentCount} Saved</span>
      </div>
    );
  }

  return null;
}

/**
 * Enhanced error message component with document preservation info
 */
export function DocumentAwareErrorMessage({
  error,
  documentCount,
  onRetry,
  className = ''
}: {
  error: string;
  documentCount: number;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
      <div className='flex items-start gap-3'>
        <AlertTriangle className='w-5 h-5 text-red-500 flex-shrink-0 mt-0.5' />
        <div className='flex-1'>
          <h3 className='text-sm font-medium text-red-800'>Error Occurred</h3>
          <p className='text-sm text-red-700 mt-1'>{error}</p>
          
          {documentCount > 0 && (
            <div className='mt-2 flex items-center gap-2 text-xs text-red-600'>
              <Shield className='w-3 h-3' />
              <span>Don't worry! Your {documentCount} uploaded document{documentCount !== 1 ? 's are' : ' is'} safely preserved.</span>
            </div>
          )}
          
          {onRetry && (
            <button
              onClick={onRetry}
              className='mt-3 text-xs font-medium text-red-800 hover:text-red-900 underline'
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
