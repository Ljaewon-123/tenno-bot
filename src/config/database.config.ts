import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfig } from './config.service';

@Injectable()
export class DatabaseConfig {
  constructor(private readonly config: AppConfig) {}
  get pgOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      url: this.config.PG_DATABASE_URL,
      ssl: true,
    };
  }
}
