import { payload } from '@/utils/discord-embed';
import { TargetCommand } from '@/warframe-api/enum';
import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { Injectable, UseInterceptors } from '@nestjs/common';
import type { ButtonContext, SlashCommandContext } from 'necord';
import { Button, ComponentParam, Context, Options, SlashCommand } from 'necord';
import { ArchimedeaCommand } from './dto/archimedea.command.dto';
import { DropCommand } from './dto/drop.command.dto';
import { VoidFissuresCommand } from './dto/void-fissures.command.dto';
import { DropItemAutocompleteInterceptor } from './interceptors/drop-item-autocomplete.interceptor';

@Injectable()
export class SlashCommandService {
  constructor(private readonly warframeApi: WarframeApiService) {}

  @SlashCommand({
    name: 'archon-hunt',
    description: 'Get the current Archon Hunt information',
  })
  async archonHunt(@Context() [interaction]: SlashCommandContext) {
    const archon = await this.warframeApi.archonHunt();
    return interaction.editReply(payload(archon));
  }

  @SlashCommand({
    name: 'sortie',
    description: 'Get the current Sortie information',
  })
  async sortie(@Context() [interaction]: SlashCommandContext) {
    const sortie = await this.warframeApi.sortie();
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
    const archimedea = await this.warframeApi.archimedea(type, detail);
    return interaction.editReply(payload(archimedea));
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
