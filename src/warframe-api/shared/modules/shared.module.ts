import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cache } from './entities/cache.entity.js';
import { CacheRepository } from './repositories/cache.repository.js';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Cache])],
  providers: [CacheRepository],
  exports: [CacheRepository],
})
export class SharedModule {}
