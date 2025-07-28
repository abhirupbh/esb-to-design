import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Wand2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DocumentTemplate, UploadedFile } from "@shared/schema";

export function DocumentGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [includeSections, setIncludeSections] = useState({
    restServiceSpecs: true,
    wsdlDocumentation: true,
    requestResponseMapping: true,
    flowDiagrams: true,
    umlDiagrams: false,
    errorHandlingPatterns: true,
  });

  const { data: templates = [] } = useQuery<DocumentTemplate[]>({
    queryKey: ['/api/templates'],
  });

  const { data: files = [] } = useQuery<UploadedFile[]>({
    queryKey: ['/api/files'],
  });

  const { data: status } = useQuery({
    queryKey: ['/api/status'],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) {
        throw new Error("Please select a document template");
      }

      const parsedFiles = files.filter(file => file.status === 'parsed');
      if (parsedFiles.length === 0) {
        throw new Error("No parsed files available for document generation");
      }

      const response = await apiRequest('POST', '/api/documents/generate', {
        templateId: selectedTemplate,
        fileIds: parsedFiles.map(file => file.id),
        configuration: {
          includeSections,
          timestamp: new Date().toISOString(),
        }
      });

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Document generated successfully",
        description: "Your service design document is ready for export.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sectionOptions = [
    { id: 'restServiceSpecs', label: 'REST Service Specifications', checked: includeSections.restServiceSpecs },
    { id: 'wsdlDocumentation', label: 'WSDL Documentation', checked: includeSections.wsdlDocumentation },
    { id: 'requestResponseMapping', label: 'Request/Response Mapping', checked: includeSections.requestResponseMapping },
    { id: 'flowDiagrams', label: 'Flow Diagrams', checked: includeSections.flowDiagrams },
    { id: 'umlDiagrams', label: 'UML Diagrams', checked: includeSections.umlDiagrams },
    { id: 'errorHandlingPatterns', label: 'Error Handling Patterns', checked: includeSections.errorHandlingPatterns },
  ];

  const canGenerate = selectedTemplate && files.some(file => file.status === 'parsed') && status?.percentage >= 50;

  const handleSectionChange = (sectionId: string, checked: boolean) => {
    setIncludeSections(prev => ({
      ...prev,
      [sectionId]: checked
    }));
  };

  const handleGenerate = async () => {
    await generateMutation.mutateAsync();
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="text-primary mr-3 h-5 w-5" />
          Document Generation
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Document Template
            </Label>
            <Select value={selectedTemplate?.toString() || ""} onValueChange={(value) => setSelectedTemplate(parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id.toString()}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-xs text-gray-500 mt-1">
                {templates.find(t => t.id === selectedTemplate)?.description}
              </p>
            )}
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Include Sections
            </Label>
            <div className="space-y-2">
              {sectionOptions.map((section) => (
                <div key={section.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={section.id}
                    checked={section.checked}
                    onCheckedChange={(checked) => handleSectionChange(section.id, checked as boolean)}
                  />
                  <Label htmlFor={section.id} className="text-sm text-gray-700 cursor-pointer">
                    {section.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={handleGenerate}
            disabled={!canGenerate || generateMutation.isPending}
            className="w-full bg-primary text-white hover:bg-blue-700"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {generateMutation.isPending ? "Generating..." : "Generate Document"}
          </Button>

          {!canGenerate && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p>Document generation requirements:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Select a document template</li>
                <li>At least one file must be successfully parsed</li>
                <li>Processing must be at least 50% complete</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
