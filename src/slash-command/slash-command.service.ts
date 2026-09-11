import {
  AlarmService,
  CYCLE_REMIND_LEAD_MINUTES,
  REMIND_LEAD_MINUTES,
} from '@/alarm/alarm.service';
import {
  button,
  ephemeral,
  okCard,
  payload,
  relative,
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
  WarframeApiService,
} from '@/warframe-api/warframe-api.service';
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
import { IncarnonCommand } from './dto/incarnon.command.dto';
import { VoidFissuresCommand } from './dto/void-fissures.command.dto';
import { DropItemAutocompleteInterceptor } from './interceptors/drop-item-autocomplete.interceptor';
import { IncarnonWeaponAutocompleteInterceptor } from './interceptors/incarnon-weapon-autocomplete.interceptor';

/**
 * 🔔 기준 시각 몇 분 전에 DM으로 한 번 오는 개인 리마인더. 다시 누르면 취소된다.
 * 기준이 하나로 정해지는 커맨드에만 붙는다 — `RemindTarget`이 그 목록이고,
 * 무엇의 몇 분 전인지는 `remindMomentOf()`·`leadFor()`가 정한다.
 *
 * 지역 축은 안 쓰더라도 customId에 자리를 남긴다 — 세그먼트 수가 달라지면 라우팅이 갈라진다.
 */
const remindButton = (
  target: RemindTarget,
  option?: CycleName,
  label = '🔔 Remind me',
) => [button(`alarm/remind/${target}/${option ?? FILTER_OFF}`, label)];

/** 사이클 🔔는 지역마다 하나다 — 라벨은 행성 괄호를 떼야 버튼 셋이 한 줄에 든다 */
const cycleRemindButtons = () =>
  Object.values(CycleName).flatMap((name) =>
    remindButton(
      TargetCommand.Cycles,
      name,
      `🔔 ${CycleLabel[name].split(' (')[0]}`,
    ),
  );

@Injectable()
export class SlashCommandService {
  constructor(
    private readonly warframeApi: WarframeApiService,
    private readonly alarmService: AlarmService,
  ) {}

  @SlashCommand({
    name: 'archon-hunt',
    description: 'Get the current Archon Hunt information',
  })
  async archonHunt(@Context() [interaction]: SlashCommandContext) {
    const archon = await this.warframeApi.archonHunt(
      remindButton(TargetCommand.ArchonHunt),
    );
    return interaction.editReply(payload(archon));
  }

  @SlashCommand({
    name: 'sortie',
    description: 'Get the current Sortie information',
  })
  async sortie(@Context() [interaction]: SlashCommandContext) {
    const sortie = await this.warframeApi.sortie(
      remindButton(TargetCommand.Sortie),
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

  /**
   * 티어를 좁힌 화면에서만 페이저가 붙는다(요약 화면은 티어당 2줄이라 넘길 게 없다).
   * 두 필터 축(티어·스틸패스)을 customId에 실어야 페이지를 넘기거나 다른 축을 켜도
   * 먼저 건 필터가 살아남는다 — void-trader와 같은 이유.
   */
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
    // 도착 알림이라 부재 화면에서만 의미가 있다 — 와 있는 동안은 서비스가 버린다
    const voidTrader = await this.warframeApi.voidTrader(
      undefined,
      0,
      remindButton(TargetCommand.VoidTrader),
    );
    return interaction.editReply(payload(voidTrader));
  }

  /** 카테고리 전환. 값이 망가졌으면 기본(요약) 화면으로 떨어뜨린다 */
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

  /**
   * 고른 카테고리 안에서 8개씩 끊어 같은 메시지를 갈아끼운다(새 메시지를 쌓으면 채널이 오염된다).
   * 버튼 인터랙션이라 커맨드의 15분 토큰 만료와 무관하게 계속 눌린다.
   */
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
    const cycles = await this.warframeApi.cycles(cycleRemindButtons());
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

  /** 주기로 좁힌다 — 일간과 주간은 남은 시간이 달라 같이 볼 이유가 없다 */
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
      remindButton(TargetCommand.Archimedea),
    );
    return interaction.editReply(payload(archimedea));
  }

  /**
   * detail은 미션 1개 = 1페이지. 다 쌓으면 편차·위험 설명문이 메시지 합 한도를 넘겨
   * 서버가 통째로 400을 준다 — 페이징이 그 유일한 방어다.
   * 두 축(종·detail)이 customId에 실려 있다(`all`이면 필터 없음) — 페이지를 넘기거나
   * 한 축을 바꿔도 나머지 축이 살아 있어야 같은 목록을 계속 보게 된다.
   */
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
      remindButton(TargetCommand.Archimedea),
      Number(page),
    );
    return interaction.update(payload(archimedea));
  }

  /**
   * 🔔 토글. `update()`가 아니라 ephemeral `reply()`인 이유 — 이 카드는 채널의 모두가
   * 보는 것이고 리마인더는 누른 사람 것이다. 버튼 라벨은 유저별로 못 바꾸므로
   * "등록됐는지 취소됐는지"는 이 응답만이 말해준다.
   */
  @Button('alarm/remind/:target/:option')
  async remind(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('target') target: string,
    @ComponentParam('option') option: string,
  ) {
    // 버튼은 defer 대상이 아니라 여기서 던지면 전역 필터가 ephemeral 에러 카드로 받는다
    if (!interaction.guildId)
      throw new BadRequestException(
        'This needs a server channel to fall back to when your DMs are closed.',
      );
    if (!isRemindTarget(target))
      throw new BadRequestException('That reminder is no longer available.');

    // 지역은 사이클에만 실린다 — 나머지는 `all`이 와서 걸러진다
    const region = isCycleName(option) ? option : undefined;
    const at = await this.alarmService.remind({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      target,
      option: region,
    });
    // 사이클은 카드 하나에 지역 셋이 붙으므로 어느 지역을 걸었는지가 응답의 유일한 단서다
    const label = region
      ? CycleLabel[region]
      : TargetCommandLabel[target as TargetCommand];
    const lead =
      target === TargetCommand.Cycles
        ? CYCLE_REMIND_LEAD_MINUTES
        : REMIND_LEAD_MINUTES;

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

  /** weapon을 주면 그 무기 상세, 없으면 이번 주 서킷 로테이션 */
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

  /** 이름을 잘못 친 카드에서 돌아올 자리 — 없으면 커맨드 재입력이 유일한 길이 된다 */
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

  /**
   * 아이템 하나로 좁혀졌을 때만 페이저가 붙는다. 이름이 유저 입력이라 customId에
   * `encodeURIComponent`로 실린다 — 공백·`/`가 그대로 들어가면 라우팅이 깨진다.
   */
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
}
