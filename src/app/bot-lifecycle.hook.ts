import { AlarmService } from '@/alarm/alarm.service';
import { NotificationService } from '@/notification/notification.service';
import { PartyService } from '@/party/party.service';
import { Injectable, Logger } from '@nestjs/common';
import { Context, type ContextOf, On, Once } from 'necord';

@Injectable()
export class BotLifecycleHook {
  private readonly logger = new Logger(BotLifecycleHook.name);

  constructor(
    private readonly alarmService: AlarmService,
    private readonly notificationService: NotificationService,
    private readonly partyService: PartyService,
  ) {}

  @Once('ready')
  onReady(@Context() [client]: ContextOf<'ready'>) {
    this.logger.log(`Logged in as ${client.user.username}!`);
  }

  @On('warn')
  onWarn(@Context() [message]: ContextOf<'warn'>) {
    this.logger.warn(message);
  }

  /** 추방/서버 삭제 — 남겨두면 알람이 1분마다 영원히 실패한다 */
  @On('guildDelete')
  async onGuildDelete(@Context() [guild]: ContextOf<'guildDelete'>) {
    await this.cleanup({ guildId: guild.id }, `guild ${guild.id}`);
  }

  /** 수신 채널이 사라진 알람/구독도 같은 이유로 정리한다 */
  @On('channelDelete')
  async onChannelDelete(@Context() [channel]: ContextOf<'channelDelete'>) {
    await this.cleanup({ channelId: channel.id }, `channel ${channel.id}`);
  }

  private async cleanup(
    where: { guildId: string } | { channelId: string },
    label: string,
  ) {
    const [alarms, notifications, parties] = await Promise.all([
      this.alarmService.cleanup(where),
      this.notificationService.cleanup(where),
      this.partyService.cleanup(where),
    ]);
    if (alarms || notifications || parties) {
      this.logger.log(
        `${label} 정리: 알람 ${alarms}건, 구독 ${notifications}건, 파티 ${parties}건 삭제`,
      );
    }
  }
}
