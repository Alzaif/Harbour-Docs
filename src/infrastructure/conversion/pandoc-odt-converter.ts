import { execFile as execFileCb } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { DocumentConverterPort, OdtConversionResult } from '../../domain/ports/document-converter.port.js';

const execFile = promisify(execFileCb);

export interface PandocOdtConverterOptions {
  pandocPath: string;
  execFileFn?: typeof execFile;
}

export class PandocOdtConverter implements DocumentConverterPort {
  private readonly pandocPath: string;
  private readonly execFileFn: typeof execFile;

  constructor(options: PandocOdtConverterOptions) {
    this.pandocPath = options.pandocPath;
    this.execFileFn = options.execFileFn ?? execFile;
  }

  async convertOdtToHtml(buffer: Buffer, workDir: string): Promise<OdtConversionResult> {
    const inputPath = join(workDir, 'input.odt');
    const mediaDir = join(workDir, 'media');
    await mkdir(workDir, { recursive: true });
    await writeFile(inputPath, buffer);

    const { stdout } = await this.execFileFn(
      this.pandocPath,
      [inputPath, '-t', 'html', '--standalone', `--extract-media=${mediaDir}`],
      { maxBuffer: 20 * 1024 * 1024 },
    );

    return { html: stdout, mediaDir };
  }
}
