import { Module } from '@nestjs/common';
import { WfcdItemsService } from './wfcd-items.service';

@Module({
  providers: [WfcdItemsService],
  exports: [WfcdItemsService],
})
export class WfcdItemsModule {}
