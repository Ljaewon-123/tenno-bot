import { AlarmService } from '@/alarm/alarm.service';
import { FeedbackService } from '@/feedback/feedback.service';
import {
  button,
  card,
  ephemeral,
  okCard,
  payload,
  relative,
  SUPPORT_SERVER_URL,
} from '@/utils/discord-embed';
import {
  isRemindTarget,
  RemindTarget,
  TargetCommand,
  TargetCommandLabel,
} from '@/warframe-api/enum';
import { isDropCategory } from '@/warframe-api/drop-table/vo/enum';
import {
  ARCHIMEDEA_DETAIL,
  DROP_KEY,
  FILTER_OFF,
  FISSURE_HARD,
  INCARNON_KEY,
  RELIC_OPEN,
  RELIC_REWARD,
} from '@/warframe-api/constants';
import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import {
  ArchimedeaType,
  CycleLabel,
  CycleName,
  isCycleName,
  isNightwaveFilter,
  isVoidTier,
  isVoidTraderCategory,
} from '@/warframe-api/world-state/vo/enum';
import {
  BadRequestException,
  Injectable,
  UseInterceptors,
} from '@nestjs/common';
import type {
  ButtonContext,
  SlashCommandContext,
  StringSelectContext,
} from 'necord';
import {
  Button,
  ComponentParam,
  Context,
  Options,
  SelectedStrings,
  SlashCommand,
  StringSelect,
} from 'necord';
import { ArchimedeaCommand } from './dto/archimedea.command.dto';
import { DropCommand } from './dto/drop.command.dto';
import { FeedbackCommand } from './dto/feedback.command.dto';
import { IncarnonCommand } from './dto/incarnon.command.dto';
import { RelicCommand } from './dto/relic.command.dto';
import { VoidFissuresCommand } from './dto/void-fissures.command.dto';
import { DropItemAutocompleteInterceptor } from './interceptors/drop-item-autocomplete.interceptor';
import { IncarnonWeaponAutocompleteInterceptor } from './interceptors/incarnon-weapon-autocomplete.interceptor';
import { RelicAutocompleteInterceptor } from './interceptors/relic-autocomplete.interceptor';

@Injectable()
export class SlashCommandService {
  constructor(
    private readonly warframeApi: WarframeApiService,
    private readonly alarmService: AlarmService,
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

  @SlashCommand({
    name: 'archon-hunt',
    description: 'Get the current Archon Hunt information',
  })
  async archonHunt(@Context() [interaction]: SlashCommandContext) {
    const archon = await this.warframeApi.archonHunt(
      this.remindButton(TargetCommand.ArchonHunt),
    );
    return interaction.editReply(payload(archon));
  }

  @SlashCommand({
    name: 'sortie',
    description: 'Get the current Sortie information',
  })
  async sortie(@Context() [interaction]: SlashCommandContext) {
    const sortie = await this.warframeApi.sortie(
      this.remindButton(TargetCommand.Sortie),
    );
    return interaction.editReply(payload(sortie));
  }

  @SlashCommand({
    name: 'events',
    description: 'Get the current Events information',
  })
  async events(@Context() [interaction]: SlashCommandContext) {
    const events = await this.warframeApi.events();
    return interaction.editReply(payload(events));
  }

  @SlashCommand({
    name: 'void-fissures',
    description: 'Get the current Void Fissures information',
  })
  async voidFissures(
    @Context() [interaction]: SlashCommandContext,
    @Options() { tier, steelPath }: VoidFissuresCommand,
  ) {
    const voidFissures = await this.warframeApi.voidFissures(
      tier,
      undefined,
      0,
      steelPath,
    );
    return interaction.editReply(payload(voidFissures));
  }

  @Button(`${TargetCommand.VoidFissures}/:tier/:hard/page/:page`)
  async voidFissuresPage(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('tier') tier: string,
    @ComponentParam('hard') hard: string,
    @ComponentParam('page') page: string,
  ) {
    const voidFissures = await this.warframeApi.voidFissures(
      isVoidTier(tier) ? tier : undefined,
      undefined,
      Number(page),
      hard === FISSURE_HARD,
    );
    return interaction.update(payload(voidFissures));
  }

  @SlashCommand({
    name: 'void-trader',
    description: "Get the current Void Trader (Baro Ki'Teer) information",
  })
  async voidTrader(@Context() [interaction]: SlashCommandContext) {
    const voidTrader = await this.warframeApi.voidTrader(
      undefined,
      0,
      this.remindButton(TargetCommand.VoidTrader),
    );
    return interaction.editReply(payload(voidTrader));
  }

  @StringSelect(`${TargetCommand.VoidTrader}/category`)
  async voidTraderCategory(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() [category]: string[],
  ) {
    const voidTrader = await this.warframeApi.voidTrader(
      isVoidTraderCategory(category) ? category : undefined,
    );
    return interaction.update(payload(voidTrader));
  }

  @Button(`${TargetCommand.VoidTrader}/:category/page/:page`)
  async voidTraderPage(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('category') category: string,
    @ComponentParam('page') page: string,
  ) {
    const voidTrader = await this.warframeApi.voidTrader(
      isVoidTraderCategory(category) ? category : undefined,
      Number(page),
    );
    return interaction.update(payload(voidTrader));
  }

  @SlashCommand({
    name: 'cycles',
    description: 'Get the current open world day/night cycles',
  })
  async cycles(@Context() [interaction]: SlashCommandContext) {
    const cycles = await this.warframeApi.cycles(this.cycleRemindButtons());
    return interaction.editReply(payload(cycles));
  }

  @SlashCommand({
    name: 'nightwave',
    description: 'Get the current Nightwave challenges',
  })
  async nightwave(@Context() [interaction]: SlashCommandContext) {
    const nightwave = await this.warframeApi.nightwave();
    return interaction.editReply(payload(nightwave));
  }

  @Button(`${TargetCommand.Nightwave}/filter/:filter`)
  async nightwaveFilter(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('filter') filter: string,
  ) {
    const nightwave = await this.warframeApi.nightwave(
      undefined,
      isNightwaveFilter(filter) ? filter : undefined,
    );
    return interaction.update(payload(nightwave));
  }

  /** 인게임에서 이름이 Shockwave로 바뀌어 둘 다 찾을 수 있게 별칭을 남긴다 */
  @SlashCommand({
    name: 'shockwave',
    description: 'Get the current Nightwave challenges (alias of /nightwave)',
  })
  async shockwave(@Context() context: SlashCommandContext) {
    return this.nightwave(context);
  }

  @SlashCommand({
    name: 'archimedea',
    description: 'Get the current Deep and Temporal Archimedea',
  })
  async archimedea(
    @Context() [interaction]: SlashCommandContext,
    @Options() { type, detail }: ArchimedeaCommand,
  ) {
    const archimedea = await this.warframeApi.archimedea(
      type,
      detail,
      this.remindButton(TargetCommand.Archimedea),
    );
    return interaction.editReply(payload(archimedea));
  }

  @Button(`${TargetCommand.Archimedea}/:type/:detail/page/:page`)
  async archimedeaPage(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('type') type: string,
    @ComponentParam('detail') detail: string,
    @ComponentParam('page') page: string,
  ) {
    const archimedea = await this.warframeApi.archimedea(
      type === FILTER_OFF ? undefined : (type as ArchimedeaType),
      detail === ARCHIMEDEA_DETAIL,
      this.remindButton(TargetCommand.Archimedea),
      Number(page),
    );
    return interaction.update(payload(archimedea));
  }

  /** 리마인더는 누른 사람 것이라 update()가 아니라 ephemeral reply()로 결과를 알린다 */
  @Button('alarm/remind/:target/:option')
  async remind(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('target') target: string,
    @ComponentParam('option') option: string,
  ) {
    if (!interaction.guildId)
      throw new BadRequestException(
        'This needs a server channel to fall back to when your DMs are closed.',
      );
    if (!isRemindTarget(target))
      throw new BadRequestException('That reminder is no longer available.');

    const region = isCycleName(option) ? option : undefined;
    const at = await this.alarmService.remind({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      target,
      option: region,
    });
    const label = region
      ? CycleLabel[region]
      : TargetCommandLabel[target as TargetCommand];
    const lead = this.alarmService.leadFor(target);

    return interaction.reply(
      ephemeral(
        at
          ? okCard(
              `Reminder set · ${label}`,
              `I will DM you ${relative(at)} — ${lead} minutes before.`,
              'Press 🔔 again to cancel',
            )
          : okCard(
              `Reminder cancelled · ${label}`,
              'Nothing will be sent.',
              'Press 🔔 again to set it back',
            ),
      ),
    );
  }

  @UseInterceptors(IncarnonWeaponAutocompleteInterceptor)
  @SlashCommand({
    name: 'incarnon',
    description:
      'Get this week Incarnon Genesis rotation, or one weapon detail',
  })
  async incarnon(
    @Context() [interaction]: SlashCommandContext,
    @Options() { weapon }: IncarnonCommand,
  ) {
    const incarnon = weapon
      ? await this.warframeApi.incarnonWeapon(weapon)
      : await this.warframeApi.incarnon();
    return interaction.editReply(payload(incarnon));
  }

  @Button(INCARNON_KEY)
  async incarnonRotation(@Context() [interaction]: ButtonContext) {
    const incarnon = await this.warframeApi.incarnon();
    return interaction.update(payload(incarnon));
  }

  @UseInterceptors(DropItemAutocompleteInterceptor)
  @SlashCommand({
    name: 'drop',
    description: 'Find where an item drops from',
  })
  async dropSources(
    @Context() [interaction]: SlashCommandContext,
    @Options() { itemName, category }: DropCommand,
  ) {
    const dropSources = await this.warframeApi.dropSources(itemName, category);
    return interaction.editReply(payload(dropSources));
  }

  /** 아이템 이름은 유저 입력이라 customId에 encodeURIComponent로 싣는다 */
  @Button(`${DROP_KEY}/:category/:item/page/:page`)
  async dropSourcesPage(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('category') category: string,
    @ComponentParam('item') item: string,
    @ComponentParam('page') page: string,
  ) {
    const dropSources = await this.warframeApi.dropSources(
      decodeURIComponent(item),
      isDropCategory(category) ? category : undefined,
      undefined,
      Number(page),
    );
    return interaction.update(payload(dropSources));
  }

  @UseInterceptors(RelicAutocompleteInterceptor)
  @SlashCommand({
    name: 'relic',
    description: 'Show everything that drops from one relic',
  })
  async relic(
    @Context() [interaction]: SlashCommandContext,
    @Options() { relicName }: RelicCommand,
  ) {
    const relic = await this.warframeApi.relic(relicName);
    return interaction.editReply(payload(relic));
  }

  @StringSelect(RELIC_OPEN)
  async relicOpen(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() [relicName]: string[],
  ) {
    const relic = await this.warframeApi.relic(relicName);
    return interaction.update(payload(relic));
  }

  @StringSelect(RELIC_REWARD)
  async relicReward(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() [itemName]: string[],
  ) {
    const dropSources = await this.warframeApi.dropSources(itemName);
    return interaction.update(payload(dropSources));
  }

  /** 지역 축은 안 쓰더라도 customId에 자리를 남긴다 — 세그먼트 수가 달라지면 라우팅이 갈라진다 */
  private remindButton(
    target: RemindTarget,
    option?: CycleName,
    label = '🔔 Remind me',
  ) {
    return [button(`alarm/remind/${target}/${option ?? FILTER_OFF}`, label)];
  }

  /** 라벨에서 행성 괄호를 떼야 버튼 셋이 한 줄에 든다 */
  private cycleRemindButtons() {
    return Object.values(CycleName).flatMap((name) =>
      this.remindButton(
        TargetCommand.Cycles,
        name,
        `🔔 ${CycleLabel[name].split(' (')[0]}`,
      ),
    );
  }
}
