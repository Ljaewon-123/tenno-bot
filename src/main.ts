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
  // 공개 GET(헬스·스탯)뿐이라 origin을 좁힐 이유가 없다
  app.enableCors();
  const config = app.get(AppConfig);
  await app.listen(config.PORT);
}
void bootstrap();
