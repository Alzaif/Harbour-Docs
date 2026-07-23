import { describe, expect, it, vi } from 'vitest';
import { PandocOdtConverter } from '../../../src/infrastructure/conversion/pandoc-odt-converter.js';

describe('PandocOdtConverter', () => {
  it('runs pandoc with html output and extract-media', async () => {
    const execFileFn = vi.fn().mockResolvedValue({
      stdout: '<html><body><p>Converted</p></body></html>',
      stderr: '',
    });
    const converter = new PandocOdtConverter({
      pandocPath: '/usr/bin/pandoc',
      execFileFn,
    });

    const result = await converter.convertOdtToHtml(Buffer.from('odt'), '/tmp/work');

    expect(execFileFn).toHaveBeenCalledWith(
      '/usr/bin/pandoc',
      ['/tmp/work/input.odt', '-t', 'html', '--standalone', '--extract-media=/tmp/work/media'],
      { maxBuffer: 20 * 1024 * 1024 },
    );
    expect(result.html).toContain('Converted');
    expect(result.mediaDir).toBe('/tmp/work/media');
  });
});
