import { button, payload } from '@/utils/discord-embed';
import { RemindTarget, TargetCommand } from '@/warframe-api/enum';
import {
  ARCHIMEDEA_DETAIL,
  FILTER_OFF,
  FISSURE_HARD,
} from '@/warframe-api/constants';
import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import {
  ArchimedeaType,
  CycleLabel,
  CycleName,
  isNightwaveFilter,
  isVoidTier,
  isVoidTraderCategory,
} from '@/warframe-api/world-state/vo/enum';
import { Injectable } from '@nestjs/common';
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
import { REMIND_KEY } from './constants';
import { ArchimedeaCommand } from './dto/archimedea.command.dto';
import { VoidFissuresCommand } from './dto/void-fissures.command.dto';

@Injectable()
export class WorldStateCommandService {
  constructor(private readonly warframeApi: WarframeApiService) {}

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

  /** 지역 축은 안 쓰더라도 customId에 자리를 남긴다 — 세그먼트 수가 달라지면 라우팅이 갈라진다 */
  private remindButton(
    target: RemindTarget,
    option?: CycleName,
    label = '🔔 Remind me',
  ) {
    return [button(`${REMIND_KEY}/${target}/${option ?? FILTER_OFF}`, label)];
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
