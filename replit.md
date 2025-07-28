# ESB Document Converter

## Overview

This is a full-stack web application that converts Enterprise Service Bus (ESB) configurations from various platforms (Oracle OSB, Boomi, Tibco, MuleSoft) into comprehensive service documentation. The system parses uploaded configuration files, extracts service definitions, and generates formatted documentation with REST specifications, WSDL documentation, flow diagrams, and more.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **File Handling**: React Dropzone for drag-and-drop file uploads
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **File Processing**: Multer for multipart file uploads with memory storage
- **Architecture Pattern**: Service layer pattern with parser registry for extensible platform support

## Key Components

### File Processing System
- **Parser Registry**: Extensible system supporting multiple ESB platforms
- **Platform Parsers**: Dedicated parsers for OSB, Boomi, Tibco, and MuleSoft
- **Service Extraction**: Converts platform-specific configurations to unified service definitions
- **Async Processing**: Background file processing with status tracking

### Database Schema
- **uploaded_files**: Tracks uploaded files with processing status and metadata
- **services**: Stores extracted REST/SOAP service definitions
- **proxy_services**: Manages proxy service configurations
- **transformations**: Handles data transformation mappings
- **document_templates**: Template definitions for generated documentation
- **generated_documents**: Tracks document generation jobs and results

### Document Generation
- **Template System**: Configurable document templates for different output formats
- **Section Generation**: Modular approach to generate specific documentation sections
- **Export Formats**: Support for PDF, HTML, Word, and Excel exports
- **Flow Diagrams**: Automatic generation of service flow visualizations

## Data Flow

1. **File Upload**: Users drag/drop or select ESB configuration files
2. **Platform Detection**: System identifies the ESB platform (OSB, Boomi, etc.)
3. **Parsing**: Platform-specific parser extracts services, transformations, and configurations
4. **Storage**: Parsed data is stored in normalized database schema
5. **Configuration**: Users can review and configure extracted services
6. **Generation**: Document generator creates comprehensive documentation
7. **Export**: Final documents are available in multiple formats

## External Dependencies

### Production Dependencies
- **Database**: Neon PostgreSQL serverless database (@neondatabase/serverless)
- **ORM**: Drizzle ORM with Zod validation for type safety
- **File Processing**: Multer for handling multipart uploads
- **Session Management**: PostgreSQL-backed sessions (connect-pg-simple)
- **Validation**: Zod schemas for data validation throughout the stack

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Fast bundling for production server code
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Replit Configuration
- **Modules**: Node.js 20, Web server, PostgreSQL 16
- **Development**: `npm run dev` starts both frontend and backend
- **Production Build**: Vite builds frontend, ESBuild bundles backend
- **Port Configuration**: Server runs on port 5000, exposed on port 80
- **Auto-scaling**: Configured for Replit's autoscale deployment target

### Environment Requirements
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)

### Build Process
1. Frontend build: Vite compiles React app to static files
2. Backend build: ESBuild bundles server with external dependencies
3. Static serving: Express serves frontend assets in production
4. Database migrations: Drizzle handles schema synchronization

## Changelog

```
Changelog:
- June 19, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```