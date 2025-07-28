import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, HelpCircle, Settings } from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import { UploadedFilesList } from "@/components/uploaded-files-list";
import { ServiceConfiguration } from "@/components/service-configuration";
import { ProcessingStatus } from "@/components/processing-status";
import { DocumentGeneration } from "@/components/document-generation";
import { ExportOptions } from "@/components/export-options";
import { FlowDiagram } from "@/components/flow-diagram";

export default function Dashboard() {
  const { data: status } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 2000,
  });

  // Determine current step based on processing status
  const getCurrentStep = () => {
    if (!status) return 1;
    const statusData = status as any;
    if (statusData.files === 0) return 1;
    if (statusData.percentage < 50) return 2;
    if (statusData.percentage < 100) return 3;
    return 4;
  };

  const currentStep = getCurrentStep();

  const processSteps = [
    { step: 1, label: "Upload Files", active: currentStep >= 1, clickable: true },
    { step: 2, label: "Parse & Extract", active: currentStep >= 2, clickable: currentStep >= 2 },
    { step: 3, label: "Generate Document", active: currentStep >= 3, clickable: currentStep >= 3 },
    { step: 4, label: "Export", active: currentStep >= 4, clickable: currentStep >= 4 }
  ];

  const handleStepClick = (step: number) => {
    // Only allow clicking on completed or current step
    if (step <= currentStep) {
      const element = document.getElementById(`step-${step}`);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <ArrowRightLeft className="text-white h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">ESB Document Converter</h1>
                <p className="text-sm text-gray-500">Transform ESB configurations to service documentation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Process Steps Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8 w-full">
              {processSteps.map((step, index) => (
                <div key={step.step} className="flex items-center space-x-3">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-all ${
                      step.active 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    } ${step.clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                    onClick={() => step.clickable && handleStepClick(step.step)}
                  >
                    {step.step}
                  </div>
                  <span 
                    className={`text-sm font-medium cursor-pointer ${
                      step.active ? 'text-primary' : 'text-gray-500'
                    }`}
                    onClick={() => step.clickable && handleStepClick(step.step)}
                  >
                    {step.label}
                  </span>
                  {index < processSteps.length - 1 && (
                    <div className="flex-1 h-px bg-gray-200 min-w-16"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-6">
            {/* File Upload Section */}
            <div id="step-1">
              <FileUpload />
            </div>

            {/* Uploaded Files List */}
            <div id="step-2">
              <UploadedFilesList />
            </div>

            {/* Service Configuration Display */}
            <ServiceConfiguration />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Processing Status */}
            <ProcessingStatus />

            {/* Document Generation */}
            <div id="step-3">
              <DocumentGeneration />
            </div>

            {/* Export Options */}
            <div id="step-4">
              <ExportOptions />
            </div>
          </div>
        </div>

        {/* Flow Diagram Preview */}
        <FlowDiagram />
      </div>
    </div>
  );
}
