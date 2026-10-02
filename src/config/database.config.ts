import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'node:path';
import { AppConfig } from './config.service';
import { NodeEnv } from './enum';

/** CWD가 아니라 __dirname 기준이어야 nest build 후 dist에서도 같은 자리를 본다 */
const migrations = [join(__dirname, '../migrations/*{.js,.ts}')];

@Injectable()
export class DatabaseConfig {
  constructor(private readonly config: AppConfig) {}
  get pgOptions(): TypeOrmModuleOptions {
    const isProduction = this.config.nodeEnv === NodeEnv.Production;
    return {
      type: 'postgres',
      url: isProduction ? this.config.PG_DATABASE_URL : this.config.DEV_DB,
      ssl: isProduction ? { ca: this.config.PG_CA_CERT } : true,
      synchronize: !isProduction,
      migrations,
      // dev는 synchronize가 이미 스키마를 맞춰 놓는다 — 프로덕션에서만 돌린다
      migrationsRun: isProduction,
    };
  }
}
