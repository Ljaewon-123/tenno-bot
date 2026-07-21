import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { DropSource } from './entities/drop-source.entity';
import { DropSourceRepository } from './repositories/drop-source.repository';
import type {
  BlueprintLocation,
  DropReward,
  DropRewardList,
  DropTableData,
  KeyReward,
  MissionRewards,
  ModLocation,
  Relic,
  Syndicates,
  TransientReward,
} from './types';
import { DropCategory } from './vo/enum';

/** all.json → drop_source 역인덱스 구축 전담. 검색 API는 DropTableService */
@Injectable()
export class DropSourceService {
  constructor(private readonly dropSourceRepository: DropSourceRepository) {}

  /** all.json을 평탄화해 drop_source 테이블 전체 재구축 */
  @Transactional()
  async rebuildDropSources(all: DropTableData) {
    const rows = this.buildRows(all);
    await this.dropSourceRepository.clear();
    // ponytail: 전량 삭제 후 재삽입. 주 1회라 충분, 느려지면 diff upsert로
    for (let i = 0; i < rows.length; i += 1000) {
      await this.dropSourceRepository.insert(rows.slice(i, i + 1000));
    }
    return rows.length;
  }

  private buildRows(all: DropTableData): DropSource[] {
    return [
      ...this.missionRows(all.missionRewards),
      ...this.relicRows(all.relics),
      ...this.transientRows(all.transientRewards),
      // enemyModTables/enemyBlueprintTables는 mod/blueprintLocations의 역방향 중복이라 스킵
      ...this.enemyModRows(all.modLocations),
      ...this.enemyBlueprintRows(all.blueprintLocations),
      ...this.sortieRows(all.sortieRewards),
      ...this.keyRows(all.keyRewards),
      ...this.bountyRows(all),
      ...this.syndicateRows(all.syndicates),
      ...this.avatarRows(all),
    ];
  }

  private missionRows(missionRewards: MissionRewards): DropSource[] {
    const rows: DropSource[] = [];
    for (const [planet, nodes] of Object.entries(missionRewards)) {
      for (const [node, info] of Object.entries(nodes)) {
        for (const { reward, rotation } of this.iterateRewards(info.rewards)) {
          rows.push(
            this.row(
              reward.itemName,
              DropCategory.Mission,
              node,
              reward.chance,
              {
                planet,
                gameMode: info.gameMode,
                isEvent: info.isEvent,
                rotation,
                rarity: reward.rarity,
              },
            ),
          );
        }
      }
    }
    return rows;
  }

  private relicRows(relics: Relic[]): DropSource[] {
    return relics.flatMap((relic) =>
      relic.rewards.map((reward) =>
        this.row(
          reward.itemName,
          DropCategory.Relic,
          `${relic.tier} ${relic.relicName}`,
          reward.chance,
          { tier: relic.tier, state: relic.state, rarity: reward.rarity },
        ),
      ),
    );
  }

  private transientRows(transients: TransientReward[]): DropSource[] {
    return transients.flatMap((transient) =>
      transient.rewards.map((reward) =>
        this.row(
          reward.itemName,
          DropCategory.Transient,
          transient.objectiveName,
          reward.chance,
          { rotation: reward.rotation, rarity: reward.rarity },
        ),
      ),
    );
  }

  private enemyModRows(modLocations: ModLocation[]): DropSource[] {
    return modLocations.flatMap((mod) =>
      mod.enemies.map((enemy) =>
        this.row(
          mod.modName,
          DropCategory.Enemy,
          enemy.enemyName,
          enemy.chance,
          {
            type: 'mod',
            enemyModDropChance: enemy.enemyModDropChance,
            rarity: enemy.rarity,
          },
        ),
      ),
    );
  }

  private enemyBlueprintRows(locations: BlueprintLocation[]): DropSource[] {
    return locations.flatMap((bp) =>
      bp.enemies.map((enemy) =>
        this.row(
          bp.blueprintName,
          DropCategory.Enemy,
          enemy.enemyName,
          enemy.chance,
          {
            type: 'blueprint',
            itemName: bp.itemName,
            enemyItemDropChance: enemy.enemyItemDropChance,
            enemyBlueprintDropChance: enemy.enemyBlueprintDropChance,
            rarity: enemy.rarity,
          },
        ),
      ),
    );
  }

  private sortieRows(sortieRewards: DropReward[]): DropSource[] {
    return sortieRewards.map((reward) =>
      this.row(reward.itemName, DropCategory.Sortie, 'Sortie', reward.chance, {
        rarity: reward.rarity,
      }),
    );
  }

  private keyRows(keyRewards: KeyReward[]): DropSource[] {
    return keyRewards.flatMap((key) =>
      this.iterateRewards(key.rewards).map(({ reward, rotation }) =>
        this.row(
          reward.itemName,
          DropCategory.Key,
          key.keyName,
          reward.chance,
          {
            rotation,
            rarity: reward.rarity,
          },
        ),
      ),
    );
  }

  private bountyRows(all: DropTableData): DropSource[] {
    const bountyTables = {
      cetus: all.cetusBountyRewards,
      solaris: all.solarisBountyRewards,
      deimos: all.deimosRewards,
      zariman: all.zarimanRewards,
      entratiLab: all.entratiLabRewards,
      hex: all.hexRewards,
    };
    const rows: DropSource[] = [];
    for (const [region, bounties] of Object.entries(bountyTables)) {
      for (const bounty of bounties ?? []) {
        for (const { reward, rotation } of this.iterateRewards(
          bounty.rewards,
        )) {
          rows.push(
            this.row(
              reward.itemName,
              DropCategory.Bounty,
              bounty.bountyLevel,
              reward.chance,
              { region, rotation, stage: reward.stage, rarity: reward.rarity },
            ),
          );
        }
      }
    }
    return rows;
  }

  private syndicateRows(syndicates: Syndicates): DropSource[] {
    return Object.entries(syndicates).flatMap(([syndicate, items]) =>
      items.map((item) =>
        this.row(
          item.item,
          DropCategory.Syndicate,
          syndicate,
          item.chance ?? 0,
          {
            standing: item.standing,
            cost: item.cost,
            place: item.place,
            rarity: item.rarity,
          },
        ),
      ),
    );
  }

  private avatarRows(all: DropTableData): DropSource[] {
    const avatarTables = [
      all.resourceByAvatar,
      all.sigilByAvatar,
      all.additionalItemByAvatar,
    ];
    return avatarTables.flatMap((table) =>
      (table ?? []).flatMap((source) =>
        source.items.map((item) =>
          this.row(item.item, DropCategory.Avatar, source.source, item.chance, {
            rarity: item.rarity,
          }),
        ),
      ),
    );
  }

  private row(
    itemName: string,
    category: DropCategory,
    sourceName: string,
    chance: number,
    metadata: Record<string, any> = {},
  ): DropSource {
    return this.dropSourceRepository.create({
      itemName,
      category,
      sourceName,
      chance,
      metadata,
    });
  }

  /** 로테이션 유무(배열/객체) 양쪽 형태를 하나의 목록으로 통일 */
  private iterateRewards(
    list: DropRewardList,
  ): { reward: DropReward; rotation?: string }[] {
    if (Array.isArray(list)) {
      return list.map((reward) => ({ reward, rotation: reward.rotation }));
    }
    return Object.entries(list).flatMap(([rotation, rewards]) =>
      rewards.map((reward) => ({ reward, rotation })),
    );
  }
}
