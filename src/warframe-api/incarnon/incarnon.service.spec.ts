import { describe, expect, it, vi } from 'vitest';
import { IncarnonService } from './incarnon.service';

/** 실제 상수 키를 그대로 쓴다 — 여기가 어긋나면 재료가 통째로 빈다 */
const BRATON_ADAPTER =
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/BratonIncarnonUnlocker';
const MATERIAL_NAMES: Record<string, string> = {
  '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem': 'Pathos Clamp',
  '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem': 'Rune Marrow',
  '/Lotus/Types/Gameplay/Duviri/Resource/DuviriMushroomItem': 'Tasoma Extract',
};

/** 실제 표에서 필요한 최소 형태만 남긴 위키텍스트 */
const table = (perk: string) => `
{| class="wikitable"
|-
! colspan="3" | Evolution
! | {{Weapon|Braton}}
! | Notes
|-
! EVO1
| style="text-align:center;" | ${perk} [[File:Icon.png|64px|center]]
|
* Gain Radial {{D|Heat}} damage.
| style="text-align:center" | -
|}
`;

const page = (title: string, perk = 'Incarnon Form') => ({
  title,
  revisions: [
    { slots: { main: { content: `===Evolutions===${table(perk)}` } } },
  ],
});

/**
 * 월 1회 수집. 위키가 유일한 출처라 여기서 잘못 덮어쓰면 되돌릴 데가 없다 —
 * 특히 "파싱이 조용히 깨져서 빈 결과를 정상인 양 저장하는" 경우를 막는 게 핵심이다.
 */
describe('IncarnonService', () => {
  const build = (
    cached?: unknown,
    pages = [page('Braton Incarnon Genesis')],
  ) => {
    const request = vi.fn().mockResolvedValue({ query: { pages } });
    const save = vi.fn();
    const cacheRepository = {
      findOneBy: vi
        .fn()
        .mockResolvedValue(
          cached === undefined ? null : { key: 'incarnon', cache: cached },
        ),
      create: vi.fn((value: object) => ({ ...value })),
      save,
    };
    const wfcdItemsService = {
      findIncarnonGenesis: () => [
        {
          name: 'Braton Incarnon Genesis',
          uniqueName: BRATON_ADAPTER,
          imageName: 'Braton.png',
        },
      ],
      findItem: (uniqueName: string) =>
        MATERIAL_NAMES[uniqueName]
          ? { name: MATERIAL_NAMES[uniqueName] }
          : undefined,
      imgUrl: (imageName: string) => `https://cdn/${imageName}`,
    };
    const service = new IncarnonService(
      { request } as never,
      cacheRepository as never,
      wfcdItemsService as never,
    );
    return { service, request, save, cacheRepository };
  };

  describe('수집', () => {
    it('캐시가 비어 있으면 시딩이 받아 온다', async () => {
      const { service, request, save } = build();

      await service.seedIfEmpty();

      expect(request).toHaveBeenCalledTimes(1);
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          cache: [
            expect.objectContaining({
              name: 'Braton',
              adapter: BRATON_ADAPTER,
            }),
          ],
        }),
      );
    });

    it('캐시가 이미 있으면 시딩이 네트워크를 타지 않는다', async () => {
      // 퍽은 밸런스 패치 때나 바뀐다 — 재배포마다 위키를 긁을 이유가 없다
      const { service, request } = build([
        { name: 'Braton', adapter: 'a', tiers: [{}] },
      ]);

      await service.seedIfEmpty();

      expect(request).not.toHaveBeenCalled();
    });

    it('요청은 45개 페이지를 한 번에 묶는다', async () => {
      const { service, request } = build();

      await service.sync();

      const [, , config] = request.mock.calls[0] as [
        unknown,
        unknown,
        { params: { titles: string } },
      ];
      expect(config.params.titles).toBe('Braton Incarnon Genesis');
    });

    it('파싱 결과가 기존보다 줄면 덮어쓰지 않는다', async () => {
      // 위키 문법이 바뀌어 파서가 깨지면 개수부터 준다. 이걸 통과시키면 유일한 출처가 빈 채로 덮인다
      const { service, save } = build([
        { name: 'Braton', adapter: 'a', tiers: [{}] },
        { name: 'Lato', adapter: 'b', tiers: [{}] },
      ]);

      await service.sync();

      expect(save).not.toHaveBeenCalled();
    });

    it('티어가 하나도 안 나온 무기는 세지 않는다', async () => {
      // 표가 통째로 안 잡혀도 페이지 수는 45 그대로라 개수만으론 못 걸러낸다
      const { service, save } = build(undefined, [
        {
          title: 'Braton Incarnon Genesis',
          revisions: [{ slots: { main: { content: '내용 없음' } } }],
        },
      ]);

      await service.sync();

      expect(save).not.toHaveBeenCalled();
    });
  });

  describe('조회', () => {
    const cached = [
      {
        name: 'Braton',
        adapter: BRATON_ADAPTER,
        imageName: 'Braton.png',
        reference: 'Braton Prime',
        tiers: [{ evolution: 1, perks: [] }],
      },
    ];

    it('대소문자를 가리지 않고 찾는다', async () => {
      // 자동완성을 안 쓰고 직접 타이핑해도 걸려야 한다
      const { service } = build(cached);

      await expect(service.findWeapon('braton')).resolves.toMatchObject({
        name: 'Braton',
        reference: 'Braton Prime',
      });
    });

    it('재료를 이름과 개수로 붙인다', async () => {
      const { service } = build(cached);

      const found = await service.findWeapon('Braton');

      expect(found?.materials).toEqual([
        { name: 'Pathos Clamp', count: 20 },
        { name: 'Rune Marrow', count: 60 },
        { name: 'Tasoma Extract', count: 60 },
      ]);
    });

    it('썸네일은 어댑터 아이콘을 쓴다', async () => {
      const { service } = build(cached);

      await expect(service.findWeapon('Braton')).resolves.toMatchObject({
        thumbnail: 'https://cdn/Braton.png',
      });
    });

    it('캐시가 비면 찾지 못한다', async () => {
      const { service } = build();

      await expect(service.findWeapon('Braton')).resolves.toBeUndefined();
    });
  });
});
