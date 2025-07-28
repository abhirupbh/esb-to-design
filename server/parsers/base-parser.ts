import { UnifiedService } from "@shared/schema";

export abstract class BaseParser {
  abstract platform: string;
  
  abstract canParse(filename: string, content: Buffer): boolean;
  abstract parse(filename: string, content: Buffer): Promise<{
    services: UnifiedService[];
    proxyServices: any[];
    transformations: any[];
    metadata: any;
  }>;

  protected extractFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  protected isXmlContent(content: Buffer): boolean {
    const contentStr = content.toString('utf8', 0, Math.min(1000, content.length));
    return contentStr.trim().startsWith('<?xml') || contentStr.includes('<');
  }

  protected isJsonContent(content: Buffer): boolean {
    try {
      const contentStr = content.toString('utf8');
      JSON.parse(contentStr);
      return true;
    } catch {
      return false;
    }
  }

  protected parseXml(content: string): any {
    // Basic XML parsing - in production, use a proper XML parser
    const parser = new DOMParser();
    return parser.parseFromString(content, 'text/xml');
  }
}
