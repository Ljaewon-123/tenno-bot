import { Global, Module } from '@nestjs/common';
import { AppConfig, loadConfig } from './config.service';
import { DatabaseConfig } from './database.config';

@Global()
@Module({
  providers: [{ provide: AppConfig, useFactory: loadConfig }, DatabaseConfig],
  exports: [AppConfig, DatabaseConfig],
})
export class ConfigModule {}
