import { CreatePartyCommand } from '@/party/dto/create-party.command.dto';
import { partyMessage } from '@/party/party.message';
import { PartyService } from '@/party/party.service';
import { Injectable } from '@nestjs/common';
import { EmbedBuilder, messageLink } from 'discord.js';
import {
  Button,
  ComponentParam,
  Context,
  Options,
  Subcommand,
  type ButtonContext,
  type SlashCommandContext,
} from 'necord';
import { PartyCommands } from './decorators/party-commands.decorator';

@PartyCommands()
@Injectable()
export class PartyCommandService {
  constructor(private readonly partyService: PartyService) {}

  @Subcommand({ name: 'create', description: 'Open a new party' })
  async create(
    @Context() [interaction]: SlashCommandContext,
    @Options() { name, mission, size }: CreatePartyCommand,
  ) {
    if (!interaction.guildId) {
      return interaction.editReply({ content: 'This command is guild-only.' });
    }
    const party = await this.partyService.create({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      hostUserId: interaction.user.id,
      name,
      mission,
      partySize: size ?? 4,
    });

    // 인터랙션 응답 자체가 모집 메시지 — 버튼/크론이 갱신할 수 있게 id를 붙여둔다
    const message = await interaction.editReply(partyMessage(party));
    await this.partyService.attachMessage(party.id, message.id);
    return message;
  }

  @Subcommand({ name: 'list', description: 'Show open parties' })
  async list(@Context() [interaction]: SlashCommandContext) {
    if (!interaction.guildId) {
      return interaction.editReply({ content: 'This command is guild-only.' });
    }
    const parties = await this.partyService.list(interaction.guildId);

    const embed = new EmbedBuilder().setTitle('Parties').setColor(0x5865f2);

    if (!parties.length) {
      return interaction.editReply({
        embeds: [embed.setDescription('No open parties.')],
      });
    }

    // 임베드 필드는 25개까지
    embed.addFields(
      parties.slice(0, 25).map((party) => ({
        name: party.name.slice(0, 256),
        value: [
          `${party.mission} · ${party.members.length}/${party.partySize}`,
          `host <@${party.hostUserId}>`,
          party.channelId && party.messageId
            ? messageLink(party.channelId, party.messageId, party.guildId)
            : null,
        ]
          .filter((line): line is string => Boolean(line))
          .join('\n')
          .slice(0, 1024),
      })),
    );
    return interaction.editReply({ embeds: [embed] });
  }

  @Button('party/join/:id')
  async join(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('id') id: string,
  ) {
    const party = await this.partyService.join(id, interaction.user.id);
    await interaction.update(partyMessage(party));

    // 임베드 갱신만으론 알림이 안 뜬다 — 정원이 찬 순간만 별개 메시지로 멘션
    if (party.members.length >= party.partySize) {
      await interaction.followUp({
        content: `파티가 가득 찼습니다! ${party.members.map((userId) => `<@${userId}>`).join(' ')}`,
      });
    }
  }

  @Button('party/leave/:id')
  async leave(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('id') id: string,
  ) {
    const party = await this.partyService.leave(id, interaction.user.id);
    return interaction.update(partyMessage(party));
  }

  @Button('party/close/:id')
  async close(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('id') id: string,
  ) {
    const party = await this.partyService.close(id, interaction.user.id);
    return interaction.update(partyMessage(party));
  }
}
