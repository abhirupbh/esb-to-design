import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  Activity
} from "lucide-react";
import type { ProcessingStatus } from "@shared/schema";

interface StatusResponse extends ProcessingStatus {
  files: number;
  services: number;
  proxyServices: number;
  transformations: number;
}

export function ProcessingStatus() {
  const { data: status } = useQuery<StatusResponse>({
    queryKey: ['/api/status'],
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'processing':
        return 'In Progress';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'text-green-600';
      case 'processing':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const processingSteps = [
    {
      key: 'platformDetection',
      label: 'Platform Detection',
      status: status.platformDetection
    },
    {
      key: 'serviceExtraction',
      label: 'Service Extraction', 
      status: status.serviceExtraction
    },
    {
      key: 'schemaMapping',
      label: 'Schema Mapping',
      status: status.schemaMapping
    },
    {
      key: 'flowDiagram',
      label: 'Flow Diagram',
      status: status.flowDiagram
    }
  ];

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="text-primary mr-3 h-5 w-5" />
          Processing Status
        </h3>
        
        <div className="space-y-4">
          {processingSteps.map((step) => (
            <div key={step.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{step.label}</span>
              <div className={`flex items-center text-sm ${getStatusColor(step.status)}`}>
                {getStatusIcon(step.status)}
                <span className="ml-1">{getStatusText(step.status)}</span>
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span>{status.percentage}%</span>
            </div>
            <Progress value={status.percentage} className="h-2" />
          </div>

          {/* Summary Statistics */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Extraction Summary</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-600">Files</span>
                <Badge variant="secondary">{status.files}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-600">Services</span>
                <Badge variant="secondary">{status.services}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-600">Proxies</span>
                <Badge variant="secondary">{status.proxyServices}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-600">Transforms</span>
                <Badge variant="secondary">{status.transformations}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
