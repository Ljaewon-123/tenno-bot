import dayjs, { type Dayjs } from '@/utils/dayjs';
import {
  Accent,
  accentFor,
  bar,
  bold,
  button,
  card,
  emptyCard,
  errorCard,
  linkButton,
  okCard,
  paged,
  relative,
  select,
  subtext,
  type Block,
  type Line,
  LIMIT,
} from '@/utils/discord-embed';
import { Injectable } from '@nestjs/common';
import { ButtonBuilder } from 'discord.js';
import { DropTableService } from './drop-table/drop-table.service';
import type { DropSource } from './drop-table/entities/drop-source.entity';
import { DropCategory } from './drop-table/vo/enum';
import { IncarnonService } from './incarnon/incarnon.service';
import type { IncarnonTier } from './incarnon/types';
import {
  ARCHIMEDEA_DETAIL,
  DROP_ALL,
  DROP_KEY,
  EVO_NUMERAL,
  FILTER_OFF,
  FISSURE_HARD,
  INCARNON_FIXED_SLOTS,
  INCARNON_KEY,
  PAGE_SUFFIX_LENGTH,
  PERK_SLOTS,
  RELIC_OPEN,
  RELIC_REWARD,
  TOP,
  TRADER_ALL,
  TRADER_PEEK,
} from './constants';
import { AlarmRequest, RemindTarget, TargetCommand } from './enum';
import type { Buttons } from './types';
import { DropItem } from './wfcd-items/vo/drop-item.interface';
import { WfcdItemsService } from './wfcd-items/wfcd-items.service';
import {
  ArchimedeaLabel,
  ArchimedeaType,
  ArchonReward,
  CircuitCategory,
  CycleIcon,
  CycleLabel,
  CycleName,
  CycleNextState,
  NightwaveFilter,
  VoidTier,
  VoidTraderCategory,
  VoidTraderCategoryLabel,
} from './world-state/vo/enum';
import {
  Archimedea,
  ArchimedeaCondition,
  ArchimedeaMission,
  Fissure,
  NightwaveChallenge,
  VoidTraderItem,
  WorldEvent,
} from './world-state/vo/types';
import {
  ArchonImage,
  TTL_SECONDS,
  VOID_TRADER_IMAGE,
  VOID_TRADER_WEAPON_CATEGORIES,
} from './world-state/constants';
import { staleAsOf } from './world-state/stale';
import { WorldStateService } from './world-state/world-state.service';

@Injectable()
export class WarframeApiService {
  constructor(
    private readonly worldStateService: WorldStateService,
    private readonly wfcdItemsService: WfcdItemsService,
    private readonly dropTableService: DropTableService,
    private readonly incarnonService: IncarnonService,
  ) {}

  /** 월드스테이트는 캐시라 최대 TTL만큼 옛날 값일 수 있어 footer에 나이를 적는다 */
  private fresh(data: unknown, ...extra: Line[]) {
    const asOf = staleAsOf(data);
    return [
      ...extra.filter(Boolean),
      asOf ? `cached ${relative(asOf)}` : `cached ${TTL_SECONDS}s`,
    ].join(' · ');
  }

  private foldedLine(shown: number, total: number, sort: string, path?: Line) {
    return [`Showing ${shown} of ${total}`, sort, path]
      .filter(Boolean)
      .join(' · ');
  }

  /** 막대는 최고 확률 대비 상대값이라 절대 등급은 이모지로 따로 보인다 */
  private chanceIcon(chance: number) {
    return chance >= 5 ? '🟢' : chance >= 1 ? '🟠' : '🔴';
  }

  /** 성유물만 순정 → 빛나는 두 확률이 있다. 둘이 같으면(레퀴엠) 화살표를 안 붙인다 */
  private chanceText({ chance, metadata }: DropSource) {
    const radiant = metadata?.radiantChance as number | null | undefined;
    return radiant == null || radiant === chance
      ? `${chance}%`
      : `${chance}% → ${radiant}%`;
  }

  async archonHunt(buttons?: Buttons) {
    const archon = await this.worldStateService.archonHunt();
    const art = ArchonImage[archon.boss];
    const boss = this.wfcdItemsService.findItemImg(art.boss);
    const shard = this.wfcdItemsService.findItemImg(art.shard);
    // 소스가 256px라 풀폭 1장은 뭉갠다 — 2-up 갤러리가 안 서면 썸네일로 내린다
    const gallery = boss && shard ? [boss, shard] : undefined;

    return card({
      accent: accentFor(archon.expiry),
      title: `Archon Hunt · ${archon.boss}`,
      subtitle: `Resets ${relative(archon.expiry)}`,
      thumbnail: gallery ? undefined : boss,
      image: gallery,
      blocks: [
        [
          {
            lines: archon.missions.map((mission, index) =>
              bold(`${index + 1} · ${mission.node} — ${mission.type}`),
            ),
            // 집정관 사냥은 항상 Steel Path라 API에 없어도 고정으로 적는다
            more: `All three on Steel Path · reward ${ArchonReward[archon.boss]} Archon Shard`,
          },
        ],
      ],
      buttons: [
        ...(buttons ?? []),
        linkButton('Wiki', this.wikiUrl(archon.boss)),
      ],
      footer: this.fresh(archon),
    });
  }

  async sortie(buttons?: Buttons) {
    const sortie = await this.worldStateService.sortie();

    return card({
      accent: accentFor(sortie.expiry),
      title: `Sortie · ${sortie.boss}`,
      subtitle: `Resets ${relative(sortie.expiry)}`,
      blocks: [
        sortie.variants.map((variant, index) => ({
          lines: [
            bold(`${index + 1} · ${variant.node} — ${variant.missionType}`),
            subtext(`${variant.modifier} — ${variant.modifierDescription}`),
          ],
        })),
      ],
      buttons,
      footer: this.fresh(sortie),
    });
  }

  async events(buttons?: Buttons) {
    const events = await this.worldStateService.events();
    const active = events.filter((event) => !event.expired);

    if (!active.length)
      return emptyCard(
        'No active events',
        'Operations run a few times a year. Nothing is live right now.',
        'Use /notification on event:events to get pinged when one starts',
      );

    return card({
      accent: accentFor(active[0].expiry),
      title: `Active Events · ${active.length}`,
      // 이벤트마다 페이로드가 달라 없는 필드는 줄째로 뺀다
      blocks: active.map((event) => [
        {
          heading: event.description,
          lines: [
            [event.node, `ends ${relative(event.expiry)}`]
              .filter(Boolean)
              .join(' · '),
            this.scoreLine(event),
            event.rewardTypes?.length
              ? `Rewards: ${event.rewardTypes.join(' · ')}`
              : undefined,
            event.tooltip && subtext(event.tooltip),
          ],
        },
      ]),
      buttons,
      footer: this.fresh(events),
    });
  }

  private scoreLine(event: WorldEvent): Line {
    const { currentScore, maximumScore } = event;
    if (!currentScore || !maximumScore) return undefined;
    return `${bar((currentScore / maximumScore) * 100)} ${currentScore.toLocaleString()} / ${maximumScore.toLocaleString()}`;
  }

  private fissureLine(fissure: Fissure) {
    return `- ${bold(fissure.node)} — ${fissure.missionType}${
      fissure.isHard ? ` · ${bold('SP')}` : ''
    } ${relative(fissure.expiry)}`;
  }

  /** 티어·스틸패스 필터를 둘 다 customId에 실어야 페이지를 넘겨도 필터가 유지된다 */
  async voidFissures(
    options?: VoidTier,
    buttons?: Buttons,
    page = 0,
    hard = false,
  ) {
    const fissures = await this.worldStateService.voidFissures(options);
    const live = fissures.filter((fissure) => !fissure.expired);
    const active = hard ? live.filter((fissure) => fissure.isHard) : live;

    const filterId = (tier: VoidTier | typeof FILTER_OFF, sp: boolean) =>
      `${TargetCommand.VoidFissures}/${tier}/${sp ? FISSURE_HARD : FILTER_OFF}/page/0`;
    const filters = [
      !hard &&
        live.some((fissure) => fissure.isHard) &&
        button(filterId(options ?? FILTER_OFF, true), 'Steel Path only'),
      (hard || options) && button(filterId(FILTER_OFF, false), 'All fissures'),
    ].filter((child): child is ButtonBuilder => Boolean(child));

    const applied = [
      options && `\`tier:${options}\``,
      hard && '`steel-path`',
    ].filter(Boolean);

    if (!active.length)
      return emptyCard(
        'No active fissures',
        applied.length
          ? `Nothing matches ${applied.join(' + ')} right now.`
          : 'The relays are quiet.',
        applied.length > 0 && 'Drop the filter to see every tier',
        filters,
      );

    const soonest = (list: Fissure[]) =>
      [...list].sort((a, b) => dayjs(a.expiry).diff(b.expiry));

    // 티어를 좁히면 그룹이 하나라 접지 않고 페이지로 편다
    if (options) {
      const view = paged({
        key: `${TargetCommand.VoidFissures}/${options}/${hard ? FISSURE_HARD : FILTER_OFF}`,
        items: soonest(active),
        page,
        sort: 'soonest first',
      });

      return card({
        title: `Void Fissures · ${options}${hard ? ' · Steel Path' : ''}`,
        subtitle: `${active.length} active`,
        blocks: [[{ lines: view.items.map((f) => this.fissureLine(f)) }]],
        buttons: [...(view.buttons ?? []), ...filters, ...(buttons ?? [])],
        footer: this.fresh(fissures, view.footer),
      });
    }

    const byTier = active.reduce<Record<string, Fissure[]>>((acc, fissure) => {
      (acc[fissure.tier] ??= []).push(fissure);
      return acc;
    }, {});

    const groups: Block[][] = [];
    const empty: string[] = [];
    for (const tier of Object.values(VoidTier)) {
      const list = soonest(byTier[tier] ?? []);
      if (!list.length) {
        empty.push(tier);
        continue;
      }

      groups.push([
        {
          heading: `${tier} ${list.length}`,
          lines: list
            .slice(0, TOP.fissure)
            .map((fissure) => this.fissureLine(fissure)),
          more:
            list.length > TOP.fissure
              ? this.foldedLine(
                  TOP.fissure,
                  list.length,
                  'soonest first',
                  `/void-fissures tier:${tier}${hard ? ' steel-path:True' : ''}`,
                )
              : undefined,
        },
      ]);
    }
    if (empty.length) groups.push([subtext(`${empty.join(' · ')} — none`)]);

    return card({
      title: `Void Fissures${hard ? ' · Steel Path' : ''}`,
      subtitle: `${active.length} active · soonest first`,
      blocks: groups,
      buttons: [...filters, ...(buttons ?? [])],
      footer: this.fresh(fissures),
    });
  }

  /** 아이템 DB에 없는 건 대부분 코스메틱·소모품이라 Other로 */
  private traderCategory(stock: VoidTraderItem): VoidTraderCategory {
    const category = this.wfcdItemsService.findItemByName(stock.item)?.category;
    if (category === 'Mods') return VoidTraderCategory.Mods;
    return VOID_TRADER_WEAPON_CATEGORIES.includes(category ?? '')
      ? VoidTraderCategory.Weapons
      : VoidTraderCategory.Other;
  }

  /** 재고가 40종이라 기본은 카테고리 요약, 셀렉트로 고른 카테고리만 전부 편다 */
  async voidTrader(category?: VoidTraderCategory, page = 0, buttons?: Buttons) {
    const trader = await this.worldStateService.voidTrader();
    const now = dayjs();
    const active =
      now.isAfter(trader.activation) && now.isBefore(trader.expiry);
    const thumbnail = this.wfcdItemsService.imgUrl(VOID_TRADER_IMAGE);

    if (!active)
      return card({
        accent: Accent.Muted,
        title: `${trader.character} is away`,
        subtitle: `Arrives ${relative(trader.activation)} · stays 48 hours`,
        thumbnail,
        blocks: [],
        // 🔔는 도착 알림이라 부재 화면에만 붙는다
        buttons,
        footer: this.fresh(trader, 'Inventory is unknown until he arrives'),
      });

    const stock = [...trader.inventory].sort((a, b) => a.ducats - b.ducats);
    // 분류는 아이템 DB 전체 스캔이라 재고당 딱 한 번만 돌린다
    const grouped = new Map<VoidTraderCategory, VoidTraderItem[]>(
      Object.values(VoidTraderCategory).map((name) => [name, []]),
    );
    for (const item of stock)
      grouped.get(this.traderCategory(item))?.push(item);
    const filled = [...grouped].filter(([, items]) => items.length);

    const picker = select(
      `${TargetCommand.VoidTrader}/category`,
      'Pick a category to see all items',
      [
        { label: 'All categories', value: TRADER_ALL },
        ...filled.map(([name, items]) => ({
          label: `${VoidTraderCategoryLabel[name]} · ${items.length}`,
          value: name,
        })),
      ],
      category ?? TRADER_ALL,
    );

    const head = {
      accent: accentFor(trader.expiry),
      title: `${trader.character} · ${trader.location}`,
      thumbnail,
      select: picker,
    };

    if (!category) {
      const shown = filled.reduce(
        (sum, [, items]) => sum + Math.min(items.length, TRADER_PEEK),
        0,
      );
      return card({
        ...head,
        subtitle: `Departs ${relative(trader.expiry)} · ${stock.length} items`,
        blocks: [
          filled.map(([name, items]) => ({
            heading: `${VoidTraderCategoryLabel[name]} · ${items.length}`,
            lines: [
              items
                .slice(0, TRADER_PEEK)
                .map((item) => `${bold(item.item)} ${item.ducats}dt`)
                .join(' · '),
            ],
          })),
        ],
        footer: this.fresh(
          trader,
          this.foldedLine(shown, stock.length, 'cheapest first'),
          'dt = ducats',
        ),
      });
    }

    const items = grouped.get(category) ?? [];
    const view = paged({
      key: `${TargetCommand.VoidTrader}/${category}`,
      items,
      page,
      sort: 'cheapest first',
    });

    return card({
      ...head,
      subtitle: `Departs ${relative(trader.expiry)} · ${VoidTraderCategoryLabel[category]} · ${items.length} items`,
      blocks: [
        [
          {
            lines: view.items.map(
              (item) =>
                `- ${bold(item.item)} · ${item.ducats}dt / ${item.credits.toLocaleString()}cr`,
            ),
          },
        ],
      ],
      buttons: view.buttons,
      footer: this.fresh(trader, view.footer, 'dt = ducats'),
    });
  }

  async cycles(buttons?: Buttons) {
    const names = Object.values(CycleName);
    // 한 지역이 실패해도 나머지는 보여준다
    const results = await Promise.allSettled(
      names.map(async (name) => this.worldStateService.cycle(name)),
    );

    const rows = names
      .map((name, index) => ({ name, result: results[index] }))
      .sort((a, b) => {
        if (a.result.status !== 'fulfilled') return 1;
        if (b.result.status !== 'fulfilled') return -1;
        return dayjs(a.result.value.expiry).diff(b.result.value.expiry);
      });

    const soonest = rows[0]?.result;
    const failed = rows.filter((row) => row.result.status !== 'fulfilled');

    return card({
      accent:
        soonest?.status === 'fulfilled'
          ? accentFor(soonest.value.expiry)
          : Accent.Error,
      title: 'World Cycles',
      blocks: [
        [
          {
            lines: rows.map(({ name, result }) => {
              const label = bold(CycleLabel[name]);
              if (result.status !== 'fulfilled')
                return `⚠️ ${label} unavailable`;

              const next = CycleNextState[result.value.state];
              const state = next
                ? `${result.value.state} → ${next}`
                : result.value.state;
              return `${CycleIcon[name]} ${label} ${state} ${relative(result.value.expiry)}`;
            }),
          },
        ],
      ],
      buttons,
      footer: this.fresh(
        soonest?.status === 'fulfilled' ? soonest.value : undefined,
        failed.length > 0 &&
          `${failed.length} of ${rows.length} regions failed to load`,
      ),
    });
  }

  async nightwave(buttons?: Buttons, filter?: NightwaveFilter) {
    const nightwave = await this.worldStateService.nightwave();
    const now = dayjs();
    // possibleChallenges에는 아직 안 뜬 것까지 들어있고, activeChallenges에도 기간이 지난 게 남는다
    const all = nightwave.activeChallenges.filter((challenge) =>
      now.isBefore(challenge.expiry),
    );
    const active = filter
      ? all.filter(
          (challenge) =>
            challenge.isDaily === (filter === NightwaveFilter.Daily),
        )
      : all;

    const filters = [
      filter !== NightwaveFilter.Daily &&
        all.some((challenge) => challenge.isDaily) &&
        button(`${TargetCommand.Nightwave}/filter/daily`, 'Daily only'),
      filter !== NightwaveFilter.Weekly &&
        all.some((challenge) => !challenge.isDaily) &&
        button(`${TargetCommand.Nightwave}/filter/weekly`, 'Weekly only'),
      filter &&
        button(
          `${TargetCommand.Nightwave}/filter/${FILTER_OFF}`,
          'All challenges',
        ),
    ].filter((child): child is ButtonBuilder => Boolean(child));

    const groups: [string, NightwaveChallenge[]][] = [
      ['Daily', active.filter((challenge) => challenge.isDaily)],
      [
        'Weekly',
        active.filter((challenge) => !challenge.isDaily && !challenge.isElite),
      ],
      ['Elite Weekly', active.filter((challenge) => challenge.isElite)],
    ];

    return card({
      accent: accentFor(nightwave.expiry),
      title: `Nightwave · Season ${nightwave.season}`,
      subtitle: `Season ends ${relative(nightwave.expiry)}`,
      blocks: groups.map(([label, challenges]) => [
        challenges.length > 0 && {
          heading: `${label} ${challenges.length}`,
          lines: challenges.flatMap((challenge) => [
            `- ${bold(challenge.title)} · ${challenge.reputation} rep`,
            subtext(`${challenge.desc} — ${relative(challenge.expiry)}`),
          ]),
        },
      ]),
      buttons: [...filters, ...(buttons ?? [])],
      footer: this.fresh(nightwave),
    });
  }

  private archimedeaId(
    type: ArchimedeaType | typeof FILTER_OFF,
    detail: boolean,
  ) {
    return `${TargetCommand.Archimedea}/${type}/${detail ? ARCHIMEDEA_DETAIL : FILTER_OFF}/page/0`;
  }

  async archimedea(
    type?: ArchimedeaType,
    detail = false,
    buttons?: Buttons,
    page = 0,
  ) {
    const archimedeas = await this.worldStateService.archimedeas();
    // typeKey가 "C T_ L A B"처럼 쪼개져 오므로 공백을 지워야 enum과 맞는다
    const keyOf = (archimedea: Archimedea) =>
      archimedea.typeKey.replace(/\s/g, '') as ArchimedeaType;
    const targets = type
      ? archimedeas.filter((archimedea) => keyOf(archimedea) === type)
      : archimedeas;

    if (!targets.length)
      return emptyCard(
        'No active Archimedea',
        'Nothing is running right now.',
        'It rotates weekly',
      );

    const labelOf = (archimedea: Archimedea) =>
      ArchimedeaLabel[keyOf(archimedea)] ?? archimedea.typeKey;

    // 종 전환은 버튼 하나로 순환한다 — 종마다 버튼을 깔면 한 행 5개 한도를 넘는다
    const cycle: (ArchimedeaType | typeof FILTER_OFF)[] = [
      FILTER_OFF,
      ...new Set(archimedeas.map(keyOf)),
    ];
    const nextType =
      cycle[(cycle.indexOf(type ?? FILTER_OFF) + 1) % cycle.length];
    const filters = [
      cycle.length > 2 &&
        button(
          this.archimedeaId(nextType, detail),
          nextType === FILTER_OFF
            ? 'Show both'
            : `${ArchimedeaLabel[nextType] ?? nextType} only`,
        ),
      button(
        this.archimedeaId(type ?? FILTER_OFF, !detail),
        detail ? 'Hide details' : 'Show details',
      ),
    ].filter((child): child is ButtonBuilder => Boolean(child));

    // detail을 전부 쌓으면 메시지 글자 수 한도를 넘어서 미션 단위로 페이징한다
    const missions = targets.flatMap((archimedea) =>
      archimedea.missions.map((mission, index) => ({
        archimedea,
        mission,
        number: index + 1,
      })),
    );
    if (detail && missions.length)
      return this.archimedeaDetail({
        missions,
        page,
        type,
        labelOf,
        buttons: [...filters, ...(buttons ?? [])],
      });

    const blocks: Block[][] = [];
    for (const archimedea of targets) {
      blocks.push([
        targets.length > 1 && bold(labelOf(archimedea)),
        ...archimedea.missions.map((mission, index) => ({
          heading: `${index + 1} · ${mission.missionType}`,
          lines: [
            `Deviation ${bold(mission.deviation.name)}`,
            // subtext 회색 위에선 굵게가 안 보여 엘리트 위험은 아이콘으로 표시
            subtext(
              `Risks · ${mission.risks
                .map((risk) => (risk.isHard ? `☠️ ${risk.name}` : risk.name))
                .join(' · ')}`,
            ),
          ],
        })),
      ]);
      blocks.push(this.archimedeaModifiers(archimedea));
    }

    return card({
      accent: accentFor(targets[0].expiry),
      title: targets.length === 1 ? labelOf(targets[0]) : 'Archimedea',
      subtitle: `Resets ${relative(targets[0].expiry)}`,
      blocks,
      buttons: [...filters, ...(buttons ?? [])],
      footer: this.fresh(archimedeas, '☠️ risks are elite-only'),
    });
  }

  private archimedeaDetail({
    missions,
    page,
    type,
    labelOf,
    buttons,
  }: {
    missions: {
      archimedea: Archimedea;
      mission: ArchimedeaMission;
      number: number;
    }[];
    page: number;
    type?: ArchimedeaType;
    labelOf: (archimedea: Archimedea) => string;
    buttons: Buttons;
  }) {
    const view = paged({
      key: `${TargetCommand.Archimedea}/${type ?? FILTER_OFF}/${ARCHIMEDEA_DETAIL}`,
      items: missions,
      page,
      sort: 'one mission per page',
      size: 1,
    });
    const { archimedea, mission, number } = view.items[0];

    return card({
      accent: accentFor(archimedea.expiry),
      title: labelOf(archimedea),
      subtitle: `Resets ${relative(archimedea.expiry)}`,
      blocks: [
        [
          {
            heading: `${number} · ${mission.missionType}`,
            lines: [mission.deviation, ...mission.risks].flatMap(
              (condition) => [
                this.conditionName(condition),
                subtext(condition.description),
              ],
            ),
          },
        ],
        this.archimedeaModifiers(archimedea),
      ],
      buttons: [...(view.buttons ?? []), ...(buttons ?? [])],
      footer: this.fresh(missions[0]?.archimedea, view.footer),
    });
  }

  private archimedeaModifiers(archimedea: Archimedea): Block[] {
    return [
      {
        heading: `Personal Modifiers · ${archimedea.personalModifiers.length}`,
        lines: [
          subtext(
            archimedea.personalModifiers
              .map((modifier) => modifier.name)
              .join(' · '),
          ),
        ],
      },
    ];
  }

  private conditionName(condition: ArchimedeaCondition) {
    return `${bold(condition.name)}${condition.isHard ? ' elite' : ''}`;
  }

  /** 서킷 로테이션은 매주 월요일 00:00 UTC에 바뀐다 — duviriCycle의 expiry는 2시간짜리 무드 사이클이라 못 쓴다 */
  private nextCircuitReset() {
    const now = dayjs.utc();
    // dayjs 주는 일요일 시작이라 일요일엔 day(1)이 내일, 나머지 요일은 다음 주 월요일(day(8))
    return now.day(now.day() === 0 ? 1 : 8).startOf('day');
  }

  private wikiUrl(page: string) {
    return `https://wiki.warframe.com/w/${encodeURIComponent(page.replace(/ /g, '_'))}`;
  }

  private genesisWikiLink(weapon: string) {
    return `[${weapon}](${this.wikiUrl(`${weapon} Incarnon Genesis`)})`;
  }

  async incarnon(buttons?: Buttons) {
    const duviri = await this.worldStateService.duviriCycle();
    const { choices } = duviri;
    const pick = (category: CircuitCategory) =>
      choices.find((choice) => choice.categoryKey === category)?.choices ?? [];
    const genesis = pick(CircuitCategory.Hard);
    const warframes = pick(CircuitCategory.Normal);

    if (!genesis.length)
      return emptyCard(
        'No Circuit rotation',
        'The weekly rotation has not been published yet.',
        'It resets Monday 00:00 UTC',
      );

    return card({
      title: 'Incarnon Genesis · This Week',
      subtitle: `Rotates ${relative(this.nextCircuitReset())}`,
      // 인카논 폼 무기 아트는 wfcd에 없어 어댑터 아이콘을 쓴다
      thumbnail: this.wfcdItemsService.findItemImgByName(
        `${genesis[0]} Incarnon Genesis`,
      ),
      blocks: [
        [
          {
            heading: 'Steel Path Circuit · Weapons',
            lines: [
              genesis.map((weapon) => this.genesisWikiLink(weapon)).join(' · '),
            ],
          },
          warframes.length > 0 && {
            heading: 'Normal Circuit · Warframes',
            lines: [warframes.join(' · ')],
          },
        ],
      ],
      buttons,
      footer: this.fresh(duviri, 'Resets Monday 00:00 UTC'),
    });
  }

  /** `/images/{이름}`은 리다이렉트된 파일에서 404라 Special:FilePath를 쓴다 */
  private perkIcon(icon?: string) {
    return (
      icon &&
      `https://wiki.warframe.com/w/Special:FilePath/${encodeURIComponent(icon)}`
    );
  }

  private installLine(materials: { name: string; count: number }[]) {
    return materials
      .map((material) => `${material.count} ${material.name}`)
      .join(' · ');
  }

  private incarnonTier(tier: IncarnonTier, icons: boolean): Block[] {
    return [
      {
        heading: `EVO ${EVO_NUMERAL[tier.evolution] ?? tier.evolution}`,
        // EVO1은 해금 조건이 없다
        lines: [subtext(tier.challenge ?? 'Unlocked on install')],
      },
      ...tier.perks.map((perk) => ({
        lines: [bold(perk.name), subtext(perk.effect.join(' '))],
        thumbnail: icons ? this.perkIcon(perk.icon) : undefined,
      })),
    ];
  }

  async incarnonWeapon(name: string) {
    const weapon = await this.incarnonService.findWeapon(name);
    if (!weapon) return this.incarnonMiss(name);

    const perks = weapon.tiers.reduce(
      (count, tier) => count + tier.perks.length,
      0,
    );
    // 아이콘까지 달면 컴포넌트 40개를 넘는 무기는 전부 텍스트로 — 넘기면 400이다
    const icons = perks * PERK_SLOTS + INCARNON_FIXED_SLOTS < LIMIT.components;

    return card({
      title: `${weapon.name} · Incarnon Genesis`,
      subtitle:
        weapon.reference !== weapon.name &&
        `Numbers shown for ${weapon.reference}`,
      thumbnail: weapon.thumbnail,
      blocks: [
        [
          this.installLine(weapon.materials),
          ...weapon.tiers.flatMap((tier) => this.incarnonTier(tier, icons)),
        ],
      ],
      buttons: [
        linkButton('Wiki', this.wikiUrl(`${weapon.name} Incarnon Genesis`)),
      ],
      footer:
        'Perks from wiki.warframe.com (CC BY-SA) · materials from DE export',
    });
  }

  private incarnonMiss(name: string) {
    const install = this.incarnonService.install(name);
    if (install)
      return card({
        accent: Accent.Soon,
        title: `${install.name} · data not collected yet`,
        thumbnail: install.thumbnail,
        blocks: [
          [
            "This weapon exists — its perks haven't been pulled from the wiki yet. Try again later today.",
          ],
          [this.installLine(install.materials)],
        ],
        footer: 'Materials come from DE export · perks pull monthly',
      });

    const { closest, total } = this.incarnonService.suggest(name);
    return emptyCard(
      `No Incarnon weapon named “${name}”`,
      closest.length > 0 &&
        `Closest matches: ${closest.map((match) => bold(match)).join(' · ')}`,
      `${total} weapons have an Incarnon Genesis`,
      [button(INCARNON_KEY, "This week's rotation")],
    );
  }

  /** 아이템 이름이 유저 입력이라 customId 100자를 넘으면 버튼을 생략한다 */
  private dropButton(
    label: string,
    itemName: string,
    category: DropCategory | typeof DROP_ALL,
  ) {
    const id = `${DROP_KEY}/${category}/${encodeURIComponent(itemName)}/page/0`;
    return id.length <= LIMIT.customId ? button(id, label) : undefined;
  }

  async dropSources(
    itemName: string,
    category?: DropCategory,
    buttons?: Buttons,
    page = 0,
  ) {
    const sources = await this.dropTableService.findDropSources(
      itemName,
      category,
    );
    const widen = category
      ? this.dropButton('All sources', itemName, DROP_ALL)
      : undefined;

    if (!sources.length)
      return emptyCard(
        `No drop sources · ${itemName}`,
        'Nothing in the drop tables matches that name.',
        category && `Drop \`category:${category}\` to widen the search`,
        widen && [widen],
      );

    const byItem = sources.reduce<Record<string, DropSource[]>>(
      (acc, source) => {
        (acc[source.itemName] ??= []).push(source);
        return acc;
      },
      {},
    );

    const item = this.wfcdItemsService.findItemByName(Object.keys(byItem)[0]);
    // 모드 카드는 세로 3:4라 썸네일로는 안 읽혀 큰 이미지 슬롯에 넣는다
    const modCard = item?.levelStats?.length ? item.wikiaThumbnail : undefined;
    const detail = modCard ? undefined : this.itemDetail(item);

    const prices = await this.traderPrices(sources);
    const groups = Object.entries(byItem);
    // customId 100자 제한 — 이름이 길거나 아이템이 여럿이면 페이저 대신 접힌 줄로
    const key = `${DROP_KEY}/${category ?? DROP_ALL}/${encodeURIComponent(itemName)}`;
    const single =
      groups.length === 1 &&
      key.length + PAGE_SUFFIX_LENGTH <= LIMIT.customId &&
      groups[0];

    const relicsOnly =
      category !== DropCategory.Relic &&
      sources.some((source) => source.category === DropCategory.Relic) &&
      sources.some((source) => source.category !== DropCategory.Relic)
        ? this.dropButton('Relics only', itemName, DropCategory.Relic)
        : undefined;

    const view =
      single &&
      paged({
        key,
        items: [...single[1]].sort((a, b) => b.chance - a.chance),
        page,
        sort: 'highest chance first',
      });

    const relics = [
      ...new Set(
        sources
          .filter((source) => source.category === DropCategory.Relic)
          .map((source) => source.sourceName),
      ),
    ].slice(0, LIMIT.selectOptions);

    return card({
      title: `Drop Sources · ${itemName}`,
      subtitle: `${sources.length} sources · highest chance first`,
      thumbnail:
        !modCard && item?.imageName
          ? this.wfcdItemsService.imgUrl(item.imageName)
          : undefined,
      image: modCard,
      blocks: [
        [detail],
        ...(view
          ? [[this.dropGroup(single[0], single[1], category, prices, view)]]
          : groups.map(([name, list]): Block[] => [
              this.dropGroup(name, list, category, prices),
            ])),
      ],
      buttons: [
        ...(view ? (view.buttons ?? []) : []),
        relicsOnly,
        widen,
        ...(buttons ?? []),
      ].filter((child): child is ButtonBuilder => Boolean(child)),
      select: relics.length
        ? select(
            RELIC_OPEN,
            'Open a relic to see everything in it',
            relics.map((name) => ({ label: name, value: name })),
          )
        : undefined,
      footer: [
        view && view.footer,
        relics.length > 0 && 'Relic chance: Intact → Radiant',
        'Bar is relative to the best source · 🟢 ≥5% · 🟠 1-5% · 🔴 <1%',
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }

  /** /drop의 역방향(성유물 → 보상). 보상이 최대 8개라 페이저가 없다 */
  async relic(relicName: string) {
    const rewards = await this.dropTableService.findRelicRewards(relicName);
    if (!rewards.length)
      return emptyCard(
        `No relic named “${relicName}”`,
        'Nothing in the drop tables matches that name.',
        'Pick one from the list on a /drop card, or check the tier (Lith · Meso · Neo · Axi · Requiem)',
      );

    const item = this.wfcdItemsService.findRelic(relicName);
    const best = rewards[0].chance;

    return card({
      title: relicName,
      subtitle: [
        `${rewards.length} rewards`,
        item?.vaulted === true && 'Vaulted',
        item?.vaulted === false && 'Currently dropping',
        'chance: Intact → Radiant',
      ]
        .filter(Boolean)
        .join(' · '),
      thumbnail:
        item?.imageName && this.wfcdItemsService.imgUrl(item.imageName),
      // 보상 8개 × Section 3칸 = 24칸이라 줄마다 아이콘을 붙여도 40칸 한도에 든다
      blocks: [
        rewards.map((reward): Block => ({
          lines: [
            `${this.chanceIcon(reward.chance)} ${reward.itemName} ${bar((reward.chance / best) * 100)} ${this.chanceText(reward)}`,
          ],
          thumbnail: this.wfcdItemsService.findItemImgByName(reward.itemName),
        })),
      ],
      select: select(
        RELIC_REWARD,
        'Pick a reward to see its other sources',
        rewards.slice(0, LIMIT.selectOptions).map((reward) => ({
          label: reward.itemName.slice(0, 100),
          value: reward.itemName,
        })),
      ),
      footer:
        'Bar is Intact, relative to the best reward · 🟢 ≥5% · 🟠 1-5% · 🔴 <1%',
    });
  }

  async searchRelicNames(keyword: string) {
    return this.dropTableService.searchRelicNames(keyword);
  }

  /** 두캇 가격은 바로 방문 중의 재고 응답에만 있다 */
  private async traderPrices(sources: DropSource[]) {
    if (!sources.some((source) => source.category === DropCategory.Trader))
      return new Map<string, string>();

    const trader = await this.worldStateService
      .voidTrader()
      .catch(() => undefined);
    return new Map(
      (trader?.inventory ?? []).map((stock) => [
        stock.item,
        `${stock.ducats} ducats + ${stock.credits.toLocaleString('en-US')}cr`,
      ]),
    );
  }

  private dropGroup(
    name: string,
    list: DropSource[],
    category?: DropCategory,
    prices = new Map<string, string>(),
    view?: { items: DropSource[] },
  ): Block {
    const sorted = [...list].sort((a, b) => b.chance - a.chance);
    // 막대 기준은 페이지가 아니라 전체 목록의 최고 확률
    const best = sorted[0].chance;

    return {
      heading: name,
      lines: (view ? view.items : sorted.slice(0, TOP.drop)).map((source) => {
        const tail =
          source.category && source.category !== DropCategory.Relic
            ? ` (${source.category})`
            : '';
        // 상점은 chance가 0이라 막대 대신 두캇 가격을 붙인다
        if (source.category === DropCategory.Trader)
          return `- 🛒 ${source.sourceName}${tail}${prices.has(name) ? ` · ${prices.get(name)}` : ''}`;
        return `- ${this.chanceIcon(source.chance)} ${source.sourceName}${tail} ${bar((source.chance / best) * 100)} ${this.chanceText(source)}`;
      }),
      more:
        !view && sorted.length > TOP.drop
          ? this.foldedLine(
              TOP.drop,
              sorted.length,
              'highest chance first',
              !category && `add \`category:\` to /drop item:${name}`,
            )
          : undefined,
    };
  }

  private itemDetail(item?: DropItem) {
    // 원문에 <DT_FREEZE_COLOR> 같은 게임 내부 태그가 섞여 있고 디스코드는 그대로 뱉는다
    const clean = (text: string) => text.replace(/<[^>]+>/g, '');
    const levelStats = item?.levelStats;
    const maxRank = levelStats?.at(-1)?.stats;
    if (!levelStats || !maxRank?.length) {
      return item?.description && clean(item.description);
    }

    const rank = item.fusionLimit ?? levelStats.length - 1;
    return clean(
      [`${item.type} · Rank ${rank}/${rank}`, ...maxRank].join('\n'),
    );
  }

  async health() {
    return this.worldStateService
      .ping()
      .then((ms) =>
        okCard('WFCD API · online', `Responded in ${Math.round(ms)}ms`),
      )
      .catch((error: Error) => errorCard('WFCD API · offline', error.message));
  }

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

  /** 🔔 리마인더 기준 시각 — 만료(소티·집정관·아르키메디아) / 다음 전환(사이클) / 도착(바로) */
  async remindMomentOf(
    target: RemindTarget,
    option?: CycleName,
  ): Promise<Dayjs | null> {
    switch (target) {
      case TargetCommand.Sortie:
        return dayjs((await this.worldStateService.sortie()).expiry);
      case TargetCommand.ArchonHunt:
        return dayjs((await this.worldStateService.archonHunt()).expiry);
      case TargetCommand.Archimedea: {
        // 로테이션 사이엔 빈 배열일 수 있다
        const expiries = (await this.worldStateService.archimedeas())
          .map((archimedea) => dayjs(archimedea.expiry))
          .sort((a, b) => a.diff(b));
        return expiries[0] ?? null;
      }
      case TargetCommand.Cycles: {
        if (!option) return null;
        return dayjs((await this.worldStateService.cycle(option)).expiry);
      }
      case TargetCommand.VoidTrader: {
        const activation = dayjs(
          (await this.worldStateService.voidTrader()).activation,
        );
        return activation.isAfter(dayjs()) ? activation : null;
      }
    }
  }

  async searchItemNames(keyword: string) {
    return this.dropTableService.searchItemNames(keyword);
  }

  /** 위키 수집 전에도 떠야 해서 캐시가 아니라 wfcd 목록을 쓴다. 디스코드 자동완성 상한 25개 */
  searchIncarnonNames(keyword: string) {
    const wanted = keyword.trim().toLowerCase();
    return this.wfcdItemsService
      .findIncarnonGenesis()
      .map((item) => item.name.replace(' Incarnon Genesis', ''))
      .filter((name) => name.toLowerCase().includes(wanted))
      .sort()
      .slice(0, 25);
  }
}
