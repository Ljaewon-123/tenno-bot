import { WarframeApiModule } from '@/warframe-api/warframe-api.module';
import { WorldStateModule } from '@/warframe-api/world-state/world-state.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './repositories/notification.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    WarframeApiModule,
    WorldStateModule,
  ],
  providers: [NotificationService, NotificationRepository],
  exports: [NotificationService],
})
export class NotificationModule {}
