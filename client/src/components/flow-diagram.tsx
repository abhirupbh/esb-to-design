import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GitBranch, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Eye,
  Download
} from "lucide-react";
import type { Service, ProxyService, Transformation } from "@shared/schema";

export function FlowDiagram() {
  const [zoomLevel, setZoomLevel] = useState(100);

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  const { data: proxyServices = [] } = useQuery<ProxyService[]>({
    queryKey: ['/api/proxy-services'],
  });

  const { data: transformations = [] } = useQuery<Transformation[]>({
    queryKey: ['/api/transformations'],
  });

  const hasData = services.length > 0 || proxyServices.length > 0 || transformations.length > 0;

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleFitToScreen = () => {
    setZoomLevel(100);
  };

  const generateMermaidDiagram = () => {
    if (!hasData) return '';

    let diagram = 'graph TD\n';
    
    // Add services
    services.forEach((service, index) => {
      const nodeId = `S${index}`;
      diagram += `  ${nodeId}[${service.name}]\n`;
      diagram += `  ${nodeId} --> |${service.type}| API[API Gateway]\n`;
    });

    // Add proxy services
    proxyServices.forEach((proxy, index) => {
      const nodeId = `P${index}`;
      diagram += `  ${nodeId}[${proxy.name}]\n`;
      diagram += `  ${nodeId} --> Backend[Backend Services]\n`;
    });

    // Add transformations
    transformations.forEach((transform, index) => {
      const nodeId = `T${index}`;
      diagram += `  ${nodeId}[${transform.name}]\n`;
      diagram += `  Input --> ${nodeId}\n`;
      diagram += `  ${nodeId} --> Output\n`;
    });

    return diagram;
  };

  return (
    <div className="mt-8">
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <GitBranch className="text-primary mr-3 h-5 w-5" />
              Integration Flow Diagram
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
              >
                <ZoomOut className="h-4 w-4 mr-1" />
                Zoom Out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
              >
                <ZoomIn className="h-4 w-4 mr-1" />
                Zoom In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFitToScreen}
              >
                <Maximize className="h-4 w-4 mr-1" />
                Fit to Screen
              </Button>
              {hasData && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div 
            className="bg-gray-50 rounded-lg p-8 text-center min-h-96 flex items-center justify-center overflow-auto"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
          >
            {!hasData ? (
              <div className="text-gray-500">
                <GitBranch className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h4 className="text-lg font-medium mb-2">Flow Diagram Preview</h4>
                <p className="text-sm">Upload and process ESB files to generate interactive flow diagrams</p>
                <p className="text-xs mt-2">Diagrams will show service interactions, message routing, and transformation patterns</p>
              </div>
            ) : (
              <div className="w-full h-full">
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    Integration Flow Overview
                  </h4>
                  
                  {/* Simple visual representation */}
                  <div className="space-y-4">
                    {services.length > 0 && (
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h5 className="font-medium text-sm text-gray-900">Services ({services.length})</h5>
                        <div className="mt-2 space-y-1">
                          {services.slice(0, 3).map((service, index) => (
                            <div key={index} className="text-xs text-gray-600 flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                              {service.name} ({service.type})
                            </div>
                          ))}
                          {services.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{services.length - 3} more services
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {proxyServices.length > 0 && (
                      <div className="border-l-4 border-green-500 pl-4">
                        <h5 className="font-medium text-sm text-gray-900">Proxy Services ({proxyServices.length})</h5>
                        <div className="mt-2 space-y-1">
                          {proxyServices.slice(0, 3).map((proxy, index) => (
                            <div key={index} className="text-xs text-gray-600 flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              {proxy.name}
                            </div>
                          ))}
                          {proxyServices.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{proxyServices.length - 3} more proxies
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {transformations.length > 0 && (
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h5 className="font-medium text-sm text-gray-900">Transformations ({transformations.length})</h5>
                        <div className="mt-2 space-y-1">
                          {transformations.slice(0, 3).map((transform, index) => (
                            <div key={index} className="text-xs text-gray-600 flex items-center">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                              {transform.name} ({transform.type})
                            </div>
                          ))}
                          {transformations.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{transformations.length - 3} more transformations
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <p className="text-xs text-blue-800">
                        Interactive flow diagrams with detailed service relationships will be generated here.
                        This preview shows the discovered components from your ESB configurations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {hasData && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Zoom: {zoomLevel}% | Services: {services.length} | Proxies: {proxyServices.length} | Transformations: {transformations.length}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
