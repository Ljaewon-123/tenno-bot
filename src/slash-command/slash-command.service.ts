import { CommandAutocompleteInterceptor } from '@/app/command-autocomplete.interceptor';
import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { Injectable, UseInterceptors } from '@nestjs/common';
import type { SlashCommandContext } from 'necord';
import { Context, Options, SlashCommand } from 'necord';
import { AutoDto } from './dto/auto.dto';
import { TextDto } from './dto/text.dto';

@Injectable()
export class SlashCommandService {
  constructor(private readonly warframeApi: WarframeApiService) {}

  @SlashCommand({
    name: 'archon-hunt',
    description: 'Get the current Archon Hunt information',
  })
  async archonHunt(@Context() [interaction]: SlashCommandContext) {
    const archon = await this.warframeApi.archonHunt();
    return interaction.reply({ embeds: [archon] });
  }

  @SlashCommand({
    name: 'sortie',
    description: 'Get the current Sortie information',
  })
  async sortie(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply('pong!');
  }

  @SlashCommand({
    name: 'events',
    description: 'Get the current Events information',
  })
  async events(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply('pong!');
  }

  @SlashCommand({
    name: 'void-fissures',
    description: 'Get the current Void Fissures information',
  })
  async voidFissures(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply('pong!');
  }

  @SlashCommand({
    name: 'length',
    description: 'Calculate the length of your text',
  })
  async onLength(
    @Context() [interaction]: SlashCommandContext,
    @Options() { text }: TextDto,
  ) {
    return interaction.reply({
      content: `The length of your text is: ${text.length}`,
    });
  }

  @UseInterceptors(CommandAutocompleteInterceptor)
  @SlashCommand({
    name: 'cat',
    description: 'Retrieve information about a specific cat breed',
  })
  public async onSearch(
    @Context() [interaction]: SlashCommandContext,
    @Options() { cat }: AutoDto,
  ) {
    return interaction.reply({
      content: `I found information on the breed of ${cat} cat!`,
    });
  }
}
