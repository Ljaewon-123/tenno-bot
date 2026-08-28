import dayjs from '@/utils/dayjs';
import { TargetCommand } from '@/warframe-api/enum';
import { CacheKey } from '@/warframe-api/shared/enum';
import { CacheRepository } from '@/warframe-api/shared/modules/repositories/cache.repository';
import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { WorldStateService } from '@/warframe-api/world-state/world-state.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Client } from 'discord.js';
import { FindOptionsWhere, LessThanOrEqual } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationHistoryRepository } from './repositories/notification-history.repository';
import { NotificationRepository } from './repositories/notification.repository';
import { WatchTarget } from './types';

/** 실패 이력 보관 기간 */
const HISTORY_RETENTION_DAYS = 30;

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
  async subscribe(guildId: string, channelId: string, eventType: WatchTarget) {
    const existing = await this.notificationRepository.findOneBy({
      guildId,
      eventType,
    });
    const entity =
      existing ?? this.notificationRepository.create({ guildId, eventType });
    entity.channelId = channelId;
    return this.notificationRepository.save(entity);
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

  /** 발송 대상이 사라진 구독 정리 — 봇 추방/채널 삭제 시. 이력도 같이 지운다 */
  async cleanup(where: FindOptionsWhere<Notification>) {
    const { affected } = await this.notificationRepository.delete(where);
    await this.notificationHistoryRepository.delete(where);
    return affected ?? 0;
  }

  // 소티(일간)/아콘헌트(주간)는 UTC 00:00 리셋이지만 DE가 몇 분씩 늦추는 일이 있어
  // 시각이 아닌 id 변화로 감지한다. 10분 간격 = 알림 최대 10분 지연, 하루 3×144회 호출.
  @Cron(CronExpression.EVERY_10_MINUTES)
  async detect() {
    // 한 엔드포인트가 죽어도 나머지는 돌아야 하므로 allSettled
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

    const entity = cached ?? this.cacheRepository.create({ key });
    entity.cache = nextIds;
    await this.cacheRepository.save(entity);

    /**
     * 이전 커서에 없던 id가 하나라도 있으면 변경으로 본다.
     * 단일 객체(소티/아콘헌트)는 id 하나짜리 배열이라 교체 = 변경,
     * events는 새 이벤트 등장만 잡히고 만료로 사라진 건 무시된다.
     */
    const hasNewId = (prevIds: string[], nextIds: string[]) =>
      nextIds.some((id) => !prevIds.includes(id));

    // 커서가 없던 첫 실행은 심어두기만 한다 — 신규 배포 때 알림이 쏟아지는 걸 막는다
    if (!cached) return;
    if (!hasNewId(prevIds, nextIds)) return;

    return this.broadcast(eventType);
  }

  private async broadcast(eventType: WatchTarget) {
    const notifications = await this.notificationRepository.findBy({
      eventType,
    });
    if (!notifications.length) return;

    // 변화가 감지된 순간에만 도는 경로라 임베드용 재호출 1회는 감수한다
    const embed = await this.warframeApiService.getAlarmTarget({
      target: eventType,
    });

    // 채널이 지워졌거나 권한이 빠진 길드 하나 때문에 나머지 발송이 멈추면 안 된다
    const results = await Promise.allSettled(
      notifications.map(async ({ channelId }) => {
        if (!channelId) return;
        const channel = await this.client.channels.fetch(channelId);
        if (channel?.isSendable()) await channel.send({ embeds: [embed] });
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

    // 이력 저장이 실패해도 발송은 이미 끝났으니 로깅만 하고 넘어간다
    await this.notificationHistoryRepository
      .insert(
        failures.map(({ notification, reason }) =>
          // id 기본값이 필드 초기화식이라 create()로 엔티티를 만들어야 채워진다
          this.notificationHistoryRepository.create({
            guildId: notification.guildId,
            channelId: notification.channelId,
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

  /** 실패 이력은 30일치만 — 그보다 오래된 건 들여다볼 일이 없다 */
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
