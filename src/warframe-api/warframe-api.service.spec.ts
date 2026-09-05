import { ComponentType, type ContainerBuilder } from 'discord.js';
import { describe, expect, it, vi } from 'vitest';
import { WarframeApiService } from './warframe-api.service';
import { WfcdItemsService } from './wfcd-items/wfcd-items.service';
import { ArchimedeaType, ArchonBoss } from './world-state/vo/enum';

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
  let image: string | undefined;

  for (const child of children) {
    if (child.type === ComponentType.TextDisplay && child.content)
      contents.push(child.content);
    if (child.type === ComponentType.Section) {
      contents.push(...(child.components ?? []).map((text) => text.content));
      thumbnail = child.accessory?.media?.url;
    }
    if (child.type === ComponentType.MediaGallery)
      image = child.items?.[0].media?.url;
  }

  return { contents, thumbnail, image, text: contents.join('\n') };
};

/**
 * 이미지 URL이 비면 디스코드가 조용히 안 그리고 끝나서 눈으로는 회귀를 못 잡는다.
 * 알람·구독도 같은 카드 빌더를 타므로 여기만 지키면 세 경로가 같이 지켜진다.
 */
describe('WarframeApiService 카드 이미지', () => {
  const wfcdItemsService = new WfcdItemsService({
    find: () => undefined,
  } as never);

  const build = (worldState: object) =>
    new WarframeApiService(worldState as never, wfcdItemsService, {} as never);

  it.each(Object.values(ArchonBoss))(
    '%s — 썸네일은 보스 엠블럼, 큰 슬롯은 해당 색 샤드',
    async (boss) => {
      const service = build({
        archonHunt: vi.fn().mockResolvedValue({
          boss,
          expiry: '2099-09-08T00:00:00Z',
          rewardPool: 'Archon Hunt',
          missions: [],
        }),
      });

      const { thumbnail, image } = parts(await service.archonHunt());
      const name = boss.replace('Archon ', '');
      expect(thumbnail).toBe(
        `https://cdn.warframestat.us/img/${name}Header.png`,
      );
      expect(image).toBe(
        `https://cdn.warframestat.us/img/ArchonShard${name}.png`,
      );
    },
  );

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

    const { text } = parts(await service.voidTrader(1));
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
    expect(text).toContain('- Lith B4 ▰▰▰▰▰▰▰▰ 11.06%');
    expect(text).toContain('- Meso B3 ▰▰▱▱▱▱▱▱ 2.51%');
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
    expect(text).toContain('-# …and 1 more');
    expect(text).toContain('-# Meso · Neo · Requiem · Omnia — none');
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
    // 엘리트 위험만 굵게 — isHard의 유일한 시각적 쓸모다
    expect(onlyHex.text).toContain('-# Risks · **Fortified Foes**');
    expect(onlyHex.text).toContain('-# Bold risks are elite-only');
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
    new WfcdItemsService({ find: () => undefined } as never),
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
