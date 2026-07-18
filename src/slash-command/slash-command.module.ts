import { AlarmModule } from '@/alarm/alarm.module';
import { WarframeApiModule } from '@/warframe-api/warframe-api.module';
import { Module } from '@nestjs/common';
import { SlashCommandService } from './slash-command.service';

@Module({
  imports: [WarframeApiModule, AlarmModule],
  providers: [SlashCommandService],
})
export class SlashCommandModule {}
