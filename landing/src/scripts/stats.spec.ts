import { describe, expect, it } from 'vitest';
import { mapStats } from './stats.ts';

// fetch 응답 → 화면 표시값 매핑만 순수 함수로 떼어 테스트한다. DOM 갱신/fetch 자체는 브라우저 전용이라 여기서 안 다룸.
describe('mapStats', () => {
  it('formats guilds/users with thousands separators', () => {
    expect(mapStats({ guilds: 1234, users: 987654, ready: true })).toEqual({
      servers: '1,234',
      users: '987,654',
      online: true,
    });
  });

  it('passes ready:false through as online:false', () => {
    expect(mapStats({ guilds: 5, users: 10, ready: false })).toEqual({
      servers: '5',
      users: '10',
      online: false,
    });
  });

  it('formats zero counts without separators', () => {
    expect(mapStats({ guilds: 0, users: 0, ready: true })).toEqual({
      servers: '0',
      users: '0',
      online: true,
    });
  });
});
