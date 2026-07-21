import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpJsonService } from '../shared/http-json.service';
import { DropSourceService } from './drop-source.service';
import { DropTableService } from './drop-table.service';
import { Cache } from './entities/cache.entity';
import { DropSource } from './entities/drop-source.entity';
import { CacheRepository } from './repositories/cache.repository';
import { DropSourceRepository } from './repositories/drop-source.repository';

@Module({
  imports: [
    HttpModule.register({ baseURL: 'https://drops.warframestat.us' }),
    TypeOrmModule.forFeature([Cache, DropSource]),
  ],
  providers: [
    DropTableService,
    DropSourceService,
    HttpJsonService,
    CacheRepository,
    DropSourceRepository,
  ],
  exports: [DropTableService],
})
export class DropTableModule {}
