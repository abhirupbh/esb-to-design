import { BaseParser } from "./base-parser";
import { UnifiedService } from "@shared/schema";

export class OSBParser extends BaseParser {
  platform = "OSB";

  canParse(filename: string, content: Buffer): boolean {
    const ext = this.extractFileExtension(filename);
    
    // Check for OSB-specific file extensions
    if (['ear', 'jar'].includes(ext)) {
      return true;
    }

    // Check for OSB-specific XML content
    if (ext === 'xml' && this.isXmlContent(content)) {
      const contentStr = content.toString('utf8');
      return contentStr.includes('xmlns:osb') || 
             contentStr.includes('proxy-service') ||
             contentStr.includes('business-service');
    }

    return false;
  }

  async parse(filename: string, content: Buffer): Promise<{
    services: UnifiedService[];
    proxyServices: any[];
    transformations: any[];
    metadata: any;
  }> {
    const services: UnifiedService[] = [];
    const proxyServices: any[] = [];
    const transformations: any[] = [];
    
    try {
      if (this.isXmlContent(content)) {
        const contentStr = content.toString('utf8');
        
        // Parse proxy services
        const proxyMatches = contentStr.match(/<proxy-service[^>]*name="([^"]*)"[^>]*>/g);
        if (proxyMatches) {
          for (const match of proxyMatches) {
            const nameMatch = match.match(/name="([^"]*)"/);
            if (nameMatch) {
              const serviceName = nameMatch[1];
              
              // Extract service details from XML
              const serviceConfig = this.extractServiceConfig(contentStr, serviceName);
              
              const unifiedService: UnifiedService = {
                name: serviceName,
                type: serviceConfig.type || 'SOAP',
                platform: 'OSB',
                endpoint: serviceConfig.endpoint,
                methods: serviceConfig.methods,
                description: serviceConfig.description,
                requestSchema: serviceConfig.requestSchema,
                responseSchema: serviceConfig.responseSchema
              };
              
              services.push(unifiedService);
              
              proxyServices.push({
                name: serviceName,
                serviceUri: serviceConfig.serviceUri,
                endpointUri: serviceConfig.endpointUri,
                wsdlResource: serviceConfig.wsdlResource,
                configuration: serviceConfig
              });
            }
          }
        }

        // Parse transformations
        const xsltMatches = contentStr.match(/<xsl:stylesheet[^>]*>/g);
        if (xsltMatches) {
          xsltMatches.forEach((match, index) => {
            transformations.push({
              name: `XSLT_Transform_${index + 1}`,
              type: 'XSLT',
              sourceSchema: 'auto-detected',
              targetSchema: 'auto-detected',
              mappingConfiguration: { xslt: match }
            });
          });
        }
      }

      return {
        services,
        proxyServices,
        transformations,
        metadata: {
          platform: 'OSB',
          filename,
          parsedAt: new Date().toISOString(),
          serviceCount: services.length,
          proxyServiceCount: proxyServices.length,
          transformationCount: transformations.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse OSB file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractServiceConfig(content: string, serviceName: string): any {
    // Extract service configuration from XML
    const serviceRegex = new RegExp(`<proxy-service[^>]*name="${serviceName}"[\\s\\S]*?</proxy-service>`, 'i');
    const serviceMatch = content.match(serviceRegex);
    
    if (!serviceMatch) {
      return {};
    }

    const serviceXml = serviceMatch[0];
    
    return {
      type: serviceXml.includes('rest-') ? 'REST' : 'SOAP',
      endpoint: this.extractValue(serviceXml, 'endpoint-uri') || this.extractValue(serviceXml, 'uri'),
      serviceUri: this.extractValue(serviceXml, 'service-uri'),
      endpointUri: this.extractValue(serviceXml, 'endpoint-uri'),
      wsdlResource: this.extractValue(serviceXml, 'wsdl-resource'),
      description: this.extractValue(serviceXml, 'description'),
      methods: serviceXml.includes('rest-') ? this.extractRestMethods(serviceXml) : ['POST'],
      requestSchema: this.extractValue(serviceXml, 'request-type'),
      responseSchema: this.extractValue(serviceXml, 'response-type')
    };
  }

  private extractValue(xml: string, tagName: string): string | undefined {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private extractRestMethods(xml: string): string[] {
    const methods: string[] = [];
    const methodMatches = xml.match(/<http:method>([^<]*)<\/http:method>/gi);
    
    if (methodMatches) {
      methodMatches.forEach(match => {
        const method = match.match(/>([^<]*)</)?.[1];
        if (method) {
          methods.push(method.toUpperCase());
        }
      });
    }
    
    return methods.length > 0 ? methods : ['GET', 'POST'];
  }
}
