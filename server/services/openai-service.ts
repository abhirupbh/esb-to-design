import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AnalysisResult {
  platform: 'OSB' | 'Boomi' | 'Tibco' | 'MuleSoft' | 'Unknown';
  services: ServiceInfo[];
  integrationPoints: IntegrationPoint[];
  overallArchitecture: string;
  securityPatterns: string[];
  errorHandling: string[];
}

export interface ServiceInfo {
  name: string;
  type: 'REST' | 'SOAP' | 'JMS' | 'FILE';
  endpoint?: string;
  methods?: string[];
  description?: string;
  requestSchema?: any;
  responseSchema?: any;
  orchestrationSteps?: string[];
  dataMapping?: DataMapping[];
}

export interface IntegrationPoint {
  name: string;
  type: string;
  description: string;
  connectedSystems: string[];
}

export interface DataMapping {
  source: string;
  target: string;
  transformation?: string;
  dataType: string;
}

export interface DocumentGenerationRequest {
  analysisResult: AnalysisResult;
  templateFormat: 'enterprise' | 'standard';
  includeRestSpecs: boolean;
  includeSoapSpecs: boolean;
  includeFlowDiagrams: boolean;
  includeDataMapping: boolean;
}

export class OpenAIService {
  
  async analyzeESBArtifact(fileContent: string, fileName: string): Promise<AnalysisResult> {
    try {
      const prompt = `
You are an expert Enterprise Service Bus (ESB) architect. Analyze the following ESB configuration file and extract comprehensive service information.

File: ${fileName}
Content: ${fileContent.substring(0, 50000)} // Limit content for token efficiency

Please analyze this ESB artifact and provide a detailed JSON response with the following structure:

{
  "platform": "OSB|Boomi|Tibco|MuleSoft|Unknown",
  "services": [
    {
      "name": "service name",
      "type": "REST|SOAP|JMS|FILE",
      "endpoint": "service endpoint if available",
      "methods": ["GET", "POST", etc.],
      "description": "service description",
      "requestSchema": "request schema or structure",
      "responseSchema": "response schema or structure",
      "orchestrationSteps": ["step1", "step2", ...],
      "dataMapping": [
        {
          "source": "source field/system",
          "target": "target field/system", 
          "transformation": "transformation logic",
          "dataType": "string|integer|object|etc"
        }
      ]
    }
  ],
  "integrationPoints": [
    {
      "name": "integration name",
      "type": "database|api|file|queue",
      "description": "integration description",
      "connectedSystems": ["system1", "system2"]
    }
  ],
  "overallArchitecture": "description of the overall integration architecture",
  "securityPatterns": ["OAuth", "Basic Auth", etc.],
  "errorHandling": ["retry patterns", "circuit breaker", etc.]
}

Focus on:
1. Identifying the ESB platform (OSB, Boomi, Tibco, MuleSoft)
2. Extracting all services (REST, SOAP, etc.)
3. Understanding data flows and transformations
4. Identifying integration patterns
5. Security configurations
6. Error handling mechanisms

Be thorough and accurate in your analysis.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert ESB architect. Analyze ESB configurations and extract service information in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 4000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result as AnalysisResult;

    } catch (error) {
      console.error('Error analyzing ESB artifact:', error);
      throw new Error(`Failed to analyze ESB artifact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateDesignDocument(request: DocumentGenerationRequest): Promise<string> {
    try {
      const { analysisResult, templateFormat, includeRestSpecs, includeSoapSpecs, includeFlowDiagrams, includeDataMapping } = request;
      
      const hasRestServices = analysisResult.services.some(s => s.type === 'REST');
      const hasSoapServices = analysisResult.services.some(s => s.type === 'SOAP');
      
      // Only include sections for service types that exist
      const actuallyIncludeRest = includeRestSpecs && hasRestServices;
      const actuallyIncludeSoap = includeSoapSpecs && hasSoapServices;

      const prompt = `
Generate a comprehensive Enterprise Service Design Document based on the following analysis results. 
Follow the exact format and structure provided in the template.

ANALYSIS RESULTS:
${JSON.stringify(analysisResult, null, 2)}

DOCUMENT REQUIREMENTS:
- Template Format: ${templateFormat}
- Include REST Specifications: ${actuallyIncludeRest}
- Include SOAP/WSDL Specifications: ${actuallyIncludeSoap}
- Include Flow Diagrams: ${includeFlowDiagrams}
- Include Data Mapping: ${includeDataMapping}

IMPORTANT RULES:
1. If no REST services are found, DO NOT include REST API sections
2. If no SOAP services are found, DO NOT include SOAP/WSDL sections
3. Only include sections relevant to the actual services found
4. Follow the Enterprise Service Design Document template format exactly
5. Include UML sequence diagrams in text format for orchestration flows
6. Provide detailed OpenAPI 3.0 specifications for REST services
7. Include comprehensive data mapping tables
8. Generate realistic sample requests/responses

TEMPLATE STRUCTURE TO FOLLOW:

# [Service Name] Enterprise Service Design Document

## 1. Document Control
[Version table with proper formatting]

## 2. Overview
### Purpose
[Clear purpose statement based on analysis]

### Scope
[In-scope and out-of-scope items]

### Audience
[Target audience]

### Definitions & Acronyms
[Relevant terms]

## 3. Architecture Summary
### Component Overview
[Detailed component descriptions]

### Integration Points
[System integration details]

### Assumptions
[Technical assumptions]

## 4. Service API Inventory
[Table format with API details]

## 5. API Detailed Design

${actuallyIncludeRest ? `
### 5.1 REST API Specifications
[For each REST service, include:]
- Overview with summary, owner, purpose, authentication
- Orchestration details with sequence diagrams
- Data mapping tables (request/response)
- Sample request/response
- Complete OpenAPI 3.0 specification
` : ''}

${actuallyIncludeSoap ? `
### 5.2 SOAP/WSDL Specifications  
[For each SOAP service, include:]
- WSDL overview and operations
- Message schemas
- Fault handling
- Security configurations
` : ''}

${includeDataMapping ? `
### 5.3 Data Mapping Specifications
[Comprehensive mapping tables]
` : ''}

${includeFlowDiagrams ? `
### 5.4 Flow Diagrams
[UML sequence diagrams in text format]
` : ''}

## 6. Security Specifications
[Security patterns and configurations]

## 7. Error Handling
[Error patterns and handling strategies]

Generate a complete, professional document that follows this structure exactly. 
Make it detailed and comprehensive with realistic examples.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: "You are an expert technical writer specializing in enterprise service documentation. Generate comprehensive, well-structured design documents."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });

      return response.choices[0].message.content || '';

    } catch (error) {
      console.error('Error generating design document:', error);
      throw new Error(`Failed to generate design document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateConfiguration(config: any): Promise<{ isValid: boolean; issues: string[] }> {
    try {
      const prompt = `
Validate this ESB service configuration for potential issues:

${JSON.stringify(config, null, 2)}

Check for:
1. Security vulnerabilities
2. Performance bottlenecks
3. Integration anti-patterns
4. Missing error handling
5. Data validation issues
6. Scalability concerns

Respond with JSON: { "isValid": boolean, "issues": ["issue1", "issue2", ...] }
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an ESB security and architecture expert. Validate configurations and identify potential issues."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content || '{"isValid": false, "issues": ["Analysis failed"]}');

    } catch (error) {
      console.error('Error validating configuration:', error);
      return { isValid: false, issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`] };
    }
  }
}

export const openaiService = new OpenAIService();