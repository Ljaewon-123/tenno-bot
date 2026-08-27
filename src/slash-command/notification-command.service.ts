import { NotificationCommand } from '@/notification/dto/notification.command.dto';
import { NotificationService } from '@/notification/notification.service';
import { Injectable } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import { Context, Options, Subcommand, type SlashCommandContext } from 'necord';
import { NotificationCommands } from './decorators/notification.decorator';

@NotificationCommands()
@Injectable()
export class NotificationCommandService {
  constructor(private readonly notificationService: NotificationService) {}

  @Subcommand({
    name: 'on',
    description: 'Send this event to the current channel when it changes',
  })
  async on(
    @Context() [interaction]: SlashCommandContext,
    @Options() { eventType }: NotificationCommand,
  ) {
    if (!interaction.guildId) {
      return interaction.editReply({ content: 'This command is guild-only.' });
    }
    await this.notificationService.subscribe(
      interaction.guildId,
      interaction.channelId,
      eventType,
    );
    return interaction.editReply({
      content: `Subscribed to \`${eventType}\` in <#${interaction.channelId}>.`,
    });
  }

  @Subcommand({ name: 'off', description: 'Stop notifications for this event' })
  async off(
    @Context() [interaction]: SlashCommandContext,
    @Options() { eventType }: NotificationCommand,
  ) {
    if (!interaction.guildId) {
      return interaction.editReply({ content: 'This command is guild-only.' });
    }
    const removed = await this.notificationService.unsubscribe(
      interaction.guildId,
      eventType,
    );
    return interaction.editReply({
      content: removed
        ? `Unsubscribed from \`${eventType}\`.`
        : `Not subscribed to \`${eventType}\`.`,
    });
  }

  @Subcommand({ name: 'list', description: 'Show this server subscriptions' })
  async list(@Context() [interaction]: SlashCommandContext) {
    if (!interaction.guildId) {
      return interaction.editReply({ content: 'This command is guild-only.' });
    }
    const subscriptions = await this.notificationService.list(
      interaction.guildId,
    );

    const embed = new EmbedBuilder()
      .setTitle('Warframe Notifications')
      .setColor(0x5865f2);

    if (!subscriptions.length) {
      return interaction.editReply({
        embeds: [embed.setDescription('No subscriptions yet.')],
      });
    }

    embed.setDescription(
      subscriptions
        .map(({ eventType, channelId }) => `\`${eventType}\` → <#${channelId}>`)
        .join('\n'),
    );
    return interaction.editReply({ embeds: [embed] });
  }
}
