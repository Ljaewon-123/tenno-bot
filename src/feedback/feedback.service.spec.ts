import { BadRequestException } from '@nestjs/common';
import { WebhookClient } from 'discord.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedbackService } from './feedback.service.js';

const feedback = {
  userId: '1',
  userTag: 'tenno',
  guild: 'Relay',
  message: 'hi',
};

// discord.js가 형식을 검사한다 — id는 스노우플레이크, 토큰은 68자여야 생성자가 안 터진다
const WEBHOOK_URL = `https://discord.com/api/webhooks/123456789012345678/${'a'.repeat(68)}`;

const build = (url = WEBHOOK_URL) =>
  new FeedbackService({ FEEDBACK_WEBHOOK_URL: url } as never);

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('FeedbackService', () => {
  it('웹훅이 없으면 서포트 서버로 안내한다', async () => {
    await expect(build('').send(feedback)).rejects.toThrow(BadRequestException);
  });

  it('유저 글이 아무도 핑하지 않게 멘션을 전부 끈다', async () => {
    const send = vi
      .spyOn(WebhookClient.prototype, 'send')
      .mockResolvedValue({} as never);

    await build().send({ ...feedback, message: '@everyone [x](https://evil)' });

    const [options] = send.mock.calls[0] as [
      { content: string; allowedMentions: unknown },
    ];
    expect(options.allowedMentions).toEqual({ parse: [] });
    expect(options.content).toContain('\\[x](https://evil)');
  });

  it('같은 유저는 1분 안에 다시 못 보내고, 지나면 보낼 수 있다', async () => {
    vi.useFakeTimers();
    vi.spyOn(WebhookClient.prototype, 'send').mockResolvedValue({} as never);
    const service = build();

    await service.send(feedback);
    await expect(service.send(feedback)).rejects.toThrow(BadRequestException);
    await service.send({ ...feedback, userId: '2' });

    vi.advanceTimersByTime(60_000);
    await expect(service.send(feedback)).resolves.toBeUndefined();
  });

  it('발송이 실패하면 쿨다운을 되돌려 바로 다시 보낼 수 있다', async () => {
    const send = vi
      .spyOn(WebhookClient.prototype, 'send')
      .mockRejectedValueOnce(new Error('429'))
      .mockResolvedValue({} as never);
    const service = build();

    await expect(service.send(feedback)).rejects.toThrow('429');
    await service.send(feedback);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
