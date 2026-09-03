import { describe, expect, it, vi } from 'vitest';
import { WarframeApiService } from './warframe-api.service';
import { WfcdItemsService } from './wfcd-items/wfcd-items.service';
import { ArchonBoss } from './world-state/vo/enum';

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

  it('드랍 임베드는 모드 최대 랭크 효과를 설명에 단다', async () => {
    const items = new WfcdItemsService([
      {
        name: 'Vitality',
        type: 'Warframe Mod',
        imageName: 'HealthMaxMod.jpg',
        levelStats: [{ stats: ['+9% Health'] }, { stats: ['+100% Health'] }],
      },
    ] as never);
    const service = new WarframeApiService({} as never, items, {
      findDropSources: vi
        .fn()
        .mockResolvedValue([
          { itemName: 'Vitality', sourceName: 'Grineer Lancer', chance: 1.01 },
        ]),
    } as never);

    const { description, thumbnail } = (await service.dropSources('vitality'))
      .data;
    expect(description).toBe('Warframe Mod\n+100% Health');
    expect(thumbnail?.url).toBe(
      'https://cdn.warframestat.us/img/HealthMaxMod.jpg',
    );
  });
});
