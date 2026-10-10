import { Global, Module } from '@nestjs/common';
import { AppConfig, loadConfig } from './config.service.js';
import { DatabaseConfig } from './database.config.js';

@Global()
@Module({
  providers: [{ provide: AppConfig, useFactory: loadConfig }, DatabaseConfig],
  exports: [AppConfig, DatabaseConfig],
})
export class ConfigModule {}
