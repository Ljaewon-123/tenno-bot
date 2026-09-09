import { PartyMessageService } from '@/party/party-message.service';
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
  const partyService = { list: vi.fn().mockResolvedValue(parties) };
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

  it('빈 목록은 집계 없이 진입 안내만 낸다 — 전부 0인 줄은 정보가 아니다', async () => {
    const context = interaction();

    await service([]).list([context] as never);

    const { components } = context.editReply.mock.calls[0][0];
    expect(components[0].toJSON().components).toHaveLength(1);
    expect(components[0].toJSON().components[0].type).toBe(
      ComponentType.TextDisplay,
    );
  });
});
