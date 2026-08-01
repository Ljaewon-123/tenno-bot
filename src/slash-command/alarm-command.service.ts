import { AlarmService } from '@/alarm/alarm.service';
import { CreateAlarmCommand } from '@/alarm/dto/create-alarm.command.dto';
import { DeleteAlarmCommand } from '@/alarm/dto/delete-alarm.command.dto';
import { resolveTimezone } from '@/utils/timezone';
import { Injectable } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import {
  Context,
  createCommandGroupDecorator,
  Options,
  Subcommand,
  type SlashCommandContext,
} from 'necord';

export const AlarmCommands = createCommandGroupDecorator({
  name: 'alarm',
  description: 'Manage repeating Warframe info alarms',
});

@AlarmCommands()
@Injectable()
export class AlarmCommandService {
  constructor(private readonly alarmService: AlarmService) {}

  @Subcommand({ name: 'register', description: 'Register a new alarm' })
  async registerAlarm(
    @Context() [interaction]: SlashCommandContext,
    @Options() request: CreateAlarmCommand,
  ) {
    if (!interaction.guildId) {
      return interaction.reply({ content: 'This command is guild-only.' });
    }
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

  @Subcommand({ name: 'delete', description: 'Delete an existing alarm' })
  async unRegisterAlarm(
    @Context() [interaction]: SlashCommandContext,
    @Options() { id }: DeleteAlarmCommand,
  ) {
    await this.alarmService.unRegister(id);
    return interaction.reply({
      content: `Delete alarm with id: ${id}`,
    });
  }

  @Subcommand({ name: 'list', description: 'Show alarms in this server' })
  async popAlarm(@Context() [interaction]: SlashCommandContext) {
    if (!interaction.guildId) {
      return interaction.reply({ content: 'This command is guild-only.' });
    }
    const alarms = await this.alarmService.popAlarm(interaction.guildId);

    const embed = new EmbedBuilder().setTitle('Alarms').setColor(0x5865f2);

    if (!alarms.length) {
      return interaction.reply({
        embeds: [embed.setDescription('No alarms registered.')],
      });
    }

    // 임베드 필드는 25개까지
    embed.addFields(
      alarms.slice(0, 25).map((alarm) => ({
        name: alarm.name.slice(0, 256),
        value: [
          `Target: ${alarm.targetCommand.target}`,
          `Every ${alarm.intervalValue} min · next <t:${alarm.doneAt.unix()}:R>`,
          alarm.description,
          `id: \`${alarm.id}\``,
        ]
          .filter((line): line is string => Boolean(line))
          .join('\n')
          .slice(0, 1024),
      })),
    );
    return interaction.reply({ embeds: [embed] });
  }
}
