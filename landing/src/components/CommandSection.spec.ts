import { describe, expect, it } from 'vitest';
import { describeOptions } from './CommandSection.ts';

describe('describeOptions', () => {
  it('leaves the description untouched when the command has options', () => {
    expect(describeOptions('Register a new alarm', true)).toBe('Register a new alarm');
  });

  it('adds a period before "No options." when the description has none', () => {
    expect(describeOptions('Show alarms in this server', false)).toBe('Show alarms in this server. No options.');
  });

  it('does not double the period when the description already ends with one', () => {
    expect(describeOptions('Nothing to configure.', false)).toBe('Nothing to configure. No options.');
  });
});
