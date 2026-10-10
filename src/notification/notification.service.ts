import { asPush, payload } from '@/utils/discord-embed/index.js';
import dayjs from '@/utils/dayjs.js';
import { TargetCommand } from '@/warframe-api/enum.js';
import { CacheKey } from '@/warframe-api/shared/enum.js';
import { CacheRepository } from '@/warframe-api/shared/modules/repositories/cache.repository.js';
import { WarframeApiService } from '@/warframe-api/warframe-api.service.js';
import { WorldStateService } from '@/warframe-api/world-state/world-state.service.js';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Client } from 'discord.js';
import { FindOptionsWhere, LessThanOrEqual } from 'typeorm';
import { HISTORY_RETENTION_DAYS } from './constants.js';
import { Notification } from './entities/notification.entity.js';
import { NotificationHistoryRepository } from './repositories/notification-history.repository.js';
import { NotificationRepository } from './repositories/notification.repository.js';
import { WatchTarget, WatchTargetLabel } from './types.js';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationHistoryRepository: NotificationHistoryRepository,
    private readonly cacheRepository: CacheRepository,
    private readonly worldStateService: WorldStateService,
    private readonly warframeApiService: WarframeApiService,
    private readonly client: Client,
  ) {}

  /** 같은 길드+이벤트는 하나만 — 다시 켜면 수신 채널만 갈아끼운다 */
  async subscribe(
    guildId: string,
    channelId: string,
    eventType: WatchTarget,
  ): Promise<Notification> {
    const existing = await this.notificationRepository.findOneBy({
      guildId,
      eventType,
    });
    const entity =
      existing ?? this.notificationRepository.create({ guildId, eventType });
    entity.channelId = channelId;
    return this.notificationRepository
      .save(entity)
      .catch((error: { code?: string }) => {
        // 동시 요청이 나란히 insert하면 unique에 걸린다 — 다시 돌면 update로 간다
        if (error?.code !== '23505') throw error;
        return this.subscribe(guildId, channelId, eventType);
      });
  }

  async unsubscribe(guildId: string, eventType: WatchTarget) {
    const { affected } = await this.notificationRepository.delete({
      guildId,
      eventType,
    });
    return Boolean(affected);
  }

  async list(guildId: string) {
    return this.notificationRepository.findBy({ guildId });
  }

  /** 실패 이력은 길드 컬럼이 없어 여기서 안 지운다 — purgeHistory가 쓸어간다 */
  async cleanup(where: FindOptionsWhere<Notification>) {
    const { affected } = await this.notificationRepository.delete(where);
    return affected ?? 0;
  }

  // DE가 리셋을 몇 분씩 늦추는 일이 있어 시각이 아니라 id 변화로 감지한다
  @Cron(CronExpression.EVERY_10_MINUTES)
  async detect() {
    const results = await Promise.allSettled([
      this.watch(CacheKey.LastSortieId, TargetCommand.Sortie, async () => [
        (await this.worldStateService.sortie()).id,
      ]),
      this.watch(
        CacheKey.LastArchonHuntId,
        TargetCommand.ArchonHunt,
        async () => [(await this.worldStateService.archonHunt()).id],
      ),
      this.watch(CacheKey.LastEventsId, TargetCommand.Events, async () =>
        (await this.worldStateService.events())
          .filter((event) => !event.expired)
          .map((event) => event.id),
      ),
      // 바로는 와 있는 동안만 커서를 채운다 — id로 보면 도착 스케줄 갱신에도 알림이 나간다
      this.watch(
        CacheKey.LastVoidTraderId,
        TargetCommand.VoidTrader,
        async () => {
          const trader = await this.worldStateService.voidTrader();
          const now = dayjs();
          return now.isAfter(trader.activation) && now.isBefore(trader.expiry)
            ? [trader.activation]
            : [];
        },
      ),
      // 시즌 id는 몇 달에 한 번이라 챌린지 id 묶음으로 본다
      this.watch(CacheKey.LastNightwaveId, TargetCommand.Nightwave, async () =>
        (await this.worldStateService.nightwave()).activeChallenges
          .filter((challenge) => !challenge.isDaily)
          .map((challenge) => challenge.id),
      ),
      this.watch(
        CacheKey.LastArchimedeaId,
        TargetCommand.Archimedea,
        async () =>
          (await this.worldStateService.archimedeas()).map(
            (archimedea) => archimedea.id,
          ),
      ),
    ]);

    for (const result of results) {
      if (result.status === 'rejected') this.logger.error(result.reason);
    }
  }

  private async watch(
    key: CacheKey,
    eventType: WatchTarget,
    fetchIds: () => Promise<string[]>,
  ) {
    const nextIds = await fetchIds();
    const cached = await this.cacheRepository.findOneBy({ key });
    const prevIds = (cached?.cache as string[] | undefined) ?? [];

    // 이전 커서에 없던 id가 생기면 변경 — 만료로 사라진 건 무시된다
    const hasNewId = (prevIds: string[], nextIds: string[]) =>
      nextIds.some((id) => !prevIds.includes(id));

    // 커서가 없던 첫 실행은 심어두기만 한다 — 신규 배포 때 알림이 쏟아지는 걸 막는다
    if (cached && hasNewId(prevIds, nextIds)) await this.broadcast(eventType);

    // 커서는 발송 뒤에 옮긴다 — 먼저 옮기면 broadcast가 던졌을 때 그 변화는 영영 안 알려진다
    const entity = cached ?? this.cacheRepository.create({ key });
    entity.cache = nextIds;
    await this.cacheRepository.save(entity);
  }

  private async broadcast(eventType: WatchTarget) {
    const notifications = await this.notificationRepository.findBy({
      eventType,
    });
    if (!notifications.length) return;

    const view = await this.warframeApiService.getAlarmTarget({
      target: eventType,
    });
    // asPush는 뷰를 제자리에서 고치므로 발송 루프 밖에서 한 번만 부른다
    asPush(
      view,
      `🔔 ${WatchTargetLabel[eventType]} changed`,
      '/notification off to stop',
      `/${eventType}`,
    );

    const results = await Promise.allSettled(
      notifications.map(async ({ channelId }) => {
        if (!channelId) return;
        const channel = await this.client.channels.fetch(channelId);
        if (channel?.isSendable()) await channel.send(payload(view));
      }),
    );

    const failures = results.flatMap((result, index) =>
      result.status === 'rejected'
        ? [
            {
              notification: notifications[index],
              reason: result.reason as unknown,
            },
          ]
        : [],
    );
    if (!failures.length) return;

    for (const { notification, reason } of failures) {
      this.logger.error(
        `${eventType} 발송 실패 (channel: ${notification.channelId})`,
        reason,
      );
    }

    await this.notificationHistoryRepository
      .insert(
        failures.map(({ reason }) =>
          // id 기본값이 필드 초기화식이라 create()로 엔티티를 만들어야 채워진다
          this.notificationHistoryRepository.create({
            eventType,
            error: (reason instanceof Error
              ? reason.message
              : (JSON.stringify(reason) ?? 'unknown')
            ).slice(0, 1000),
          }),
        ),
      )
      .catch((error) => this.logger.error('발송 실패 이력 저장 실패', error));
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeHistory() {
    const { affected } = await this.notificationHistoryRepository.delete({
      createdAt: LessThanOrEqual(
        dayjs().subtract(HISTORY_RETENTION_DAYS, 'day'),
      ),
    });
    if (affected) this.logger.log(`발송 실패 이력 ${affected}건 정리`);
  }
}
