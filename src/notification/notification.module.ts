import { WarframeApiModule } from '@/warframe-api/warframe-api.module';
import { WorldStateModule } from '@/warframe-api/world-state/world-state.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationHistory } from './entities/notification-history.entity';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationHistoryRepository } from './repositories/notification-history.repository';
import { NotificationRepository } from './repositories/notification.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationHistory]),
    WarframeApiModule,
    WorldStateModule,
  ],
  providers: [
    NotificationService,
    NotificationRepository,
    NotificationHistoryRepository,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
