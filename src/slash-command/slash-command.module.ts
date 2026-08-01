import { AlarmModule } from '@/alarm/alarm.module';
import { NotificationModule } from '@/notification/notification.module';
import { WarframeApiModule } from '@/warframe-api/warframe-api.module';
import { Module } from '@nestjs/common';
import { AlarmCommandService } from './alarm-command.service';
import { NotificationCommandService } from './notification-command.service';
import { SlashCommandService } from './slash-command.service';

@Module({
  imports: [WarframeApiModule, AlarmModule, NotificationModule],
  providers: [
    SlashCommandService,
    AlarmCommandService,
    NotificationCommandService,
  ],
})
export class SlashCommandModule {}
