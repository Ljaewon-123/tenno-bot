import { CreatePartyCommand } from '@/party/dto/create-party.command.dto.js';
import { PartyMessageService } from '@/party/party-message.service.js';
import { PartyService } from '@/party/party.service.js';
import { PartyVisibility, PartyVisibilityLabel } from '@/party/vo/enum.js';
import {
  Accent,
  button,
  emptyCard,
  guildOnly,
  manageCard,
  payload,
  relative,
} from '@/utils/discord-embed/index.js';
import { Injectable } from '@nestjs/common';
import {
  ActionRowBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import {
  Button,
  ComponentParam,
  Context,
  Modal,
  Options,
  Subcommand,
  type ButtonContext,
  type ModalContext,
  type SlashCommandContext,
} from 'necord';
import { DEFAULT_PARTY_SIZE, PARTY_CREATE_ID } from './constants.js';
import { PartyCommands } from './decorators/party-commands.decorator.js';

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
    @Options() { name, mission, size, visibility }: CreatePartyCommand,
  ) {
    if (!interaction.guildId) return interaction.editReply(guildOnly());

    const party = await this.partyService.create({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      hostUserId: interaction.user.id,
      name,
      mission,
      partySize: size ?? DEFAULT_PARTY_SIZE,
      visibility: visibility ?? PartyVisibility.PUBLIC,
    });

    // 버튼·크론이 이 메시지를 갱신할 수 있게 id를 붙여둔다
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
            '/party history for the last few',
            // 버튼으론 슬래시 커맨드를 못 불러서 모달로 연다
            [button(PARTY_CREATE_ID, 'Create a party', ButtonStyle.Primary)],
          ),
        ),
      );

    const breakdown = Object.values(PartyVisibility)
      .map(
        (value) =>
          `${PartyVisibilityLabel[value]} ${parties.filter((party) => party.visibility === value).length}`,
      )
      .join(' · ');

    return interaction.editReply(
      payload(
        manageCard({
          title: `Open Parties · ${parties.length}`,
          rows: parties.map((party) => ({
            text: this.partyMessage.line(party),
          })),
          footer: `${breakdown} · Join from the recruiting message in its own channel`,
        }),
      ),
    );
  }

  @Button(PARTY_CREATE_ID)
  async createPrompt(@Context() [interaction]: ButtonContext) {
    return interaction.showModal(
      new ModalBuilder()
        .setCustomId(PARTY_CREATE_ID)
        .setTitle('Open a party')
        .addComponents(
          // 모달엔 셀렉트가 없어 인원·공개범위는 기본값으로 연다
          this.modalRow('name', 'Party name'),
          this.modalRow('mission', 'Mission (e.g. Mot (Void) — Survival)'),
        ),
    );
  }

  @Modal(PARTY_CREATE_ID)
  async createSubmit(@Context() [interaction]: ModalContext) {
    if (!interaction.guildId) return interaction.reply(guildOnly());

    const party = await this.partyService.create({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      hostUserId: interaction.user.id,
      name: interaction.fields.getTextInputValue('name'),
      mission: interaction.fields.getTextInputValue('mission'),
      partySize: DEFAULT_PARTY_SIZE,
      visibility: PartyVisibility.PUBLIC,
    });

    await interaction.reply(this.partyMessage.build(party));
    const message = await interaction.fetchReply();
    return this.partyService.attachMessage(party.id, message.id);
  }

  @Subcommand({ name: 'history', description: 'Show recently closed parties' })
  async history(@Context() [interaction]: SlashCommandContext) {
    if (!interaction.guildId) return interaction.editReply(guildOnly());

    const parties = await this.partyService.history(interaction.guildId);

    if (!parties.length)
      return interaction.editReply(
        payload(
          emptyCard(
            'No closed parties',
            'Nothing has wrapped up here yet.',
            '/party create to open one',
          ),
        ),
      );

    return interaction.editReply(
      payload(
        manageCard({
          accent: Accent.Muted,
          title: `Recent Parties · ${parties.length}`,
          rows: parties.map((party) => ({
            text: `${this.partyMessage.line(party)} · closed ${relative(party.updatedAt)}`,
          })),
          footer: 'Most recent first · /party create to open a new one',
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

  private modalRow(id: string, label: string) {
    return new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId(id)
        .setLabel(label)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100),
    );
  }
}
