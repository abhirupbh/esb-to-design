import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Globe, 
  Share2, 
  Shuffle, 
  Edit,
  ExternalLink
} from "lucide-react";
import type { Service, ProxyService, Transformation } from "@shared/schema";

export function ServiceConfiguration() {
  const [activeTab, setActiveTab] = useState("services");

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  const { data: proxyServices = [] } = useQuery<ProxyService[]>({
    queryKey: ['/api/proxy-services'],
  });

  const { data: transformations = [] } = useQuery<Transformation[]>({
    queryKey: ['/api/transformations'],
  });

  const getServiceTypeBadge = (type: string) => {
    const variants = {
      'REST': 'default',
      'SOAP': 'secondary',
      'JMS': 'outline',
      'FILE': 'outline'
    };
    
    const colors = {
      'REST': 'bg-green-100 text-green-800',
      'SOAP': 'bg-orange-100 text-orange-800',
      'JMS': 'bg-purple-100 text-purple-800',
      'FILE': 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      'GET': 'bg-blue-100 text-blue-800',
      'POST': 'bg-green-100 text-green-800',
      'PUT': 'bg-yellow-100 text-yellow-800',
      'DELETE': 'bg-red-100 text-red-800',
      'PATCH': 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {method}
      </span>
    );
  };

  const handleViewDetails = (serviceId: number) => {
    // TODO: Implement service details modal
    console.log('View service details:', serviceId);
  };

  const handleEditService = (serviceId: number) => {
    // TODO: Implement service editing
    console.log('Edit service:', serviceId);
  };

  return (
    <Card>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-gray-200">
          <TabsList className="h-auto p-0 bg-transparent space-x-8 px-6">
            <TabsTrigger 
              value="services" 
              className="py-4 px-1 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary font-medium text-sm rounded-none bg-transparent"
            >
              Services 
              <Badge variant="secondary" className="ml-1">
                {services.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="proxies" 
              className="py-4 px-1 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary font-medium text-sm rounded-none bg-transparent"
            >
              Proxy Services 
              <Badge variant="secondary" className="ml-1">
                {proxyServices.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="transformations" 
              className="py-4 px-1 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary font-medium text-sm rounded-none bg-transparent"
            >
              Transformations 
              <Badge variant="secondary" className="ml-1">
                {transformations.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-6">
          <TabsContent value="services" className="mt-0">
            <div className="space-y-4">
              {services.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No services found</h4>
                  <p className="text-sm text-gray-600">Upload and parse ESB files to see extracted services.</p>
                </div>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          {getServiceTypeBadge(service.type)}
                          {service.method && service.method.split(',').map(method => (
                            <span key={method.trim()}>
                              {getMethodBadge(method.trim())}
                            </span>
                          ))}
                        </div>
                        {service.endpoint && (
                          <p className="text-sm text-gray-600 mb-2 flex items-center">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {service.endpoint}
                          </p>
                        )}
                        {service.description && (
                          <p className="text-sm text-gray-500 mb-3">{service.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(service.id)}
                          className="text-primary hover:text-blue-700"
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditService(service.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {(service.requestSchema || service.responseSchema) && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {service.requestSchema && (
                          <div>
                            <span className="text-gray-500">Request Schema:</span>
                            <span className="ml-2 text-gray-900 font-mono text-xs">
                              {service.requestSchema.length > 50 
                                ? service.requestSchema.substring(0, 50) + '...' 
                                : service.requestSchema}
                            </span>
                          </div>
                        )}
                        {service.responseSchema && (
                          <div>
                            <span className="text-gray-500">Response Schema:</span>
                            <span className="ml-2 text-gray-900 font-mono text-xs">
                              {service.responseSchema.length > 50 
                                ? service.responseSchema.substring(0, 50) + '...' 
                                : service.responseSchema}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="proxies" className="mt-0">
            <div className="space-y-4">
              {proxyServices.length === 0 ? (
                <div className="text-center py-8">
                  <Share2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No proxy services found</h4>
                  <p className="text-sm text-gray-600">Upload ESB configuration files to see proxy services.</p>
                </div>
              ) : (
                proxyServices.map((proxy) => (
                  <div key={proxy.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{proxy.name}</h4>
                        <div className="space-y-1 text-sm">
                          {proxy.serviceUri && (
                            <div>
                              <span className="text-gray-500">Service URI:</span>
                              <span className="ml-2 text-gray-900 font-mono">{proxy.serviceUri}</span>
                            </div>
                          )}
                          {proxy.endpointUri && (
                            <div>
                              <span className="text-gray-500">Endpoint URI:</span>
                              <span className="ml-2 text-gray-900 font-mono">{proxy.endpointUri}</span>
                            </div>
                          )}
                          {proxy.wsdlResource && (
                            <div>
                              <span className="text-gray-500">WSDL Resource:</span>
                              <span className="ml-2 text-gray-900 font-mono">{proxy.wsdlResource}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary hover:text-blue-700"
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="transformations" className="mt-0">
            <div className="space-y-4">
              {transformations.length === 0 ? (
                <div className="text-center py-8">
                  <Shuffle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No transformations found</h4>
                  <p className="text-sm text-gray-600">Parse ESB files to discover transformation mappings.</p>
                </div>
              ) : (
                transformations.map((transform) => (
                  <div key={transform.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{transform.name}</h4>
                          <Badge variant="outline">{transform.type}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {transform.sourceSchema && (
                            <div>
                              <span className="text-gray-500">Source Schema:</span>
                              <span className="ml-2 text-gray-900">{transform.sourceSchema}</span>
                            </div>
                          )}
                          {transform.targetSchema && (
                            <div>
                              <span className="text-gray-500">Target Schema:</span>
                              <span className="ml-2 text-gray-900">{transform.targetSchema}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary hover:text-blue-700"
                        >
                          View Mapping
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
