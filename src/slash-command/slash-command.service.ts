import { FeedbackService } from '@/feedback/feedback.service.js';
import {
  card,
  okCard,
  payload,
  SUPPORT_SERVER_URL,
} from '@/utils/discord-embed/index.js';
import { WarframeApiService } from '@/warframe-api/warframe-api.service.js';
import { Injectable } from '@nestjs/common';
import type { SlashCommandContext } from 'necord';
import { Context, Options, SlashCommand } from 'necord';
import { FeedbackCommand } from './dto/feedback.command.dto.js';

@Injectable()
export class SlashCommandService {
  constructor(
    private readonly warframeApi: WarframeApiService,
    private readonly feedbackService: FeedbackService,
  ) {}

  @SlashCommand({
    name: 'help',
    description: 'List all commands',
  })
  async help(@Context() [interaction]: SlashCommandContext) {
    return interaction.editReply(
      payload(
        card({
          title: '📖 Commands',
          blocks: [
            [
              {
                heading: 'Info',
                lines: [
                  '`/status` — Warframe data API health',
                  '`/archon-hunt` — Current Archon Hunt',
                  '`/sortie` — Current Sortie',
                  '`/events` — Current Events',
                  '`/void-fissures` — Void Fissures by tier',
                  "`/void-trader` — Baro Ki'Teer",
                  '`/cycles` — Open world day/night cycles',
                  '`/nightwave` — Nightwave challenges (alias `/shockwave`)',
                  '`/archimedea` — Deep and Temporal Archimedea',
                  '`/incarnon` — Incarnon Genesis rotation, or one weapon',
                  '`/drop` — Find where an item drops from',
                  '`/relic` — Everything that drops from one relic',
                ],
              },
            ],
            [
              {
                heading: 'Alarm',
                lines: [
                  '`/alarm register|delete|list` — Repeating reminders for the commands above (Manage Channels)',
                ],
              },
            ],
            [
              {
                heading: 'Notification',
                lines: [
                  '`/notification on|off|list` — Subscribe this server to worldstate changes (Manage Server)',
                ],
              },
            ],
            [
              {
                heading: 'Party',
                lines: ['`/party create|list|history` — Recruit a squad'],
              },
            ],
            [
              {
                heading: 'Support',
                lines: [
                  '`/feedback` — Send a bug report or idea to the developer',
                ],
              },
            ],
          ],
          footer: `Press 🔔 on a card for a one-time reminder · [Support server](${SUPPORT_SERVER_URL})`,
        }),
      ),
    );
  }

  @SlashCommand({
    name: 'feedback',
    description: 'Send a bug report or idea to the developer',
  })
  async feedback(
    @Context() [interaction]: SlashCommandContext,
    @Options() { message }: FeedbackCommand,
  ) {
    await this.feedbackService.send({
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      guild: interaction.guild?.name,
      message,
    });
    return interaction.editReply(
      payload(
        okCard(
          'Feedback sent',
          'Thanks! The developer will read it.',
          `Want a reply? Join the [support server](${SUPPORT_SERVER_URL})`,
        ),
      ),
    );
  }

  @SlashCommand({
    name: 'status',
    description: "Check the Warframe data API's status",
  })
  async status(@Context() [interaction]: SlashCommandContext) {
    return interaction.editReply(payload(await this.warframeApi.health()));
  }
}
