import { BaseParser } from "./base-parser";
import { UnifiedService } from "@shared/schema";

export class MuleSoftParser extends BaseParser {
  platform = "MuleSoft";

  canParse(filename: string, content: Buffer): boolean {
    const ext = this.extractFileExtension(filename);
    
    // Check for MuleSoft-specific file extensions
    if (['jar', 'xml', 'json'].includes(ext)) {
      return true;
    }

    // Check for MuleSoft-specific content
    if (this.isXmlContent(content)) {
      const contentStr = content.toString('utf8');
      return contentStr.includes('mule xmlns') || 
             contentStr.includes('http://www.mulesoft.org') ||
             contentStr.includes('mule-config');
    }

    if (this.isJsonContent(content)) {
      const contentStr = content.toString('utf8');
      return contentStr.includes('"muleVersion"') || 
             contentStr.includes('"flows"') ||
             contentStr.includes('"mule');
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
        await this.parseXmlContent(content, services, proxyServices, transformations);
      } else if (this.isJsonContent(content)) {
        await this.parseJsonContent(content, services, proxyServices, transformations);
      }

      return {
        services,
        proxyServices,
        transformations,
        metadata: {
          platform: 'MuleSoft',
          filename,
          parsedAt: new Date().toISOString(),
          serviceCount: services.length,
          proxyServiceCount: proxyServices.length,
          transformationCount: transformations.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse MuleSoft file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parseXmlContent(
    content: Buffer, 
    services: UnifiedService[], 
    proxyServices: any[], 
    transformations: any[]
  ): Promise<void> {
    const contentStr = content.toString('utf8');
    
    // Parse MuleSoft flows
    const flowMatches = contentStr.match(/<flow[^>]*name="([^"]*)"[^>]*>/g);
    if (flowMatches) {
      for (const match of flowMatches) {
        const nameMatch = match.match(/name="([^"]*)"/);
        if (nameMatch) {
          const flowName = nameMatch[1];
          const flowConfig = this.extractFlowConfig(contentStr, flowName);
          
          const unifiedService: UnifiedService = {
            name: flowName,
            type: this.determineServiceType(flowConfig),
            platform: 'MuleSoft',
            endpoint: flowConfig.endpoint,
            methods: flowConfig.methods,
            description: flowConfig.description,
            requestSchema: flowConfig.requestSchema,
            responseSchema: flowConfig.responseSchema
          };
          
          services.push(unifiedService);
        }
      }
    }

    // Parse HTTP listeners as proxy services
    const httpListenerMatches = contentStr.match(/<http:listener[^>]*>/g);
    if (httpListenerMatches) {
      httpListenerMatches.forEach((match, index) => {
        const pathMatch = match.match(/path="([^"]*)"/);
        const configMatch = match.match(/config-ref="([^"]*)"/);
        
        proxyServices.push({
          name: `HTTP_Listener_${index + 1}`,
          serviceUri: pathMatch ? pathMatch[1] : '/default',
          endpointUri: configMatch ? configMatch[1] : 'default-config',
          configuration: { xml: match }
        });
      });
    }

    // Parse DataWeave transformations
    const dataWeaveMatches = contentStr.match(/<dw:transform-message[^>]*>[\s\S]*?<\/dw:transform-message>/g);
    if (dataWeaveMatches) {
      dataWeaveMatches.forEach((match, index) => {
        transformations.push({
          name: `DataWeave_Transform_${index + 1}`,
          type: 'DataWeave',
          sourceSchema: 'auto-detected',
          targetSchema: 'auto-detected',
          mappingConfiguration: { dataweave: match }
        });
      });
    }
  }

  private async parseJsonContent(
    content: Buffer, 
    services: UnifiedService[], 
    proxyServices: any[], 
    transformations: any[]
  ): Promise<void> {
    const contentStr = content.toString('utf8');
    const muleConfig = JSON.parse(contentStr);
    
    // Parse flows from JSON configuration
    if (muleConfig.flows) {
      for (const flow of muleConfig.flows) {
        const unifiedService: UnifiedService = {
          name: flow.name,
          type: this.determineServiceTypeFromJson(flow),
          platform: 'MuleSoft',
          endpoint: flow.source?.path || flow.endpoint,
          methods: this.extractMethodsFromJson(flow),
          description: flow.description,
          requestSchema: flow.inputSchema,
          responseSchema: flow.outputSchema
        };
        
        services.push(unifiedService);
      }
    }

    // Parse connectors as proxy services
    if (muleConfig.connectors) {
      for (const connector of muleConfig.connectors) {
        proxyServices.push({
          name: connector.name,
          serviceUri: connector.path,
          endpointUri: connector.host,
          configuration: connector
        });
      }
    }

    // Parse transformations
    if (muleConfig.transformations) {
      for (const transform of muleConfig.transformations) {
        transformations.push({
          name: transform.name,
          type: transform.type || 'DataWeave',
          sourceSchema: transform.inputMimeType,
          targetSchema: transform.outputMimeType,
          mappingConfiguration: transform.script
        });
      }
    }
  }

  private extractFlowConfig(content: string, flowName: string): any {
    const flowRegex = new RegExp(`<flow[^>]*name="${flowName}"[\\s\\S]*?</flow>`, 'i');
    const flowMatch = content.match(flowRegex);
    
    if (!flowMatch) {
      return {};
    }

    const flowXml = flowMatch[0];
    
    return {
      endpoint: this.extractHttpListenerPath(flowXml),
      description: this.extractValue(flowXml, 'doc:description'),
      methods: this.extractHttpMethods(flowXml),
      requestSchema: this.extractValue(flowXml, 'request-type'),
      responseSchema: this.extractValue(flowXml, 'response-type')
    };
  }

  private extractHttpListenerPath(xml: string): string | undefined {
    const pathMatch = xml.match(/<http:listener[^>]*path="([^"]*)"/);
    return pathMatch ? pathMatch[1] : undefined;
  }

  private extractValue(xml: string, tagName: string): string | undefined {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private extractHttpMethods(xml: string): string[] {
    const methodsMatch = xml.match(/allowedMethods="([^"]*)"/);
    if (methodsMatch) {
      return methodsMatch[1].split(',').map(method => method.trim().toUpperCase());
    }
    return ['GET', 'POST'];
  }

  private determineServiceType(config: any): 'REST' | 'SOAP' | 'JMS' | 'FILE' {
    if (config.endpoint) {
      if (config.endpoint.includes('/api/') || config.endpoint.includes('/rest/')) {
        return 'REST';
      }
      if (config.endpoint.includes('/soap/')) {
        return 'SOAP';
      }
    }
    return 'REST';
  }

  private determineServiceTypeFromJson(flow: any): 'REST' | 'SOAP' | 'JMS' | 'FILE' {
    if (flow.source?.type === 'http') {
      return 'REST';
    }
    if (flow.source?.type === 'soap') {
      return 'SOAP';
    }
    if (flow.source?.type === 'jms') {
      return 'JMS';
    }
    if (flow.source?.type === 'file') {
      return 'FILE';
    }
    return 'REST';
  }

  private extractMethodsFromJson(flow: any): string[] {
    if (flow.source?.allowedMethods) {
      return Array.isArray(flow.source.allowedMethods) 
        ? flow.source.allowedMethods 
        : [flow.source.allowedMethods];
    }
    return ['GET', 'POST'];
  }
}
