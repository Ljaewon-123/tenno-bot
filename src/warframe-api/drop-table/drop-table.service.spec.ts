import { describe, expect, it, vi } from 'vitest';
import { CacheKey } from '../shared/enum';
import { DropTableService } from './drop-table.service';
import { DropCategory } from './vo/enum';

/** findDropSources가 리포지토리에 넘긴 조회 조건 */
interface CapturedFind {
  where: { itemName: { value: string }; category?: DropCategory };
  order: { chance: string };
  take: number;
}

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
    const dropSourceRepository = {
      find: vi.fn<(options: unknown) => Promise<unknown[]>>(),
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
      dropSourceRepository,
      dropSourceService,
    };
  };

  describe('getAllDropTables', () => {
    it('hash가 같으면 all.json을 받지 않는다', async () => {
      const { service, request, dropSourceService } = build('new-hash');
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
        expect.objectContaining({ key: CacheKey.DropTable, cache: 'new-hash' }),
      );
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
      const { service, dropSourceRepository } = build();
      await service.findDropSources('vauban');

      const options = dropSourceRepository.find.mock
        .calls[0][0] as CapturedFind;
      expect(options.where.itemName.value).toBe('%vauban%');
      expect(options.where.category).toBeUndefined();
      expect(options).toMatchObject({ order: { chance: 'DESC' }, take: 50 });
    });

    it('카테고리를 주면 조건에 더한다', async () => {
      const { service, dropSourceRepository } = build();
      await service.findDropSources('vauban', DropCategory.Relic);

      const options = dropSourceRepository.find.mock
        .calls[0][0] as CapturedFind;
      expect(options.where.category).toBe(DropCategory.Relic);
    });
  });
});
