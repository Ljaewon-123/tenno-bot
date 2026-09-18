import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { Injectable } from '@nestjs/common';
import type { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

/**
 * /relic 의 name 옵션 자동완성. 드랍 인덱스의 성유물 이름만 보여준다 —
 * `/drop` 쪽(itemName)과 달리 이건 sourceName 축이다.
 */
@Injectable()
export class RelicAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(private readonly warframeApi: WarframeApiService) {
    super();
  }

  async transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'name') return;

    // 자동완성 응답 제한도 3초라 실패하면 조용히 빈 목록으로 넘긴다
    const names = await this.warframeApi
      .searchRelicNames(focused.value)
      .catch(() => [] as string[]);
    return interaction.respond(
      names.map((name) => ({ name: name.slice(0, 100), value: name })),
    );
  }
}
