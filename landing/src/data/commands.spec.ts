import { describe, expect, it } from 'vitest';
import { COMMANDS, GETTING_STARTED, SIDEBAR_SECTIONS } from './commands.ts';

// 앵커 id 충돌은 브라우저가 조용히 첫 번째로만 스크롤해 버그를 숨긴다 — 데이터 단계에서 막는다.
describe('commands data', () => {
  it('has unique anchor ids across getting-started sections, commands and subcommands', () => {
    const ids = [
      ...GETTING_STARTED.map((item) => item.id),
      ...COMMANDS.flatMap((command) => [
        command.id,
        ...(command.subcommands?.map((sub) => `${command.id}-${sub.id}`) ?? []),
      ]),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('assigns every command to exactly one sidebar section', () => {
    const grouped = SIDEBAR_SECTIONS.flatMap((section) => section.commands);
    expect(grouped.length).toBe(COMMANDS.length);
  });

  it('every option required flag pairs with a boolean, and choice options list choices', () => {
    const allOptions = COMMANDS.flatMap((c) => [...(c.options ?? []), ...(c.subcommands?.flatMap((s) => s.options) ?? [])]);
    for (const option of allOptions) {
      expect(typeof option.required).toBe('boolean');
      if (option.type === 'choice') expect(option.choices?.length).toBeGreaterThan(0);
    }
  });
});
