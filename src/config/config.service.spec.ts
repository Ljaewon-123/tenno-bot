import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadConfig } from './config.service.js';

/** 로컬 .env가 섞여 들어오면 결과가 개발자 PC마다 달라진다 */
vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

describe('loadConfig', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DISCORD_TOKEN', 't');
    vi.stubEnv('PG_DATABASE_URL', 'prod');
    vi.stubEnv('PORT', undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  it('필수 env가 다 있으면 뜬다', () => {
    expect(loadConfig()).toMatchObject({
      nodeEnv: 'production',
      PG_DATABASE_URL: 'prod',
      PORT: 3000,
    });
  });

  it('PG_DATABASE_URL이 없으면 부팅을 막는다', () => {
    vi.stubEnv('PG_DATABASE_URL', undefined);
    expect(() => loadConfig()).toThrow(/PG_DATABASE_URL/);
  });

  it('DISCORD_TOKEN이 없으면 부팅을 막는다', () => {
    vi.stubEnv('DISCORD_TOKEN', undefined);
    expect(() => loadConfig()).toThrow(/DISCORD_TOKEN/);
  });

  /** 오타(prod 등)가 development로 조용히 떨어지면 synchronize가 켜진다 */
  it('NODE_ENV가 enum 밖이면 막는다', () => {
    vi.stubEnv('NODE_ENV', 'prod');
    expect(() => loadConfig()).toThrow(/nodeEnv/);
  });

  /** env는 전부 문자열이라 implicit conversion이 없으면 IsInt에서 터진다 */
  it('PORT 문자열을 숫자로 바꾼다', () => {
    vi.stubEnv('PORT', '8080');
    expect(loadConfig().PORT).toBe(8080);
  });
});
