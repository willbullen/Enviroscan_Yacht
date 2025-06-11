import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Alert, AlertDescription } from './alert';
import FileUpload, { FileUploadProps, UploadedFile } from './FileUpload';
import { toast } from 'sonner';

export interface FileUploadDialogProps extends Omit<FileUploadProps, 'onUpload' | 'onError'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onCancel?: () => void;
  autoCloseOnUpload?: boolean;
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  category,
  onUploadComplete,
  onCancel,
  autoCloseOnUpload = true,
  ...uploadProps
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    setError('');
    
    // Show success toast
    toast.success(`${files.length} file(s) uploaded successfully`);
    
    // Call callback
    onUploadComplete?.(files);
    
    // Auto-close if enabled
    if (autoCloseOnUpload) {
      handleClose();
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
  };

  const handleClose = () => {
    setUploadedFiles([]);
    setError('');
    setIsUploading(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    handleClose();
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'drawings': return 'Upload Technical Drawings';
      case 'documents': return 'Upload Documents';
      case 'issue-photos': return 'Upload Issue Photos';
      case '3d-models': return 'Upload 3D Models';
      default: return 'Upload Files';
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'drawings': return 'Upload technical drawings, plans, and blueprints for this project.';
      case 'documents': return 'Upload project documents, specifications, and reports.';
      case 'issue-photos': return 'Upload photos to document this issue or defect.';
      case '3d-models': return 'Upload 3D models, scans, and CAD files for this project.';
      default: return 'Select files to upload.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {title || getCategoryTitle(category)}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {description || getCategoryDescription(category)}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* File Upload Component */}
          <FileUpload
            category={category}
            onUpload={handleUpload}
            onError={handleError}
            {...uploadProps}
          />

          {/* Uploaded Files Summary */}
          {uploadedFiles.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">
                Successfully Uploaded ({uploadedFiles.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between text-xs p-2 bg-green-50 border border-green-200 rounded"
                  >
                    <span className="font-medium text-green-800 truncate">
                      {file.originalName}
                    </span>
                    <span className="text-green-600 ml-2">
                      {Math.round(file.fileSize / 1024)} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
            >
              {uploadedFiles.length > 0 ? 'Close' : 'Cancel'}
            </Button>
            
            {!autoCloseOnUpload && uploadedFiles.length > 0 && (
              <Button onClick={handleClose}>
                Done ({uploadedFiles.length} uploaded)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog; 