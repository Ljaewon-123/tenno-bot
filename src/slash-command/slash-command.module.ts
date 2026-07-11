import { Module } from '@nestjs/common';
import { SlashCommandController } from './slash-command.controller';
import { SlashCommandService } from './slash-command.service';

@Module({
  providers: [SlashCommandService],
  controllers: [SlashCommandController],
})
export class SlashCommandModule {}
