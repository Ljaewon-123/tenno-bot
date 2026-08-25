import { describe, expect, it, vi } from 'vitest';
import { CacheKey } from '@/warframe-api/shared/enum';
import { NotificationService } from './notification.service';

/** 커서 비교가 틀리면 알림이 안 나가거나 매 10분 도배된다 — 그 한 가지만 지킨다 */
describe('NotificationService.detect', () => {
  const build = (cachedIds: Record<string, string[]>) => {
    const send = vi.fn();
    const cacheRepository = {
      findOneBy: vi.fn(({ key }: { key: CacheKey }) =>
        cachedIds[key] ? { key, cache: cachedIds[key] } : null,
      ),
      create: vi.fn((value: object) => ({ ...value })),
      save: vi.fn(),
    };
    const service = new NotificationService(
      { findBy: vi.fn().mockResolvedValue([{ channelId: 'c1' }]) } as never,
      cacheRepository as never,
      {
        sortie: vi.fn().mockResolvedValue({ id: 'sortie-2' }),
        archonHunt: vi.fn().mockResolvedValue({ id: 'archon-1' }),
        events: vi.fn().mockResolvedValue([{ id: 'event-1', expired: false }]),
      } as never,
      { getAlarmTarget: vi.fn().mockResolvedValue('embed') } as never,
      {
        channels: {
          fetch: vi.fn().mockResolvedValue({ isSendable: () => true, send }),
        },
      } as never,
    );
    return { service, send, cacheRepository };
  };

  it('커서가 없는 첫 실행은 심어두기만 하고 발송하지 않는다', async () => {
    const { service, send, cacheRepository } = build({});
    await service.detect();

    expect(send).not.toHaveBeenCalled();
    expect(cacheRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        key: CacheKey.LastSortieId,
        cache: ['sortie-2'],
      }),
    );
  });

  it('id가 그대로면 발송하지 않는다', async () => {
    const { service, send } = build({
      [CacheKey.LastSortieId]: ['sortie-2'],
      [CacheKey.LastArchonHuntId]: ['archon-1'],
      [CacheKey.LastEventsId]: ['event-1'],
    });
    await service.detect();

    expect(send).not.toHaveBeenCalled();
  });

  it('id가 바뀐 대상만 발송한다', async () => {
    const { service, send } = build({
      [CacheKey.LastSortieId]: ['sortie-1'],
      [CacheKey.LastArchonHuntId]: ['archon-1'],
      [CacheKey.LastEventsId]: ['event-1'],
    });
    await service.detect();

    expect(send).toHaveBeenCalledTimes(1);
  });
});
