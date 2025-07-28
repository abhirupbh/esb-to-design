import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { fileProcessor } from "./services/file-processor";
import { documentGenerator } from "./services/document-generator";
import { insertUploadedFileSchema, insertGeneratedDocumentSchema } from "@shared/schema";

// Calculate processing progress
function calculateProgress(files: any[], services: any[], proxyServices: any[], transformations: any[]): number {
  if (files.length === 0) return 0;
  
  let progress = 0;
  
  // Platform detection (25%)
  if (files.length > 0 && files.every(f => f.platform)) progress += 25;
  
  // Service extraction (25%) 
  if (files.length > 0 && files.every(f => f.status === 'parsed')) progress += 25;
  
  // Schema mapping (25%)
  if (services.length > 0) progress += 25;
  
  // Flow diagram generation (25%)
  if (services.length > 0) progress += 25;
  
  return progress;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept specific file types
    const allowedTypes = ['.jar', '.ear', '.zip', '.xml', '.json'];
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported`));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // File upload endpoint
  app.post('/api/files/upload', upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const uploadedFiles = [];

      for (const file of req.files) {
        // Validate and create file record
        const fileData = insertUploadedFileSchema.parse({
          filename: file.filename || `${Date.now()}_${file.originalname}`,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          status: 'uploaded'
        });

        const uploadedFile = await storage.createUploadedFile(fileData);
        uploadedFiles.push(uploadedFile);

        // Process file asynchronously
        fileProcessor.processFile(uploadedFile.id, file.originalname, file.buffer)
          .catch(error => {
            console.error(`Error processing file ${file.originalname}:`, error);
          });
      }

      res.json({ 
        message: 'Files uploaded successfully',
        files: uploadedFiles 
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all uploaded files
  app.get('/api/files', async (req, res) => {
    try {
      const files = await storage.getAllUploadedFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch files',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get file details with parsed data
  app.get('/api/files/:id', async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const fileDetails = await fileProcessor.getProcessingStatus(fileId);
      res.json(fileDetails);
    } catch (error) {
      res.status(404).json({ 
        message: 'File not found',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete uploaded file
  app.delete('/api/files/:id', async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const deleted = await storage.deleteUploadedFile(fileId);
      
      if (deleted) {
        res.json({ message: 'File deleted successfully' });
      } else {
        res.status(404).json({ message: 'File not found' });
      }
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to delete file',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all services
  app.get('/api/services', async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch services',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get services by file ID
  app.get('/api/files/:id/services', async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const services = await storage.getServicesByFileId(fileId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch services',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all proxy services
  app.get('/api/proxy-services', async (req, res) => {
    try {
      const proxyServices = await storage.getAllProxyServices();
      res.json(proxyServices);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch proxy services',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get proxy services by file ID
  app.get('/api/files/:id/proxy-services', async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const proxyServices = await storage.getProxyServicesByFileId(fileId);
      res.json(proxyServices);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch proxy services',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all transformations
  app.get('/api/transformations', async (req, res) => {
    try {
      const transformations = await storage.getAllTransformations();
      res.json(transformations);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch transformations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get transformations by file ID
  app.get('/api/files/:id/transformations', async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const transformations = await storage.getTransformationsByFileId(fileId);
      res.json(transformations);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch transformations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get document templates
  app.get('/api/templates', async (req, res) => {
    try {
      const templates = await storage.getAllDocumentTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch templates',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate document with AI
  app.post('/api/documents/generate', async (req, res) => {
    try {
      const { templateId, fileIds, configuration } = req.body;
      
      if (!templateId || !fileIds || !Array.isArray(fileIds)) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const document = await documentGenerator.generateDocument(
        templateId, 
        fileIds, 
        configuration
      );

      res.json(document);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to generate document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // AI-powered document generation
  app.post('/api/ai/generate-document', async (req, res) => {
    try {
      const { fileIds, includeFlowDiagrams, includeDataMapping } = req.body;
      
      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({ message: 'File IDs are required' });
      }

      const files = await Promise.all(fileIds.map(id => storage.getUploadedFile(id)));
      const services = await storage.getServices();
      const transformations = await storage.getTransformations();

      const content = await documentGenerator.generateAIDocument(fileIds, {
        files: files.filter(Boolean),
        services,
        transformations,
        includeFlowDiagrams,
        includeDataMapping,
      });

      res.json({ 
        content,
        type: 'markdown',
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating AI document:', error);
      res.status(500).json({ 
        message: 'Failed to generate AI document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Export document
  app.get('/api/documents/:id/export/:format', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const format = req.params.format as 'pdf' | 'html' | 'word' | 'json';
      
      if (!['pdf', 'html', 'word', 'json'].includes(format)) {
        return res.status(400).json({ message: 'Invalid export format' });
      }

      const exportBuffer = await documentGenerator.exportDocument(documentId, format);
      
      // Set appropriate headers based on format
      const contentTypes = {
        pdf: 'application/pdf',
        html: 'text/html',
        word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        json: 'application/json'
      };

      const extensions = {
        pdf: 'pdf',
        html: 'html',
        word: 'docx',
        json: 'json'
      };

      res.setHeader('Content-Type', contentTypes[format]);
      res.setHeader('Content-Disposition', `attachment; filename="service-design-document.${extensions[format]}"`);
      res.send(exportBuffer);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to export document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get processing status for all files
  app.get('/api/status', async (req, res) => {
    try {
      const files = await storage.getAllUploadedFiles();
      const services = await storage.getAllServices();
      const proxyServices = await storage.getAllProxyServices();
      const transformations = await storage.getAllTransformations();

      const status = {
        files: files.length,
        services: services.length,
        proxyServices: proxyServices.length,
        transformations: transformations.length,
        platformDetection: files.length === 0 ? 'pending' : files.every(f => f.platform) ? 'complete' : 'processing',
        serviceExtraction: files.length === 0 ? 'pending' : files.every(f => f.status === 'parsed') ? 'complete' : 'processing',
        schemaMapping: services.length > 0 ? 'complete' : 'pending',
        flowDiagram: services.length > 0 ? 'complete' : 'pending',
        percentage: calculateProgress(files, services, proxyServices, transformations)
      };

      res.json(status);
    } catch (error) {
      console.error('Status endpoint error:', error);
      res.status(500).json({ 
        message: 'Failed to get status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
