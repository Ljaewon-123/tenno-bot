import { describe, expect, it } from 'vitest';
import { literal } from './markdown';

/** 유저가 친 이름이 봇 명의 메시지에서 피싱 링크·서식으로 렌더되면 안 된다 */
describe('literal', () => {
  it('마스킹 링크를 링크로 못 쓰게 깬다', () => {
    expect(literal('[Free Nitro](https://evil.x)')).toBe(
      '\\[Free Nitro](https://evil.x)',
    );
  });

  it('굵게·헤딩 같은 서식 기호를 이스케이프한다', () => {
    expect(literal('**b**')).toBe('\\*\\*b\\*\\*');
    expect(literal('# big')).toBe('\\# big');
  });

  it('평범한 이름은 그대로 둔다', () => {
    expect(literal('Mot (Void) — Survival')).toBe('Mot (Void) — Survival');
  });
});
