import { AlarmService } from '@/alarm/alarm.service';
import { CreateAlarmRequest } from '@/alarm/dto/create-alarm.request.dto';
import { Injectable } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';

@Injectable()
export class AlarmCommandService {
  constructor(private readonly alarmService: AlarmService) {}

  @SlashCommand({
    name: 'register-alarm',
    description: 'Register a new alarm',
  })
  async registerAlarm(
    @Context() [interaction]: SlashCommandContext,
    @Options() request: CreateAlarmRequest,
  ) {
    const alarm = await this.alarmService.register(request);
    return interaction.reply({
      content: `Register alarm: ${alarm.name}: ${alarm.targetCommand.target}`,
    });
  }

  @SlashCommand({
    name: 'delete-alarm',
    description: 'Delete an existing alarm',
  })
  async unRegisterAlarm(
    @Context() [interaction]: SlashCommandContext,
    @Options() id: string,
  ) {
    await this.alarmService.unRegister(id);
    return interaction.reply({
      content: `Delete alarm with id: ${id}`,
    });
  }

  async popAlarm(
    @Context() [interaction]: SlashCommandContext,
    @Options() guildId: string,
  ) {
    const alarms = await this.alarmService.popAlarm(guildId);
    return interaction.reply({
      content: `Alarms for guild ${guildId}: ${JSON.stringify(alarms)}`,
    });
  }
}
