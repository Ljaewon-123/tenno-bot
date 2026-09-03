import dayjs from '@/utils/dayjs';
import { Injectable } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import { DropTableService } from './drop-table/drop-table.service';
import type { DropSource } from './drop-table/entities/drop-source.entity';
import { DropCategory } from './drop-table/vo/enum';
import { AlarmRequest, TargetCommand } from './enum';
import { DropItem } from './wfcd-items/vo/drop-item.interface';
import { WfcdItemsService } from './wfcd-items/wfcd-items.service';
import {
  ArchimedeaLabel,
  ArchimedeaType,
  ArchonImage,
  ArchonReward,
  CycleLabel,
  CycleName,
  VOID_TRADER_IMAGE,
  VoidTier,
} from './world-state/vo/enum';
import {
  Archimedea,
  Fissure,
  NightwaveChallenge,
} from './world-state/vo/types';
import { WorldStateService } from './world-state/world-state.service';

@Injectable()
export class WarframeApiService {
  constructor(
    private readonly worldStateService: WorldStateService,
    private readonly wfcdItemsService: WfcdItemsService,
    private readonly dropTableService: DropTableService,
  ) {}

  /** 집정관 */
  async archonHunt() {
    const archon = await this.worldStateService.archonHunt();
    const expiryTimestamp = dayjs(archon.expiry).unix();
    const image = ArchonImage[archon.boss];
    return (
      new EmbedBuilder()
        .setTitle(`Archon Hunt - ${archon.boss}`)
        .addFields(
          { name: 'Reward Shard', value: ArchonReward[archon.boss] },
          { name: 'Time Remaining', value: `<t:${expiryTimestamp}:R>` },
          {
            name: 'Missions',
            value: archon.missions
              .map((mission) => `${mission.node} - ${mission.type}`)
              .join('\n'),
          },
        )
        // 보스는 바로키와 같은 썸네일(80px) 슬롯 — author 아이콘은 24px 고정이라 못 키운다
        .setThumbnail(this.wfcdItemsService.imgUrl(image.boss))
        // 큰 슬롯은 원본 해상도대로 그려진다(상한 아래일 때). 샤드는 256px라 폭을 다 먹지 않는다.
        // 더 줄이려면 리사이즈한 파일을 우리가 들고 attachment로 붙이는 수밖에 없다.
        .setImage(this.wfcdItemsService.imgUrl(image.shard))
        .setColor(0x5865f2)
    );
  }
  /** 출격 (소티) */
  async sortie() {
    const sortie = await this.worldStateService.sortie();
    const expiryTimestamp = dayjs(sortie.expiry).unix();
    return new EmbedBuilder()
      .setTitle('Sortie')
      .setDescription(`Boss: ${sortie.boss}`)
      .addFields(
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
  async voidFissures(options?: VoidTier) {
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
      // 바로 본인은 상단 썸네일 — 큰 슬롯에 넣으면 512px 초상화가 임베드를 잡아먹는다.
      // 썸네일은 80px 고정이라 크기 조절 대신 슬롯을 바꾸는 게 유일한 방법.
      .setThumbnail(this.wfcdItemsService.imgUrl(VOID_TRADER_IMAGE))
      .setColor(0x5865f2);

    if (isActive && trader.inventory.length) {
      embed.addFields({
        name: 'Inventory',
        value: trader.inventory
          .map((item) => `${item.item} - ${item.ducats}dt / ${item.credits}cr`)
          .join('\n')
          .slice(0, 1024),
      });

      // 남은 큰 슬롯은 인벤토리 첫 아이템으로 대표 (아이템 이미지가 없는 항목이면 그냥 비운다)
      const imageUrl = this.wfcdItemsService.findItemImg(
        trader.inventory[0].uniqueName,
      );
      if (imageUrl) embed.setImage(imageUrl);
    }

    return embed;
  }

  /** 오픈월드 낮/밤 사이클 — 셋을 따로 볼 이유가 없어 한 임베드에 모은다 */
  async cycles() {
    const names = Object.values(CycleName);
    // 한 곳이 죽어도 나머지는 보여준다 — 사이클 셋은 서로 무관한 엔드포인트다
    const results = await Promise.allSettled(
      names.map(async (name) => this.worldStateService.cycle(name)),
    );

    return new EmbedBuilder()
      .setTitle('World Cycles')
      .setColor(0x5865f2)
      .addFields(
        names.map((name, index) => {
          const result = results[index];
          return {
            name: CycleLabel[name],
            value:
              result.status === 'fulfilled'
                ? `**${result.value.state}**\n<t:${dayjs(result.value.expiry).unix()}:R>`
                : 'unavailable',
            inline: true,
          };
        }),
      );
  }

  /** 나이트웨이브 — 일일/주간/엘리트로 나눠 보여준다 */
  async nightwave() {
    const nightwave = await this.worldStateService.nightwave();
    const now = dayjs();
    // possibleChallenges에는 아직 안 뜬 것까지 들어있고, activeChallenges에도 기간이 지난 게 남는다
    const active = nightwave.activeChallenges.filter((challenge) =>
      now.isBefore(challenge.expiry),
    );

    const embed = new EmbedBuilder()
      .setTitle(`Nightwave - Season ${nightwave.season}`)
      .setDescription(`Season ends <t:${dayjs(nightwave.expiry).unix()}:R>`)
      .setColor(0x5865f2);

    const groups: [string, NightwaveChallenge[]][] = [
      ['Daily', active.filter((challenge) => challenge.isDaily)],
      [
        'Weekly',
        active.filter((challenge) => !challenge.isDaily && !challenge.isElite),
      ],
      ['Elite Weekly', active.filter((challenge) => challenge.isElite)],
    ];

    for (const [label, challenges] of groups) {
      if (!challenges.length) continue;
      embed.addFields({
        name: `${label} (${challenges.length})`,
        value: challenges
          .map(
            (challenge) =>
              `**${challenge.title}** · ${challenge.reputation} rep\n${challenge.desc} — <t:${dayjs(challenge.expiry).unix()}:R>`,
          )
          .join('\n')
          .slice(0, 1024),
      });
    }
    return embed;
  }

  /** 아르키메디아 (심층/시간) — 옵션이 없으면 둘 다, detail이면 편차·위험 설명까지 */
  async archimedea(type?: ArchimedeaType, detail = false) {
    const archimedeas = await this.worldStateService.archimedeas();
    // typeKey가 "C T_ L A B"처럼 쪼개져 오므로 공백을 지워야 enum과 맞는다
    const keyOf = (archimedea: Archimedea) =>
      archimedea.typeKey.replace(/\s/g, '') as ArchimedeaType;
    const targets = type
      ? archimedeas.filter((archimedea) => keyOf(archimedea) === type)
      : archimedeas;

    const embed = new EmbedBuilder().setTitle('Archimedea').setColor(0x5865f2);

    if (!targets.length) {
      return embed.setDescription('No active Archimedea currently.');
    }

    embed.setDescription(`Resets <t:${dayjs(targets[0].expiry).unix()}:R>`);

    for (const archimedea of targets) {
      const label = ArchimedeaLabel[keyOf(archimedea)] ?? archimedea.typeKey;
      // 설명까지 넣으면 미션 3개로 1024자를 넘기므로, detail일 때만 미션당 필드를 쪼갠다
      embed.addFields(
        ...(detail
          ? archimedea.missions.map((mission) => ({
              name: `${label} · ${mission.missionType}`.slice(0, 256),
              value: [
                `**${mission.deviation.name}** — ${mission.deviation.description}`,
                ...mission.risks.map(
                  (risk) =>
                    `**${risk.name}${risk.isHard ? ' (elite)' : ''}** — ${risk.description}`,
                ),
              ]
                .join('\n')
                .slice(0, 1024),
            }))
          : [
              {
                name: label.slice(0, 256),
                value: archimedea.missions
                  .map(
                    (mission) =>
                      `**${mission.missionType}** · ${mission.deviation.name}\n↳ ${mission.risks
                        .map(
                          (risk) =>
                            `${risk.name}${risk.isHard ? ' (elite)' : ''}`,
                        )
                        .join(', ')}`,
                  )
                  .join('\n')
                  .slice(0, 1024),
              },
            ]),
        {
          name: `${label} · Personal Modifiers`.slice(0, 256),
          value: archimedea.personalModifiers
            .map((modifier) => `**${modifier.name}** — ${modifier.description}`)
            .join('\n')
            .slice(0, 1024),
        },
      );
    }
    return embed;
  }

  async dropSources(itemName: string, category?: DropCategory) {
    const sources = await this.dropTableService.findDropSources(
      itemName,
      category,
    );

    const embed = new EmbedBuilder()
      .setTitle(`Drop Sources - ${itemName}`)
      .setColor(0x5865f2);

    if (!sources.length) {
      return embed.setDescription('No drop sources found.');
    }

    // 부분 일치라 여러 아이템이 잡힐 수 있어 아이템별로 묶는다
    const byItem = sources.reduce<Record<string, DropSource[]>>(
      (acc, source) => {
        (acc[source.itemName] ??= []).push(source);
        return acc;
      },
      {},
    );

    // 썸네일/설명은 하나뿐이라 첫 아이템으로 대표한다 (자동완성으로 고르면 보통 한 개다)
    const item = this.wfcdItemsService.findItemByName(Object.keys(byItem)[0]);
    const modCard = item?.levelStats?.length ? item.wikiaThumbnail : undefined;
    if (modCard) {
      // 모드 카드 이미지에 이름·최대 랭크 수치·설명이 전부 박혀 있다. 텍스트로 옮겨 적지 않는다
      embed.setImage(modCard);
    } else {
      if (item?.imageName) {
        embed.setThumbnail(this.wfcdItemsService.imgUrl(item.imageName));
      }
      const detail = this.itemDetail(item);
      if (detail) embed.setDescription(detail);
    }

    embed.addFields(
      Object.entries(byItem)
        .slice(0, 25)
        .map(([name, list]) => ({
          name: name.slice(0, 256),
          value: list
            .map((source) => `${source.sourceName} - ${source.chance}%`)
            .join('\n')
            .slice(0, 1024),
        })),
    );
    return embed;
  }

  /** 모드는 최대 랭크 효과, 그 외 아이템은 설명문. 카드 이미지가 없을 때 쓰는 대체 표기 */
  private itemDetail(item?: DropItem) {
    // 원문에 <DT_FREEZE_COLOR> 같은 게임 내부 태그가 섞여 있고 디스코드는 그대로 뱉는다
    const clean = (text: string) => text.replace(/<[^>]+>/g, '');
    const levelStats = item?.levelStats;
    const maxRank = levelStats?.at(-1)?.stats;
    if (!levelStats || !maxRank?.length) {
      return item?.description && clean(item.description);
    }

    // 최대 랭크 수치라는 걸 안 적으면 미강화 수치로 오해한다
    const rank = item.fusionLimit ?? levelStats.length - 1;
    return clean(
      [`${item.type} · Rank ${rank}/${rank}`, ...maxRank].join('\n'),
    );
  }

  /** 알람용 디스패치 — 슬래시 커맨드와 동일한 임베드를 만든다 */
  async getAlarmTarget(request: AlarmRequest) {
    switch (request.target) {
      case TargetCommand.ArchonHunt:
        return this.archonHunt();
      case TargetCommand.Sortie:
        return this.sortie();
      case TargetCommand.Events:
        return this.events();
      case TargetCommand.VoidFissures:
        return this.voidFissures(request.options);
      case TargetCommand.VoidTrader:
        return this.voidTrader();
      case TargetCommand.Cycles:
        return this.cycles();
      case TargetCommand.Nightwave:
        return this.nightwave();
      case TargetCommand.Archimedea:
        return this.archimedea();
    }
  }

  /** 드랍 커맨드 오토컴플리트용 아이템 이름 목록 */
  async searchItemNames(keyword: string) {
    return this.dropTableService.searchItemNames(keyword);
  }
}
