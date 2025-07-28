import { BaseParser } from "./base-parser";
import { UnifiedService } from "@shared/schema";

export class TibcoParser extends BaseParser {
  platform = "Tibco";

  canParse(filename: string, content: Buffer): boolean {
    const ext = this.extractFileExtension(filename);
    
    // Check for Tibco-specific file extensions
    if (['ear', 'xml', 'process'].includes(ext)) {
      return true;
    }

    // Check for Tibco-specific XML content
    if (this.isXmlContent(content)) {
      const contentStr = content.toString('utf8');
      return contentStr.includes('xmlns:tibco') || 
             contentStr.includes('pd:ProcessDefinition') ||
             contentStr.includes('tibco.plugin');
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
        
        // Parse Tibco process definitions
        const processMatches = contentStr.match(/<pd:ProcessDefinition[^>]*name="([^"]*)"[^>]*>/g);
        if (processMatches) {
          for (const match of processMatches) {
            const nameMatch = match.match(/name="([^"]*)"/);
            if (nameMatch) {
              const processName = nameMatch[1];
              const processConfig = this.extractProcessConfig(contentStr, processName);
              
              const unifiedService: UnifiedService = {
                name: processName,
                type: this.determineServiceType(processConfig),
                platform: 'Tibco',
                endpoint: processConfig.endpoint,
                methods: processConfig.methods,
                description: processConfig.description,
                requestSchema: processConfig.requestSchema,
                responseSchema: processConfig.responseSchema
              };
              
              services.push(unifiedService);
            }
          }
        }

        // Parse Tibco HTTP receivers as proxy services
        const httpReceiverMatches = contentStr.match(/<pd:activity[^>]*name="HTTP Receiver"[^>]*>/g);
        if (httpReceiverMatches) {
          httpReceiverMatches.forEach((match, index) => {
            proxyServices.push({
              name: `HTTP_Receiver_${index + 1}`,
              serviceUri: this.extractHttpReceiverConfig(contentStr, match),
              configuration: { type: 'HTTP Receiver', xml: match }
            });
          });
        }

        // Parse Tibco mappers as transformations
        const mapperMatches = contentStr.match(/<pd:activity[^>]*type="com\.tibco\.plugin\.mapper\.MapperActivity"[^>]*>/g);
        if (mapperMatches) {
          mapperMatches.forEach((match, index) => {
            transformations.push({
              name: `Mapper_${index + 1}`,
              type: 'Tibco Mapper',
              sourceSchema: 'auto-detected',
              targetSchema: 'auto-detected',
              mappingConfiguration: { xml: match }
            });
          });
        }
      }

      return {
        services,
        proxyServices,
        transformations,
        metadata: {
          platform: 'Tibco',
          filename,
          parsedAt: new Date().toISOString(),
          serviceCount: services.length,
          proxyServiceCount: proxyServices.length,
          transformationCount: transformations.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse Tibco file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractProcessConfig(content: string, processName: string): any {
    const processRegex = new RegExp(`<pd:ProcessDefinition[^>]*name="${processName}"[\\s\\S]*?</pd:ProcessDefinition>`, 'i');
    const processMatch = content.match(processRegex);
    
    if (!processMatch) {
      return {};
    }

    const processXml = processMatch[0];
    
    return {
      endpoint: this.extractValue(processXml, 'endpoint') || this.extractHttpReceiverPath(processXml),
      description: this.extractValue(processXml, 'description'),
      methods: this.extractHttpMethods(processXml),
      requestSchema: this.extractValue(processXml, 'inputSchema'),
      responseSchema: this.extractValue(processXml, 'outputSchema')
    };
  }

  private determineServiceType(config: any): 'REST' | 'SOAP' | 'JMS' | 'FILE' {
    if (config.endpoint) {
      if (config.endpoint.includes('/rest/') || config.endpoint.includes('/api/')) {
        return 'REST';
      }
      if (config.endpoint.includes('/soap/') || config.endpoint.includes('wsdl')) {
        return 'SOAP';
      }
    }
    return 'REST';
  }

  private extractValue(xml: string, tagName: string): string | undefined {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private extractHttpReceiverPath(xml: string): string | undefined {
    const pathMatch = xml.match(/<config[^>]*>[\s\S]*?<value>([^<]*)<\/value>[\s\S]*?<\/config>/);
    return pathMatch ? pathMatch[1] : undefined;
  }

  private extractHttpReceiverConfig(content: string, match: string): string {
    // Extract HTTP receiver configuration
    const configMatch = content.indexOf(match);
    if (configMatch !== -1) {
      const configSection = content.substring(configMatch, configMatch + 1000);
      const pathMatch = configSection.match(/<value>([^<]*)<\/value>/);
      return pathMatch ? pathMatch[1] : '/default-path';
    }
    return '/default-path';
  }

  private extractHttpMethods(xml: string): string[] {
    // Look for HTTP method configurations
    const methodMatches = xml.match(/<method>([^<]*)<\/method>/gi);
    if (methodMatches) {
      return methodMatches.map(match => {
        const method = match.match(/>([^<]*)</)?.[1];
        return method ? method.toUpperCase() : 'POST';
      });
    }
    return ['GET', 'POST'];
  }
}
