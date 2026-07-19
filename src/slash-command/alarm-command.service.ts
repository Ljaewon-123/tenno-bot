import { AlarmService } from '@/alarm/alarm.service';
import { CreateAlarmCommand } from '@/alarm/dto/create-alarm.command.dto';
import { DeleteAlarmCommand } from '@/alarm/dto/delete-alarm.command.dto';
import dayjs from '@/utils/dayjs';
import { resolveTimezone } from '@/utils/timezone';
import { TargetCommand } from '@/warframe-api/enum';
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
    @Options() request: CreateAlarmCommand,
  ) {
    if (!interaction.guildId) {
      return interaction.reply({ content: 'This command is guild-only.' });
    }
    console.log(request, 'dev debug');
    const saved = await this.alarmService.register({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      name: request.name,
      description: request.description,
      intervalValue: request.intervalValue,
      targetCommand: { target: request.target, options: request.options },
      timezone: resolveTimezone(interaction.locale, request.timezone),
    });
    return interaction.reply({
      content: `Register alarm: ${saved.name}: ${saved.targetCommand.target} (${saved.timezone})`,
    });
  }

  @SlashCommand({
    name: 'register-sortie-alarm',
    description: 'Register a daily Sortie reset alarm (16:00 UTC)',
  })
  async registerSortieAlarm(@Context() [interaction]: SlashCommandContext) {
    return this.registerResetAlarm(interaction, TargetCommand.Sortie);
  }

  @SlashCommand({
    name: 'register-archon-alarm',
    description: 'Register a weekly Archon Hunt reset alarm (Monday 00:00 UTC)',
  })
  async registerArchonAlarm(@Context() [interaction]: SlashCommandContext) {
    return this.registerResetAlarm(interaction, TargetCommand.ArchonHunt);
  }

  /** 리셋 시각에 맞춘 반복 알람 등록 */
  private async registerResetAlarm(
    interaction: SlashCommandContext[0],
    target: TargetCommand.Sortie | TargetCommand.ArchonHunt,
  ) {
    if (!interaction.guildId) {
      return interaction.reply({ content: 'This command is guild-only.' });
    }

    // 아콘 헌트는 매주 월요일 00:00 UTC, 출격은 매일 16:00 UTC 리셋
    const isWeekly = target === TargetCommand.ArchonHunt;
    const now = dayjs.utc();
    let fireAt = isWeekly
      ? now.startOf('week').add(1, 'day') // 이번 주 월요일 00:00 UTC
      : now.startOf('day').add(16, 'hour'); // 오늘 16:00 UTC
    if (!fireAt.isAfter(now)) fireAt = fireAt.add(isWeekly ? 7 : 1, 'day');

    const saved = await this.alarmService.register({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      name: `${target} reset`,
      description: `Fires every ${isWeekly ? 'Monday at 00:00' : 'day at 16:00'} UTC`,
      intervalValue: (isWeekly ? 7 : 1) * 24 * 60,
      targetCommand: { target },
      timezone: resolveTimezone(interaction.locale),
      doneAt: fireAt,
    });
    return interaction.reply({
      content: `Register alarm: ${saved.name}, first fire <t:${fireAt.unix()}:R>`,
    });
  }

  @SlashCommand({
    name: 'delete-alarm',
    description: 'Delete an existing alarm',
  })
  async unRegisterAlarm(
    @Context() [interaction]: SlashCommandContext,
    @Options() { id }: DeleteAlarmCommand,
  ) {
    await this.alarmService.unRegister(id);
    return interaction.reply({
      content: `Delete alarm with id: ${id}`,
    });
  }

  @SlashCommand({
    name: 'pop-alarm-list',
    description: 'showing all alarms list',
  })
  async popAlarm(@Context() [interaction]: SlashCommandContext) {
    if (!interaction.guildId) {
      return interaction.reply({ content: 'This command is guild-only.' });
    }
    const alarms = await this.alarmService.popAlarm(interaction.guildId);
    return interaction.reply({
      content: `Alarms for guild ${interaction.guildId}: ${JSON.stringify(alarms)}`,
    });
  }
}
