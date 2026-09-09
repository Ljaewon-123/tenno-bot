import { CreatePartyCommand } from '@/party/dto/create-party.command.dto';
import { PartyMessageService, partyLine } from '@/party/party-message.service';
import { PartyService } from '@/party/party.service';
import { PartyVisibility, PartyVisibilityLabel } from '@/party/vo/enum';
import {
  Accent,
  button,
  emptyCard,
  manageCard,
  payload,
  relative,
} from '@/utils/discord-embed';
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
import { PartyCommands } from './decorators/party-commands.decorator';
import { guildOnly } from './guild-only';

/** 빈 화면 진입 버튼과 모달이 같은 id를 쓴다 — 버튼이 띄우는 모달이라 나눌 이유가 없다 */
const PARTY_CREATE_ID = 'party/create';

/** 모달로 열면 인원은 기본값이다 — 바꾸려면 /party create */
const DEFAULT_PARTY_SIZE = 4;

/** 모달 입력 한 칸 = 한 행. 둘 다 필수라 빈 파티가 생기지 않는다 */
const modalRow = (id: string, label: string) =>
  new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100),
  );

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
      partySize: size ?? 4,
      visibility: visibility ?? PartyVisibility.PUBLIC,
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
            '/party history for the last few',
            // 빈 화면은 막다른 길이 되면 안 된다. 버튼으로는 슬래시 커맨드를 못 부르므로
            // 진입 수단은 모달뿐이다 — 이름·미션만 받고 나머지는 기본값으로 연다
            [button(PARTY_CREATE_ID, 'Create a party', ButtonStyle.Primary)],
          ),
        ),
      );

    // 0인 범위도 남긴다 — 줄 모양이 매번 같아야 "친구만이 없다"가 읽힌다
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
          rows: parties.map((party) => ({ text: partyLine(party) })),
          footer: `${breakdown} · Join from the recruiting message in its own channel`,
        }),
      ),
    );
  }

  /** 빈 화면의 진입 버튼 → 모달. 버튼은 defer 대상이 아니라 여기서 바로 띄울 수 있다 */
  @Button(PARTY_CREATE_ID)
  async createPrompt(@Context() [interaction]: ButtonContext) {
    return interaction.showModal(
      new ModalBuilder()
        .setCustomId(PARTY_CREATE_ID)
        .setTitle('Open a party')
        .addComponents(
          // 모달에는 셀렉트가 없다 — 인원·공개범위는 기본값(4명·Public)으로 열고
          // 바꾸려면 /party create를 쓴다. 빈 화면에서 필요한 건 "일단 여는 것"이다
          modalRow('name', 'Party name'),
          modalRow('mission', 'Mission (e.g. Mot (Void) — Survival)'),
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

    // 모달 응답이 곧 모집 메시지다 — 버튼·크론이 갱신할 수 있게 id를 붙여둔다
    await interaction.reply(this.partyMessage.build(party));
    const message = await interaction.fetchReply();
    return this.partyService.attachMessage(party.id, message.id);
  }

  /** 마감 파티는 지우지 않아 기록이 이미 있다 — 조회 경로만 없었다 */
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
            text: `${partyLine(party)} · closed ${relative(party.updatedAt)}`,
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
}
