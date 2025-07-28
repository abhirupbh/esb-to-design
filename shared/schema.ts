import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  platform: text("platform"), // OSB, Boomi, Tibco, MuleSoft, etc.
  status: text("status").notNull().default("uploaded"), // uploaded, processing, parsed, error
  errorMessage: text("error_message"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // REST, SOAP, etc.
  endpoint: text("endpoint"),
  method: text("method"), // GET, POST, etc.
  description: text("description"),
  requestSchema: text("request_schema"),
  responseSchema: text("response_schema"),
  configuration: jsonb("configuration"), // Raw service configuration
});

export const proxyServices = pgTable("proxy_services", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull(),
  name: text("name").notNull(),
  serviceUri: text("service_uri"),
  endpointUri: text("endpoint_uri"),
  wsdlResource: text("wsdl_resource"),
  configuration: jsonb("configuration"),
});

export const transformations = pgTable("transformations", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // XSLT, XQuery, etc.
  sourceSchema: text("source_schema"),
  targetSchema: text("target_schema"),
  mappingConfiguration: jsonb("mapping_configuration"),
});

export const documentTemplates = pgTable("document_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sections: jsonb("sections"), // Array of section configurations
  isDefault: boolean("is_default").default(false),
});

export const generatedDocuments = pgTable("generated_documents", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  fileIds: jsonb("file_ids"), // Array of file IDs used
  configuration: jsonb("configuration"), // Generation settings
  status: text("status").notNull().default("pending"), // pending, generating, completed, error
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertProxyServiceSchema = createInsertSchema(proxyServices).omit({
  id: true,
});

export const insertTransformationSchema = createInsertSchema(transformations).omit({
  id: true,
});

export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates).omit({
  id: true,
});

export const insertGeneratedDocumentSchema = createInsertSchema(generatedDocuments).omit({
  id: true,
  generatedAt: true,
});

// Types
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type ProxyService = typeof proxyServices.$inferSelect;
export type InsertProxyService = z.infer<typeof insertProxyServiceSchema>;

export type Transformation = typeof transformations.$inferSelect;
export type InsertTransformation = z.infer<typeof insertTransformationSchema>;

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;

export type GeneratedDocument = typeof generatedDocuments.$inferSelect;
export type InsertGeneratedDocument = z.infer<typeof insertGeneratedDocumentSchema>;

// Processing status type
export type ProcessingStatus = {
  platformDetection: 'pending' | 'processing' | 'complete' | 'error';
  serviceExtraction: 'pending' | 'processing' | 'complete' | 'error';
  schemaMapping: 'pending' | 'processing' | 'complete' | 'error';
  flowDiagram: 'pending' | 'processing' | 'complete' | 'error';
  percentage: number;
};

// Unified service model for cross-platform compatibility
export type UnifiedService = {
  id?: number;
  name: string;
  type: 'REST' | 'SOAP' | 'JMS' | 'FILE';
  platform: 'OSB' | 'Boomi' | 'Tibco' | 'MuleSoft' | 'Unknown';
  endpoint?: string;
  methods?: string[];
  description?: string;
  requestSchema?: any;
  responseSchema?: any;
  transformations?: any[];
  errorHandling?: any;
  security?: any;
  routing?: any;
};
