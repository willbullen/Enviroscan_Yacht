import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X, Upload, AlertCircle, CheckCircle, FileIcon, Image, File } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  onFileRemoved?: (index: number) => void;
  maxFiles?: number;
  maxSize?: number;
  uploading?: boolean;
  progress?: number;
  uploadedFiles?: Array<{
    name: string;
    size: number;
    status?: 'uploading' | 'success' | 'error';
  }>;
}

export const FileUploader = ({
  onFilesSelected,
  onFileRemoved,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  uploading = false,
  progress = 0,
  uploadedFiles = []
}: FileUploaderProps) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      
      setError(null);
      
      // Check if adding these files would exceed the max file count
      if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
        setError(`You can only upload a maximum of ${maxFiles} files at once.`);
        return;
      }
      
      onFilesSelected(acceptedFiles);
    },
    [maxFiles, onFilesSelected, uploadedFiles.length]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxSize,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    disabled: uploading,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension as string)) {
      return <Image className="h-6 w-6 text-blue-500" />;
    }
    
    if (extension === 'pdf') {
      return <FileIcon className="h-6 w-6 text-red-500" />;
    }
    
    return <File className="h-6 w-6 text-gray-500" />;
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'uploading') {
      return <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
    }
    
    if (status === 'success') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    
    if (status === 'error') {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    
    return null;
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 transition-colors flex flex-col items-center justify-center cursor-pointer',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          uploading && 'opacity-50 cursor-not-allowed bg-muted',
          'hover:border-primary hover:bg-primary/5'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className={cn('h-10 w-10', isDragActive ? 'text-primary' : 'text-muted-foreground')} />
          <div className="flex flex-col gap-1">
            <p className="font-medium">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here or click to browse'}
            </p>
            <p className="text-sm text-muted-foreground">
              Accepts JPG, PNG, and PDF (max {formatFileSize(maxSize)} per file)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploading && progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Files</p>
          <div className="rounded-md border divide-y">
            {uploadedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.name)}
                  <div>
                    <p className="font-medium text-sm truncate max-w-[240px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(file.status)}
                  {!uploading && onFileRemoved && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={() => onFileRemoved(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;