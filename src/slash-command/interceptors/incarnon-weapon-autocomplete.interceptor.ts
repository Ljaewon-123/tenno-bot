import { WarframeApiService } from '@/warframe-api/warframe-api.service.js';
import { Injectable } from '@nestjs/common';
import type { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

@Injectable()
export class IncarnonWeaponAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(private readonly warframeApi: WarframeApiService) {
    super();
  }

  async transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'weapon') return;

    const names = this.warframeApi.searchIncarnonNames(focused.value);
    return interaction.respond(names.map((name) => ({ name, value: name })));
  }
}
