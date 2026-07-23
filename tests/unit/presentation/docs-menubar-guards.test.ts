import { describe, expect, it } from 'vitest';
import { isEditorUsable } from '../../../src/presentation/editor-usable.js';

describe('isEditorUsable', () => {
  it('returns false for null', () => {
    expect(isEditorUsable(null)).toBe(false);
  });

  it('returns false for destroyed editor', () => {
    expect(isEditorUsable({ isDestroyed: true } as never)).toBe(false);
  });

  it('returns true for live editor', () => {
    expect(isEditorUsable({ isDestroyed: false } as never)).toBe(true);
  });
});
