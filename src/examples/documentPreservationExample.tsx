// Example: How to use the document persistence system in any form with file uploads

import React, { useState } from 'react';
import { useDocumentPersistence, useDocumentAwareErrorHandler } from '@/hooks/useDocumentPersistence';
import { DocumentPreservationIndicator } from '@/components/ui/DocumentPreservationIndicator';
import { toast } from 'sonner';

export function ExampleFormWithDocuments() {
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, any[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize document persistence
  const {
    hasBackup,
    backupCount,
    backup,
    restore,
    clear
  } = useDocumentPersistence({
    key: 'exampleFormDocuments',
    autoBackup: true,
    onRestore: (backup) => {
      // Restore both documents and form data
      setUploadedFiles(backup.files);
      setFormData(backup.formData);
      toast.info(`Restored ${Object.values(backup.files).flat().length} documents and form data from previous session.`);
    }
  });

  // Error handler that automatically preserves documents
  const handleErrorWithDocuments = useDocumentAwareErrorHandler(toast.error, {
    key: 'exampleFormDocuments'
  });

  // Restore data on component mount if backup exists
  React.useEffect(() => {
    if (hasBackup) {
      restore();
    }
  }, [hasBackup, restore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Your form submission logic here
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          documents: Object.values(uploadedFiles).flat()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Submission failed');
      }

      // Success - clear backup
      clear();
      toast.success('Form submitted successfully!');
      
    } catch (error) {
      // Error - documents are automatically preserved
      handleErrorWithDocuments(uploadedFiles, formData, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const documentCount = Object.values(uploadedFiles).reduce((total, files) => total + files.length, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Your form fields here */}
      
      {/* File upload section */}
      <div>
        <label>Upload Documents</label>
        {/* Your file upload component */}
      </div>

      {/* Document preservation indicator */}
      <DocumentPreservationIndicator
        documentCount={documentCount}
        hasBackup={hasBackup && documentCount === 0}
        showProtectionNotice={true}
      />

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Form'}
      </button>
    </form>
  );
}

// For existing forms, you can wrap the submission handler:
export function wrapWithDocumentPreservation(
  originalHandler: (formData: any) => Promise<void>,
  documents: Record<string, any[]>,
  formData: any,
  backupKey: string = 'formDocuments'
) {
  return async (data: any) => {
    try {
      await originalHandler(data);
      // Success - clear backup
      localStorage.removeItem(backupKey);
    } catch (error) {
      // Error - preserve documents
      const backup = {
        files: documents,
        formData: data,
        timestamp: Date.now()
      };
      localStorage.setItem(backupKey, JSON.stringify(backup));
      
      // Show user-friendly error
      const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'An error occurred');
      const documentCount = Object.values(documents).reduce((total, files) => total + files.length, 0);
      toast.error(
        `${errorMessage}. Your ${documentCount} uploaded document(s) and form data have been preserved.`,
        { duration: 6000 }
      );
      
      throw error; // Re-throw for other error handling
    }
  };
}
