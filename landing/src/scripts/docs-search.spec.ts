import { describe, expect, it } from 'vitest';
import { matchesQuery, shouldExpandSidebar } from './docs-search.ts';

describe('matchesQuery', () => {
  const entry = { name: '/void-fissures', description: 'Get the current Void Fissures information' };

  it('matches by substring in the name, case-insensitively', () => {
    expect(matchesQuery(entry, 'FISSURE')).toBe(true);
  });

  it('matches by substring in the description', () => {
    expect(matchesQuery(entry, 'current void')).toBe(true);
  });

  it('does not match unrelated text', () => {
    expect(matchesQuery(entry, 'archimedea')).toBe(false);
  });

  it('treats an empty or whitespace-only query as matching everything', () => {
    expect(matchesQuery(entry, '')).toBe(true);
    expect(matchesQuery(entry, '   ')).toBe(true);
  });
});

describe('shouldExpandSidebar', () => {
  it('expands once there is a non-whitespace query', () => {
    expect(shouldExpandSidebar('fissure')).toBe(true);
  });

  it('does not expand for an empty or whitespace-only query', () => {
    expect(shouldExpandSidebar('')).toBe(false);
    expect(shouldExpandSidebar('   ')).toBe(false);
  });
});
