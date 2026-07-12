import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpJsonService } from '../shared/http-json.service';
import { WorldStateService } from './world-state.service';

@Module({
  imports: [HttpModule.register({ baseURL: 'https://api.warframestat.us' })],
  providers: [WorldStateService, HttpJsonService],
  exports: [WorldStateService],
})
export class WorldStateModule {}
