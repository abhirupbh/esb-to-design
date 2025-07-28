import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  List, 
  Eye, 
  Trash2, 
  FileArchive, 
  FileCode, 
  File, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Loader2
} from "lucide-react";
import { formatFileSize, getPlatformColor, getPlatformInitial } from "@/lib/file-utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UploadedFile } from "@shared/schema";

export function UploadedFilesList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery<UploadedFile[]>({
    queryKey: ['/api/files'],
    refetchInterval: 2000, // Poll every 2 seconds for status updates
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest('DELETE', `/api/files/${fileId}`);
    },
    onSuccess: () => {
      toast({
        title: "File deleted",
        description: "File has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jar':
      case 'ear':
        return <FileArchive className="text-blue-600 h-5 w-5" />;
      case 'xml':
        return <FileCode className="text-green-600 h-5 w-5" />;
      case 'json':
        return <File className="text-purple-600 h-5 w-5" />;
      default:
        return <File className="text-gray-600 h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string, errorMessage?: string) => {
    switch (status) {
      case 'uploaded':
        return (
          <Badge variant="outline" className="text-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            Uploaded
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="text-yellow-600">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'parsed':
        return (
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Parsed
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const handleViewDetails = (fileId: number) => {
    // TODO: Implement file details modal or navigate to details page
    console.log('View details for file:', fileId);
  };

  const handleDeleteFile = async (fileId: number) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      await deleteMutation.mutateAsync(fileId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading files...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <List className="text-primary mr-3 h-5 w-5" />
          Uploaded Files
          <Badge variant="secondary" className="ml-2">
            {files.length}
          </Badge>
        </h3>
      </div>
      
      <CardContent className="p-0">
        {files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-medium mb-2">No files uploaded yet</h4>
            <p className="text-sm">Upload ESB project files to get started with document generation.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {getFileIcon(file.originalName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {file.originalName}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span>{formatFileSize(file.size)}</span>
                      {file.platform && (
                        <span className="flex items-center">
                          <div className={`w-2 h-2 ${getPlatformColor(file.platform)} rounded-full mr-1`}></div>
                          {file.platform}
                        </span>
                      )}
                      {getStatusBadge(file.status, file.errorMessage)}
                    </div>
                    {file.errorMessage && (
                      <p className="text-xs text-red-600 mt-1 truncate">
                        {file.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(file.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id)}
                    disabled={deleteMutation.isPending}
                    className="text-gray-400 hover:text-red-600"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
