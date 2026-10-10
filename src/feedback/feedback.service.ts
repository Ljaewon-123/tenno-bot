import { AppConfig } from '@/config/config.service.js';
import dayjs from '@/utils/dayjs.js';
import { bold, literal } from '@/utils/discord-embed/index.js';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { Dayjs } from 'dayjs';
import { WebhookClient } from 'discord.js';
import { FEEDBACK_COOLDOWN_SECONDS } from './constants.js';
import type { Feedback } from './types.js';

@Injectable()
export class FeedbackService {
  // 봇이 서포트 서버에 없어도(dev 봇 등) 보낼 수 있게 채널 send가 아니라 웹훅으로 보낸다
  private readonly webhook?: WebhookClient;
  // ponytail: 인메모리라 재시작하면 풀린다 — 우회 스팸이 실제로 오면 DB로 옮긴다
  private readonly lastSentAt = new Map<string, Dayjs>();

  constructor(config: AppConfig) {
    if (config.FEEDBACK_WEBHOOK_URL)
      this.webhook = new WebhookClient({ url: config.FEEDBACK_WEBHOOK_URL });
  }

  async send({ userId, userTag, guild, message }: Feedback) {
    if (!this.webhook)
      throw new BadRequestException(
        'Feedback is not set up yet. Please use the support server instead.',
      );

    const last = this.lastSentAt.get(userId);
    if (last && dayjs().diff(last, 'second') < FEEDBACK_COOLDOWN_SECONDS)
      throw new BadRequestException(
        'You just sent feedback. Please wait a minute before sending more.',
      );

    // 실패하면 바로 다시 보낼 수 있어야 해서 보내기 전에 잡고 실패 시 되돌린다(동시 연타도 이걸로 막힌다)
    this.lastSentAt.set(userId, dayjs());
    await this.webhook
      .send({
        username: 'Feedback',
        content: `${bold('Feedback')} · ${literal(userTag)} (${userId}) · ${guild ? literal(guild) : 'DM'}\n${literal(message)}`,
        // 유저 글이 그대로 실린다 — 웹훅은 기본으로 @everyone도 핑한다
        allowedMentions: { parse: [] },
      })
      .catch((error: unknown) => {
        this.lastSentAt.delete(userId);
        throw error;
      });
  }
}
