import { describe, expect, it, vi } from 'vitest';
import { CacheKey } from '../shared/enum';
import { DropTableService } from './drop-table.service';
import { DropCategory } from './vo/enum';

/** 체이닝만 되는 QueryBuilder 흉내. 어떤 절이 붙었는지만 본다 */
const stubQueryBuilder = () => {
  const builder = {
    where: vi.fn(() => builder),
    andWhere: vi.fn(() => builder),
    orderBy: vi.fn(() => builder),
    addOrderBy: vi.fn(() => builder),
    setParameter: vi.fn(() => builder),
    take: vi.fn(() => builder),
    getMany: vi.fn(() => Promise.resolve([])),
  };
  return builder;
};

/** hash 게이트가 틀리면 매주 3MB짜리 all.json을 헛으로 받거나, 반대로 영영 갱신되지 않는다 */
describe('DropTableService', () => {
  const build = (cachedHash?: string) => {
    const request = vi.fn((_method: unknown, path: string) =>
      Promise.resolve(
        path === 'data/info.json' ? { hash: 'new-hash' } : { relics: [] },
      ),
    );
    const cacheRepository = {
      findOneBy: vi.fn(() =>
        cachedHash === undefined
          ? null
          : { key: CacheKey.DropTable, cache: cachedHash },
      ),
      create: vi.fn((value: object) => ({ ...value })),
      save: vi.fn(),
    };
    const queryBuilder = stubQueryBuilder();
    const dropSourceRepository = {
      createQueryBuilder: vi.fn(() => queryBuilder),
    };
    const dropSourceService = { rebuildDropSources: vi.fn() };
    const service = new DropTableService(
      { request } as never,
      cacheRepository as never,
      dropSourceRepository as never,
      dropSourceService as never,
    );
    return {
      service,
      request,
      cacheRepository,
      queryBuilder,
      dropSourceService,
    };
  };

  describe('getAllDropTables', () => {
    it('hash가 같으면 all.json을 받지 않는다', async () => {
      const { service, request, dropSourceService } = build('v3:new-hash');
      await service.getAllDropTables();

      expect(request).toHaveBeenCalledTimes(1);
      expect(dropSourceService.rebuildDropSources).not.toHaveBeenCalled();
    });

    it('hash가 다르면 재수집하고 새 hash를 남긴다', async () => {
      const { service, cacheRepository, dropSourceService } = build('old-hash');
      await service.getAllDropTables();

      expect(dropSourceService.rebuildDropSources).toHaveBeenCalledWith({
        relics: [],
      });
      expect(cacheRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          key: CacheKey.DropTable,
          cache: 'v3:new-hash',
        }),
      );
    });

    it('인덱스 버전만 달라도 재구축한다', async () => {
      // 필터 규칙을 바꾸면 원본 hash는 그대로여서, 이게 없으면 옛 행이 계속 남는다
      const { service, dropSourceService } = build('v2:new-hash');
      await service.getAllDropTables();

      expect(dropSourceService.rebuildDropSources).toHaveBeenCalled();
    });

    it('재수집이 실패하면 hash를 남기지 않는다', async () => {
      // 여기서 hash를 저장해버리면 깨진 테이블로 다음 주까지 간다
      const { service, cacheRepository, dropSourceService } = build('old-hash');
      dropSourceService.rebuildDropSources.mockRejectedValue(new Error('boom'));

      await expect(service.getAllDropTables()).rejects.toThrow('boom');
      expect(cacheRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findDropSources', () => {
    it('부분 일치로 찾고 확률 높은 순 50개로 자른다', async () => {
      const { service, queryBuilder } = build();
      await service.findDropSources('vauban');

      expect(queryBuilder.where).toHaveBeenCalledWith(expect.any(String), {
        like: '%vauban%',
      });
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
        'drop.chance',
        'DESC',
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(50);
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });

    // 'Necramech Pressure Point'가 확률로 50칸을 다 먹어 'Pressure Point'가 사라졌다
    it('이름이 정확히 맞는 아이템을 확률보다 먼저 정렬한다', async () => {
      const { service, queryBuilder } = build();
      await service.findDropSources('Pressure Point');

      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'drop.itemName ILIKE :exact',
        'DESC',
      );
      expect(queryBuilder.setParameter).toHaveBeenCalledWith(
        'exact',
        'Pressure Point',
      );
      // orderBy가 addOrderBy보다 먼저 걸려야 정확 일치가 1순위가 된다
      expect(queryBuilder.orderBy.mock.invocationCallOrder[0]).toBeLessThan(
        queryBuilder.addOrderBy.mock.invocationCallOrder[0],
      );
    });

    it('카테고리를 주면 조건에 더한다', async () => {
      const { service, queryBuilder } = build();
      await service.findDropSources('vauban', DropCategory.Relic);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.any(String), {
        category: DropCategory.Relic,
      });
    });
  });
});
