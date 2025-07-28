import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileUp, AlertCircle } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { validateFileType, validateFileSize, formatFileSize } from "@/lib/file-utils";
import { useToast } from "@/hooks/use-toast";

export function FileUpload() {
  const { addFiles, startUpload, isUploading, uploadFiles, removeFile, clearAll } = useFileUpload();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          toast({
            title: "File rejected",
            description: `${file.name}: ${error.message}`,
            variant: "destructive",
          });
        });
      });
    }

    // Validate accepted files
    const validFiles = acceptedFiles.filter(file => {
      if (!validateFileType(file)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return false;
      }

      if (!validateFileSize(file)) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 100MB size limit.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      addFiles(validFiles);
    }
  }, [addFiles, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/java-archive': ['.jar'],
      'application/zip': ['.zip', '.ear'],
      'application/xml': ['.xml'],
      'application/json': ['.json'],
      'text/xml': ['.xml'],
      'text/json': ['.json']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true
  });

  const supportedPlatforms = [
    { name: "Oracle OSB", initial: "OSB", color: "bg-orange-500" },
    { name: "Boomi", initial: "B", color: "bg-blue-600" },
    { name: "Tibco", initial: "T", color: "bg-green-600" },
    { name: "MuleSoft", initial: "M", color: "bg-purple-600" }
  ];

  return (
    <Card>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Upload className="text-primary mr-3 h-5 w-5" />
          Upload ESB Project Files
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Support for OSB, Boomi, Tibco, MuleSoft, and other ESB platforms
        </p>
      </div>
      
      <CardContent className="p-6">
        {/* File Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-blue-50' 
              : 'border-gray-300 hover:border-primary hover:bg-blue-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileUp className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop files here' : 'Drop your ESB files here'}
          </h3>
          <p className="text-gray-600 mb-4">or click to browse and select files</p>
          <Button 
            type="button" 
            disabled={isUploading}
            className="bg-primary text-white hover:bg-blue-700"
          >
            Choose Files
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            Supports .jar, .ear, .zip, .xml, .json files up to 100MB
          </p>
        </div>

        {/* Supported Platforms */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Supported ESB Platforms:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {supportedPlatforms.map((platform) => (
              <div key={platform.name} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 ${platform.color} rounded flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{platform.initial}</span>
                </div>
                <span className="text-sm font-medium">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* File Type Information */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Supported File Types:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>.jar/.ear</strong> - Java archive files (OSB, Tibco)</li>
                <li><strong>.zip</strong> - Compressed project files (Boomi)</li>
                <li><strong>.xml</strong> - Configuration files (OSB, Tibco, MuleSoft)</li>
                <li><strong>.json</strong> - Configuration files (Boomi, MuleSoft)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pending Upload Files */}
        {uploadFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Ready to Upload ({uploadFiles.length})</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAll}
                disabled={isUploading}
              >
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2 mb-4">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileUp className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{uploadFile.file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(uploadFile.file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {uploadFile.status === 'uploading' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-blue-600">Uploading...</span>
                      </div>
                    )}
                    {uploadFile.status === 'error' && (
                      <span className="text-xs text-red-600">Error: {uploadFile.error}</span>
                    )}
                    {uploadFile.status === 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFile(uploadFile.id)}
                        disabled={isUploading}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={startUpload}
              disabled={isUploading || uploadFiles.length === 0}
              className="w-full bg-primary hover:bg-blue-700"
              size="lg"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Uploading Files...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {uploadFiles.length} File{uploadFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
