import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { Injectable } from '@nestjs/common';
import type { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

/** /incarnon 의 weapon 옵션 자동완성. 인카논 제네시스가 있는 45종만 보여준다 */
@Injectable()
export class IncarnonWeaponAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(private readonly warframeApi: WarframeApiService) {
    super();
  }

  async transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'weapon') return;

    // wfcd 메모리 조회라 실패할 일이 없지만, 자동완성 응답 제한 3초는 여기도 똑같이 걸린다
    const names = this.warframeApi.searchIncarnonNames(focused.value);
    return interaction.respond(names.map((name) => ({ name, value: name })));
  }
}
