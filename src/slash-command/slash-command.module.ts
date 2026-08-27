import { AlarmModule } from '@/alarm/alarm.module';
import { NotificationModule } from '@/notification/notification.module';
import { PartyModule } from '@/party/party.module';
import { WarframeApiModule } from '@/warframe-api/warframe-api.module';
import { Module } from '@nestjs/common';
import { AlarmCommandService } from './alarm-command.service';
import { NotificationCommandService } from './notification-command.service';
import { PartyCommandService } from './party-command.service';
import { SlashCommandService } from './slash-command.service';

@Module({
  imports: [WarframeApiModule, AlarmModule, NotificationModule, PartyModule],
  providers: [
    SlashCommandService,
    AlarmCommandService,
    NotificationCommandService,
    PartyCommandService,
  ],
})
export class SlashCommandModule {}
