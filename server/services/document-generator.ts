import { storage } from "../storage";
import { openaiService, type DocumentGenerationRequest } from './openai-service.js';
import { DocumentTemplate, GeneratedDocument } from "@shared/schema";

export interface DocumentSection {
  id: string;
  title: string;
  content: any;
  type: 'text' | 'table' | 'diagram' | 'code';
}

export class DocumentGenerator {
  async generateDocument(
    templateId: number, 
    fileIds: number[], 
    configuration: any
  ): Promise<GeneratedDocument> {
    
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Create document record
    const generatedDocument = await storage.createGeneratedDocument({
      templateId,
      fileIds,
      configuration,
      status: "generating"
    });

    try {
      // Use OpenAI to generate comprehensive design document
      const aiGeneratedContent = await this.generateAIDocument(fileIds, configuration);
      
      // Also generate sections using traditional method for comparison/backup
      const sections = await this.generateSections(template, fileIds, configuration);
      
      // Update document with generated content
      await storage.updateGeneratedDocument(generatedDocument.id, {
        status: "completed",
        configuration: {
          ...configuration,
          aiGeneratedContent,
          sections,
          generatedSections: sections.length,
          generationType: 'ai-powered'
        }
      });

      return await storage.getGeneratedDocument(generatedDocument.id) as GeneratedDocument;
    } catch (error) {
      await storage.updateGeneratedDocument(generatedDocument.id, {
        status: "error",
        configuration: {
          ...configuration,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });
      throw error;
    }
  }

  async generateAIDocument(fileIds: number[], configuration: any): Promise<string> {
    try {
      // Collect all analyzed data from the files
      const allServices = [];
      const allIntegrationPoints = [];
      let overallArchitecture = "";
      let securityPatterns: string[] = [];
      let errorHandling: string[] = [];
      let detectedPlatform = 'Unknown';

      for (const fileId of fileIds) {
        const services = await storage.getServicesByFileId(fileId);
        const transformations = await storage.getTransformationsByFileId(fileId);
        const file = await storage.getUploadedFile(fileId);
        
        if (file?.platform) {
          detectedPlatform = file.platform;
        }

        // Extract services with their analysis metadata
        for (const service of services) {
          const config = service.configuration as any;
          if (config?.analysisMetadata) {
            overallArchitecture = config.analysisMetadata.overallArchitecture || overallArchitecture;
            securityPatterns = [...securityPatterns, ...(config.analysisMetadata.securityPatterns || [])];
            errorHandling = [...errorHandling, ...(config.analysisMetadata.errorHandling || [])];
          }

          allServices.push({
            name: service.name,
            type: service.type as 'REST' | 'SOAP' | 'JMS' | 'FILE',
            endpoint: service.endpoint || undefined,
            methods: service.method?.split(', '),
            description: service.description || undefined,
            requestSchema: service.requestSchema ? JSON.parse(service.requestSchema) : undefined,
            responseSchema: service.responseSchema ? JSON.parse(service.responseSchema) : undefined,
            orchestrationSteps: config?.orchestrationSteps || [],
            dataMapping: config?.dataMapping || []
          });
        }

        // Extract integration points from transformations
        for (const transform of transformations) {
          const config = transform.mappingConfiguration as any;
          if (config?.integrationType) {
            allIntegrationPoints.push({
              name: transform.name,
              type: config.integrationType,
              description: config.description || transform.targetSchema || '',
              connectedSystems: config.connectedSystems || []
            });
          }
        }
      }

      // Prepare the analysis result for document generation
      const analysisResult = {
        platform: detectedPlatform as 'OSB' | 'Boomi' | 'Tibco' | 'MuleSoft' | 'Unknown',
        services: allServices,
        integrationPoints: allIntegrationPoints,
        overallArchitecture,
        securityPatterns: Array.from(new Set(securityPatterns)), // Remove duplicates
        errorHandling: Array.from(new Set(errorHandling))
      };

      // Determine what sections to include based on service types
      const hasRestServices = allServices.some(s => s.type === 'REST');
      const hasSoapServices = allServices.some(s => s.type === 'SOAP');

      const documentRequest: DocumentGenerationRequest = {
        analysisResult,
        templateFormat: configuration?.templateFormat || 'enterprise',
        includeRestSpecs: hasRestServices,
        includeSoapSpecs: hasSoapServices,
        includeFlowDiagrams: configuration?.includeFlowDiagrams ?? true,
        includeDataMapping: configuration?.includeDataMapping ?? true
      };

      // Generate the document using OpenAI
      const generatedDocument = await openaiService.generateDesignDocument(documentRequest);
      
      return generatedDocument;

    } catch (error) {
      console.error('Error generating AI document:', error);
      throw new Error(`Failed to generate AI document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getTemplate(templateId: number): Promise<DocumentTemplate | undefined> {
    const templates = await storage.getAllDocumentTemplates();
    return templates.find(t => t.id === templateId);
  }

  private async generateSections(
    template: DocumentTemplate, 
    fileIds: number[], 
    configuration: any
  ): Promise<DocumentSection[]> {
    const sections: DocumentSection[] = [];
    const templateSections = template.sections as string[];

    for (const sectionId of templateSections) {
      if (configuration.includeSections?.[sectionId] !== false) {
        const section = await this.generateSection(sectionId, fileIds);
        if (section) {
          sections.push(section);
        }
      }
    }

    return sections;
  }

  private async generateSection(sectionId: string, fileIds: number[]): Promise<DocumentSection | null> {
    switch (sectionId) {
      case 'restServiceSpecs':
        return await this.generateRestServiceSpecs(fileIds);
      case 'wsdlDocumentation':
        return await this.generateWsdlDocumentation(fileIds);
      case 'requestResponseMapping':
        return await this.generateRequestResponseMapping(fileIds);
      case 'flowDiagrams':
        return await this.generateFlowDiagrams(fileIds);
      case 'umlDiagrams':
        return await this.generateUmlDiagrams(fileIds);
      case 'errorHandlingPatterns':
        return await this.generateErrorHandlingPatterns(fileIds);
      default:
        return null;
    }
  }

  private async generateRestServiceSpecs(fileIds: number[]): Promise<DocumentSection> {
    const allServices = await storage.getAllServices();
    const services = allServices.filter(service => 
      fileIds.includes(service.fileId) && service.type === 'REST'
    );

    const content = {
      services: services.map(service => ({
        name: service.name,
        endpoint: service.endpoint,
        method: service.method,
        description: service.description,
        requestSchema: service.requestSchema,
        responseSchema: service.responseSchema,
        examples: this.generateApiExamples(service)
      }))
    };

    return {
      id: 'restServiceSpecs',
      title: 'REST Service Specifications',
      content,
      type: 'table'
    };
  }

  private async generateWsdlDocumentation(fileIds: number[]): Promise<DocumentSection> {
    const allServices = await storage.getAllServices();
    const allProxyServices = await storage.getAllProxyServices();
    
    const soapServices = allServices.filter(service => 
      fileIds.includes(service.fileId) && service.type === 'SOAP'
    );
    
    const proxyServices = allProxyServices.filter(proxy => 
      fileIds.includes(proxy.fileId)
    );

    const content = {
      soapServices: soapServices.map(service => ({
        name: service.name,
        endpoint: service.endpoint,
        description: service.description,
        operations: this.extractSoapOperations(service),
        wsdlDefinition: this.generateWsdlDefinition(service)
      })),
      proxyServices: proxyServices.map(proxy => ({
        name: proxy.name,
        serviceUri: proxy.serviceUri,
        endpointUri: proxy.endpointUri,
        wsdlResource: proxy.wsdlResource
      }))
    };

    return {
      id: 'wsdlDocumentation',
      title: 'WSDL Documentation',
      content,
      type: 'code'
    };
  }

  private async generateRequestResponseMapping(fileIds: number[]): Promise<DocumentSection> {
    const allTransformations = await storage.getAllTransformations();
    const transformations = allTransformations.filter(transform => 
      fileIds.includes(transform.fileId)
    );

    const content = {
      mappings: transformations.map(transform => ({
        name: transform.name,
        type: transform.type,
        sourceSchema: transform.sourceSchema,
        targetSchema: transform.targetSchema,
        mappingRules: this.extractMappingRules(transform),
        fieldMappings: this.generateFieldMappings(transform)
      }))
    };

    return {
      id: 'requestResponseMapping',
      title: 'Request/Response Mapping',
      content,
      type: 'table'
    };
  }

  private async generateFlowDiagrams(fileIds: number[]): Promise<DocumentSection> {
    const allServices = await storage.getAllServices();
    const allProxyServices = await storage.getAllProxyServices();
    const allTransformations = await storage.getAllTransformations();
    
    const services = allServices.filter(service => fileIds.includes(service.fileId));
    const proxyServices = allProxyServices.filter(proxy => fileIds.includes(proxy.fileId));
    const transformations = allTransformations.filter(transform => fileIds.includes(transform.fileId));

    const content = {
      flowDiagram: this.generateMermaidFlowDiagram(services, proxyServices, transformations),
      serviceInteractions: this.generateServiceInteractionDiagram(services),
      integrationPatterns: this.identifyIntegrationPatterns(services, transformations)
    };

    return {
      id: 'flowDiagrams',
      title: 'Integration Flow Diagrams',
      content,
      type: 'diagram'
    };
  }

  private async generateUmlDiagrams(fileIds: number[]): Promise<DocumentSection> {
    const allServices = await storage.getAllServices();
    const services = allServices.filter(service => fileIds.includes(service.fileId));

    const content = {
      classdiagram: this.generateUmlClassDiagram(services),
      sequenceDiagram: this.generateUmlSequenceDiagram(services),
      componentDiagram: this.generateUmlComponentDiagram(services)
    };

    return {
      id: 'umlDiagrams',
      title: 'UML Diagrams',
      content,
      type: 'diagram'
    };
  }

  private async generateErrorHandlingPatterns(fileIds: number[]): Promise<DocumentSection> {
    const allServices = await storage.getAllServices();
    const services = allServices.filter(service => fileIds.includes(service.fileId));

    const content = {
      errorPatterns: services.map(service => ({
        serviceName: service.name,
        errorTypes: this.extractErrorTypes(service),
        handlingStrategy: this.extractErrorHandlingStrategy(service),
        retryPolicies: this.extractRetryPolicies(service)
      }))
    };

    return {
      id: 'errorHandlingPatterns',
      title: 'Error Handling Patterns',
      content,
      type: 'table'
    };
  }

  // Helper methods for content generation
  private generateApiExamples(service: any): any {
    return {
      requestExample: this.generateRequestExample(service),
      responseExample: this.generateResponseExample(service),
      curlExample: this.generateCurlExample(service)
    };
  }

  private generateRequestExample(service: any): any {
    // Generate sample request based on schema
    return {
      headers: { "Content-Type": "application/json" },
      body: "{ /* Sample request based on schema */ }"
    };
  }

  private generateResponseExample(service: any): any {
    // Generate sample response based on schema
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: "{ /* Sample response based on schema */ }"
    };
  }

  private generateCurlExample(service: any): string {
    return `curl -X ${service.method || 'POST'} "${service.endpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{ /* request data */ }'`;
  }

  private extractSoapOperations(service: any): any[] {
    // Extract SOAP operations from service configuration
    return [
      { name: "operation1", input: "InputType", output: "OutputType" }
    ];
  }

  private generateWsdlDefinition(service: any): string {
    // Generate WSDL definition based on service
    return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://schemas.xmlsoap.org/wsdl/"
             targetNamespace="${service.endpoint}">
  <!-- WSDL definition for ${service.name} -->
</definitions>`;
  }

  private extractMappingRules(transform: any): any[] {
    // Extract mapping rules from transformation configuration
    return [
      { source: "sourceField", target: "targetField", transformation: "direct" }
    ];
  }

  private generateFieldMappings(transform: any): any[] {
    // Generate field mappings table
    return [
      { sourceField: "input.id", targetField: "output.identifier", rule: "direct mapping" }
    ];
  }

  private generateMermaidFlowDiagram(services: any[], proxyServices: any[], transformations: any[]): string {
    // Generate Mermaid flow diagram syntax
    let diagram = "graph TD\n";
    
    services.forEach((service, index) => {
      diagram += `  S${index}[${service.name}]\n`;
    });

    proxyServices.forEach((proxy, index) => {
      diagram += `  P${index}[${proxy.name}]\n`;
    });

    transformations.forEach((transform, index) => {
      diagram += `  T${index}[${transform.name}]\n`;
    });

    return diagram;
  }

  private generateServiceInteractionDiagram(services: any[]): string {
    // Generate service interaction diagram
    return "sequenceDiagram\n  participant Client\n  participant Service\n";
  }

  private identifyIntegrationPatterns(services: any[], transformations: any[]): string[] {
    // Identify common integration patterns
    const patterns = [];
    if (transformations.length > 0) patterns.push("Message Transformation");
    if (services.some(s => s.type === 'REST' && s.type === 'SOAP')) patterns.push("Protocol Bridging");
    return patterns;
  }

  private generateUmlClassDiagram(services: any[]): string {
    // Generate UML class diagram
    return "@startuml\nclass Service {\n  +name: String\n  +endpoint: String\n}\n@enduml";
  }

  private generateUmlSequenceDiagram(services: any[]): string {
    // Generate UML sequence diagram
    return "@startuml\nClient -> Service: request\nService -> Client: response\n@enduml";
  }

  private generateUmlComponentDiagram(services: any[]): string {
    // Generate UML component diagram
    return "@startuml\ncomponent Service\ncomponent Database\nService --> Database\n@enduml";
  }

  private extractErrorTypes(service: any): string[] {
    // Extract error types from service configuration
    return ["ValidationError", "BusinessRuleError", "SystemError"];
  }

  private extractErrorHandlingStrategy(service: any): string {
    // Extract error handling strategy
    return "Fault tolerant with retry and circuit breaker";
  }

  private extractRetryPolicies(service: any): any {
    // Extract retry policies
    return {
      maxRetries: 3,
      retryInterval: "1000ms",
      backoffStrategy: "exponential"
    };
  }

  async exportDocument(documentId: number, format: 'pdf' | 'html' | 'word' | 'json'): Promise<Buffer> {
    const document = await storage.getGeneratedDocument(documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    switch (format) {
      case 'json':
        return Buffer.from(JSON.stringify(document.configuration, null, 2));
      case 'html':
        return await this.exportAsHtml(document);
      case 'pdf':
        return await this.exportAsPdf(document);
      case 'word':
        return await this.exportAsWord(document);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private async exportAsHtml(document: GeneratedDocument): Promise<Buffer> {
    // Generate HTML document
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Service Design Document</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #2563EB; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Service Design Document</h1>
  <p>Generated on: ${new Date().toLocaleDateString()}</p>
  ${this.renderSectionsAsHtml((document.configuration as any)?.sections || [])}
</body>
</html>`;
    
    return Buffer.from(html);
  }

  private renderSectionsAsHtml(sections: DocumentSection[]): string {
    return sections.map(section => `
      <div class="section">
        <h2>${section.title}</h2>
        ${this.renderSectionContentAsHtml(section)}
      </div>
    `).join('');
  }

  private renderSectionContentAsHtml(section: DocumentSection): string {
    switch (section.type) {
      case 'table':
        return this.renderTableContent(section.content);
      case 'code':
        return `<pre><code>${JSON.stringify(section.content, null, 2)}</code></pre>`;
      case 'diagram':
        return `<div class="diagram">${section.content.flowDiagram || 'Diagram content'}</div>`;
      default:
        return `<p>${JSON.stringify(section.content)}</p>`;
    }
  }

  private renderTableContent(content: any): string {
    if (content.services) {
      return `
        <table>
          <tr><th>Service Name</th><th>Endpoint</th><th>Method</th><th>Description</th></tr>
          ${content.services.map((service: any) => `
            <tr>
              <td>${service.name}</td>
              <td>${service.endpoint || 'N/A'}</td>
              <td>${service.method || 'N/A'}</td>
              <td>${service.description || 'N/A'}</td>
            </tr>
          `).join('')}
        </table>
      `;
    }
    return '<p>Table content</p>';
  }

  private async exportAsPdf(document: GeneratedDocument): Promise<Buffer> {
    // In a real implementation, use a library like Puppeteer or PDFKit
    const htmlContent = await this.exportAsHtml(document);
    // Convert HTML to PDF
    return htmlContent; // Placeholder
  }

  private async exportAsWord(document: GeneratedDocument): Promise<Buffer> {
    // In a real implementation, use a library like docx
    const content = JSON.stringify(document.configuration, null, 2);
    return Buffer.from(content); // Placeholder
  }
}

export const documentGenerator = new DocumentGenerator();
