import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpJsonService } from '../shared/http-json.service';
import { WfcdItemsModule } from '../wfcd-items/wfcd-items.module';
import { IncarnonService } from './incarnon.service';

@Module({
  imports: [
    // 45개 페이지 본문을 한 번에 받아 386KB쯤 된다 — 인터랙션 경로(5초)보다 넉넉하게 잡는다
    HttpModule.register({
      baseURL: 'https://wiki.warframe.com',
      timeout: 30_000,
    }),
    WfcdItemsModule,
  ],
  providers: [IncarnonService, HttpJsonService],
  exports: [IncarnonService],
})
export class IncarnonModule {}
