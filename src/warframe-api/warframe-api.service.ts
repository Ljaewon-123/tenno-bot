import dayjs, { type Dayjs } from '@/utils/dayjs';
import {
  Accent,
  accentFor,
  bar,
  bold,
  button,
  card,
  emptyCard,
  linkButton,
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
import { AlarmRequest, RemindTarget, TargetCommand } from './enum';
import { DropItem } from './wfcd-items/vo/drop-item.interface';
import { WfcdItemsService } from './wfcd-items/wfcd-items.service';
import {
  ArchimedeaLabel,
  ArchimedeaType,
  ArchonImage,
  ArchonReward,
  CircuitCategory,
  CycleIcon,
  CycleLabel,
  CycleName,
  CycleNextState,
  NightwaveFilter,
  VOID_TRADER_IMAGE,
  VOID_TRADER_WEAPON_CATEGORIES,
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
import { TTL_SECONDS } from './world-state/constants';
import { staleAsOf } from './world-state/stale';
import { WorldStateService } from './world-state/world-state.service';

/** 그룹당 펴는 줄 수. 넘치는 만큼은 접는다 — 안 접으면 목록 하나가 40개 한도를 뚫는다 */
const TOP = { fissure: 2, drop: 6 } as const;

/** 기본 화면에서 카테고리당 미리 펴는 종수. 셋 다 펴도 한 화면 안에 든다 */
const TRADER_PEEK = 5;

/** 카테고리를 안 고른 상태. 셀렉트에서 되돌아올 자리가 없으면 기본 화면이 막다른 길이 된다 */
const TRADER_ALL = 'all';

/** `/drop` 페이저의 customId 앞자리 — 핸들러의 `@Button('drop/:category/:item/page/:page')`와 같아야 한다 */
export const DROP_KEY = 'drop';
const DROP_ALL = 'all';

/** customId의 필터 축에서 "안 걸림"을 뜻하는 값. 축을 비워 두면 세그먼트 수가 달라져 라우팅이 깨진다 */
export const FILTER_OFF = 'all';
/** 아르키메디아 customId의 detail 축 — `archimedea/:type/:detail/page/:page` */
export const ARCHIMEDEA_DETAIL = 'detail';
/** 균열 customId의 스틸패스 축 — `void-fissures/:tier/:hard/page/:page` */
export const FISSURE_HARD = 'sp';
/** paged()가 key 뒤에 붙이는 꼬리. 페이지 번호가 세 자리를 넘길 목록은 없다 */
const PAGE_SUFFIX_LENGTH = '/page/999'.length;

/**
 * 접힌 줄. "…and N more"는 전체가 몇 개고 어디서 나머지를 보는지를 안 말해 막다른 길이 된다 —
 * (보이는 수 / 전체 수 / 정렬 기준 / 나머지를 볼 경로) 넷을 항상 같이 준다.
 */
const foldedLine = (shown: number, total: number, sort: string, path?: Line) =>
  [`Showing ${shown} of ${total}`, sort, path].filter(Boolean).join(' · ');

/** 막대는 최고 확률 대비 상대 위계라 "흔한 건지"를 못 말한다 — 절대 등급은 이모지 3단으로 (색맹도 형태로 구분된다) */
const chanceIcon = (chance: number) =>
  chance >= 5 ? '🟢' : chance >= 1 ? '🟠' : '🔴';

/** 버튼은 컴포넌트가 정하지 않는다 — 어떤 버튼을 붙일지는 커맨드 핸들러가 안다 */
type Buttons = ButtonBuilder[] | undefined;

@Injectable()
export class WarframeApiService {
  constructor(
    private readonly worldStateService: WorldStateService,
    private readonly wfcdItemsService: WfcdItemsService,
    private readonly dropTableService: DropTableService,
  ) {}

  /**
   * footer는 데이터 신선도 자리다. 월드스테이트는 캐시를 타므로 최대 TTL만큼 옛날 값일 수 있고,
   * 안 적으면 매번 실시간으로 읽어온 값이라고 오해한다.
   */
  private fresh(data: unknown, ...extra: Line[]) {
    // 스테일 캐시로 내준 값이면 TTL이 아니라 실제 나이를 적는다 — `cached 60s`는 나이를 축소해 말한다
    const asOf = staleAsOf(data);
    return [
      ...extra.filter(Boolean),
      asOf ? `cached ${relative(asOf)}` : `cached ${TTL_SECONDS}s`,
    ].join(' · ');
  }

  /** 집정관 */
  async archonHunt(buttons?: Buttons) {
    const archon = await this.worldStateService.archonHunt();
    const art = ArchonImage[archon.boss];
    const boss = this.wfcdItemsService.findItemImg(art.boss);
    const shard = this.wfcdItemsService.findItemImg(art.shard);
    // 소스가 256²뿐이라 풀폭 1장은 4배로 늘어나 뭉갠다. 갤러리 2칸은 칸당 약 254px라 원본 그대로 선명하다 —
    // 한 칸짜리 갤러리는 다시 풀폭으로 늘어나므로 짝이 안 맞으면 2-up을 접고 썸네일로 내린다
    const gallery = boss && shard ? [boss, shard] : undefined;

    return card({
      accent: accentFor(archon.expiry),
      title: `Archon Hunt · ${archon.boss}`,
      subtitle: `Resets ${relative(archon.expiry)}`,
      // 2-up이 못 서면 86px 썸네일이 폴백이다 — 보스는 엠블럼이라 그 크기에서도 읽힌다
      thumbnail: gallery ? undefined : boss,
      // 샤드 색이 이 커맨드의 진짜 관심사라 두 번째 칸은 장식이 아니라 정보다
      image: gallery,
      blocks: [
        [
          {
            lines: archon.missions.map((mission, index) =>
              bold(`${index + 1} · ${mission.node} — ${mission.type}`),
            ),
            // Steel Path와 보상은 3미션 공통값이다 — 줄마다 반복하면 갤러리가 먹은 세로를 두 번 잃는다.
            // 집정관 사냥은 항상 Steel Path 난이도라 API에 없어도 고정으로 적을 수 있다
            more: `All three on Steel Path · reward ${ArchonReward[archon.boss]} Archon Shard`,
          },
        ],
      ],
      // 보스 공략은 API에 없다 — 위키가 유일한 다음 행동이라 링크 버튼으로 내보낸다
      buttons: [
        ...(buttons ?? []),
        linkButton('Wiki', this.wikiUrl(archon.boss)),
      ],
      footer: this.fresh(archon),
    });
  }

  /** 출격 (소티) — 조건 문장이 미션명보다 길어서 노드/타입이 굵은 줄, 조건이 회색 줄이다 */
  async sortie(buttons?: Buttons) {
    const sortie = await this.worldStateService.sortie();

    return card({
      accent: accentFor(sortie.expiry),
      title: `Sortie · ${sortie.boss}`,
      subtitle: `Resets ${relative(sortie.expiry)}`,
      // 미션 사이는 구분선이 아니라 빈 줄 — 셋은 같은 종류라 위계가 아니라 순서만 있다
      blocks: [
        sortie.variants.map((variant, index) => ({
          lines: [
            bold(`${index + 1} · ${variant.node} — ${variant.missionType}`),
            // 조건은 이름과 설명이 한 쌍이다 — 설명만 두면 "무슨 조건인지"를 부를 이름이 사라져
            // 위키를 찾거나 남에게 말할 때 쓸 말이 없다
            subtext(`${variant.modifier} — ${variant.modifierDescription}`),
          ],
        })),
      ],
      buttons,
      footer: this.fresh(sortie),
    });
  }

  /** 이벤트 — 평소 0개가 기본 화면이라 빈 상태를 사과문이 아니라 안내로 쓴다 */
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
      // 이벤트는 종류마다 페이로드가 달라 없는 필드는 "N/A"가 아니라 아예 빼는 게 유일한 안전책
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

  /** 이벤트는 "얼마나 남았나"보다 "얼마나 찼나"가 행동을 만든다 */
  private scoreLine(event: WorldEvent): Line {
    const { currentScore, maximumScore } = event;
    if (!currentScore || !maximumScore) return undefined;
    return `${bar((currentScore / maximumScore) * 100)} ${currentScore.toLocaleString()} / ${maximumScore.toLocaleString()}`;
  }

  /** 균열 한 줄 — 티어 요약과 티어별 페이지가 같은 모양이어야 페이지가 "같은 목록"으로 읽힌다 */
  private fissureLine(fissure: Fissure) {
    return `- ${bold(fissure.node)} — ${fissure.missionType}${
      // Steel Path는 이모지가 아니라 굵은 축약 — 줄 끝의 남은 시간이 밀리지 않는다
      fissure.isHard ? ` · ${bold('SP')}` : ''
    } ${relative(fissure.expiry)}`;
  }

  /**
   * 보이드 균열 — 티어가 6개라 그룹당 상위 몇 줄만 펴고 접는다.
   * 필터는 티어·스틸패스 두 축이고 둘 다 customId에 실린다(`:tier/:hard`) — 안 그러면
   * 페이지를 넘기거나 다른 축을 켜는 순간 먼저 건 필터가 죽는다.
   */
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
      // 스틸패스 균열이 실제로 있을 때만 — 눌러서 빈 화면이 나오는 버튼은 미끼다
      !hard &&
        live.some((fissure) => fissure.isHard) &&
        button(filterId(options ?? FILTER_OFF, true), 'Steel Path only'),
      // 좁힌 화면에서 되돌아갈 자리. 두 축을 한 번에 푼다
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

    // 티어를 하나로 좁힌 순간 그룹이 하나뿐이라 접을 이유가 없다 — 여기서만 페이지로 편다.
    // 요약 화면은 접힌 줄이 `tier:` 필터를 가리키고, 그 필터가 이 페이저로 이어진다
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
      // 항목 0개인 티어는 블록을 만들지 않고 마지막 한 줄로 합친다 — "없음"도 정보다
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
          // 티어 필터가 나머지를 보는 유일한 경로다 — 접은 자리에서 바로 알려준다
          more:
            list.length > TOP.fissure
              ? foldedLine(
                  TOP.fissure,
                  list.length,
                  'soonest first',
                  // 켜 둔 스틸패스 필터까지 실어야 눌러서 간 화면의 개수가 여기 적힌 수와 같다
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

  /** 재고 한 종의 분류. 아이템 DB에서 못 찾으면(코스메틱·소모품이 대부분) Other로 흡수한다 */
  private traderCategory(stock: VoidTraderItem): VoidTraderCategory {
    const category = this.wfcdItemsService.findItemByName(stock.item)?.category;
    if (category === 'Mods') return VoidTraderCategory.Mods;
    return VOID_TRADER_WEAPON_CATEGORIES.includes(category ?? '')
      ? VoidTraderCategory.Weapons
      : VoidTraderCategory.Other;
  }

  /**
   * 보이드 상인 (바로 키티어) — 부재가 대부분의 시간이라 부재 화면이 따로 있다.
   * 재고 40종을 페이지로만 넘기면 6번 눌러야 다 본다 — 확인 목적에는 과하다.
   * 기본 화면은 카테고리 3개 요약, 셀렉트로 고른 카테고리만 전체 가격과 함께 편다.
   */
  async voidTrader(category?: VoidTraderCategory, page = 0, buttons?: Buttons) {
    const trader = await this.worldStateService.voidTrader();
    const now = dayjs();
    const active =
      now.isAfter(trader.activation) && now.isBefore(trader.expiry);
    // 바로 본인은 썸네일 — 큰 슬롯에 넣으면 512px 초상화가 카드를 잡아먹는다
    const thumbnail = this.wfcdItemsService.imgUrl(VOID_TRADER_IMAGE);

    if (!active)
      return card({
        // 지금 할 게 없다는 상태다 — 재고가 없으므로 카운트다운 하나만 남긴다
        accent: Accent.Muted,
        title: `${trader.character} is away`,
        subtitle: `Arrives ${relative(trader.activation)} · stays 48 hours`,
        thumbnail,
        blocks: [],
        // 🔔는 도착 알림이라 부재 화면에서만 뜻이 있다 — 와 있는 동안 누를 도착이 없다
        buttons,
        footer: this.fresh(trader, 'Inventory is unknown until he arrives'),
      });

    // 정렬이 흔들리면 페이지 번호가 의미를 잃는다 — ducats 오름차순 고정
    const stock = [...trader.inventory].sort((a, b) => a.ducats - b.ducats);
    // 분류는 아이템 DB 전체 스캔이라 재고당 딱 한 번만 돌린다
    const grouped = new Map<VoidTraderCategory, VoidTraderItem[]>(
      Object.values(VoidTraderCategory).map((name) => [name, []]),
    );
    for (const item of stock)
      grouped.get(this.traderCategory(item))?.push(item);
    const filled = [...grouped].filter(([, items]) => items.length);

    // 비어 있는 카테고리는 고를 수 없다 — 고르면 빈 화면이 나오는 선택지는 미끼다
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
            // 가로 나열 + ducats만 — 크레딧은 병목이 아니라서 두 값을 다 쓰면 줄만 두 배가 된다
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
          foldedLine(shown, stock.length, 'cheapest first'),
          'dt = ducats',
        ),
      });
    }

    const items = grouped.get(category) ?? [];
    const view = paged({
      // 카테고리를 customId에 실어야 페이지를 넘겨도 필터가 살아남는다
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

  /**
   * 오픈월드 낮/밤 사이클 — 셋을 따로 볼 이유가 없어 한 카드에 모은다.
   * V2에는 3열 격자가 없다. 대신 임박한 순 세로 스택이라 지역이 늘어도 줄만 늘어난다.
   */
  async cycles(buttons?: Buttons) {
    const names = Object.values(CycleName);
    // 한 곳이 죽어도 나머지는 보여준다 — 통째로 에러를 띄우면 멀쩡한 둘까지 잃는다
    const results = await Promise.allSettled(
      names.map(async (name) => this.worldStateService.cycle(name)),
    );

    const rows = names
      .map((name, index) => ({ name, result: results[index] }))
      .sort((a, b) => {
        // 실패한 지역은 정렬 기준이 없으므로 항상 뒤로 민다
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
              // 실패한 지역도 자리를 남긴다 — 줄이 사라지면 지역이 없어진 것처럼 읽힌다
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

  /** 나이트웨이브 — 일일/주간/엘리트로 나눠 보여준다. 필터는 주기 축 하나뿐이다 */
  async nightwave(buttons?: Buttons, filter?: NightwaveFilter) {
    const nightwave = await this.worldStateService.nightwave();
    const now = dayjs();
    // possibleChallenges에는 아직 안 뜬 것까지 들어있고, activeChallenges에도 기간이 지난 게 남는다
    const all = nightwave.activeChallenges.filter((challenge) =>
      now.isBefore(challenge.expiry),
    );
    // 일간은 하루, 주간·엘리트는 한 주 — 남은 시간이 다르면 같이 볼 이유도 없다
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
      // 좁힌 화면에서 되돌아갈 자리
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

  /** 아르키메디아 customId — 두 축(종·detail)을 다 실어야 버튼을 눌러도 나머지 축이 산다 */
  private archimedeaId(
    type: ArchimedeaType | typeof FILTER_OFF,
    detail: boolean,
  ) {
    return `${TargetCommand.Archimedea}/${type}/${detail ? ARCHIMEDEA_DETAIL : FILTER_OFF}/page/0`;
  }

  /** 아르키메디아 (심층/시간) — 옵션이 없으면 둘 다, detail이면 편차·위험 설명까지 */
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

    /**
     * 종 전환은 버튼 하나로 순환한다(둘 다 → 심층 → 시간 → 둘 다) — 종마다 버튼을 깔면
     * 페이저 2 + 종 2 + detail 1 + 🔔 1로 한 행 5개 한도를 넘긴다.
     */
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

    // 미션마다 편차1+위험3의 설명문이 붙는 detail은 다 쌓으면 메시지 합 한도를 넘긴다 —
    // 산출물 4c가 페이징을 요구한 이유고, G8이 실제로 터질 수 있는 유일한 경로다
    const missions = targets.flatMap((archimedea) =>
      archimedea.missions.map((mission, index) => ({
        archimedea,
        mission,
        // 종을 넘겨도 미션 번호는 그 종 안에서 1..3이다
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
        // 둘 다 나올 때만 어느 쪽인지 밝힌다 — 하나뿐이면 제목이 이미 말하고 있다
        targets.length > 1 && bold(labelOf(archimedea)),
        ...archimedea.missions.map((mission, index) => ({
          heading: `${index + 1} · ${mission.missionType}`,
          lines: [
            `Deviation ${bold(mission.deviation.name)}`,
            // 굵게는 subtext의 회색 위에서 거의 구분이 안 된다 — 엘리트 전용 위험은 아이콘으로 찍는다
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

  /**
   * detail은 미션 1개 = 1페이지. 페이지가 어느 종의 것인지는 제목이 말하고,
   * 개인 수정자는 매 페이지에 남긴다 — 페이지를 넘길 때마다 다시 찾으러 가면 안 된다.
   */
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
      // 타입을 customId에 실어야 넘긴 페이지에서도 필터가 산다
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

  /** 위키 페이지 URL — 공백은 언더스코어, 나머지 특수문자는 인코딩해야 페이지에 닿는다 */
  private wikiUrl(page: string) {
    return `https://wiki.warframe.com/w/${encodeURIComponent(page.replace(/ /g, '_'))}`;
  }

  /** 퍽·설치 재료는 어느 API에도 없고 위키 표가 유일한 출처다. 페이지명이 곧 `{무기} Incarnon Genesis` */
  private genesisWikiLink(weapon: string) {
    return `[${weapon}](${this.wikiUrl(`${weapon} Incarnon Genesis`)})`;
  }

  /**
   * 이번 주 서킷 로테이션. 스틸패스(hard) 목록이 이번 주에 얻을 수 있는 인카논 제네시스다.
   * 진화 퍽·설치 재료는 어느 API에도 없다(위키 표가 유일한 출처) — 위키 링크로 넘긴다.
   */
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
      // 어댑터 아이콘만 CDN에 있다 — 인카논 폼 무기 아트는 wfcd items에 없다(위키 파일뿐)
      thumbnail: this.wfcdItemsService.findItemImgByName(
        `${genesis[0]} Incarnon Genesis`,
      ),
      // 데이터가 문자열 배열 둘뿐이라 세로 목록으로 펴면 정보량 대비 길이가 과하다
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

  /**
   * 필터·복귀 버튼도 페이저와 같은 customId를 쓴다 — 아이템 이름이 유저 입력이라
   * 100자를 넘으면 버튼을 포기한다(넘긴 채로 보내면 메시지가 통째로 400이다).
   */
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
    // 좁힌 화면에서 되돌아갈 자리 — 없으면 커맨드 재입력이 유일한 길이 된다
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
    // 모드 카드는 세로 3:4라 80px 썸네일에 넣으면 읽히지 않는다 → 큰 슬롯으로 보낸다
    const modCard = item?.levelStats?.length ? item.wikiaThumbnail : undefined;
    // 카드 이미지에 이름·최대 랭크 수치·설명이 전부 박혀 있다. 텍스트로 옮겨 적지 않는다
    const detail = modCard ? undefined : this.itemDetail(item);

    const prices = await this.traderPrices(sources);
    const groups = Object.entries(byItem);
    // customId는 100자 하드 리밋이다. 아이템 이름은 유저가 친 값이라 길이를 보장할 수 없어
    // 안 들어가면 페이저를 포기하고 접힌 줄로 돌아간다 — 넘기면 메시지가 통째로 400이다
    const key = `${DROP_KEY}/${category ?? DROP_ALL}/${encodeURIComponent(itemName)}`;
    // 여러 아이템이 잡힌 화면에서 페이지는 "어느 아이템의 몇 페이지"인지가 안 읽힌다.
    // 그때는 이름을 더 정확히 주는 게 진짜 경로라 접힌 줄을 그대로 둔다
    const single =
      groups.length === 1 &&
      key.length + PAGE_SUFFIX_LENGTH <= LIMIT.customId &&
      groups[0];

    // 실제로 좁혀질 때만 붙인다 — 이미 유물뿐인 목록에서 누르면 같은 화면이 다시 온다
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

    return card({
      title: `Drop Sources · ${itemName}`,
      // 접힌 개수는 그룹마다 다르다 — 여기서 "top 6"을 또 말하면 그룹 줄과 어긋난다
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
      // 드랍 테이블은 월드스테이트가 아니라 DB라 신선도 표기 대상이 아니다
      footer: [
        view && view.footer,
        'Bar is relative to the best source · 🟢 ≥5% · 🟠 1-5% · 🔴 <1%',
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }

  /**
   * 바로 두캇 값은 정적 데이터 어디에도 없다 — 그가 실제로 팔고 있는 동안의 재고 응답이 유일한 출처다.
   * 그래서 방문 중에만 가격이 붙는다. 상점 출처가 없으면 아예 조회하지 않는다
   */
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

  /** 확률은 숫자만으로 위계가 안 보인다 — 최고 확률 대비 상대 막대를 붙인다(절대 막대는 1%가 안 보인다) */
  private dropGroup(
    name: string,
    list: DropSource[],
    category?: DropCategory,
    prices = new Map<string, string>(),
    view?: { items: DropSource[] },
  ): Block {
    const sorted = [...list].sort((a, b) => b.chance - a.chance);
    // 막대 기준은 페이지가 아니라 목록 전체의 최고 확률이다 — 페이지마다 기준이 바뀌면 막대가 거짓말을 한다
    const best = sorted[0].chance;

    return {
      heading: name,
      lines: (view ? view.items : sorted.slice(0, TOP.drop)).map((source) => {
        // relic은 이름에 이미 드러나므로 꼬리표를 붙이지 않는다
        const tail =
          source.category && source.category !== DropCategory.Relic
            ? ` (${source.category})`
            : '';
        // 상점은 확률이 없어 chance가 0이다 — 막대를 붙이면 "0% 확률"로 읽힌다.
        // 바로가 와 있으면 두캇 값이, 아니면 아무것도 안 붙는다
        if (source.category === DropCategory.Trader)
          return `- 🛒 ${source.sourceName}${tail}${prices.has(name) ? ` · ${prices.get(name)}` : ''}`;
        return `- ${chanceIcon(source.chance)} ${source.sourceName}${tail} ${bar((source.chance / best) * 100)} ${source.chance}%`;
      }),
      // 페이저가 붙었으면 접힌 줄이 없다 — 버튼이 나머지를 보는 경로다
      more:
        !view && sorted.length > TOP.drop
          ? foldedLine(
              TOP.drop,
              sorted.length,
              'highest chance first',
              // 이미 좁힌 뒤라면 더 좁힐 경로가 없다 — 없는 길을 안내하지 않는다
              !category && `add \`category:\` to /drop item:${name}`,
            )
          : undefined,
    };
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

  /** 알람용 디스패치 — 슬래시 커맨드와 동일한 카드를 만든다 */
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

  /**
   * 🔔 1회용 리마인더가 "몇 분 전"을 계산할 기준 시각. 대상마다 기준이 다르다 —
   * 만료(소티·집정관·아르키메디아) / 다음 전환(사이클) / 도착(바로).
   * 카드를 그릴 때가 아니라 버튼을 누른 순간에만 부르므로 조회 비용이 늘지 않는다
   * (월드스테이트는 어차피 같은 캐시를 탄다).
   */
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
        // 심층/시간 둘 다 같은 주간 만료지만 로테이션 사이에 빈 배열일 수 있다
        const expiries = (await this.worldStateService.archimedeas())
          .map((archimedea) => dayjs(archimedea.expiry))
          .sort((a, b) => a.diff(b));
        return expiries[0] ?? null;
      }
      case TargetCommand.Cycles: {
        // 낮이면 다음 밤, 밤이면 다음 낮 — 어느 쪽이든 expiry가 곧 다음 전환이라 계산이 없다.
        // 지역이 빠지면 알릴 대상이 정해지지 않는다(버튼은 항상 지역을 싣는다)
        if (!option) return null;
        return dayjs((await this.worldStateService.cycle(option)).expiry);
      }
      case TargetCommand.VoidTrader: {
        // 유일하게 만료가 아니라 도착이다. 이미 와 있으면 알릴 도착이 없다
        const activation = dayjs(
          (await this.worldStateService.voidTrader()).activation,
        );
        return activation.isAfter(dayjs()) ? activation : null;
      }
    }
  }

  /** 드랍 커맨드 오토컴플리트용 아이템 이름 목록 */
  async searchItemNames(keyword: string) {
    return this.dropTableService.searchItemNames(keyword);
  }
}
