import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DropSourceService } from './drop-source.service';
import type { DropSource } from './entities/drop-source.entity';
import type { DropTableData } from './types';
import { DropCategory } from './vo/enum';

// @Transactional()은 초기화된 CLS 네임스페이스 + DataSource를 요구한다.
// 트랜잭션 경계는 DB가 보장하는 것이라 여기선 벗겨내고 평탄화 로직만 본다.
vi.mock('typeorm-transactional', () => ({
  Transactional: () => () => {},
}));

/** metadata는 섹션마다 모양이 달라 unknown으로 받고 값만 비교한다 */
type Row = Omit<DropSource, 'metadata'> & { metadata: Record<string, unknown> };

/** all.json 평탄화가 틀리면 검색 결과에서 아이템이 통째로 사라지거나 DB가 빈 채로 남는다 */
describe('DropSourceService.rebuildDropSources', () => {
  /** 바로 상점 행의 출처 — 테스트마다 갈아끼운다 */
  let primedMods: { name: string }[] = [];

  const build = () => {
    const inserted: Row[][] = [];
    const dropSourceRepository = {
      create: vi.fn((value: object) => ({ ...value })),
      clear: vi.fn(),
      insert: vi.fn((rows: Row[]) => {
        inserted.push(rows);
      }),
    };
    return {
      service: new DropSourceService(
        dropSourceRepository as never,
        {
          findPrimedMods: () => primedMods,
        } as never,
      ),
      dropSourceRepository,
      inserted,
      // 모든 청크를 하나로 편 결과
      get rows() {
        return inserted.flat();
      },
    };
  };

  /** 섹션 하나만 채우고 나머지는 빈 값으로 두는 최소 응답 */
  const data = (partial: Partial<DropTableData> = {}) =>
    ({
      missionRewards: {},
      relics: [],
      transientRewards: [],
      modLocations: [],
      blueprintLocations: [],
      sortieRewards: [],
      keyRewards: [],
      syndicates: {},
      ...partial,
    }) as DropTableData;

  const reward = (partial: object = {}) => ({
    _id: 'x',
    itemName: 'Forma Blueprint',
    rarity: 'Common',
    chance: 11.06,
    ...partial,
  });

  let harness: ReturnType<typeof build>;
  beforeEach(() => {
    primedMods = [];
    harness = build();
  });

  it('보상 배열과 로테이션 객체 양쪽을 모두 편다', async () => {
    await harness.service.rebuildDropSources(
      data({
        missionRewards: {
          Earth: {
            // 로테이션 없는 미션 — 배열 그대로
            'E Prime': {
              gameMode: 'Survival',
              isEvent: false,
              rewards: [reward()],
            },
            // 로테이션 있는 미션 — A/B/C 객체
            Cambria: {
              gameMode: 'Defense',
              isEvent: false,
              rewards: {
                A: [reward({ itemName: 'Vauban Prime' })],
                C: [reward({ itemName: 'Axi V9' })],
              },
            },
          },
        },
      }),
    );

    expect(
      harness.rows.map((row) => [row.itemName, row.metadata.rotation]),
    ).toEqual([
      ['Forma Blueprint', undefined],
      ['Vauban Prime', 'A'],
      ['Axi V9', 'C'],
    ]);
    expect(harness.rows[0]).toMatchObject({
      category: DropCategory.Mission,
      sourceName: 'E Prime',
      metadata: { planet: 'Earth', gameMode: 'Survival' },
    });
  });

  it('chance가 null이면 0으로 저장한다', async () => {
    // real 컬럼이라 null이 들어가면 insert가 터지고, 확률 정렬도 깨진다
    await harness.service.rebuildDropSources(
      data({ sortieRewards: [reward({ chance: null })] }),
    );

    expect(harness.rows[0].chance).toBe(0);
  });

  it('mod와 blueprint는 같은 enemy 카테고리로 묶되 metadata.type으로 구분한다', async () => {
    await harness.service.rebuildDropSources(
      data({
        modLocations: [
          {
            _id: 'm',
            modName: 'Serration',
            enemies: [
              {
                _id: 'e',
                enemyName: 'Grineer Lancer',
                enemyModDropChance: 3,
                rarity: 'Common',
                chance: 1.5,
              },
            ],
          },
        ],
        blueprintLocations: [
          {
            _id: 'b',
            itemName: 'Ash',
            blueprintName: 'Ash Systems',
            enemies: [
              {
                _id: 'e2',
                enemyName: 'Manic',
                enemyItemDropChance: 1,
                enemyBlueprintDropChance: 2,
                rarity: 'Rare',
                chance: 0.5,
              },
            ],
          },
        ],
      }),
    );

    expect(
      harness.rows.map((row) => [
        row.itemName,
        row.category,
        row.metadata.type,
      ]),
    ).toEqual([
      ['Serration', DropCategory.Enemy, 'mod'],
      ['Ash Systems', DropCategory.Enemy, 'blueprint'],
    ]);
  });

  it('열화판(Flawed) 모드는 인덱스에 넣지 않는다', async () => {
    await harness.service.rebuildDropSources(
      data({
        sortieRewards: [
          reward({ itemName: 'Flawed Pressure Point' }),
          reward({ itemName: 'Pressure Point' }),
        ],
      }),
    );

    expect(harness.rows.map((row) => row.itemName)).toEqual(['Pressure Point']);
  });

  // all.json에 프라임드 모드는 한 줄도 없다 — 이게 없으면 검색·오토컴플리트에서 통째로 빠진다
  it('프라임드 모드를 바로 키티어 출처로 넣는다', async () => {
    primedMods = [{ name: 'Primed Pressure Point' }];
    const local = build();

    await local.service.rebuildDropSources(data());

    expect(local.rows).toEqual([
      expect.objectContaining({
        itemName: 'Primed Pressure Point',
        category: DropCategory.Trader,
        sourceName: "Baro Ki'Teer",
        // 확률이 아니라 두캇 값이라 chance가 없다
        chance: 0,
      }),
    ]);
  });

  it('바운티/아바타 섹션이 응답에 없어도 터지지 않는다', async () => {
    // 필드 하나 빠졌다고 던지면 주 1회 수집 전체가 실패한다
    await expect(harness.service.rebuildDropSources(data())).resolves.toBe(0);
  });

  it('전량 삭제가 삽입보다 먼저 일어나고, 1000행씩 나눠 넣는다', async () => {
    const rewards = Array.from({ length: 1500 }, (_, i) =>
      reward({ itemName: `Item ${i}` }),
    );
    await harness.service.rebuildDropSources(data({ sortieRewards: rewards }));

    expect(
      harness.dropSourceRepository.clear.mock.invocationCallOrder[0],
    ).toBeLessThan(
      harness.dropSourceRepository.insert.mock.invocationCallOrder[0],
    );
    expect(harness.inserted.map((chunk) => chunk.length)).toEqual([1000, 500]);
  });
});
