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
    register: vi.fn(),
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

/** 컨테이너 안의 모든 글자 — 어느 자식에 적혔는지는 여기서 볼 것이 아니다 */
const said = ({ components: [view] }: ReturnType<typeof payload>) =>
  JSON.stringify(view.toJSON());

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

  /**
   * 경로에서 `tier:`가 빠지면 눌러서 간 화면이 알람이 보내던 목록과 다른 것이 된다 —
   * 접힌 줄이 필터를 같이 싣는 것과 같은 이유고, 목록·확인 카드·잘린 push 셋이 같은 자리를 쓴다.
   */
  it('좁힘 옵션이 걸린 알람은 목록 줄이 커맨드 옵션까지 적는다', async () => {
    const { alarmService, command } = service();
    const context = interaction();
    alarmService.popAlarm.mockResolvedValue([
      {
        ...alarms[0],
        targetCommand: { target: 'void-fissures', options: 'Axi' },
      },
    ]);

    await command.popAlarm([context] as never);

    expect(said(context.editReply.mock.calls[0][0])).toContain(
      '/void-fissures tier:Axi',
    );
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
