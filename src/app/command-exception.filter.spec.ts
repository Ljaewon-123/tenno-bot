import { BadRequestException, Logger } from '@nestjs/common';
import { MessageFlags } from 'discord.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandExceptionFilter } from './command-exception.filter';

/** 실패는 어느 커맨드에서 나오든 같은 빨강 카드여야 한다 — 평문으로 돌아가면 성공 응답과 구분이 안 된다 */
const build = (deferred = true) => {
  const interaction = {
    isRepliable: () => true,
    replied: false,
    deferred,
    editReply: vi.fn(),
    reply: vi.fn(),
  };
  // necord 컨텍스트는 args[0]이 곧 [interaction] 튜플이다
  const host = {
    getType: () => 'necord',
    getArgs: () => [[interaction]],
  } as never;
  return { interaction, host, filter: new CommandExceptionFilter({} as never) };
};

const sent = (call: unknown[]) => {
  const [message] = call as [
    { components: { toJSON: () => { components: { content?: string }[] } }[] },
  ];
  return message.components[0]
    .toJSON()
    .components.map(({ content }) => content)
    .join('\n');
};

beforeEach(() => {
  vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
});

describe('CommandExceptionFilter', () => {
  it('4xx는 서비스가 던진 문장을 그대로 카드에 보여준다', async () => {
    const { filter, host, interaction } = build();

    await filter.catch(new BadRequestException('Alarm not found.'), host);

    expect(sent(interaction.editReply.mock.calls[0])).toContain(
      '## Cannot run that',
    );
    expect(sent(interaction.editReply.mock.calls[0])).toContain(
      'Alarm not found.',
    );
  });

  it('5xx는 내부 메시지를 노출하지 않는다', async () => {
    const { filter, host, interaction } = build();

    await filter.catch(new Error('ECONNREFUSED 10.0.0.1:5432'), host);

    const text = sent(interaction.editReply.mock.calls[0]);
    expect(text).toContain('## Something went wrong');
    expect(text).not.toContain('ECONNREFUSED');
  });

  // 헬스체크가 503을 던졌는데 응답을 안 쓰면 요청이 타임아웃까지 매달린다
  it('HTTP 요청은 상태 코드로 응답하고 5xx 내부 메시지는 숨긴다', async () => {
    const reply = vi.fn();
    const filter = new CommandExceptionFilter({
      httpAdapter: { reply },
    } as never);
    const host = {
      getType: () => 'http',
      switchToHttp: () => ({ getResponse: () => 'res' }),
    } as never;

    await filter.catch(new Error('ECONNREFUSED 10.0.0.1:5432'), host);

    expect(reply).toHaveBeenCalledWith(
      'res',
      { statusCode: 500, message: 'Internal server error' },
      500,
    );
  });

  // defer 전에 터지면 editReply가 없다 — 이 경로만 ephemeral을 직접 붙여야 한다
  it('defer 전이면 ephemeral로 새 응답을 보낸다', async () => {
    const { filter, host, interaction } = build(false);

    await filter.catch(new BadRequestException('Nope.'), host);

    expect(interaction.editReply).not.toHaveBeenCalled();
    const [options] = interaction.reply.mock.calls[0] as [{ flags: number }];
    expect(options.flags & MessageFlags.Ephemeral).toBeTruthy();
    expect(options.flags & MessageFlags.IsComponentsV2).toBeTruthy();
  });
});
