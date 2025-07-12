import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatFileSize, isValidFileType, getFileTypeLabel } from '@/lib/utils';
import { useUploadProgress, useChatStore } from '@/stores/chat';
import { api } from '@/services/api';

interface DocumentUploadProps {
  onUploadComplete?: (response: any) => void;
  className?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadComplete, className }) => {
  const uploadProgress = useUploadProgress();
  const { addUploadProgress, updateUploadProgress, removeUploadProgress } = useChatStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (!isValidFileType(file)) {
        console.error(`Invalid file type: ${file.type}`);
        continue;
      }

      // Add to upload progress
      addUploadProgress({
        file,
        progress: 0,
        status: 'uploading',
      });

      try {
        const response = await api.uploadDocument(file, (progress) => {
          updateUploadProgress(file.name, { progress });
        });

        updateUploadProgress(file.name, { 
          progress: 100, 
          status: 'completed' 
        });

        onUploadComplete?.(response);

        // Remove from progress after a delay
        setTimeout(() => {
          removeUploadProgress(file.name);
        }, 2000);
      } catch (error) {
        console.error('Upload failed:', error);
        updateUploadProgress(file.name, { 
          status: 'error', 
          error: 'Upload failed' 
        });
      }
    }
  }, [addUploadProgress, updateUploadProgress, removeUploadProgress, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeUpload = (fileName: string) => {
    removeUploadProgress(fileName);
  };

  return (
    <div className={cn('w-full', className)}>
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop files here' : 'Upload documents'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOCX, and TXT files up to 10MB
            </p>
          </div>

          {uploadProgress.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm">Upload Progress</h4>
              {uploadProgress.map((item) => (
                <div
                  key={item.file.name}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(item.file.size)} • {getFileTypeLabel(item.file.type)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'uploading' && (
                      <div className="w-16 bg-muted-foreground/20 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.status === 'completed' && (
                      <span className="text-xs text-green-600 font-medium">Completed</span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-xs text-red-600 font-medium">Error</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUpload(item.file.name)}
                      className="h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
