import { Module } from '@nestjs/common';
import { DropTableModule } from './drop-table/drop-table.module.js';
import { IncarnonModule } from './incarnon/incarnon.module.js';
import { SharedModule } from './shared/modules/shared.module.js';
import { WarframeApiService } from './warframe-api.service.js';
import { WfcdItemsModule } from './wfcd-items/wfcd-items.module.js';
import { WorldStateModule } from './world-state/world-state.module.js';

@Module({
  imports: [
    WorldStateModule,
    DropTableModule,
    WfcdItemsModule,
    IncarnonModule,
    SharedModule,
  ],
  providers: [WarframeApiService],
  exports: [WarframeApiService],
})
export class WarframeApiModule {}
