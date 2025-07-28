import { parserRegistry } from "../parsers";
import { storage } from "../storage";
import { openaiService } from "./openai-service.js";
import { InsertService, InsertProxyService, InsertTransformation } from "@shared/schema";

export class FileProcessor {
  async processFile(fileId: number, filename: string, content: Buffer): Promise<void> {
    try {
      // Update file status to processing
      await storage.updateUploadedFile(fileId, { status: "processing" });

      const contentString = content.toString();

      // Use OpenAI to analyze the ESB artifact
      console.log('Analyzing ESB artifact with OpenAI...');
      const analysisResult = await openaiService.analyzeESBArtifact(contentString, filename);
      
      // Update file with detected platform from OpenAI analysis
      await storage.updateUploadedFile(fileId, { platform: analysisResult.platform });

      // Store services from OpenAI analysis
      for (const service of analysisResult.services) {
        const insertService: InsertService = {
          fileId,
          name: service.name,
          type: service.type,
          endpoint: service.endpoint,
          method: service.methods?.join(', '),
          description: service.description,
          requestSchema: JSON.stringify(service.requestSchema),
          responseSchema: JSON.stringify(service.responseSchema),
          configuration: {
            ...service,
            orchestrationSteps: service.orchestrationSteps,
            dataMapping: service.dataMapping,
            platform: analysisResult.platform,
            analysisMetadata: {
              overallArchitecture: analysisResult.overallArchitecture,
              securityPatterns: analysisResult.securityPatterns,
              errorHandling: analysisResult.errorHandling,
              integrationPoints: analysisResult.integrationPoints
            }
          }
        };
        await storage.createService(insertService);
      }

      // Store integration points as transformations
      for (const integration of analysisResult.integrationPoints) {
        const insertTransformation: InsertTransformation = {
          fileId,
          name: integration.name,
          type: integration.type,
          sourceSchema: JSON.stringify(integration.connectedSystems),
          targetSchema: integration.description,
          mappingConfiguration: {
            integrationType: integration.type,
            connectedSystems: integration.connectedSystems,
            description: integration.description
          }
        };
        await storage.createTransformation(insertTransformation);
      }

      // Also run traditional parsing as backup/validation
      try {
        const platform = await parserRegistry.detectPlatform(filename, content);
        const parseResult = await parserRegistry.parseFile(filename, content);

        // Store any additional services found by traditional parsing
        for (const service of parseResult.services) {
          // Check if service already exists (avoid duplicates)
          const existingServices = await storage.getServicesByFileId(fileId);
          const exists = existingServices.some(existing => 
            existing.name === service.name && existing.type === service.type
          );

          if (!exists) {
            const insertService: InsertService = {
              fileId,
              name: service.name,
              type: service.type,
              endpoint: service.endpoint,
              method: service.methods?.join(', '),
              description: service.description,
              requestSchema: JSON.stringify(service.requestSchema),
              responseSchema: JSON.stringify(service.responseSchema),
              configuration: { ...service, source: 'traditional_parser' }
            };
            await storage.createService(insertService);
          }
        }

        // Store proxy services
        for (const proxyService of parseResult.proxyServices) {
          const insertProxyService: InsertProxyService = {
            fileId,
            name: proxyService.name,
            serviceUri: proxyService.serviceUri,
            endpointUri: proxyService.endpointUri,
            wsdlResource: proxyService.wsdlResource,
            configuration: proxyService.configuration
          };
          await storage.createProxyService(insertProxyService);
        }

        // Store transformations from traditional parsing
        for (const transformation of parseResult.transformations) {
          const insertTransformation: InsertTransformation = {
            fileId,
            name: transformation.name,
            type: transformation.type,
            sourceSchema: transformation.sourceSchema,
            targetSchema: transformation.targetSchema,
            mappingConfiguration: transformation.mappingConfiguration
          };
          await storage.createTransformation(insertTransformation);
        }

      } catch (parserError) {
        console.warn('Traditional parser failed, but OpenAI analysis succeeded:', parserError);
      }

      // Update file status to parsed
      await storage.updateUploadedFile(fileId, { status: "parsed" });

    } catch (error) {
      // Update file status to error
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      await storage.updateUploadedFile(fileId, { 
        status: "error", 
        errorMessage 
      });
      throw error;
    }
  }

  async getProcessingStatus(fileId: number) {
    const file = await storage.getUploadedFile(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    const services = await storage.getServicesByFileId(fileId);
    const proxyServices = await storage.getProxyServicesByFileId(fileId);
    const transformations = await storage.getTransformationsByFileId(fileId);

    return {
      file,
      services,
      proxyServices,
      transformations,
      status: file.status,
      platform: file.platform
    };
  }
}

export const fileProcessor = new FileProcessor();
