import { AlarmService, REMIND_LEAD_MINUTES } from '@/alarm/alarm.service';
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
import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { ArchimedeaType } from '@/warframe-api/world-state/vo/enum';
import {
  BadRequestException,
  Injectable,
  UseInterceptors,
} from '@nestjs/common';
import type { ButtonContext, SlashCommandContext } from 'necord';
import { Button, ComponentParam, Context, Options, SlashCommand } from 'necord';
import { ArchimedeaCommand } from './dto/archimedea.command.dto';
import { DropCommand } from './dto/drop.command.dto';
import { VoidFissuresCommand } from './dto/void-fissures.command.dto';
import { DropItemAutocompleteInterceptor } from './interceptors/drop-item-autocomplete.interceptor';

/**
 * 🔔 만료 30분 전에 DM으로 한 번 오는 개인 리마인더. 다시 누르면 취소된다.
 * 만료가 카드 하나로 정해지는 커맨드에만 붙는다 — RemindTarget이 그 목록이다.
 */
const remindButton = (target: RemindTarget) => [
  button(`alarm/remind/${target}`, '🔔 Remind me'),
];

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
    @Options() { tier }: VoidFissuresCommand,
  ) {
    const voidFissures = await this.warframeApi.voidFissures(tier);
    return interaction.editReply(payload(voidFissures));
  }

  @SlashCommand({
    name: 'void-trader',
    description: "Get the current Void Trader (Baro Ki'Teer) information",
  })
  async voidTrader(@Context() [interaction]: SlashCommandContext) {
    const voidTrader = await this.warframeApi.voidTrader();
    return interaction.editReply(payload(voidTrader));
  }

  /**
   * 재고 40종 넘김 — 8개씩 끊어 같은 메시지를 갈아끼운다(새 메시지를 쌓으면 채널이 오염된다).
   * 버튼 인터랙션이라 커맨드의 15분 토큰 만료와 무관하게 계속 눌린다.
   */
  @Button(`${TargetCommand.VoidTrader}/page/:page`)
  async voidTraderPage(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('page') page: string,
  ) {
    const voidTrader = await this.warframeApi.voidTrader(Number(page));
    return interaction.update(payload(voidTrader));
  }

  @SlashCommand({
    name: 'cycles',
    description: 'Get the current open world day/night cycles',
  })
  async cycles(@Context() [interaction]: SlashCommandContext) {
    const cycles = await this.warframeApi.cycles();
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
   * type은 customId에 실려 있다(`all`이면 필터 없음) — 안 그러면 넘긴 페이지에서 필터가 죽는다.
   */
  @Button(`${TargetCommand.Archimedea}/:type/page/:page`)
  async archimedeaPage(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('type') type: string,
    @ComponentParam('page') page: string,
  ) {
    const archimedea = await this.warframeApi.archimedea(
      type === 'all' ? undefined : (type as ArchimedeaType),
      true,
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
  @Button('alarm/remind/:target')
  async remind(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('target') target: string,
  ) {
    // 버튼은 defer 대상이 아니라 여기서 던지면 전역 필터가 ephemeral 에러 카드로 받는다
    if (!interaction.guildId)
      throw new BadRequestException(
        'This needs a server channel to fall back to when your DMs are closed.',
      );
    if (!isRemindTarget(target))
      throw new BadRequestException('That reminder is no longer available.');

    const at = await this.alarmService.remind({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      target,
    });
    const label = TargetCommandLabel[target];

    return interaction.reply(
      ephemeral(
        at
          ? okCard(
              `Reminder set · ${label}`,
              `I will DM you ${relative(at)} — ${REMIND_LEAD_MINUTES} minutes before it ends.`,
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

  @SlashCommand({
    name: 'incarnon',
    description: 'Get this week Incarnon Genesis rotation from the Circuit',
  })
  async incarnon(@Context() [interaction]: SlashCommandContext) {
    const incarnon = await this.warframeApi.incarnon();
    return interaction.editReply(payload(incarnon));
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
}
