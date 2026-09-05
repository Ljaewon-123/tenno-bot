import { CreatePartyCommand } from '@/party/dto/create-party.command.dto';
import { PartyMessageService, partyLine } from '@/party/party-message.service';
import { PartyService } from '@/party/party.service';
import { emptyCard, manageCard, payload } from '@/utils/discord-embed';
import { Injectable } from '@nestjs/common';
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
import { guildOnly } from './guild-only';

@PartyCommands()
@Injectable()
export class PartyCommandService {
  constructor(
    private readonly partyService: PartyService,
    private readonly partyMessage: PartyMessageService,
  ) {}

  @Subcommand({ name: 'create', description: 'Open a new party' })
  async create(
    @Context() [interaction]: SlashCommandContext,
    @Options() { name, mission, size }: CreatePartyCommand,
  ) {
    if (!interaction.guildId) return interaction.editReply(guildOnly());

    const party = await this.partyService.create({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      hostUserId: interaction.user.id,
      name,
      mission,
      partySize: size ?? 4,
    });

    // 인터랙션 응답 자체가 모집 메시지 — 버튼/크론이 갱신할 수 있게 id를 붙여둔다
    const message = await interaction.editReply(this.partyMessage.build(party));
    await this.partyService.attachMessage(party.id, message.id);
    return message;
  }

  @Subcommand({ name: 'list', description: 'Show open parties' })
  async list(@Context() [interaction]: SlashCommandContext) {
    if (!interaction.guildId) return interaction.editReply(guildOnly());

    const parties = await this.partyService.list(interaction.guildId);

    if (!parties.length)
      return interaction.editReply(
        payload(
          emptyCard(
            'No open parties',
            'Nobody is recruiting right now.',
            '/party create to open one',
          ),
        ),
      );

    return interaction.editReply(
      payload(
        manageCard({
          title: `Open Parties · ${parties.length}`,
          rows: parties.map((party) => ({ text: partyLine(party) })),
          footer: 'Join from the recruiting message in its own channel',
        }),
      ),
    );
  }

  @Button('party/join/:id')
  async join(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('id') id: string,
  ) {
    const party = await this.partyService.join(id, interaction.user.id);
    await interaction.update(this.partyMessage.build(party));

    if (party.members.length >= party.partySize)
      await interaction.followUp(this.partyMessage.fullNotice(party));
  }

  @Button('party/leave/:id')
  async leave(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('id') id: string,
  ) {
    const party = await this.partyService.leave(id, interaction.user.id);
    return interaction.update(this.partyMessage.build(party));
  }

  @Button('party/close/:id')
  async close(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('id') id: string,
  ) {
    const party = await this.partyService.close(id, interaction.user.id);
    return interaction.update(this.partyMessage.build(party));
  }
}
