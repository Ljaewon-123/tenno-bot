import { WarframeApiModule } from '@/warframe-api/warframe-api.module.js';
import { WorldStateModule } from '@/warframe-api/world-state/world-state.module.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationHistory } from './entities/notification-history.entity.js';
import { Notification } from './entities/notification.entity.js';
import { NotificationService } from './notification.service.js';
import { NotificationHistoryRepository } from './repositories/notification-history.repository.js';
import { NotificationRepository } from './repositories/notification.repository.js';

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
