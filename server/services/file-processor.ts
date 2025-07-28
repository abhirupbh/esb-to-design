import { parserRegistry } from "../parsers";
import { storage } from "../storage";
import { InsertService, InsertProxyService, InsertTransformation } from "@shared/schema";

export class FileProcessor {
  async processFile(fileId: number, filename: string, content: Buffer): Promise<void> {
    try {
      // Update file status to processing
      await storage.updateUploadedFile(fileId, { status: "processing" });

      // Detect platform
      const platform = await parserRegistry.detectPlatform(filename, content);
      await storage.updateUploadedFile(fileId, { platform });

      // Parse file content
      const parseResult = await parserRegistry.parseFile(filename, content);

      // Store parsed services
      for (const service of parseResult.services) {
        const insertService: InsertService = {
          fileId,
          name: service.name,
          type: service.type,
          endpoint: service.endpoint,
          method: service.methods?.join(', '),
          description: service.description,
          requestSchema: JSON.stringify(service.requestSchema),
          responseSchema: JSON.stringify(service.responseSchema),
          configuration: service as any
        };
        await storage.createService(insertService);
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

      // Store transformations
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
