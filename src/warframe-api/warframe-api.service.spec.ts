import { ComponentType, type ContainerBuilder } from 'discord.js';
import { describe, expect, it, vi } from 'vitest';
import { WarframeApiService } from './warframe-api.service';
import Items from '@wfcd/items';
import { WfcdItemsService } from './wfcd-items/wfcd-items.service';
import { DropCategory } from './drop-table/vo/enum';
import dayjs from '@/utils/dayjs';
import { markStale } from './world-state/stale';
import {
  ArchimedeaType,
  ArchonBoss,
  ArchonReward,
  NightwaveFilter,
  VoidTraderCategory,
} from './world-state/vo/enum';

/**
 * V2 컨테이너는 슬롯이 아니라 컴포넌트 목록이라 필드 이름으로 못 집는다.
 * 텍스트를 다 이어붙이고 미디어 URL만 따로 뽑아 본다 — 검사할 것은 "무엇이 적혔나"뿐이다.
 */
type Media = { media?: { url?: string } };
type Node = {
  type: ComponentType;
  content?: string;
  components?: { content: string }[];
  accessory?: Media;
  items?: Media[];
};

const parts = (view: ContainerBuilder) => {
  const children = view.toJSON().components as unknown as Node[];
  const contents: string[] = [];
  let thumbnail: string | undefined;
  let images: string[] = [];

  for (const child of children) {
    if (child.type === ComponentType.TextDisplay && child.content)
      contents.push(child.content);
    if (child.type === ComponentType.Section) {
      contents.push(...(child.components ?? []).map((text) => text.content));
      thumbnail = child.accessory?.media?.url;
    }
    if (child.type === ComponentType.MediaGallery)
      images = (child.items ?? []).map((item) => item.media?.url ?? '');
  }

  return {
    contents,
    thumbnail,
    images,
    image: images[0],
    text: contents.join('\n'),
  };
};

/** 페이저 버튼의 customId — 필터가 실려 있는지, 애초에 붙었는지를 여기서 본다 */
const pagerIds = (view: ContainerBuilder) =>
  (
    view.toJSON().components as unknown as {
      type: ComponentType;
      components?: { custom_id?: string }[];
    }[]
  )
    .filter((child) => child.type === ComponentType.ActionRow)
    .flatMap((row) => row.components ?? [])
    .map((child) => child.custom_id);

/** 링크 버튼은 customId가 없다 — 눌러서 어디로 나가는지는 url만이 말한다 */
const linkUrls = (view: ContainerBuilder) =>
  (
    view.toJSON().components as unknown as {
      type: ComponentType;
      components?: { url?: string }[];
    }[]
  )
    .filter((child) => child.type === ComponentType.ActionRow)
    .flatMap((row) => row.components ?? [])
    .map((child) => child.url)
    .filter(Boolean);

/**
 * 이미지 URL이 비면 디스코드가 조용히 안 그리고 끝나서 눈으로는 회귀를 못 잡는다.
 * 알람·구독도 같은 카드 빌더를 타므로 여기만 지키면 세 경로가 같이 지켜진다.
 */
describe('WarframeApiService 카드 이미지', () => {
  const wfcdItemsService = new WfcdItemsService([] as never);

  const build = (worldState: object) =>
    new WarframeApiService(worldState as never, wfcdItemsService, {} as never);

  /**
   * 이 케이스만 진짜 아이템 DB를 물린다 — 검사할 것이 "uniqueName이 실제로 그림에 닿나"이기 때문이다.
   * 빈 배열로 두면 `findItemImg`가 전부 undefined를 주고, 오타 난 경로가 그대로 통과한다.
   * 샤드는 Misc, 보스 세트 모드는 Mods라 두 종만 실으면 된다(All은 세 배 느리다).
   */
  const withItems = (worldState: object) =>
    new WarframeApiService(
      worldState as never,
      new WfcdItemsService(new Items({ category: ['Misc', 'Mods'] })),
      {} as never,
    );

  it.each(Object.values(ArchonBoss))(
    '%s — 썸네일은 보스 엠블럼, 큰 슬롯은 해당 색 샤드, 보상은 subtitle',
    async (boss) => {
      const service = withItems({
        archonHunt: vi.fn().mockResolvedValue({
          boss,
          expiry: '2099-09-08T00:00:00Z',
          rewardPool: 'Archon Hunt',
          missions: [],
        }),
      });

      const view = await service.archonHunt();
      const { thumbnail, images, text } = parts(view);
      const name = boss.replace('Archon ', '');
      // 보스 공략은 API에 없다 — 위키가 유일한 다음 행동이다
      expect(linkUrls(view)).toEqual([
        `https://wiki.warframe.com/w/${boss.replace(' ', '_')}`,
      ]);
      // 256² 소스는 갤러리 2칸(칸당 약 254px)이라야 원본 그대로 선명하다. 한 장이면 풀폭으로 늘어나 뭉갠다 —
      // URL이 비면 디스코드가 조용히 안 그리고 끝나서 눈으로는 회귀를 못 잡는다
      expect(images).toEqual([
        `https://cdn.warframestat.us/img/${name}Header.png`,
        `https://cdn.warframestat.us/img/ArchonShard${name}.png`,
      ]);
      // 2-up이 섰으면 썸네일 자리는 비어야 한다 — 같은 보스 그림이 두 번 나온다
      expect(thumbnail).toBeUndefined();
      // Steel Path·보상은 3미션 공통이라 줄마다가 아니라 아래 한 줄
      expect(text).toContain(
        `All three on Steel Path · reward ${ArchonReward[boss]} Archon Shard`,
      );
    },
  );

  /** 한 칸짜리 갤러리는 풀폭으로 늘어나 금지안이 된다 — 짝이 깨지면 갤러리를 아예 접어야 한다 */
  it('샤드 이미지가 없으면 2-up 대신 썸네일로 내려간다', async () => {
    const service = new WarframeApiService(
      {
        archonHunt: vi.fn().mockResolvedValue({
          boss: ArchonBoss.Nira,
          expiry: '2099-09-08T00:00:00Z',
          missions: [],
        }),
      } as never,
      {
        findItemImg: (uniqueName: string) =>
          uniqueName.includes('SetMod') ? 'boss.png' : undefined,
      } as never,
      {} as never,
    );

    const { thumbnail, images } = parts(await service.archonHunt());
    expect(images).toEqual([]);
    expect(thumbnail).toBe('boss.png');
  });

  /**
   * 조건은 이름과 설명이 한 쌍이다. 설명만 남기면 그 조건을 부를 말이 사라져
   * 위키를 찾거나 파티에 말할 때 쓸 이름이 없다 — 산출물 4a가 둘을 같이 그린 이유다.
   */
  it('소티 조건은 이름과 설명을 같이 적는다', async () => {
    const { text } = parts(
      await build({
        sortie: vi.fn().mockResolvedValue({
          boss: 'Vay Hek',
          expiry: '2099-09-08T00:00:00Z',
          variants: [
            {
              node: 'Cinxia (Ceres)',
              missionType: 'Spy',
              modifier: 'Enemy Energy Drain',
              modifierDescription: 'Enemies drain your energy on hit.',
            },
          ],
        }),
      }).sortie(),
    );

    expect(text).toContain(
      '-# Enemy Energy Drain — Enemies drain your energy on hit.',
    );
  });

  /** 30분 창 안의 스테일 값에 `cached 60s`를 적으면 나이를 축소해 말하는 게 된다 */
  it('만료된 캐시로 내준 값이면 footer가 TTL이 아니라 실제 나이를 적는다', async () => {
    const sortie = {
      boss: 'Vay Hek',
      expiry: '2099-09-08T00:00:00Z',
      variants: [],
    };
    markStale(sortie, dayjs('2099-01-01T00:00:00Z'));

    const { text } = parts(
      await build({ sortie: vi.fn().mockResolvedValue(sortie) }).sortie(),
    );
    expect(text).toContain('cached <t:4070908800:R>');
    expect(text).not.toContain('cached 60s');
  });

  it('바로가 없는 동안은 카운트다운만 남기되 이미지는 유지한다', async () => {
    const service = build({
      voidTrader: vi.fn().mockResolvedValue({
        character: "Baro Ki'Teer",
        location: 'Larunda Relay',
        activation: '2099-09-10T00:00:00Z',
        expiry: '2099-09-12T00:00:00Z',
        inventory: [],
      }),
    });

    const { thumbnail, text } = parts(await service.voidTrader());
    expect(thumbnail).toBe(
      'https://cdn.warframestat.us/img/BaroKiteerAvatar.png',
    );
    expect(text).toContain("Baro Ki'Teer is away");
    expect(text).toContain('Inventory is unknown until he arrives');
  });

  /** 재고 응답에는 카테고리가 없다 — 아이템 DB의 category가 유일한 근거라 여기가 회귀 지점이다 */
  it('기본 화면은 카테고리별 요약이고 못 찾은 아이템은 Other로 흡수된다', async () => {
    const service = new WarframeApiService(
      {
        voidTrader: vi.fn().mockResolvedValue({
          character: "Baro Ki'Teer",
          location: 'Larunda Relay',
          activation: '2000-01-01T00:00:00Z',
          expiry: '2099-09-12T00:00:00Z',
          inventory: [
            { item: 'Prisma Gorgon', ducats: 600, credits: 50000 },
            { item: 'Primed Flow', ducats: 350, credits: 110000 },
            { item: 'Sands of Inaros Blueprint', ducats: 100, credits: 25000 },
          ],
        }),
      } as never,
      new WfcdItemsService([
        { name: 'Primed Flow', category: 'Mods', imageName: 'a.png' },
        { name: 'Prisma Gorgon', category: 'Primary', imageName: 'b.png' },
      ] as never),
      {} as never,
    );

    const { text } = parts(await service.voidTrader());
    expect(text).toContain('Mods · 1');
    expect(text).toContain('Weapons · 1');
    expect(text).toContain('Cosmetics & Other · 1');
    // 기본 화면은 ducats만 — 크레딧은 카테고리를 고른 뒤에 붙는다
    expect(text).toContain('**Primed Flow** 350dt');
    expect(text).not.toContain('110,000cr');
    expect(text).toContain('Showing 3 of 3 · cheapest first');

    const picked = parts(
      await service.voidTrader(VoidTraderCategory.Weapons, 0),
    );
    expect(picked.text).toContain('Weapons · 1 items');
    expect(picked.text).toContain('**Prisma Gorgon** · 600dt / 50,000cr');
    expect(picked.text).not.toContain('Primed Flow');
  });

  it('재고는 ducats 오름차순 8개씩 끊고 남은 경로를 페이지 표기로 밝힌다', async () => {
    const service = build({
      voidTrader: vi.fn().mockResolvedValue({
        character: "Baro Ki'Teer",
        location: 'Larunda Relay',
        activation: '2000-01-01T00:00:00Z',
        expiry: '2099-09-12T00:00:00Z',
        inventory: Array.from({ length: 20 }, (_, index) => ({
          item: `Item ${index}`,
          // 역순으로 넣어도 싼 것부터 나와야 페이지 번호가 의미를 가진다
          ducats: (20 - index) * 10,
          credits: 1000,
        })),
      }),
    });

    // 아이템 DB가 비어 있어 20종 전부 Other로 떨어진다
    const { text } = parts(
      await service.voidTrader(VoidTraderCategory.Other, 1),
    );
    expect(text).toContain('20 items');
    expect(text).toContain('**Item 11** · 90dt');
    expect(text).not.toContain('**Item 3**');
    expect(text).toContain('Page 2 / 3 · cheapest first · dt = ducats');
  });

  const dropService = (item: object) =>
    new WarframeApiService({} as never, new WfcdItemsService([item] as never), {
      findDropSources: vi
        .fn()
        .mockResolvedValue([
          { itemName: 'Vitality', sourceName: 'Grineer Lancer', chance: 1.01 },
        ]),
    } as never);

  it('카드 이미지가 없는 모드는 최대 랭크 효과를 첫 블록으로 적는다', async () => {
    const service = dropService({
      name: 'Vitality',
      type: 'Warframe Mod',
      imageName: 'HealthMaxMod.jpg',
      baseDrain: 2,
      fusionLimit: 10,
      levelStats: [{ stats: ['+9% Health'] }, { stats: ['+100% Health'] }],
    });

    const { text, thumbnail } = parts(await service.dropSources('vitality'));
    expect(text).toContain('Warframe Mod · Rank 10/10\n+100% Health');
    expect(thumbnail).toBe('https://cdn.warframestat.us/img/HealthMaxMod.jpg');
  });

  /** 카드 이미지에 수치·설명이 다 박혀 있어 텍스트로 중복해 적지 않는다 */
  it('모드 카드 이미지가 있으면 크게 띄우고 설명은 비운다', async () => {
    const service = dropService({
      name: 'Vitality',
      type: 'Warframe Mod',
      imageName: 'HealthMaxMod.jpg',
      wikiaThumbnail: 'https://wiki.warframe.com/images/VitalityMod.png',
      levelStats: [{ stats: ['+100% <DT_FREEZE_COLOR>Health'] }],
    });

    const { text, image, thumbnail } = parts(
      await service.dropSources('vitality'),
    );
    expect(image).toBe('https://wiki.warframe.com/images/VitalityMod.png');
    expect(thumbnail).toBeUndefined();
    expect(text).not.toContain('Rank');
  });

  /** 확률은 숫자만으로 위계가 안 보인다 — 최고 확률이 8칸을 다 채운다 */
  it('막대는 최고 확률 대비 상대값이다', async () => {
    const service = new WarframeApiService({} as never, wfcdItemsService, {
      findDropSources: vi.fn().mockResolvedValue([
        { itemName: 'Braton Prime', sourceName: 'Lith B4', chance: 11.06 },
        { itemName: 'Braton Prime', sourceName: 'Meso B3', chance: 2.51 },
      ]),
    } as never);

    const { text } = parts(await service.dropSources('braton'));
    expect(text).toContain('- 🟢 Lith B4 ▰▰▰▰▰▰▰▰ 11.06%');
    expect(text).toContain('- 🟠 Meso B3 ▰▰▱▱▱▱▱▱ 2.51%');
  });

  /** 막대는 상대 위계라 둘 다 8칸에 가까워도 실제 확률은 100배 차이일 수 있다 */
  it('확률 등급 이모지는 절대값으로 갈린다', async () => {
    const service = new WarframeApiService({} as never, wfcdItemsService, {
      findDropSources: vi.fn().mockResolvedValue([
        { itemName: 'X', sourceName: 'A', chance: 5 },
        { itemName: 'X', sourceName: 'B', chance: 4.99 },
        { itemName: 'X', sourceName: 'C', chance: 1 },
        { itemName: 'X', sourceName: 'D', chance: 0.99 },
      ]),
    } as never);

    const { text } = parts(await service.dropSources('x'));
    expect(text).toContain('🟢 A');
    expect(text).toContain('🟠 B');
    expect(text).toContain('🟠 C');
    expect(text).toContain('🔴 D');
    expect(text).toContain('🟢 ≥5% · 🟠 1-5% · 🔴 <1%');
  });

  const sourcesOf = (itemName: string, count: number) =>
    Array.from({ length: count }, (_, index) => ({
      itemName,
      sourceName: `${itemName} relic ${index}`,
      chance: 100 - index,
    }));

  const withSources = (sources: object[]) =>
    new WarframeApiService({} as never, wfcdItemsService, {
      findDropSources: vi.fn().mockResolvedValue(sources),
    } as never);

  /** 아이템이 하나로 좁혀졌으면 자를 이유가 없다 — 나머지는 페이지 버튼이 가져온다 */
  it('아이템 하나면 페이지로 펴고 접힌 줄을 쓰지 않는다', async () => {
    const view = await withSources(sourcesOf('Braton Prime', 12)).dropSources(
      'braton prime',
    );

    const { text } = parts(view);
    expect(text).toContain('Page 1 / 2 · highest chance first');
    expect(text).not.toContain('Showing');
    // 매칭된 이름이 아니라 유저가 친 질의를 싣는다 — 버튼이 같은 질의를 다시 돌려야 결과가 같다.
    // 유저 입력이라 인코딩한다: 공백이 그대로 들어가면 라우팅이 깨진다
    expect(pagerIds(view)).toEqual([
      'drop/all/braton%20prime/page/-1',
      'drop/all/braton%20prime/page/1',
    ]);
  });

  /** 페이지가 하나뿐이면 넘길 게 없다 — 버튼을 남기면 눌러보게 된다 */
  it('한 페이지에 다 들어가면 버튼도 접힌 줄도 없다', async () => {
    const view = await withSources(sourcesOf('Braton Prime', 8)).dropSources(
      'braton',
    );

    expect(pagerIds(view)).toEqual([]);
    expect(parts(view).text).not.toContain('Showing');
  });

  /**
   * 잘렸으면 전체 개수·정렬 기준·나머지를 볼 경로 셋을 같이 준다 — 개수만 주면 막다른 길이다.
   * 여러 아이템이 잡힌 화면은 "어느 아이템의 몇 페이지"가 안 읽혀 페이저를 안 붙인다
   */
  it('여러 아이템이 잡히면 접힌 줄로 돌아간다', async () => {
    const view = await withSources([
      ...sourcesOf('Braton Prime', 8),
      ...sourcesOf('Braton Vandal', 2),
    ]).dropSources('braton');

    expect(pagerIds(view)).toEqual([]);
    expect(parts(view).text).toContain(
      '-# Showing 6 of 8 · highest chance first · add `category:` to /drop item:Braton Prime',
    );
  });

  const mixedSources = [
    {
      itemName: 'Braton Prime',
      sourceName: 'Lith B4',
      chance: 11,
      category: 'relic',
    },
    {
      itemName: 'Braton Prime',
      sourceName: 'Lancer',
      chance: 2,
      category: 'enemy',
    },
  ];

  /** 좁히는 버튼은 실제로 좁혀질 때만 — 이미 유물뿐이면 눌러도 같은 화면이 온다 */
  it('유물과 다른 출처가 섞여 있을 때만 Relics only가 붙는다', async () => {
    expect(
      await withSources(mixedSources)
        .dropSources('braton prime')
        .then(pagerIds),
    ).toContain('drop/relic/braton%20prime/page/0');

    expect(
      await withSources([mixedSources[0]])
        .dropSources('braton prime')
        .then(pagerIds),
    ).not.toContain('drop/relic/braton%20prime/page/0');
  });

  /** 좁힌 화면에서 되돌아갈 자리가 없으면 커맨드 재입력이 유일한 길이 된다 */
  it('카테고리를 걸면 넓히는 버튼이 붙고, 0개여도 붙는다', async () => {
    const narrowed = await withSources([mixedSources[0]]).dropSources(
      'braton prime',
      DropCategory.Relic,
    );
    expect(pagerIds(narrowed)).toContain('drop/all/braton%20prime/page/0');

    const empty = await withSources([]).dropSources(
      'braton prime',
      DropCategory.Relic,
    );
    expect(pagerIds(empty)).toEqual(['drop/all/braton%20prime/page/0']);
  });
});

describe('WarframeApiService 균열/사이클', () => {
  const build = (worldState: object) =>
    new WarframeApiService(worldState as never, {} as never, {} as never);

  const fissure = (over: object) => ({
    node: 'Ukko (Jupiter)',
    missionType: 'Survival',
    tier: 'Axi',
    expiry: '2099-01-01T00:00:00Z',
    expired: false,
    isHard: false,
    ...over,
  });

  it('티어당 2줄만 펴고 항목 0개인 티어는 마지막 한 줄로 합친다', async () => {
    const service = build({
      voidFissures: vi
        .fn()
        .mockResolvedValue([
          fissure({ tier: 'Lith', node: 'Hepit (Void)' }),
          fissure({ tier: 'Axi', isHard: true }),
          fissure({ tier: 'Axi', node: 'Mot (Void)' }),
          fissure({ tier: 'Axi', node: 'Cerberus (Pluto)' }),
        ]),
    });

    const { text } = parts(await service.voidFissures());
    expect(text).toContain('**Lith 1**');
    expect(text).toContain('**Axi 3**');
    expect(text).toContain('· **SP**');
    // 접었으면 전체 개수·정렬 기준·나머지를 볼 경로를 같이 줘야 막다른 길이 안 된다
    expect(text).toContain(
      '-# Showing 2 of 3 · soonest first · /void-fissures tier:Axi',
    );
    expect(text).toContain('-# Meso · Neo · Requiem · Omnia — none');
    // 월드스테이트는 캐시를 타므로 실시간 값으로 오해되면 안 된다
    expect(text).toContain('-# cached 60s');
  });

  /** 요약의 접힌 줄이 가리키는 `tier:` 필터가 바로 이 화면이다 — 여기서 막히면 경로가 거짓말이 된다 */
  it('티어를 좁히면 접지 않고 페이지로 편다', async () => {
    const service = build({
      voidFissures: vi
        .fn()
        .mockResolvedValue(
          Array.from({ length: 10 }, (_, index) =>
            fissure({ node: `Node ${index}` }),
          ),
        ),
    });

    const view = await service.voidFissures('Axi' as never);
    const { text } = parts(view);
    expect(text).toContain('Void Fissures · Axi');
    expect(text).not.toContain('Showing');
    expect(text).toContain('Page 1 / 2 · soonest first');
    // 두 필터 축을 다 실어야 넘긴 페이지에서도, 다른 축을 켜도 필터가 산다
    expect(pagerIds(view)).toEqual([
      'void-fissures/Axi/all/page/-1',
      'void-fissures/Axi/all/page/1',
      // 좁힌 화면에는 되돌아갈 자리가 있어야 한다
      'void-fissures/all/all/page/0',
    ]);
  });

  /** 눌러서 빈 화면이 나오는 버튼은 미끼다 — 스틸패스 균열이 있을 때만 붙는다 */
  it('Steel Path 필터는 대상이 있을 때만 붙고 켜면 교집합이 남는다', async () => {
    const mixed = build({
      voidFissures: vi
        .fn()
        .mockResolvedValue([
          fissure({ node: 'Normal' }),
          fissure({ node: 'Hard', isHard: true }),
        ]),
    });

    expect(pagerIds(await mixed.voidFissures())).toContain(
      'void-fissures/all/sp/page/0',
    );

    const filtered = await mixed.voidFissures(undefined, undefined, 0, true);
    const { text } = parts(filtered);
    expect(text).toContain('Void Fissures · Steel Path');
    expect(text).toContain('**Hard**');
    expect(text).not.toContain('**Normal**');
    // 이미 켜진 필터는 다시 권하지 않는다 — 남는 건 되돌아갈 자리 하나뿐
    expect(pagerIds(filtered)).toEqual(['void-fissures/all/all/page/0']);

    const noneHard = build({
      voidFissures: vi.fn().mockResolvedValue([fissure({ node: 'Normal' })]),
    });
    expect(pagerIds(await noneHard.voidFissures())).toEqual([]);
  });

  it('필터를 걸고 0개면 필터를 지우라고 말한다', async () => {
    const service = build({ voidFissures: vi.fn().mockResolvedValue([]) });

    const { text } = parts(await service.voidFissures('Requiem' as never));
    expect(text).toContain('Nothing matches `tier:Requiem`');
    expect(text).toContain('-# Drop the filter to see every tier');
  });

  /** 통째로 에러 화면을 띄우면 멀쩡한 둘까지 잃는다 */
  it('사이클은 한 지역이 죽어도 자리를 남기고 실패 개수를 밝힌다', async () => {
    const service = build({
      cycle: vi
        .fn()
        .mockResolvedValueOnce({ state: 'day', expiry: '2099-01-01T02:00:00Z' })
        .mockResolvedValueOnce({
          state: 'warm',
          expiry: '2099-01-01T01:00:00Z',
        })
        .mockRejectedValueOnce(new Error('down')),
    });

    const { text } = parts(await service.cycles());
    // 임박한 순 — 금성(1시간)이 지구(2시간)보다 위, 실패한 데이모스는 맨 아래
    expect(text).toContain('🔥 **Orb Vallis (Venus)** warm → cold');
    expect(text.indexOf('Orb Vallis')).toBeLessThan(
      text.indexOf('Plains of Eidolon'),
    );
    expect(text).toContain('⚠️ **Cambion Drift (Deimos)** unavailable');
    expect(text).toContain('-# 1 of 3 regions failed to load');
  });
});

describe('WarframeApiService 나이트웨이브/아르키메디아', () => {
  const build = (worldState: object) =>
    new WarframeApiService(worldState as never, {} as never, {} as never);

  const challenge = (over: object) => ({
    id: 'c',
    activation: '2000-01-01T00:00:00Z',
    expiry: '2099-01-01T00:00:00Z',
    isDaily: false,
    isElite: false,
    isPermanent: false,
    title: 'T',
    desc: 'D',
    reputation: 1000,
    ...over,
  });

  it('만료된 챌린지는 빼고 일일/주간/엘리트로 나눈다', async () => {
    const service = build({
      nightwave: vi.fn().mockResolvedValue({
        season: 18,
        expiry: '2099-01-01T00:00:00Z',
        activeChallenges: [
          challenge({ isDaily: true }),
          challenge({}),
          challenge({ isElite: true }),
          challenge({ expiry: '2000-01-02T00:00:00Z' }),
        ],
      }),
    });

    const { text } = parts(await service.nightwave());
    expect(text).toContain('## Nightwave · Season 18');
    expect(text).toContain('**Daily 1**');
    expect(text).toContain('**Weekly 1**');
    expect(text).toContain('**Elite Weekly 1**');
  });

  /** 일간과 주간은 남은 시간이 달라 같이 볼 이유가 없다 — 엘리트는 주간에 붙는다 */
  it('주기 필터는 한 축이고 좁힌 화면에는 되돌아갈 자리가 남는다', async () => {
    const service = build({
      nightwave: vi.fn().mockResolvedValue({
        season: 18,
        expiry: '2099-01-01T00:00:00Z',
        activeChallenges: [
          challenge({ isDaily: true, title: 'Mine' }),
          challenge({ title: 'Hunt' }),
          challenge({ isElite: true, title: 'Slay' }),
        ],
      }),
    });

    expect(pagerIds(await service.nightwave())).toEqual([
      'nightwave/filter/daily',
      'nightwave/filter/weekly',
    ]);

    const weekly = await service.nightwave(undefined, NightwaveFilter.Weekly);
    const { text } = parts(weekly);
    expect(text).toContain('**Hunt**');
    expect(text).toContain('**Slay**');
    expect(text).not.toContain('**Mine**');
    expect(pagerIds(weekly)).toEqual([
      'nightwave/filter/daily',
      'nightwave/filter/all',
    ]);
  });

  const archimedea = (typeKey: string) => ({
    id: typeKey,
    expiry: '2099-01-01T00:00:00Z',
    typeKey,
    missions: [
      {
        missionType: 'Defense',
        deviation: { key: 'd', name: 'Eroding Senses', description: 'D' },
        risks: [
          {
            key: 'r',
            name: 'Fortified Foes',
            description: 'Enemies gain armor',
            isHard: true,
          },
        ],
      },
    ],
    personalModifiers: [{ key: 'm', name: 'Dull Blades', description: '-50%' }],
  });

  it('공백이 섞인 typeKey를 라벨로 옮기고 타입으로 거른다', async () => {
    const service = build({
      archimedeas: vi
        .fn()
        .mockResolvedValue([
          archimedea('C T_ L A B'),
          archimedea('C T_ H E X'),
        ]),
    });

    const both = parts(await service.archimedea());
    expect(both.text).toContain('## Archimedea');
    expect(both.text).toContain('**Deep Archimedea**');
    expect(both.text).toContain('**Temporal Archimedea**');

    const onlyHex = parts(await service.archimedea(ArchimedeaType.Temporal));
    // 하나뿐이면 제목이 이미 말하고 있어 본문에서 라벨을 뺀다
    expect(onlyHex.text).toContain('## Temporal Archimedea');
    expect(onlyHex.text).not.toContain('**Temporal Archimedea**');
    // 엘리트 위험만 아이콘 — isHard의 유일한 시각적 쓸모다
    expect(onlyHex.text).toContain('-# Risks · ☠️ Fortified Foes');
    expect(onlyHex.text).toContain('-# ☠️ risks are elite-only');
  });

  it('detail이면 편차·위험마다 설명을 붙이고 elite 안내는 뺀다', async () => {
    const service = build({
      archimedeas: vi.fn().mockResolvedValue([archimedea('C T_ L A B')]),
    });

    const { text } = parts(await service.archimedea(undefined, true));
    expect(text).toContain('**Eroding Senses**\n-# D');
    expect(text).toContain('**Fortified Foes** elite\n-# Enemies gain armor');
    expect(text).not.toContain('Bold risks are elite-only');
  });

  /**
   * detail:true를 type 없이 돌리면 2종 × 3미션 × (편차+위험) × 설명문이 한 메시지에 쌓인다.
   * 규격 한도는 "메시지 합 4000자"인데 코드는 TextDisplay 하나당으로 재고 있어(G8)
   * 개별로는 통과하고 서버가 메시지를 통째로 400으로 거절한다 — 미션 1개=1페이지가 그 방어다.
   */
  describe('detail 페이징', () => {
    const missionOf = (name: string) => ({
      missionType: name,
      deviation: { key: 'd', name: `${name} Deviation`, description: 'D' },
      risks: [{ key: 'r', name: `${name} Risk`, description: 'R' }],
    });
    const threeMissions = (typeKey: string) => ({
      ...archimedea(typeKey),
      missions: ['Alpha', 'Beta', 'Gamma'].map(missionOf),
    });
    const buildThree = (...keys: string[]) =>
      build({
        archimedeas: vi.fn().mockResolvedValue(keys.map(threeMissions)),
      });

    const buttons = (view: ContainerBuilder) =>
      (
        view.toJSON().components as unknown as {
          type: ComponentType;
          components?: { custom_id?: string; disabled?: boolean }[];
        }[]
      )
        .filter((child) => child.type === ComponentType.ActionRow)
        .flatMap((row) => row.components ?? [])
        .map((child) => [child.custom_id, child.disabled]);

    it('미션 하나만 펴고 나머지는 페이지 버튼으로 넘긴다', async () => {
      const view = await buildThree('C T_ L A B').archimedea(
        ArchimedeaType.Deep,
        true,
      );

      const { text } = parts(view);
      expect(text).toContain('**Alpha Deviation**');
      expect(text).not.toContain('**Beta Deviation**');
      expect(text).toContain('Page 1 / 3');
      // 두 축(종·detail)을 다 실어야 페이지를 넘겨도, 한 축을 바꿔도 나머지가 산다
      expect(buttons(view)).toEqual([
        ['archimedea/CT_LAB/detail/page/-1', true],
        ['archimedea/CT_LAB/detail/page/1', false],
        ['archimedea/CT_LAB/all/page/0', false],
      ]);
    });

    it('페이지를 넘기면 그 미션이 나온다', async () => {
      const { text } = parts(
        await buildThree('C T_ L A B').archimedea(
          ArchimedeaType.Deep,
          true,
          undefined,
          1,
        ),
      );
      expect(text).toContain('**Beta Deviation**');
      expect(text).not.toContain('**Alpha Deviation**');
      expect(text).toContain('Page 2 / 3');
    });

    it('타입을 안 걸면 두 종을 이어 붙여 6페이지가 되고 어느 쪽인지 제목이 말한다', async () => {
      const view = await buildThree('C T_ L A B', 'C T_ H E X').archimedea(
        undefined,
        true,
        undefined,
        3,
      );

      const { text } = parts(view);
      expect(text).toContain('## Temporal Archimedea');
      expect(text).toContain('Page 4 / 6');
      expect(buttons(view)[0][0]).toBe('archimedea/all/detail/page/2');
    });

    it('개인 수정자는 모든 페이지에 남는다 — 미션마다 다시 찾으러 가지 않는다', async () => {
      const service = buildThree('C T_ L A B');
      for (const page of [0, 1, 2]) {
        const { text } = parts(
          await service.archimedea(ArchimedeaType.Deep, true, undefined, page),
        );
        expect(text).toContain('Dull Blades');
      }
    });

    it('detail:false는 페이징하지 않는다 — 요약 3줄은 한 카드에 들어간다', async () => {
      const view = await buildThree('C T_ L A B').archimedea(
        ArchimedeaType.Deep,
      );

      const { text } = parts(view);
      expect(text).toContain('Alpha');
      expect(text).toContain('Gamma');
      // 페이저는 없지만 detail로 넘어가는 자리는 남는다 — 산출물 4c의 Show details
      expect(buttons(view)).toEqual([
        ['archimedea/CT_LAB/detail/page/0', false],
      ]);
    });
  });
});

describe('WarframeApiService 인카논 로테이션', () => {
  const duviriCycle = {
    choices: [
      { categoryKey: 'EXC_NORMAL', choices: ['Gara', 'Khora'] },
      { categoryKey: 'EXC_HARD', choices: ['Braton', 'Ack & Brunt'] },
    ],
  };

  const service = new WarframeApiService(
    { duviriCycle: vi.fn().mockResolvedValue(duviriCycle) } as never,
    new WfcdItemsService([] as never),
    {} as never,
  );

  it('스틸패스(hard) 목록만 위키 링크로 나가고 노말은 이름만 나간다', async () => {
    const { text } = parts(await service.incarnon());

    // 공백은 언더스코어, 그 외 특수문자는 인코딩해야 위키 페이지에 닿는다
    expect(text).toContain(
      '[Braton](https://wiki.warframe.com/w/Braton_Incarnon_Genesis) · ' +
        '[Ack & Brunt](https://wiki.warframe.com/w/Ack_%26_Brunt_Incarnon_Genesis)',
    );
    expect(text).toContain('**Normal Circuit · Warframes**\nGara · Khora');
  });

  it('로테이션이 비면 안내만 남긴다', async () => {
    const empty = new WarframeApiService(
      { duviriCycle: vi.fn().mockResolvedValue({ choices: [] }) } as never,
      {} as never,
      {} as never,
    );

    const { text } = parts(await empty.incarnon());
    expect(text).toContain('## No Circuit rotation');
    expect(text).not.toContain('Steel Path Circuit');
  });
});
