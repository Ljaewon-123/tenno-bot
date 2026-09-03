import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { Injectable } from '@nestjs/common';
import type { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

/** /drop 의 item 옵션 자동완성. 드랍테이블에 실제로 존재하는 이름만 보여준다 */
@Injectable()
export class DropItemAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(private readonly warframeApi: WarframeApiService) {
    super();
  }

  async transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'item') return;

    // 자동완성 응답 제한도 3초라 실패하면 조용히 빈 목록으로 넘긴다
    const names = await this.warframeApi
      .searchItemNames(focused.value)
      .catch(() => [] as string[]);
    return interaction.respond(
      names.map((name) => ({ name: name.slice(0, 100), value: name })),
    );
  }
}
