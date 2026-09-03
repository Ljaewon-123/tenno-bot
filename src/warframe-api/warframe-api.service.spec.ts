import { describe, expect, it, vi } from 'vitest';
import { WarframeApiService } from './warframe-api.service';
import { WfcdItemsService } from './wfcd-items/wfcd-items.service';
import { ArchimedeaType, ArchonBoss } from './world-state/vo/enum';

/**
 * 이미지 URL이 비면 디스코드가 조용히 안 그리고 끝나서 눈으로는 회귀를 못 잡는다.
 * 알람·구독도 같은 임베드 빌더를 타므로 여기만 지키면 세 경로가 같이 지켜진다.
 */
describe('WarframeApiService 임베드 이미지', () => {
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
          expiry: '2026-09-08T00:00:00Z',
          rewardPool: 'Archon Hunt',
          missions: [],
        }),
      });

      const { thumbnail, image } = (await service.archonHunt()).data;
      const name = boss.replace('Archon ', '');
      expect(thumbnail?.url).toBe(
        `https://cdn.warframestat.us/img/${name}Header.png`,
      );
      expect(image?.url).toBe(
        `https://cdn.warframestat.us/img/ArchonShard${name}.png`,
      );
    },
  );

  it('보이드 상인은 인벤토리가 비어도 바로 이미지를 단다', async () => {
    const service = build({
      voidTrader: vi.fn().mockResolvedValue({
        character: "Baro Ki'Teer",
        location: 'Larunda Relay',
        activation: '2026-09-10T00:00:00Z',
        expiry: '2026-09-12T00:00:00Z',
        inventory: [],
      }),
    });

    expect((await service.voidTrader()).data.thumbnail?.url).toBe(
      'https://cdn.warframestat.us/img/BaroKiteerAvatar.png',
    );
  });

  const dropService = (item: object) =>
    new WarframeApiService({} as never, new WfcdItemsService([item] as never), {
      findDropSources: vi
        .fn()
        .mockResolvedValue([
          { itemName: 'Vitality', sourceName: 'Grineer Lancer', chance: 1.01 },
        ]),
    } as never);

  it('카드 이미지가 없는 모드는 최대 랭크 효과를 설명으로 적는다', async () => {
    const service = dropService({
      name: 'Vitality',
      type: 'Warframe Mod',
      imageName: 'HealthMaxMod.jpg',
      baseDrain: 2,
      fusionLimit: 10,
      levelStats: [{ stats: ['+9% Health'] }, { stats: ['+100% Health'] }],
    });

    const { description, thumbnail } = (await service.dropSources('vitality'))
      .data;
    expect(description).toBe('Warframe Mod · Rank 10/10\n+100% Health');
    expect(thumbnail?.url).toBe(
      'https://cdn.warframestat.us/img/HealthMaxMod.jpg',
    );
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

    const { description, image } = (await service.dropSources('vitality')).data;
    expect(image?.url).toBe('https://wiki.warframe.com/images/VitalityMod.png');
    expect(description).toBeUndefined();
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

    const { title, fields } = (await service.nightwave()).data;
    expect(title).toBe('Nightwave - Season 18');
    expect(fields?.map((field) => field.name)).toEqual([
      'Daily (1)',
      'Weekly (1)',
      'Elite Weekly (1)',
    ]);
  });

  const archimedea = (typeKey: string) => ({
    id: typeKey,
    expiry: '2099-01-01T00:00:00Z',
    typeKey,
    missions: [
      {
        missionType: 'Defense',
        deviation: { key: 'd', name: 'Eroding Senses', description: '' },
        risks: [
          { key: 'r', name: 'Fortified Foes', description: '', isHard: true },
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

    expect(
      (await service.archimedea()).data.fields?.map((f) => f.name),
    ).toEqual([
      'Deep Archimedea',
      'Deep Archimedea · Personal Modifiers',
      'Temporal Archimedea',
      'Temporal Archimedea · Personal Modifiers',
    ]);

    const onlyHex = await service.archimedea(ArchimedeaType.Temporal);
    expect(onlyHex.data.fields?.[0].name).toBe('Temporal Archimedea');
    expect(onlyHex.data.fields?.[0].value).toContain('Fortified Foes (hard)');
  });
});
