import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfig } from './config.service';

@Injectable()
export class DatabaseConfig {
  constructor(private readonly config: AppConfig) {}
  get pgOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.config.PG_HOST,
      port: this.config.PG_PORT,
      username: this.config.PG_USER,
      password: this.config.PG_PASSWORD,
      database: this.config.PG_DB_NAME,
    };
  }
}
