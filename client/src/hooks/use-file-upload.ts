import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function useFileUpload() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await apiRequest('POST', '/api/files/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Files uploaded successfully",
        description: `${data.files.length} file(s) uploaded and processing started.`,
      });
      
      // Clear upload files
      setUploadFiles([]);
      
      // Invalidate files query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      
      // Mark all files as error
      setUploadFiles(prev => 
        prev.map(file => ({ ...file, status: 'error', error: error.message }))
      );
    },
  });

  const addFiles = useCallback((files: File[]) => {
    const newUploadFiles: UploadFile[] = files.map(file => ({
      file,
      id: `${file.name}-${Date.now()}`,
      progress: 0,
      status: 'pending'
    }));

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const startUpload = useCallback(async () => {
    if (uploadFiles.length === 0) return;

    // Mark files as uploading
    setUploadFiles(prev => 
      prev.map(file => ({ ...file, status: 'uploading' as const, progress: 0 }))
    );

    const files = uploadFiles.map(uploadFile => uploadFile.file);
    await uploadMutation.mutateAsync(files);
  }, [uploadFiles, uploadMutation]);

  const clearAll = useCallback(() => {
    setUploadFiles([]);
  }, []);

  return {
    uploadFiles,
    addFiles,
    removeFile,
    startUpload,
    clearAll,
    isUploading: uploadMutation.isPending,
  };
}
