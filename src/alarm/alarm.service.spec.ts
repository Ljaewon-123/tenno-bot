import { card } from '@/utils/discord-embed';
import dayjs from '@/utils/dayjs';
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
  const alarmConfigRepository = {
    findBy: vi.fn().mockResolvedValue(pending),
    update: vi.fn(),
    save: vi.fn(),
    create: vi.fn((value: object) => value),
    delete: vi.fn(),
  };
  const getAlarmTarget = vi
    .fn()
    .mockImplementation(async () => card({ title: 'Sortie', blocks: [] }));
  const fetch = vi.fn(() => Promise.resolve({ isSendable: () => true, send }));
  const service = new AlarmService(
    alarmConfigRepository as never,
    { getAlarmTarget } as never,
    { channels: { fetch } } as never,
  );
  return { service, alarmConfigRepository, getAlarmTarget, fetch, send };
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
    const [sent] = send.mock.calls[0] as [
      { components: [{ toJSON: () => { components: { content: string }[] } }] },
    ];
    expect(sent.components[0].toJSON().components[0].content).toBe(
      '-# 🔔 Alarm · sortie · every 60 min',
    );
    expect(alarmConfigRepository.save).toHaveBeenCalledWith(alarm);
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
