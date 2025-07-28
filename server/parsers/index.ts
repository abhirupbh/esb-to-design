import { BaseParser } from "./base-parser";
import { OSBParser } from "./osb-parser";
import { BoomiParser } from "./boomi-parser";
import { TibcoParser } from "./tibco-parser";
import { MuleSoftParser } from "./mulesoft-parser";

export class ParserRegistry {
  private parsers: BaseParser[] = [
    new OSBParser(),
    new BoomiParser(),
    new TibcoParser(),
    new MuleSoftParser()
  ];

  async detectPlatform(filename: string, content: Buffer): Promise<string> {
    for (const parser of this.parsers) {
      if (parser.canParse(filename, content)) {
        return parser.platform;
      }
    }
    return "Unknown";
  }

  async parseFile(filename: string, content: Buffer) {
    for (const parser of this.parsers) {
      if (parser.canParse(filename, content)) {
        return await parser.parse(filename, content);
      }
    }
    
    throw new Error(`No parser found for file: ${filename}`);
  }

  getSupportedPlatforms(): string[] {
    return this.parsers.map(parser => parser.platform);
  }
}

export const parserRegistry = new ParserRegistry();
