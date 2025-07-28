import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FileText, 
  Code, 
  FileImage, 
  FileSpreadsheet,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GeneratedDocument } from "@shared/schema";

export function ExportOptions() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // For demo purposes, we'll check if there are any completed documents
  // In a real app, you'd have a documents list endpoint
  const { data: status } = useQuery({
    queryKey: ['/api/status'],
  });

  const hasGeneratedDocument = status && status.services > 0 && status.percentage >= 75;

  const exportOptions = [
    {
      format: 'pdf',
      label: 'Export as PDF',
      icon: FileText,
      color: 'text-red-600',
      description: 'Formatted document for printing and sharing'
    },
    {
      format: 'html',
      label: 'Export as HTML',
      icon: Code,
      color: 'text-blue-600',
      description: 'Interactive web document'
    },
    {
      format: 'word',
      label: 'Export as Word',
      icon: FileImage,
      color: 'text-blue-700',
      description: 'Microsoft Word document for editing'
    },
    {
      format: 'json',
      label: 'Export Raw Data (JSON)',
      icon: FileSpreadsheet,
      color: 'text-green-600',
      description: 'Structured data for further processing'
    }
  ];

  const handleExport = async (format: string) => {
    if (!hasGeneratedDocument) {
      toast({
        title: "No document available",
        description: "Generate a document first before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(format);
    
    try {
      // In a real implementation, you would:
      // 1. Get the latest generated document ID
      // 2. Call the export endpoint
      // 3. Handle the file download
      
      // For now, simulate the export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Export started",
        description: `Document export in ${format.toUpperCase()} format will begin shortly.`,
      });

      // Simulate file download
      const link = document.createElement('a');
      link.href = `/api/documents/1/export/${format}`;
      link.download = `service-design-document.${format === 'word' ? 'docx' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Download className="text-primary mr-3 h-5 w-5" />
          Export Options
        </h3>
        
        <div className="space-y-3">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.format}
                variant="outline"
                className="w-full justify-start h-auto p-3"
                disabled={!hasGeneratedDocument || isExporting === option.format}
                onClick={() => handleExport(option.format)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <Icon className={`h-5 w-5 ${option.color}`} />
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">
                      {isExporting === option.format ? 'Exporting...' : option.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600">
              Export options will be enabled after document generation is complete.
              {!hasGeneratedDocument && " Please generate a document first."}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
