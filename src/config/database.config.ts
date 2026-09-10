import { AlarmOneShotReminder1789000000000 } from '@/migrations/1789000000000-alarm-one-shot-reminder';
import { PartyVisibility1788912000000 } from '@/migrations/1788912000000-party-visibility';
import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfig } from './config.service';
import { NodeEnv } from './enum';

// glob 대신 직접 나열 — nest build가 dist로 옮기면 경로 패턴이 깨진다
const migrations = [
  PartyVisibility1788912000000,
  AlarmOneShotReminder1789000000000,
];

@Injectable()
export class DatabaseConfig {
  constructor(private readonly config: AppConfig) {}
  get pgOptions(): TypeOrmModuleOptions {
    const isProduction = this.config.nodeEnv === NodeEnv.Production;
    return {
      type: 'postgres',
      url: this.config.PG_DATABASE_URL,
      ssl: true,
      synchronize: !isProduction,
      migrations,
      // dev는 synchronize가 이미 스키마를 맞춰 놓는다 — 프로덕션에서만 돌린다
      migrationsRun: isProduction,
    };
  }
}
