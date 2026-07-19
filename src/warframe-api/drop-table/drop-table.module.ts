import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpJsonService } from '../shared/http-json.service';
import { DropTableService } from './drop-table.service';
import { Cache } from './entities/cache.entity';
import { CacheRepository } from './repositories/cache.repository';

@Module({
  imports: [
    HttpModule.register({ baseURL: 'https://drops.warframestat.us' }),
    TypeOrmModule.forFeature([Cache]),
  ],
  providers: [DropTableService, HttpJsonService, CacheRepository],
  exports: [DropTableService],
})
export class DropTableModule {}
