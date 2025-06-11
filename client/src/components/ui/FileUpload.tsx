import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, AlertTriangle, CheckCircle, Loader2, Image, FileText, Box } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { Badge } from './badge';
import { Alert, AlertDescription } from './alert';

export interface FileUploadProps {
  category: 'drawings' | 'documents' | 'issue-photos' | '3d-models';
  onUpload?: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  metadata?: Record<string, any>;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  url: string;
  thumbnailPath?: string;
  uploadedAt: string;
  metadata?: Record<string, any>;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  result?: UploadedFile;
}

const FILE_TYPE_CONFIG = {
  'drawings': {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['.dwg', '.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.svg'],
    icon: FileText,
    description: 'Technical drawings, plans, and blueprints'
  },
  'documents': {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
    icon: FileText,
    description: 'Documents, specifications, and reports'
  },
  'issue-photos': {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['.jpg', '.jpeg', '.png', '.webp'],
    icon: Image,
    description: 'Photos documenting issues and defects'
  },
  '3d-models': {
    maxSize: 200 * 1024 * 1024, // 200MB
    allowedTypes: ['.obj', '.fbx', '.dae', '.gltf', '.glb', '.3ds', '.ply'],
    icon: Box,
    description: '3D models, scans, and CAD files'
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileName: string, category: string) => {
  const extension = fileName.toLowerCase().split('.').pop();
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
    return Image;
  }
  
  // Use category-specific icon as fallback
  return FILE_TYPE_CONFIG[category as keyof typeof FILE_TYPE_CONFIG]?.icon || File;
};

const FileUpload: React.FC<FileUploadProps> = ({
  category,
  onUpload,
  onError,
  multiple = false,
  maxFiles = 10,
  disabled = false,
  className = '',
  metadata = {}
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = FILE_TYPE_CONFIG[category];

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > config.maxSize) {
      return `File size exceeds limit of ${formatFileSize(config.maxSize)}`;
    }

    // Check file type
    const extension = '.' + file.name.toLowerCase().split('.').pop();
    if (!config.allowedTypes.includes(extension)) {
      return `File type ${extension} not allowed. Allowed types: ${config.allowedTypes.join(', ')}`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (Object.keys(metadata).length > 0) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(`/api/upload/${category}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return response.json();
  };

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return;

    const filesArray = Array.from(files);
    
    // Check file count limit
    if (!multiple && filesArray.length > 1) {
      onError?.('Only one file can be uploaded at a time');
      return;
    }

    if (uploadingFiles.length + filesArray.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of filesArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      onError?.(errors.join('\n'));
      return;
    }

    // Create uploading file entries
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload files
    const uploadedFiles: UploadedFile[] = [];

    for (const uploadingFile of newUploadingFiles) {
      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => prev.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, progress: Math.min(f.progress + Math.random() * 30, 90) }
              : f
          ));
        }, 200);

        const result = await uploadFile(uploadingFile.file);
        
        clearInterval(progressInterval);
        
        setUploadingFiles(prev => prev.map(f => 
          f.id === uploadingFile.id 
            ? { ...f, progress: 100, status: 'completed', result }
            : f
        ));

        uploadedFiles.push(result);
      } catch (error) {
        setUploadingFiles(prev => prev.map(f => 
          f.id === uploadingFile.id 
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        ));
      }
    }

    if (uploadedFiles.length > 0) {
      onUpload?.(uploadedFiles);
    }
  }, [category, disabled, maxFiles, multiple, onError, onUpload, uploadingFiles.length, metadata]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setUploadingFiles(prev => prev.filter(f => f.status === 'uploading'));
  };

  const IconComponent = config.icon;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!disabled ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={config.allowedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <IconComponent className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragOver ? 'Drop files here' : 'Upload files'}
        </p>
        
        <p className="text-sm text-gray-500 mb-4">
          {config.description}
        </p>
        
        <div className="text-xs text-gray-400 space-y-1">
          <p>Supported formats: {config.allowedTypes.join(', ')}</p>
          <p>Maximum file size: {formatFileSize(config.maxSize)}</p>
          {multiple && <p>Maximum {maxFiles} files</p>}
        </div>
        
        <Button 
          variant="outline" 
          className="mt-4"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Files
        </Button>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {multiple ? 'Uploading Files' : 'Uploading File'}
            </h4>
            {uploadingFiles.some(f => f.status === 'completed') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
                className="text-xs"
              >
                Clear Completed
              </Button>
            )}
          </div>
          
          {uploadingFiles.map((uploadingFile) => {
            const FileIcon = getFileIcon(uploadingFile.file.name, category);
            
            return (
              <div
                key={uploadingFile.id}
                className="flex items-center space-x-3 p-3 border rounded-lg"
              >
                <FileIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadingFile.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {uploadingFile.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                      {uploadingFile.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {uploadingFile.status === 'error' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(uploadingFile.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatFileSize(uploadingFile.file.size)}</span>
                    {uploadingFile.status === 'uploading' && (
                      <span>{Math.round(uploadingFile.progress)}%</span>
                    )}
                    {uploadingFile.status === 'completed' && (
                      <Badge variant="secondary" className="text-xs">
                        Uploaded
                      </Badge>
                    )}
                    {uploadingFile.status === 'error' && (
                      <Badge variant="destructive" className="text-xs">
                        Failed
                      </Badge>
                    )}
                  </div>
                  
                  {uploadingFile.status === 'uploading' && (
                    <Progress value={uploadingFile.progress} className="mt-2 h-1" />
                  )}
                  
                  {uploadingFile.status === 'error' && uploadingFile.error && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {uploadingFile.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 