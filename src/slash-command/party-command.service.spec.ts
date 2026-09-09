import { PartyMessageService } from '@/party/party-message.service';
import dayjs from '@/utils/dayjs';
import { PartyVisibility } from '@/party/vo/enum';
import { payload } from '@/utils/discord-embed';
import { ComponentType } from 'discord.js';
import { describe, expect, it, vi } from 'vitest';
import { PartyCommandService } from './party-command.service';

const party = (id: string, visibility: PartyVisibility) => ({
  id,
  name: `party ${id}`,
  mission: 'Mot (Void)',
  hostUserId: 'host',
  members: ['host'],
  partySize: 4,
  visibility,
});

const service = (parties: ReturnType<typeof party>[]) => {
  const partyService = {
    list: vi.fn().mockResolvedValue(parties),
    history: vi.fn().mockResolvedValue(parties),
  };
  return new PartyCommandService(
    partyService as never,
    new PartyMessageService(),
  );
};

const interaction = () => ({
  guildId: 'g1',
  editReply: vi.fn<(view: ReturnType<typeof payload>) => void>(),
});

/** 마지막 TextDisplay가 manageCard의 footer(-# 회색 줄) */
const footer = ({ components: [view] }: ReturnType<typeof payload>) => {
  const children = view.toJSON().components;
  const last = children.at(-1);
  return last && 'content' in last ? last.content : undefined;
};

describe('/party list', () => {
  it('0인 범위까지 세 칸을 늘 같은 순서로 센다', async () => {
    const context = interaction();

    await service([
      party('p1', PartyVisibility.PUBLIC),
      party('p2', PartyVisibility.CLAN),
      party('p3', PartyVisibility.PUBLIC),
    ]).list([context] as never);

    expect(footer(context.editReply.mock.calls[0][0])).toContain(
      'Public 2 · Friends only 0 · Clan only 1',
    );
  });

  /** 마감 파티는 지우지 않아 기록이 이미 있다 — 마감 시각은 updatedAt이 대신한다 */
  it('history는 마감 시각을 붙여 최근 것부터 보여준다', async () => {
    const context = interaction();
    const closed = {
      ...party('p1', PartyVisibility.PUBLIC),
      updatedAt: dayjs('2099-01-01T00:00:00Z'),
    };

    await service([closed]).history([context] as never);

    const [{ components }] = context.editReply.mock.calls[0];
    const text = components[0]
      .toJSON()
      .components.map((child) => ('content' in child ? child.content : ''))
      .join('\n');
    expect(text).toContain('Recent Parties · 1');
    expect(text).toContain('closed <t:4070908800:R>');
  });

  it('빈 목록은 집계 없이 안내 한 덩이 + 진입 버튼이다 — 전부 0인 줄은 정보가 아니다', async () => {
    const context = interaction();

    await service([]).list([context] as never);

    const [head, row] =
      context.editReply.mock.calls[0][0].components[0].toJSON().components as {
        type: ComponentType;
        components?: { label?: string }[];
      }[];
    expect(head.type).toBe(ComponentType.TextDisplay);
    // 버튼으로는 슬래시 커맨드를 못 부른다 — 이 버튼이 여는 모달이 빈 화면의 유일한 출구다
    expect(row.type).toBe(ComponentType.ActionRow);
    expect(row.components?.[0].label).toBe('Create a party');
  });
});
