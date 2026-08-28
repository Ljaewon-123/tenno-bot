import { CacheKey } from '@/warframe-api/shared/enum';
import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationService } from './notification.service';

interface Overrides {
  /** broadcast 대상 구독 목록 */
  notifications?: { guildId?: string; channelId: string | null }[];
  /** 조회 자체가 실패하는 채널 — 봇 추방/채널 삭제 */
  deadChannels?: string[];
  /** 월드스테이트 조회 실패를 흉내낼 때 */
  worldState?: Record<string, unknown>;
}

const build = (
  cachedIds: Record<string, string[]>,
  overrides: Overrides = {},
) => {
  const send = vi.fn();
  const cacheRepository = {
    findOneBy: vi.fn(({ key }: { key: CacheKey }) =>
      cachedIds[key] ? { key, cache: cachedIds[key] } : null,
    ),
    create: vi.fn((value: object) => ({ ...value })),
    save: vi.fn(),
  };
  const notificationRepository = {
    findBy: vi
      .fn()
      .mockResolvedValue(overrides.notifications ?? [{ channelId: 'c1' }]),
    findOneBy: vi.fn().mockResolvedValue(null),
    create: vi.fn((value: object) => ({ ...value })),
    save: vi.fn((entity: object) => entity),
  };
  const fetch = vi.fn((channelId: string) =>
    overrides.deadChannels?.includes(channelId)
      ? Promise.reject(new Error('Unknown Channel'))
      : Promise.resolve({ isSendable: () => true, send }),
  );
  const getAlarmTarget = vi.fn().mockResolvedValue('embed');
  const notificationHistoryRepository = {
    create: vi.fn((value: object) => ({ ...value })),
    insert: vi.fn(),
    delete: vi.fn().mockResolvedValue({ affected: 0 }),
  };
  const service = new NotificationService(
    notificationRepository as never,
    notificationHistoryRepository as never,
    cacheRepository as never,
    {
      sortie: vi.fn().mockResolvedValue({ id: 'sortie-2' }),
      archonHunt: vi.fn().mockResolvedValue({ id: 'archon-1' }),
      events: vi.fn().mockResolvedValue([{ id: 'event-1', expired: false }]),
      ...overrides.worldState,
    } as never,
    { getAlarmTarget } as never,
    { channels: { fetch } } as never,
  );
  return {
    service,
    send,
    fetch,
    cacheRepository,
    notificationRepository,
    notificationHistoryRepository,
    getAlarmTarget,
  };
};

beforeEach(() => {
  // allSettled 격리 테스트가 Nest Logger로 에러를 뱉어 출력이 지저분해진다
  vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
});

/** 커서 비교가 틀리면 알림이 안 나가거나 매 10분 도배된다 — 그 한 가지만 지킨다 */
describe('NotificationService.detect', () => {
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

  it('한 엔드포인트가 죽어도 나머지 감시는 계속한다', async () => {
    // 소티 API 하나 때문에 아콘/이벤트 알림까지 멈추면 안 된다
    const { service, send } = build(
      {
        [CacheKey.LastSortieId]: ['sortie-1'],
        [CacheKey.LastArchonHuntId]: ['archon-0'],
        [CacheKey.LastEventsId]: ['event-0'],
      },
      { worldState: { sortie: vi.fn().mockRejectedValue(new Error('502')) } },
    );

    await expect(service.detect()).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(2);
  });
});

/** 길드 하나가 봇을 추방했다고 나머지 길드 발송이 멈추면 안 된다 */
describe('NotificationService 발송', () => {
  const changed = {
    [CacheKey.LastSortieId]: ['sortie-1'],
    [CacheKey.LastArchonHuntId]: ['archon-1'],
    [CacheKey.LastEventsId]: ['event-1'],
  };

  it('채널 하나가 실패해도 나머지 채널에는 발송한다', async () => {
    const { service, send, fetch } = build(changed, {
      notifications: [
        { channelId: 'c1' },
        { channelId: 'dead' },
        // channelId 없는 구버전 행은 조회조차 하지 않는다
        { channelId: null },
        { channelId: 'c2' },
      ],
      deadChannels: ['dead'],
    });

    await service.detect();

    expect(send).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('실패한 채널만 이력으로 남긴다', async () => {
    const { service, notificationHistoryRepository } = build(changed, {
      notifications: [
        { guildId: 'g1', channelId: 'c1' },
        { guildId: 'g2', channelId: 'dead' },
      ],
      deadChannels: ['dead'],
    });

    await service.detect();

    expect(notificationHistoryRepository.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        guildId: 'g2',
        channelId: 'dead',
        error: expect.stringContaining('Unknown Channel') as string,
      }),
    ]);
  });

  it('전부 성공하면 이력을 남기지 않는다', async () => {
    const { service, notificationHistoryRepository } = build(changed);

    await service.detect();

    expect(notificationHistoryRepository.insert).not.toHaveBeenCalled();
  });

  it('구독이 하나도 없으면 임베드를 만들지 않는다', async () => {
    // 변화 감지마다 도는 재호출이라 구독 0건이면 아예 건너뛴다
    const { service, getAlarmTarget } = build(changed, { notifications: [] });

    await service.detect();

    expect(getAlarmTarget).not.toHaveBeenCalled();
  });
});

/** 같은 길드+이벤트 행이 둘로 늘면 같은 알림이 두 번 간다 */
describe('NotificationService.subscribe', () => {
  it('기존 구독이 있으면 새로 만들지 않고 채널만 갈아끼운다', async () => {
    const { service, notificationRepository } = build({});
    const existing = { guildId: 'g1', eventType: 'sortie', channelId: 'old' };
    notificationRepository.findOneBy.mockResolvedValue(existing);

    await service.subscribe('g1', 'new', 'sortie' as never);

    expect(notificationRepository.create).not.toHaveBeenCalled();
    expect(notificationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'new' }),
    );
  });

  it('없으면 새로 만든다', async () => {
    const { service, notificationRepository } = build({});
    await service.subscribe('g1', 'c1', 'sortie' as never);

    expect(notificationRepository.create).toHaveBeenCalledWith({
      guildId: 'g1',
      eventType: 'sortie',
    });
    expect(notificationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'c1' }),
    );
  });
});
