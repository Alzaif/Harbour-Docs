export interface OdtConversionResult {
  html: string;
  mediaDir: string;
}

export interface DocumentConverterPort {
  convertOdtToHtml(buffer: Buffer, workDir: string): Promise<OdtConversionResult>;
}
