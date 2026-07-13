import { Module } from '@nestjs/common';
import { WfcdItemsService } from './wfcd-items.service';
import { WfcdModule } from './wfcd.module';

@Module({
  imports: [WfcdModule.forRoot()],
  providers: [WfcdItemsService],
  exports: [WfcdItemsService],
})
export class WfcdItemsModule {}
