import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpJsonService } from '../shared/http-json.service';
import { DropTableService } from './drop-table.service';

@Module({
  imports: [HttpModule.register({ baseURL: 'https://drops.warframestat.us' })],
  providers: [DropTableService, HttpJsonService],
  exports: [DropTableService],
})
export class DropTableModule {}
