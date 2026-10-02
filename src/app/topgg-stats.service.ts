import { AppConfig } from '@/config/config.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Client } from 'discord.js';

@Injectable()
export class TopggStatsService {
  private readonly logger = new Logger(TopggStatsService.name);

  constructor(
    private readonly client: Client,
    private readonly config: AppConfig,
  ) {}

  /** 토큰은 top.gg 승인 후에야 나온다 — 그 전과 dev에선 env를 비워 두면 조용히 건너뛴다 */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async post() {
    const token = this.config.TOPGG_TOKEN;
    if (!token || !this.client.isReady()) return;

    await fetch(`https://top.gg/api/bots/${this.client.user.id}/stats`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ server_count: this.client.guilds.cache.size }),
    })
      .then((res) => {
        if (!res.ok)
          this.logger.warn(`top.gg 서버 수 전송 실패: ${res.status}`);
      })
      .catch((error) => this.logger.warn('top.gg 서버 수 전송 실패', error));
  }
}
