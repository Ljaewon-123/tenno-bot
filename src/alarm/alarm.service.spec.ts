import { card } from '@/utils/discord-embed';
import dayjs from '@/utils/dayjs';
import { RemindTarget, TargetCommand } from '@/warframe-api/enum';
import type { FindOperator } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AlarmService } from './alarm.service';
import { AlarmConfig } from './entities/alarm-config.entity';
import { AlarmStatus } from './vo/enum';

// @Transactional()은 초기화된 CLS 네임스페이스 + DataSource를 요구한다.
// 트랜잭션 경계는 DB가 보장할 몫이라 여기선 벗겨내고 흐름만 본다.
vi.mock('typeorm-transactional', () => ({
  Transactional: () => () => {},
  Propagation: { REQUIRED: 'REQUIRED' },
}));

const NOW = '2026-08-25T12:00:00Z';

const alarmOf = (partial: Partial<AlarmConfig> = {}) =>
  Object.assign(new AlarmConfig(), {
    guildId: 'g1',
    channelId: 'c1',
    name: 'sortie',
    intervalValue: 60,
    targetCommand: { target: 'sortie' },
    ...partial,
  });

const build = (pending: AlarmConfig[] = []) => {
  const send = vi.fn();
  const dm = vi.fn();
  const alarmConfigRepository = {
    findBy: vi.fn().mockResolvedValue(pending),
    findOneBy: vi.fn().mockResolvedValue(null),
    update: vi.fn(),
    save: vi.fn((value: object) => value),
    create: vi.fn((value: object) => Object.assign(new AlarmConfig(), value)),
    delete: vi.fn(),
  };
  const getAlarmTarget = vi
    .fn()
    .mockImplementation(async () => card({ title: 'Sortie', blocks: [] }));
  const expiryOf = vi.fn().mockResolvedValue(dayjs(NOW).add(2, 'hour'));
  const fetch = vi.fn(() => Promise.resolve({ isSendable: () => true, send }));
  const fetchUser = vi.fn(() => Promise.resolve({ send: dm }));
  const service = new AlarmService(
    alarmConfigRepository as never,
    { getAlarmTarget, expiryOf } as never,
    { channels: { fetch }, users: { fetch: fetchUser } } as never,
  );
  return {
    service,
    alarmConfigRepository,
    getAlarmTarget,
    expiryOf,
    fetch,
    send,
    fetchUser,
    dm,
  };
};

/** asPush가 맨 위에 꽂는 헤더 한 줄 */
const headerOf = (call: unknown[]) => {
  const [sent] = call as [
    { components: [{ toJSON: () => { components: { content: string }[] } }] },
  ];
  return sent.components[0].toJSON().components[0].content;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
});
afterEach(() => {
  vi.useRealTimers();
});

/** 다음 시각 계산이 틀리면 1분마다 연속 발사되거나 알람이 영영 오지 않는다 */
describe('AlarmConfig.reschedule', () => {
  it('다음 시각이 아직 미래면 그 격자를 그대로 지킨다', () => {
    // doneAt 기준으로 더해야 발동이 매번 몇 초씩 뒤로 밀리지 않는다
    // 10분 늦게 발동돼도 다음 격자는 doneAt+60이지 now+60이 아니다
    const alarm = alarmOf({
      intervalValue: 60,
      doneAt: dayjs(NOW).subtract(10, 'minute'),
    });
    alarm.reschedule();

    expect(alarm.doneAt.toISOString()).toBe(
      dayjs(NOW).add(50, 'minute').toISOString(),
    );
    expect(alarm.status).toBe(AlarmStatus.PENDING);
  });

  it('오래 밀린 알람은 지금 기준으로 한 번만 다시 잡는다', () => {
    // 하루 멈춰 있었다고 밀린 24회를 연속으로 쏘면 안 된다
    const alarm = alarmOf({
      intervalValue: 60,
      doneAt: dayjs(NOW).subtract(1, 'day'),
    });
    alarm.reschedule();

    expect(alarm.doneAt.toISOString()).toBe(
      dayjs(NOW).add(60, 'minute').toISOString(),
    );
  });
});

/** 선점에 실패하면 같은 알람이 중복 발송되고, 좀비 회수에 실패하면 영영 멈춘다 */
describe('AlarmService.getPendingAlarms', () => {
  it('만기된 PENDING과 10분 넘게 묵은 RUNNING을 함께 집는다', async () => {
    const { service, alarmConfigRepository } = build();
    await service.getPendingAlarms();

    const [where] = alarmConfigRepository.findBy.mock.calls[0] as [
      {
        status: AlarmStatus;
        doneAt?: { value: unknown };
        updatedAt?: { value: unknown };
      }[],
    ];
    expect(where[0].status).toBe(AlarmStatus.PENDING);
    expect(where[1].status).toBe(AlarmStatus.RUNNING);
    expect(dayjs(where[1].updatedAt?.value as string).toISOString()).toBe(
      dayjs(NOW).subtract(10, 'minute').toISOString(),
    );
  });

  it('집어온 알람을 RUNNING으로 선점한다', async () => {
    const alarm = alarmOf({ id: 'a1' });
    const { service, alarmConfigRepository } = build([alarm]);

    await service.getPendingAlarms();

    expect(alarmConfigRepository.update).toHaveBeenCalledWith(
      { id: expect.objectContaining({ value: ['a1'] }) as object },
      { status: AlarmStatus.RUNNING },
    );
  });

  it('집을 게 없으면 업데이트하지 않는다', async () => {
    const { service, alarmConfigRepository } = build([]);
    await service.getPendingAlarms();

    expect(alarmConfigRepository.update).not.toHaveBeenCalled();
  });
});

/** 여기서 재스케줄을 놓치면 그 알람은 RUNNING으로 굳어 다시 돌지 않는다 */
describe('AlarmService.run', () => {
  it('발송에 성공하면 다음 시각으로 밀어 저장한다', async () => {
    const alarm = alarmOf({ doneAt: dayjs(NOW) });
    const { service, send, alarmConfigRepository } = build();

    await service.run(alarm);

    // 조회 결과와 같은 카드가 그대로 나가면 채널에서 구분되지 않는다 — 발송임을 맨 위에 밝힌다
    expect(headerOf(send.mock.calls[0])).toBe(
      '-# 🔔 Alarm · sortie · every 60 min',
    );
    expect(alarmConfigRepository.save).toHaveBeenCalledWith(alarm);
    expect(alarm.status).toBe(AlarmStatus.PENDING);
  });

  it('임베드 생성이 실패해도 error를 남기고 재스케줄한다', async () => {
    const alarm = alarmOf({ doneAt: dayjs(NOW) });
    const { service, getAlarmTarget, alarmConfigRepository } = build();
    getAlarmTarget.mockRejectedValue(new Error('warframe api down'));

    await expect(service.run(alarm)).resolves.toBeUndefined();

    expect(alarm.status).toBe(AlarmStatus.PENDING);
    expect(alarm.error).toContain('warframe api down');
    expect(alarmConfigRepository.save).toHaveBeenCalledWith(alarm);
  });

  it('channelId 없는 구버전 알람은 전송만 건너뛴다', async () => {
    const alarm = alarmOf({ channelId: null, doneAt: dayjs(NOW) });
    const { service, fetch, alarmConfigRepository } = build();

    await service.run(alarm);

    expect(fetch).not.toHaveBeenCalled();
    expect(alarmConfigRepository.save).toHaveBeenCalledWith(alarm);
  });
});

/**
 * 임베드 🔔 버튼이 만드는 1회용 리마인더. 반복 알람과 두 가지가 다르다 —
 * 채널이 아니라 누른 사람에게 DM으로 가고, 한 번 쏘면 사라진다.
 */
const remindOf = (partial: Partial<AlarmConfig> = {}) =>
  alarmOf({
    id: 'r1',
    intervalValue: null,
    userId: 'u1',
    doneAt: dayjs(NOW),
    ...partial,
  });

describe('AlarmService.remind', () => {
  const input = {
    guildId: 'g1',
    channelId: 'c1',
    userId: 'u1',
    target: RemindTarget.Sortie,
  };

  it('처음 누르면 만료 30분 전으로 1회용 알람을 만든다', async () => {
    const { service, alarmConfigRepository, expiryOf } = build();
    expiryOf.mockResolvedValue(dayjs(NOW).add(2, 'hour'));

    const at = await service.remind(input);

    expect(at?.toISOString()).toBe(dayjs(NOW).add(90, 'minute').toISOString());
    const [created] = alarmConfigRepository.create.mock.calls[0] as [
      Partial<AlarmConfig>,
    ];
    // intervalValue가 비어 있는 것이 "1회용"의 유일한 표식이다 — 채워지면 영원히 반복된다
    expect(created.intervalValue).toBeFalsy();
    expect(created.userId).toBe('u1');
    expect(created.name).toBe(TargetCommand.Sortie);
    expect(alarmConfigRepository.save).toHaveBeenCalled();
  });

  it('다시 누르면 취소한다', async () => {
    const { service, alarmConfigRepository } = build();
    alarmConfigRepository.findOneBy.mockResolvedValue(remindOf());

    const at = await service.remind(input);

    expect(at).toBeNull();
    expect(alarmConfigRepository.delete).toHaveBeenCalledWith({ id: 'r1' });
    expect(alarmConfigRepository.save).not.toHaveBeenCalled();
  });

  it('사람마다 따로 잡힌다 — 같은 서버·같은 대상이어도 남의 것을 지우면 안 된다', async () => {
    const { service, alarmConfigRepository } = build();
    await service.remind(input);

    expect(alarmConfigRepository.findOneBy).toHaveBeenCalledWith({
      guildId: 'g1',
      userId: 'u1',
      name: TargetCommand.Sortie,
    });
  });

  it('남은 시간이 30분보다 짧으면 거부한다', async () => {
    // 등록하자마자 발동하는 리마인더는 알림이 아니라 소음이다
    const { service, expiryOf, alarmConfigRepository } = build();
    expiryOf.mockResolvedValue(dayjs(NOW).add(10, 'minute'));

    await expect(service.remind(input)).rejects.toThrow();
    expect(alarmConfigRepository.save).not.toHaveBeenCalled();
  });

  it('만료를 알 수 없으면 거부한다', async () => {
    const { service, expiryOf, alarmConfigRepository } = build();
    expiryOf.mockResolvedValue(null);

    await expect(service.remind(input)).rejects.toThrow();
    expect(alarmConfigRepository.save).not.toHaveBeenCalled();
  });
});

describe('AlarmService.run — 1회용', () => {
  it('누른 사람에게 DM으로 보내고 알람을 지운다', async () => {
    const alarm = remindOf();
    const { service, dm, send, alarmConfigRepository } = build();

    await service.run(alarm);

    expect(dm).toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    // 반복 주기가 없으니 남겨두면 크론이 영원히 훑는다
    expect(alarmConfigRepository.delete).toHaveBeenCalledWith({ id: 'r1' });
    expect(alarmConfigRepository.save).not.toHaveBeenCalled();
    expect(headerOf(dm.mock.calls[0])).toContain('🔔 Reminder');
    // DM이 막혀 채널로 떨어져도 누구 것인지 알려면 멘션이 본문에 있어야 한다
    expect(headerOf(dm.mock.calls[0])).toContain('<@u1>');
  });

  it('DM이 막혀 있으면 등록 채널로 떨구고 지운다', async () => {
    const alarm = remindOf();
    const { service, dm, send, alarmConfigRepository } = build();
    dm.mockRejectedValue(new Error('Cannot send messages to this user'));

    await service.run(alarm);

    expect(send).toHaveBeenCalled();
    expect(alarmConfigRepository.delete).toHaveBeenCalledWith({ id: 'r1' });
  });

  it('DM·채널 둘 다 실패해도 지운다', async () => {
    // 실패한 1회용을 남기면 1분마다 영원히 재시도한다
    const alarm = remindOf();
    const { service, dm, send, alarmConfigRepository } = build();
    dm.mockRejectedValue(new Error('blocked'));
    send.mockRejectedValue(new Error('channel gone'));

    await expect(service.run(alarm)).resolves.toBeUndefined();

    expect(alarmConfigRepository.delete).toHaveBeenCalledWith({ id: 'r1' });
  });
});

describe('AlarmService.popAlarm', () => {
  it('1회용은 /alarm list에서 제외한다 — 개인 리마인더지 서버 알람이 아니다', async () => {
    const { service, alarmConfigRepository } = build([]);
    await service.popAlarm('g1');

    const [where] = alarmConfigRepository.findBy.mock.calls[0] as [
      { guildId: string; intervalValue: FindOperator<number> },
    ];
    expect(where.guildId).toBe('g1');
    expect(where.intervalValue.type).toBe('not');
  });
});
