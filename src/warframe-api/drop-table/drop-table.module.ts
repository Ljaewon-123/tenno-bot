import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpJsonService } from '../shared/http-json.service';
import { DropSourceService } from './drop-source.service';
import { DropTableService } from './drop-table.service';
import { DropSource } from './entities/drop-source.entity';
import { DropSourceRepository } from './repositories/drop-source.repository';

@Module({
  imports: [
    // all.json은 수 MB짜리 주간 크론 수집이라 인터랙션 경로보다 넉넉하게 잡는다
    HttpModule.register({
      baseURL: 'https://drops.warframestat.us',
      timeout: 30_000,
    }),
    TypeOrmModule.forFeature([DropSource]),
  ],
  providers: [
    DropTableService,
    DropSourceService,
    HttpJsonService,
    DropSourceRepository,
  ],
  exports: [DropTableService],
})
export class DropTableModule {}
