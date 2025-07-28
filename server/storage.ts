import { 
  uploadedFiles, 
  services, 
  proxyServices, 
  transformations, 
  documentTemplates, 
  generatedDocuments,
  type UploadedFile, 
  type InsertUploadedFile,
  type Service, 
  type InsertService,
  type ProxyService, 
  type InsertProxyService,
  type Transformation, 
  type InsertTransformation,
  type DocumentTemplate, 
  type InsertDocumentTemplate,
  type GeneratedDocument, 
  type InsertGeneratedDocument
} from "@shared/schema";

export interface IStorage {
  // Uploaded Files
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  getUploadedFile(id: number): Promise<UploadedFile | undefined>;
  getAllUploadedFiles(): Promise<UploadedFile[]>;
  updateUploadedFile(id: number, updates: Partial<UploadedFile>): Promise<UploadedFile | undefined>;
  deleteUploadedFile(id: number): Promise<boolean>;

  // Services
  createService(service: InsertService): Promise<Service>;
  getServicesByFileId(fileId: number): Promise<Service[]>;
  getAllServices(): Promise<Service[]>;
  updateService(id: number, updates: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Proxy Services
  createProxyService(proxyService: InsertProxyService): Promise<ProxyService>;
  getProxyServicesByFileId(fileId: number): Promise<ProxyService[]>;
  getAllProxyServices(): Promise<ProxyService[]>;

  // Transformations
  createTransformation(transformation: InsertTransformation): Promise<Transformation>;
  getTransformationsByFileId(fileId: number): Promise<Transformation[]>;
  getAllTransformations(): Promise<Transformation[]>;

  // Document Templates
  createDocumentTemplate(template: InsertDocumentTemplate): Promise<DocumentTemplate>;
  getAllDocumentTemplates(): Promise<DocumentTemplate[]>;
  getDefaultTemplate(): Promise<DocumentTemplate | undefined>;

  // Generated Documents
  createGeneratedDocument(document: InsertGeneratedDocument): Promise<GeneratedDocument>;
  getGeneratedDocument(id: number): Promise<GeneratedDocument | undefined>;
  updateGeneratedDocument(id: number, updates: Partial<GeneratedDocument>): Promise<GeneratedDocument | undefined>;
}

export class MemStorage implements IStorage {
  private uploadedFiles: Map<number, UploadedFile> = new Map();
  private services: Map<number, Service> = new Map();
  private proxyServices: Map<number, ProxyService> = new Map();
  private transformations: Map<number, Transformation> = new Map();
  private documentTemplates: Map<number, DocumentTemplate> = new Map();
  private generatedDocuments: Map<number, GeneratedDocument> = new Map();
  
  private currentFileId = 1;
  private currentServiceId = 1;
  private currentProxyServiceId = 1;
  private currentTransformationId = 1;
  private currentTemplateId = 1;
  private currentDocumentId = 1;

  constructor() {
    // Initialize with default templates
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    const defaultTemplate: DocumentTemplate = {
      id: this.currentTemplateId++,
      name: "Standard Service Design Document",
      description: "Comprehensive service design document with all sections",
      sections: [
        "restServiceSpecs",
        "wsdlDocumentation", 
        "requestResponseMapping",
        "flowDiagrams",
        "errorHandlingPatterns"
      ],
      isDefault: true
    };

    const enterpriseTemplate: DocumentTemplate = {
      id: this.currentTemplateId++,
      name: "Enterprise Integration Specification",
      description: "Enterprise-focused integration documentation",
      sections: [
        "restServiceSpecs",
        "wsdlDocumentation",
        "requestResponseMapping",
        "flowDiagrams",
        "umlDiagrams",
        "errorHandlingPatterns",
        "securitySpecifications"
      ],
      isDefault: false
    };

    this.documentTemplates.set(defaultTemplate.id, defaultTemplate);
    this.documentTemplates.set(enterpriseTemplate.id, enterpriseTemplate);
  }

  // Uploaded Files
  async createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile> {
    const id = this.currentFileId++;
    const uploadedFile: UploadedFile = {
      ...file,
      id,
      platform: file.platform || null,
      status: file.status || "uploaded",
      errorMessage: file.errorMessage || null,
      uploadedAt: new Date()
    };
    this.uploadedFiles.set(id, uploadedFile);
    return uploadedFile;
  }

  async getUploadedFile(id: number): Promise<UploadedFile | undefined> {
    return this.uploadedFiles.get(id);
  }

  async getAllUploadedFiles(): Promise<UploadedFile[]> {
    return Array.from(this.uploadedFiles.values());
  }

  async updateUploadedFile(id: number, updates: Partial<UploadedFile>): Promise<UploadedFile | undefined> {
    const file = this.uploadedFiles.get(id);
    if (file) {
      const updatedFile = { ...file, ...updates };
      this.uploadedFiles.set(id, updatedFile);
      return updatedFile;
    }
    return undefined;
  }

  async deleteUploadedFile(id: number): Promise<boolean> {
    return this.uploadedFiles.delete(id);
  }

  // Services
  async createService(service: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const newService: Service = { 
      ...service, 
      id,
      endpoint: service.endpoint || null,
      method: service.method || null,
      description: service.description || null,
      requestSchema: service.requestSchema || null,
      responseSchema: service.responseSchema || null,
      configuration: service.configuration || null
    };
    this.services.set(id, newService);
    return newService;
  }

  async getServicesByFileId(fileId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(service => service.fileId === fileId);
  }

  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async updateService(id: number, updates: Partial<Service>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (service) {
      const updatedService = { ...service, ...updates };
      this.services.set(id, updatedService);
      return updatedService;
    }
    return undefined;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Proxy Services
  async createProxyService(proxyService: InsertProxyService): Promise<ProxyService> {
    const id = this.currentProxyServiceId++;
    const newProxyService: ProxyService = { 
      ...proxyService, 
      id,
      serviceUri: proxyService.serviceUri || null,
      endpointUri: proxyService.endpointUri || null,
      wsdlResource: proxyService.wsdlResource || null,
      configuration: proxyService.configuration || null
    };
    this.proxyServices.set(id, newProxyService);
    return newProxyService;
  }

  async getProxyServicesByFileId(fileId: number): Promise<ProxyService[]> {
    return Array.from(this.proxyServices.values()).filter(proxy => proxy.fileId === fileId);
  }

  async getAllProxyServices(): Promise<ProxyService[]> {
    return Array.from(this.proxyServices.values());
  }

  // Transformations
  async createTransformation(transformation: InsertTransformation): Promise<Transformation> {
    const id = this.currentTransformationId++;
    const newTransformation: Transformation = { 
      ...transformation, 
      id,
      sourceSchema: transformation.sourceSchema || null,
      targetSchema: transformation.targetSchema || null,
      mappingConfiguration: transformation.mappingConfiguration || null
    };
    this.transformations.set(id, newTransformation);
    return newTransformation;
  }

  async getTransformationsByFileId(fileId: number): Promise<Transformation[]> {
    return Array.from(this.transformations.values()).filter(transform => transform.fileId === fileId);
  }

  async getAllTransformations(): Promise<Transformation[]> {
    return Array.from(this.transformations.values());
  }

  // Document Templates
  async createDocumentTemplate(template: InsertDocumentTemplate): Promise<DocumentTemplate> {
    const id = this.currentTemplateId++;
    const newTemplate: DocumentTemplate = { 
      ...template, 
      id,
      description: template.description || null,
      sections: template.sections || null,
      isDefault: template.isDefault || null
    };
    this.documentTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async getAllDocumentTemplates(): Promise<DocumentTemplate[]> {
    return Array.from(this.documentTemplates.values());
  }

  async getDefaultTemplate(): Promise<DocumentTemplate | undefined> {
    return Array.from(this.documentTemplates.values()).find(template => template.isDefault);
  }

  // Generated Documents
  async createGeneratedDocument(document: InsertGeneratedDocument): Promise<GeneratedDocument> {
    const id = this.currentDocumentId++;
    const newDocument: GeneratedDocument = {
      ...document,
      id,
      status: document.status || "pending",
      configuration: document.configuration || null,
      fileIds: document.fileIds || null,
      generatedAt: new Date()
    };
    this.generatedDocuments.set(id, newDocument);
    return newDocument;
  }

  async getGeneratedDocument(id: number): Promise<GeneratedDocument | undefined> {
    return this.generatedDocuments.get(id);
  }

  async updateGeneratedDocument(id: number, updates: Partial<GeneratedDocument>): Promise<GeneratedDocument | undefined> {
    const document = this.generatedDocuments.get(id);
    if (document) {
      const updatedDocument = { ...document, ...updates };
      this.generatedDocuments.set(id, updatedDocument);
      return updatedDocument;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
