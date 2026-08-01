import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cache } from './entities/cache.entity';
import { CacheRepository } from './repositories/cache.repository';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Cache])],
  providers: [CacheRepository],
  exports: [CacheRepository],
})
export class SharedModule {}
