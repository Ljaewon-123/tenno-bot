import { NestFactory } from '@nestjs/core';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';
import { AppModule } from './app/app.module';
import { AppConfig } from './config/config.service';

async function bootstrap() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });
  const app = await NestFactory.create(AppModule);
  // 공개 GET(헬스·스탯)뿐이라 origin을 랜딩 도메인으로 좁혀도 얻는 게 없다 — 도메인 확정 전에도 동작하게 '*'
  app.enableCors();
  const config = app.get(AppConfig);
  await app.listen(config.PORT);
}
bootstrap();
