import { Module } from '@nestjs/common';
import { DropTableModule } from './drop-table/drop-table.module';
import { SharedModule } from './shared/modules/shared.module';
import { WarframeApiService } from './warframe-api.service';
import { WfcdItemsModule } from './wfcd-items/wfcd-items.module';
import { WorldStateModule } from './world-state/world-state.module';

@Module({
  imports: [WorldStateModule, DropTableModule, WfcdItemsModule, SharedModule],
  providers: [WarframeApiService],
  exports: [WarframeApiService],
})
export class WarframeApiModule {}
