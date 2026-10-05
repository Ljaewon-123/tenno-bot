import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { parseConfig } from './config.service';

const base = { DISCORD_TOKEN: 't' };

describe('parseConfig', () => {
  /** 기본값이 development면 NODE_ENV를 빠뜨린 배포가 synchronize 켜진 채로 뜬다 */
  it('NODE_ENV가 없으면 부팅을 막는다', () => {
    expect(() =>
      parseConfig({ ...base, DEV_DB: 'dev', PG_DATABASE_URL: 'prod' }),
    ).toThrow(/nodeEnv/);
  });

  it('production은 PG_DATABASE_URL이 없으면 막는다', () => {
    expect(() =>
      parseConfig({ ...base, NODE_ENV: 'production', DEV_DB: 'dev' }),
    ).toThrow(/PG_DATABASE_URL/);
  });

  it('production은 DEV_DB 없이 뜬다', () => {
    expect(
      parseConfig({ ...base, NODE_ENV: 'production', PG_DATABASE_URL: 'prod' })
        .PG_DATABASE_URL,
    ).toBe('prod');
  });

  /** dev에 운영 DB 접속정보를 둘 이유가 없다 — 유출 경로만 늘어난다 */
  it('development는 PG_DATABASE_URL 없이 DEV_DB만으로 뜬다', () => {
    expect(
      parseConfig({ ...base, NODE_ENV: 'development', DEV_DB: 'dev' }).DEV_DB,
    ).toBe('dev');
  });

  it('development는 DEV_DB가 없으면 막는다', () => {
    expect(() =>
      parseConfig({
        ...base,
        NODE_ENV: 'development',
        PG_DATABASE_URL: 'prod',
      }),
    ).toThrow(/DEV_DB/);
  });
});
