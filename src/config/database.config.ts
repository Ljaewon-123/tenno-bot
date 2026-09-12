import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'node:path';
import { AppConfig } from './config.service';
import { NodeEnv } from './enum';

/**
 * 깨지는 건 glob이 아니라 **CWD 기준 경로**다 — nest build가 dist로 옮기면 `src/migrations/*`가 안 맞는다.
 * `nest start`도 dist를 실행하므로 __dirname 기준이면 dev·prod가 같은 자리를 본다.
 * `.d.ts`는 TypeORM이 스스로 걸러내고(`declaration: true`라 dist에 깔린다), 못 찾으면 조용히 죽지 않고 로그를 남긴다.
 */
const migrations = [join(__dirname, '../migrations/*{.js,.ts}')];

@Injectable()
export class DatabaseConfig {
  constructor(private readonly config: AppConfig) {}
  get pgOptions(): TypeOrmModuleOptions {
    const isProduction = this.config.nodeEnv === NodeEnv.Production;
    return {
      type: 'postgres',
      url: this.config.PG_DATABASE_URL,
      ssl: this.config.PG_CA_CERT ? { ca: this.config.PG_CA_CERT } : true,
      synchronize: !isProduction,
      migrations,
      // dev는 synchronize가 이미 스키마를 맞춰 놓는다 — 프로덕션에서만 돌린다
      migrationsRun: isProduction,
    };
  }
}
