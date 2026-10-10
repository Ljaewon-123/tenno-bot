import { Module } from '@nestjs/common';
import { WfcdItemsService } from './wfcd-items.service.js';
import { WfcdModule } from './wfcd.module.js';

@Module({
  imports: [WfcdModule.forRoot()],
  providers: [WfcdItemsService],
  exports: [WfcdItemsService],
})
export class WfcdItemsModule {}
