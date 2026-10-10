import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpJsonService } from '../shared/http-json.service.js';
import { WorldStateService } from './world-state.service.js';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.warframestat.us',
      timeout: 5000,
    }),
  ],
  providers: [WorldStateService, HttpJsonService],
  exports: [WorldStateService],
})
export class WorldStateModule {}
