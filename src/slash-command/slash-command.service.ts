import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { Injectable, UseInterceptors } from '@nestjs/common';
import type { SlashCommandContext } from 'necord';
import { Context, Options, SlashCommand } from 'necord';
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
    return interaction.editReply({ embeds: [archon] });
  }

  @SlashCommand({
    name: 'sortie',
    description: 'Get the current Sortie information',
  })
  async sortie(@Context() [interaction]: SlashCommandContext) {
    const sortie = await this.warframeApi.sortie();
    return interaction.editReply({ embeds: [sortie] });
  }

  @SlashCommand({
    name: 'events',
    description: 'Get the current Events information',
  })
  async events(@Context() [interaction]: SlashCommandContext) {
    const events = await this.warframeApi.events();
    return interaction.editReply({ embeds: [events] });
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
    return interaction.editReply({ embeds: [voidFissures] });
  }

  @SlashCommand({
    name: 'void-trader',
    description: "Get the current Void Trader (Baro Ki'Teer) information",
  })
  async voidTrader(@Context() [interaction]: SlashCommandContext) {
    const voidTrader = await this.warframeApi.voidTrader();
    return interaction.editReply({ embeds: [voidTrader] });
  }

  @SlashCommand({
    name: 'cycles',
    description: 'Get the current open world day/night cycles',
  })
  async cycles(@Context() [interaction]: SlashCommandContext) {
    const cycles = await this.warframeApi.cycles();
    return interaction.editReply({ embeds: [cycles] });
  }

  @SlashCommand({
    name: 'nightwave',
    description: 'Get the current Nightwave challenges',
  })
  async nightwave(@Context() [interaction]: SlashCommandContext) {
    const nightwave = await this.warframeApi.nightwave();
    return interaction.editReply({ embeds: [nightwave] });
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
    return interaction.editReply({ embeds: [archimedea] });
  }

  @SlashCommand({
    name: 'incarnon',
    description: 'Get this week Incarnon Genesis rotation from the Circuit',
  })
  async incarnon(@Context() [interaction]: SlashCommandContext) {
    const incarnon = await this.warframeApi.incarnon();
    return interaction.editReply({ embeds: [incarnon] });
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
    return interaction.editReply({ embeds: [dropSources] });
  }
}
