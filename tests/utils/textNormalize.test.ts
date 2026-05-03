import { describe, it, expect } from 'vitest';
import { normalizeText, splitChars, toHalfwidth } from '../../src/utils/textNormalize.ts';

describe('normalizeText', () => {
  it('trims whitespace', () => {
    expect(normalizeText('  桌子  ')).toBe('桌子');
  });

  it('removes punctuation', () => {
    expect(normalizeText('桌子！')).toBe('桌子');
    expect(normalizeText('hello, world!')).toBe('heloworld');
  });

  it('removes consecutive duplicate chars', () => {
    expect(normalizeText('开开开开心')).toBe('开心');
  });

  it('handles empty input', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText('   ')).toBe('');
  });

  it('lowercases english', () => {
    expect(normalizeText('Hello')).toBe('helo');
  });
});

describe('toHalfwidth', () => {
  it('converts fullwidth letters to halfwidth', () => {
    expect(toHalfwidth('ＡＢＣ')).toBe('ABC');
  });
});

describe('splitChars', () => {
  it('splits CJK into individual chars', () => {
    expect(splitChars('桌子')).toEqual(['桌', '子']);
  });

  it('handles mixed input', () => {
    expect(splitChars('a桌子b')).toEqual(['a', '桌', '子', 'b']);
  });

  it('handles empty input', () => {
    expect(splitChars('')).toEqual([]);
  });
});
