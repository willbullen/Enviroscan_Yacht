import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, File, CheckCircle, AlertCircle, X } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  onFileRemoved?: (fileIndex: number) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
  uploading?: boolean;
  progress?: number;
  uploadedFiles?: { name: string; size: number; status?: 'success' | 'error' | 'uploading' }[];
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  onFileRemoved,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png'],
    'application/pdf': ['.pdf']
  },
  className = '',
  uploading = false,
  progress = 0,
  uploadedFiles = []
}) => {
  const [fileRejections, setFileRejections] = useState<{ file: File; errors: { code: string; message: string }[] }[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
      setFileRejections(rejectedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
  });

  const handleRemoveFile = (index: number) => {
    if (onFileRemoved) {
      onFileRemoved(index);
    }
  };

  const clearRejections = () => {
    setFileRejections([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
      return <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-500">IMG</div>;
    } else if (extension === 'pdf') {
      return <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-500">PDF</div>;
    } else {
      return <File className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <UploadCloud className={`w-10 h-10 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
          <div className="mt-2">
            <p className="text-sm font-medium">{isDragActive ? 'Drop files here...' : 'Drag files here or click to browse'}</p>
            <p className="text-xs text-gray-500 mt-1">
              Upload up to {maxFiles} files (max {formatFileSize(maxSize)} each)
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" className="mt-2">
            Browse files
          </Button>
        </div>
      </div>

      {/* Error messages */}
      {fileRejections.length > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
            <div className="flex-1">
              <div className="flex justify-between">
                <h4 className="text-sm font-medium text-red-800">Some files couldn't be uploaded</h4>
                <button onClick={clearRejections} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
                {fileRejections.map((rejection, index) => (
                  <li key={index}>
                    {rejection.file.name}: {rejection.errors.map(e => e.message).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* File list */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploading && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <h4 className="text-sm font-medium">Files ({uploadedFiles.length})</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <Card key={index} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.name)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {file.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {file.status === 'uploading' && (
                    <svg
                      className="animate-spin h-5 w-5 text-primary"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-red-500"
                    onClick={() => handleRemoveFile(index)}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;