import { payload } from '@/utils/discord-embed';
import { isDropCategory } from '@/warframe-api/drop-table/vo/enum';
import {
  DROP_KEY,
  INCARNON_KEY,
  RELIC_OPEN,
  RELIC_REWARD,
} from '@/warframe-api/constants';
import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { Injectable, UseInterceptors } from '@nestjs/common';
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
import { DropCommand } from './dto/drop.command.dto';
import { IncarnonCommand } from './dto/incarnon.command.dto';
import { RelicCommand } from './dto/relic.command.dto';
import { DropItemAutocompleteInterceptor } from './interceptors/drop-item-autocomplete.interceptor';
import { IncarnonWeaponAutocompleteInterceptor } from './interceptors/incarnon-weapon-autocomplete.interceptor';
import { RelicAutocompleteInterceptor } from './interceptors/relic-autocomplete.interceptor';

@Injectable()
export class ItemCommandService {
  constructor(private readonly warframeApi: WarframeApiService) {}

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

  /** 아이템 이름은 유저 입력이라 customId에 encodeURIComponent로 싣는다 */
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

  @UseInterceptors(RelicAutocompleteInterceptor)
  @SlashCommand({
    name: 'relic',
    description: 'Show everything that drops from one relic',
  })
  async relic(
    @Context() [interaction]: SlashCommandContext,
    @Options() { relicName }: RelicCommand,
  ) {
    const relic = await this.warframeApi.relic(relicName);
    return interaction.editReply(payload(relic));
  }

  @StringSelect(RELIC_OPEN)
  async relicOpen(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() [relicName]: string[],
  ) {
    const relic = await this.warframeApi.relic(relicName);
    return interaction.update(payload(relic));
  }

  @StringSelect(RELIC_REWARD)
  async relicReward(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() [itemName]: string[],
  ) {
    const dropSources = await this.warframeApi.dropSources(itemName);
    return interaction.update(payload(dropSources));
  }
}
