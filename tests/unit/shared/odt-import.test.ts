import { describe, expect, it } from 'vitest';
import {
  isValidOdtUpload,
  titleFromOdtFilename,
} from '../../../src/shared/odt-import.js';

describe('odt-import helpers', () => {
  it('accepts .odt extension or MIME type', () => {
    expect(
      isValidOdtUpload({ originalFilename: 'report.odt', mimeType: 'application/octet-stream' }),
    ).toBe(true);
    expect(
      isValidOdtUpload({
        originalFilename: 'report.bin',
        mimeType: 'application/vnd.oasis.opendocument.text',
      }),
    ).toBe(true);
    expect(
      isValidOdtUpload({ originalFilename: 'report.docx', mimeType: 'application/msword' }),
    ).toBe(false);
  });

  it('derives title from filename without extension', () => {
    expect(titleFromOdtFilename('My Report.odt')).toBe('My Report');
    expect(titleFromOdtFilename('.odt')).toBe('Untitled');
  });
});
