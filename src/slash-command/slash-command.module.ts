import { AlarmModule } from '@/alarm/alarm.module';
import { WarframeApiModule } from '@/warframe-api/warframe-api.module';
import { Module } from '@nestjs/common';
import { AlarmCommandService } from './alarm-command.service';
import { SlashCommandService } from './slash-command.service';

@Module({
  imports: [WarframeApiModule, AlarmModule],
  providers: [SlashCommandService, AlarmCommandService],
})
export class SlashCommandModule {}
