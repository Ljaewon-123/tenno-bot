import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { EmbedBuilder } from 'discord.js';
import { ArchonReward } from './world-state/vo/enum';
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
        { name: '남은 시간', value: `<t:${expiryTimestamp}:R>` },
        {
          name: '미션',
          value: archon.missions
            .map((mission) => `${mission.node} - ${mission.type}`)
            .join('\n'),
        },
      )
      .setColor(0x5865f2);
  }
  /** 출격 (소티) */
  async sortie() {
    return this.worldStateService.sortie();
  }
  /** 이벤트 */
  async events() {
    return this.worldStateService.events();
  }
  /** 보이드 균열 */
  async voidFissures() {
    return this.worldStateService.voidFissures();
  }
}
