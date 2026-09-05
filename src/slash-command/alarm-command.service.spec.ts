import dayjs from '@/utils/dayjs';
import { payload } from '@/utils/discord-embed';
import { ComponentType } from 'discord.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlarmCommandService } from './alarm-command.service';

const alarms = Array.from({ length: 5 }, (_, index) => ({
  id: `id-${index}`,
  name: `alarm ${index}`,
  description: null,
  intervalValue: 15,
  targetCommand: { target: 'sortie' },
  // 뒤에 등록된 것이 먼저 울리게 섞어 둔다 — 정렬이 죽으면 이 테스트가 잡는다
  doneAt: dayjs().add(5 - index, 'minute'),
}));

const service = () => {
  const alarmService = {
    popAlarm: vi.fn().mockResolvedValue(alarms),
    unRegister: vi.fn().mockResolvedValue(true),
  };
  return {
    alarmService,
    command: new AlarmCommandService(alarmService as never),
  };
};

const interaction = () => ({
  guildId: 'g1',
  editReply: vi.fn<(view: ReturnType<typeof payload>) => void>(),
  update: vi.fn<(view: ReturnType<typeof payload>) => void>(),
});

/** 컨테이너 자식 중 Section만 — 삭제 버튼이 붙는 유일한 자리 */
const deleteIds = ({ components: [view] }: ReturnType<typeof payload>) =>
  view
    .toJSON()
    .components.filter((child) => child.type === ComponentType.Section)
    .map((child) =>
      'custom_id' in child.accessory ? child.accessory.custom_id : undefined,
    );

describe('/alarm list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('임박한 순 3개마다 삭제 버튼이 붙고 페이지가 customId에 실린다', async () => {
    const { command } = service();
    const context = interaction();

    await command.popAlarm([context] as never);

    expect(deleteIds(context.editReply.mock.calls[0][0])).toEqual([
      'alarm/list/delete/id-4/0',
      'alarm/list/delete/id-3/0',
      'alarm/list/delete/id-2/0',
    ]);
  });

  it('삭제 버튼은 지운 뒤 보던 페이지를 다시 그린다', async () => {
    const { alarmService, command } = service();
    const context = interaction();

    await command.deleteFromList([context] as never, 'id-4', '1');

    expect(alarmService.unRegister).toHaveBeenCalledWith('id-4', 'g1');
    expect(deleteIds(context.update.mock.calls[0][0])).toEqual([
      'alarm/list/delete/id-1/1',
      'alarm/list/delete/id-0/1',
    ]);
  });
});
