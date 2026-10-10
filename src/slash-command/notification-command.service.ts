import { NotificationCommand } from '@/notification/dto/notification.command.dto.js';
import { NotificationService } from '@/notification/notification.service.js';
import { WatchTarget, WatchTargetLabel } from '@/notification/types.js';
import {
  guildOnly,
  manageCard,
  okCard,
  payload,
  subtext,
} from '@/utils/discord-embed/index.js';
import { Injectable, UseGuards } from '@nestjs/common';
import { Context, Options, Subcommand, type SlashCommandContext } from 'necord';
import { NotificationCommands } from './decorators/notification.decorator.js';
import { CanPostGuard } from './guards/can-post.guard.js';

@NotificationCommands()
@Injectable()
export class NotificationCommandService {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(CanPostGuard)
  @Subcommand({
    name: 'on',
    description: 'Send this event to the current channel when it changes',
  })
  async on(
    @Context() [interaction]: SlashCommandContext,
    @Options() { eventType }: NotificationCommand,
  ) {
    if (!interaction.guildId) return interaction.editReply(guildOnly());

    await this.notificationService.subscribe(
      interaction.guildId,
      interaction.channelId,
      eventType,
    );
    return interaction.editReply(
      payload(
        okCard(
          `Subscribed · ${WatchTargetLabel[eventType]}`,
          `Changes will post in <#${interaction.channelId}>.`,
          'Fires on change, not on a timer',
        ),
      ),
    );
  }

  @Subcommand({ name: 'off', description: 'Stop notifications for this event' })
  async off(
    @Context() [interaction]: SlashCommandContext,
    @Options() { eventType }: NotificationCommand,
  ) {
    if (!interaction.guildId) return interaction.editReply(guildOnly());

    const removed = await this.notificationService.unsubscribe(
      interaction.guildId,
      eventType,
    );
    return interaction.editReply(
      payload(
        okCard(
          removed
            ? `Unsubscribed · ${WatchTargetLabel[eventType]}`
            : `Already off · ${WatchTargetLabel[eventType]}`,
          removed
            ? 'This server will stop getting it.'
            : 'This server was not subscribed.',
          '/notification list to see the rest',
        ),
      ),
    );
  }

  @Subcommand({ name: 'list', description: 'Show this server subscriptions' })
  async list(@Context() [interaction]: SlashCommandContext) {
    if (!interaction.guildId) return interaction.editReply(guildOnly());

    const subscriptions = await this.notificationService.list(
      interaction.guildId,
    );
    const targets = Object.values(WatchTarget);

    return interaction.editReply(
      payload(
        manageCard({
          title: `Subscriptions · ${subscriptions.length} of ${targets.length}`,
          rows: targets.map((target) => {
            const on = subscriptions.find(
              ({ eventType }) => eventType === target,
            );
            return {
              text: on
                ? `${WatchTargetLabel[target]} → <#${on.channelId}>`
                : subtext(`${WatchTargetLabel[target]} — off`),
            };
          }),
          footer: 'Fires on change, not on a timer · /notification on to add',
        }),
      ),
    );
  }
}
