import { BaseParser } from "./base-parser";
import { UnifiedService } from "@shared/schema";

export class BoomiParser extends BaseParser {
  platform = "Boomi";

  canParse(filename: string, content: Buffer): boolean {
    const ext = this.extractFileExtension(filename);
    
    // Check for Boomi-specific file extensions
    if (['zip', 'json'].includes(ext)) {
      return true;
    }

    // Check for Boomi-specific JSON content
    if (ext === 'json' && this.isJsonContent(content)) {
      const contentStr = content.toString('utf8');
      return contentStr.includes('"componentType"') || 
             contentStr.includes('"processId"') ||
             contentStr.includes('"boomi');
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
      if (this.isJsonContent(content)) {
        const contentStr = content.toString('utf8');
        const boomiConfig = JSON.parse(contentStr);
        
        // Parse Boomi processes as services
        if (boomiConfig.processes) {
          for (const process of boomiConfig.processes) {
            const unifiedService: UnifiedService = {
              name: process.name || process.processId,
              type: this.determineServiceType(process),
              platform: 'Boomi',
              endpoint: process.endpoint,
              methods: this.extractMethods(process),
              description: process.description,
              requestSchema: process.inputSchema,
              responseSchema: process.outputSchema
            };
            
            services.push(unifiedService);
          }
        }

        // Parse Boomi connectors as proxy services
        if (boomiConfig.connectors) {
          for (const connector of boomiConfig.connectors) {
            proxyServices.push({
              name: connector.name,
              serviceUri: connector.serviceUri,
              endpointUri: connector.endpointUri,
              configuration: connector
            });
          }
        }

        // Parse Boomi maps as transformations
        if (boomiConfig.maps) {
          for (const map of boomiConfig.maps) {
            transformations.push({
              name: map.name,
              type: 'Boomi Map',
              sourceSchema: map.sourceProfile,
              targetSchema: map.targetProfile,
              mappingConfiguration: map.mappingRules
            });
          }
        }
      }

      return {
        services,
        proxyServices,
        transformations,
        metadata: {
          platform: 'Boomi',
          filename,
          parsedAt: new Date().toISOString(),
          serviceCount: services.length,
          proxyServiceCount: proxyServices.length,
          transformationCount: transformations.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse Boomi file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private determineServiceType(process: any): 'REST' | 'SOAP' | 'JMS' | 'FILE' {
    if (process.connectorType) {
      switch (process.connectorType.toLowerCase()) {
        case 'http':
        case 'rest':
          return 'REST';
        case 'soap':
        case 'web service':
          return 'SOAP';
        case 'jms':
          return 'JMS';
        case 'file':
        case 'ftp':
        case 'sftp':
          return 'FILE';
        default:
          return 'REST';
      }
    }
    return 'REST';
  }

  private extractMethods(process: any): string[] {
    if (process.httpMethods) {
      return Array.isArray(process.httpMethods) ? process.httpMethods : [process.httpMethods];
    }
    if (process.operations) {
      return process.operations.map((op: any) => op.method || 'POST');
    }
    return ['POST'];
  }
}
