import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { UploadCloud, Check, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onUpload: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  className?: string;
  buttonText?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  acceptedFileTypes = ['image/*', 'application/pdf'],
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = '',
  buttonText = 'Upload File',
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`File is too large. Max size is ${maxSize / (1024 * 1024)}MB.`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Invalid file type. Please upload the correct file type.');
        } else {
          setError('There was an error with the file. Please try again.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        setFiles(acceptedFiles);
        setError(null);
        setSuccess(true);
        onUpload(acceptedFiles);
      }
    },
    [maxSize, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((obj, type) => {
      obj[type] = [];
      return obj;
    }, {} as Record<string, string[]>),
    maxFiles,
    maxSize,
  });

  const resetUploader = () => {
    setFiles([]);
    setError(null);
    setSuccess(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  let displayText = 'Drag & drop files here, or click to select files';
  if (isDragActive) {
    displayText = 'Drop the files here...';
  }

  return (
    <div className={`w-full ${className}`}>
      {!success ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2">
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{displayText}</p>
            <Button type="button" size="sm" variant="secondary">
              {buttonText}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Accepted files: {acceptedFileTypes.join(', ')} (Max size: {formatFileSize(maxSize)})
          </p>
        </div>
      ) : (
        <div className="border rounded-md p-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{files[0]?.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(files[0]?.size || 0)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetUploader}>
              Change
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-500 p-2 bg-red-50 rounded">
          <AlertCircle className="h-4 w-4" />
          <p className="text-xs">{error}</p>
        </div>
      )}
    </div>
  );
};