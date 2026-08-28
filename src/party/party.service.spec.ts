import dayjs from '@/utils/dayjs';
import { BadRequestException, Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Party } from './entities/party.entity';
import { PartyMessageService } from './party-message.service';
import { PartyService } from './party.service';
import { PartyStatus } from './vo/enum';

const party = (overrides: Partial<Party> = {}) =>
  ({
    id: 'p1',
    guildId: 'g1',
    channelId: 'c1',
    messageId: 'm1',
    hostUserId: 'host',
    name: 'n',
    mission: 'm',
    partySize: 4,
    members: ['host'],
    status: PartyStatus.OPEN,
    createdAt: dayjs(),
    ...overrides,
  }) as Party;

interface Overrides {
  /** 조건부 UPDATE가 실제로 행을 바꿨는지 */
  affected?: number;
  /** UPDATE 직후 다시 읽히는 행 — 실패 사유 분기의 입력 */
  found?: Party | null;
  /** expire()가 만료 대상으로 집어올 파티들 */
  expired?: Party[];
  /** 메시지 fetch가 실패하는 채널 — 삭제된 메시지/권한 소실 */
  deadChannels?: string[];
  /** save()가 던질 에러 — 1인 1파티 인덱스 위반 흉내 */
  saveError?: unknown;
}

const build = (overrides: Overrides = {}) => {
  const execute = vi
    .fn()
    .mockResolvedValue({ affected: overrides.affected ?? 1 });
  const getMany = vi.fn().mockResolvedValue(overrides.expired ?? []);
  const qb: Record<string, unknown> = { execute, getMany };
  for (const method of ['update', 'set', 'where', 'andWhere', 'setParameter']) {
    qb[method] = vi.fn(() => qb);
  }

  const save = overrides.saveError
    ? vi.fn().mockRejectedValue(overrides.saveError)
    : vi.fn((entity: object) => entity);
  const update = vi.fn();
  const partyRepository = {
    createQueryBuilder: vi.fn(() => qb),
    create: vi.fn((value: object) => ({ ...value })),
    save,
    update,
    findOneBy: vi
      .fn()
      .mockResolvedValue(
        overrides.found === undefined ? party() : overrides.found,
      ),
    findBy: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue({ affected: 2 }),
  };

  const edit = vi.fn();
  const fetchMessage = vi.fn((messageId: string) =>
    overrides.deadChannels?.includes(messageId)
      ? Promise.reject(new Error('Unknown Message'))
      : Promise.resolve({ edit }),
  );
  const fetchChannel = vi.fn(() =>
    Promise.resolve({
      isTextBased: () => true,
      messages: { fetch: fetchMessage },
    }),
  );

  const service = new PartyService(
    partyRepository as never,
    {
      channels: { fetch: fetchChannel },
    } as never,
    new PartyMessageService(),
  );
  return { service, partyRepository, qb, edit, update, save };
};

beforeEach(() => {
  vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});

describe('create', () => {
  it('host를 members에 넣어 저장한다', async () => {
    const { service, save } = build();
    await service.create({ hostUserId: 'host' } as never);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ members: ['host'] }),
    );
  });

  it('1인 1파티 인덱스 위반은 500이 아니라 안내로 바꾼다', async () => {
    const { service } = build({ saveError: { code: '23505' } });
    await expect(
      service.create({ hostUserId: 'host' } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('그 외 DB 에러는 그대로 올린다', async () => {
    const error = new Error('connection lost');
    const { service } = build({ saveError: error });
    await expect(service.create({ hostUserId: 'host' } as never)).rejects.toBe(
      error,
    );
  });
});

describe('affected 0일 때 사유 분기', () => {
  const cases: [string, Party, string][] = [
    ['join', party({ status: PartyStatus.CLOSE }), 'closed'],
    ['join', party({ members: ['host', 'u1'] }), 'already joined'],
    ['join', party({ members: ['a', 'b', 'c', 'd'] }), 'full'],
    ['leave', party({ status: PartyStatus.CLOSE }), 'closed'],
    ['leave', party({ hostUserId: 'u1' }), 'host cannot leave'],
    ['leave', party(), 'not joined'],
    ['close', party({ status: PartyStatus.CLOSE }), 'already closed'],
    ['close', party(), 'Only the host'],
  ];

  it.each(cases)('%s → %s', async (method, found, expected) => {
    const { service } = build({ affected: 0, found });
    await expect(
      (
        service as never as Record<
          string,
          (a: string, b: string) => Promise<Party>
        >
      )[method]('p1', 'u1'),
    ).rejects.toThrow(new RegExp(expected, 'i'));
  });

  it('성공하면 갱신된 행을 돌려준다', async () => {
    const { service } = build({
      affected: 1,
      found: party({ members: ['host', 'u1'] }),
    });
    await expect(service.join('p1', 'u1')).resolves.toMatchObject({
      members: ['host', 'u1'],
    });
  });

  it('사라진 파티는 not found', async () => {
    const { service } = build({ affected: 0, found: null });
    await expect(service.join('p1', 'u1')).rejects.toThrow(/not found/i);
  });
});

describe('expire', () => {
  it('만료 대상이 없으면 아무것도 안 한다', async () => {
    const { service, update, edit } = build({ expired: [] });
    await service.expire();
    expect(update).not.toHaveBeenCalled();
    expect(edit).not.toHaveBeenCalled();
  });

  it('전부 마감하고 임베드를 다시 그린다', async () => {
    const { service, update, edit } = build({
      expired: [party({ id: 'p1' }), party({ id: 'p2', messageId: 'm2' })],
    });
    await service.expire();
    expect(update).toHaveBeenCalledWith(['p1', 'p2'], {
      status: PartyStatus.CLOSE,
    });
    expect(edit).toHaveBeenCalledTimes(2);
  });

  it('한 건이 실패해도 나머지는 갱신된다', async () => {
    const { service, edit } = build({
      expired: [party({ id: 'p1', messageId: 'dead' }), party({ id: 'p2' })],
      deadChannels: ['dead'],
    });
    await expect(service.expire()).resolves.toBeUndefined();
    expect(edit).toHaveBeenCalledTimes(1);
  });

  it('메시지 좌표가 없는 파티는 디스코드를 건드리지 않는다', async () => {
    const { service, edit } = build({ expired: [party({ messageId: null })] });
    await service.expire();
    expect(edit).not.toHaveBeenCalled();
  });
});
