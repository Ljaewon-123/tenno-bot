import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { EmbedBuilder } from 'discord.js';
import { ArchonReward, VoidTier } from './world-state/vo/enum';
import { Fissure } from './world-state/vo/types';
import { WorldStateService } from './world-state/world-state.service';

@Injectable()
export class WarframeApiService {
  constructor(private readonly worldStateService: WorldStateService) {}

  /** 집정관 */
  async archonHunt() {
    const archon = await this.worldStateService.archonHunt();
    const expiryTimestamp = dayjs(archon.expiry).unix();
    return new EmbedBuilder()
      .setTitle('Archon Hunt')
      .setDescription(`Boss: ${archon.boss}`)
      .addFields(
        { name: 'Reward Pool', value: archon.rewardPool },
        { name: 'Reward Shard', value: ArchonReward[archon.boss] },
        { name: 'Time Remaining', value: `<t:${expiryTimestamp}:R>` },
        {
          name: 'Missions',
          value: archon.missions
            .map((mission) => `${mission.node} - ${mission.type}`)
            .join('\n'),
        },
      )
      .setColor(0x5865f2);
  }
  /** 출격 (소티) */
  async sortie() {
    const sortie = await this.worldStateService.sortie();
    const expiryTimestamp = dayjs(sortie.expiry).unix();
    return new EmbedBuilder()
      .setTitle('Sortie')
      .setDescription(`Boss: ${sortie.boss}`)
      .addFields(
        { name: 'Reward Pool', value: sortie.rewardPool },
        { name: 'Time Remaining', value: `<t:${expiryTimestamp}:R>` },
        {
          name: 'Missions',
          value: sortie.variants
            .map(
              (variant) =>
                `${variant.node} - ${variant.missionType} (${variant.modifierDescription})`,
            )
            .join('\n'),
        },
      )
      .setColor(0x5865f2);
  }

  /** 이벤트 */
  async events() {
    const events = await this.worldStateService.events();
    const activeEvents = events.filter((event) => !event.expired);

    const embed = new EmbedBuilder().setTitle('Events').setColor(0x5865f2);

    if (activeEvents.length === 0) {
      return embed.setDescription('No active events currently.');
    }

    embed.addFields(
      activeEvents.slice(0, 25).map((event) => {
        const expiryTimestamp = dayjs(event.expiry).unix();
        const lines = [
          event.node && `Location: ${event.node}`,
          event.tooltip,
          `Time Remaining: <t:${expiryTimestamp}:R>`,
        ].filter((line): line is string => Boolean(line));

        return {
          name: event.description.slice(0, 256),
          value: lines.join('\n').slice(0, 1024),
        };
      }),
    );
    return embed;
  }

  /** 보이드 균열 */
  async voidFissures(options?: VoidTier[]) {
    const fissures = await this.worldStateService.voidFissures(options);
    const activeByTier = fissures
      .filter((fissure) => !fissure.expired)
      .reduce<Record<string, Fissure[]>>((acc, fissure) => {
        (acc[fissure.tier] ??= []).push(fissure);
        return acc;
      }, {});

    const embed = new EmbedBuilder()
      .setTitle('Void Fissures')
      .setColor(0x5865f2);

    for (const tier of Object.values(VoidTier)) {
      const fissuresInTier = activeByTier[tier];
      if (!fissuresInTier?.length) continue;

      embed.addFields({
        name: tier,
        value: fissuresInTier
          .map(
            (fissure) =>
              `${fissure.node} - ${fissure.missionType} (${fissure.enemy})${fissure.isHard ? ' [Steel Path]' : ''}`,
          )
          .join('\n')
          .slice(0, 1024),
      });
    }
    return embed;
  }

  /** 보이드 상인 (바로 키티어) */
  async voidTrader() {
    const trader = await this.worldStateService.voidTrader();
    const now = dayjs();
    const isActive =
      now.isAfter(trader.activation) && now.isBefore(trader.expiry);
    const nextTimestamp = dayjs(
      isActive ? trader.expiry : trader.activation,
    ).unix();

    const embed = new EmbedBuilder()
      .setTitle(`Void Trader - ${trader.character}`)
      .setDescription(`Location: ${trader.location}`)
      .addFields({
        name: isActive ? 'Departs' : 'Arrives',
        value: `<t:${nextTimestamp}:R>`,
      })
      .setColor(0x5865f2);

    if (isActive && trader.inventory.length) {
      embed.addFields({
        name: 'Inventory',
        value: trader.inventory
          .map((item) => `${item.item} - ${item.ducats}dt / ${item.credits}cr`)
          .join('\n')
          .slice(0, 1024),
      });
    }

    return embed;
  }
}
