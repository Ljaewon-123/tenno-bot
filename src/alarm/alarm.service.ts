import dayjs from '@/utils/dayjs';
import { asPush, payload, relative } from '@/utils/discord-embed';
import {
  AlarmRequest,
  RemindTarget,
  TargetCommand,
  TargetCommandLabel,
} from '@/warframe-api/enum';
import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import {
  CycleLabel,
  CycleName,
  VoidTier,
} from '@/warframe-api/world-state/vo/enum';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Client, type ContainerBuilder } from 'discord.js';
import { FindOptionsWhere, In, IsNull, LessThanOrEqual, Not } from 'typeorm';
import {
  ALARM_LIMIT_PER_GUILD,
  CYCLE_REMIND_LEAD_MINUTES,
  REMIND_LEAD_MINUTES,
  STALE_AFTER_MINUTES,
} from './constants';
import { CreateAlarm } from './dto/create-alarm.dto';
import { AlarmConfig } from './entities/alarm-config.entity';
import { AlarmConfigRepository } from './repositories/alarm-config.repository';
import { RemindInput } from './types';
import { AlarmStatus } from './vo/enum';
import { TargetCommandAlarm } from './vo/target-command.vo';

@Injectable()
export class AlarmService {
  private readonly logger = new Logger(AlarmService.name);

  constructor(
    private readonly alarmConfigRepository: AlarmConfigRepository,
    private readonly warframeApiService: WarframeApiService,
    private readonly client: Client,
  ) {}

  @Interval(60_000)
  async cron() {
    const alarms = await this.getPendingAlarms();
    // run()의 거절을 여기서 안 받으면 unhandled rejection으로 프로세스가 죽는다.
    // RUNNING으로 남은 행은 getPendingAlarms가 회수한다
    alarms.forEach((alarm) => {
      this.run(alarm).catch((error) =>
        this.logger.error(`알람 ${alarm.id} 처리 실패`, error),
      );
    });
  }

  async register(alarm: CreateAlarm) {
    const { target, options } = alarm.targetCommand;
    if (options && target !== TargetCommand.VoidFissures)
      throw new BadRequestException(
        '`tier` only applies to the void-fissures target.',
      );

    const registered = await this.alarmConfigRepository.countBy({
      guildId: alarm.guildId,
      intervalValue: Not(IsNull()),
    });
    if (registered >= ALARM_LIMIT_PER_GUILD)
      throw new BadRequestException(
        `This server already has ${registered} alarms. Delete one with /alarm delete first.`,
      );

    const entity = this.alarmConfigRepository.create(alarm);
    return this.alarmConfigRepository.save(entity);
  }

  /** id는 다른 서버에도 노출될 수 있으므로 반드시 길드로 한 번 더 좁힌다 */
  async unRegister(id: string, guildId: string) {
    const { affected } = await this.alarmConfigRepository.delete({
      id,
      guildId,
    });
    return Boolean(affected);
  }

  /** 발송 대상이 사라진 알람 정리 — 남겨두면 1분마다 영원히 실패한다 */
  async cleanup(where: FindOptionsWhere<AlarmConfig>) {
    const { affected } = await this.alarmConfigRepository.delete(where);
    return affected ?? 0;
  }

  leadFor(target: RemindTarget) {
    return target === TargetCommand.Cycles
      ? CYCLE_REMIND_LEAD_MINUTES
      : REMIND_LEAD_MINUTES;
  }

  /** 🔔 토글 — 등록하면 발동 시각을, 이미 있으면 지우고 null을 돌려준다 */
  async remind({ guildId, channelId, userId, target, option }: RemindInput) {
    // 지역까지 키에 넣어야 시투스·발리스 토글이 서로를 안 지운다
    const key = option ? `${target}:${option}` : target;
    const existing = await this.alarmConfigRepository.findOneBy({
      guildId,
      userId,
      name: key,
    });
    if (existing) {
      await this.alarmConfigRepository.delete({ id: existing.id });
      return null;
    }

    const moment = await this.warframeApiService.remindMomentOf(target, option);
    if (!moment)
      throw new BadRequestException(
        `${TargetCommandLabel[target]} is between rotations right now.`,
      );

    const lead = this.leadFor(target);
    const at = moment.subtract(lead, 'minute');
    if (!at.isAfter(dayjs()))
      throw new BadRequestException(
        `${TargetCommandLabel[target]} happens in under ${lead} minutes — too late to remind you.`,
      );

    const entity = this.alarmConfigRepository.create({
      guildId,
      channelId,
      userId,
      // 토글 키를 겸한다
      name: key,
      intervalValue: null,
      targetCommand: { target, options: option },
      doneAt: at,
    });
    // 🔔 동시 클릭 레이스는 부분 유니크 인덱스(23505)가 막는다
    await this.alarmConfigRepository
      .save(entity)
      .catch((error: { code?: string }) => {
        if (error?.code === '23505')
          throw new BadRequestException(
            'That reminder is already set — press 🔔 again to cancel it.',
          );
        throw error;
      });
    return at;
  }

  /** 반복 알람만 — 1회용은 개인 리마인더라 서버 목록에 안 보인다 */
  async popAlarm(guildId: string) {
    const alarms = await this.alarmConfigRepository.findBy({
      guildId,
      intervalValue: Not(IsNull()),
    });

    return alarms.map((alarm) => ({
      id: alarm.id,
      name: alarm.name,
      description: alarm.description,
      intervalValue: alarm.intervalValue,
      targetCommand: alarm.targetCommand,
      doneAt: alarm.doneAt,
    }));
  }

  async getPendingAlarms() {
    const now = dayjs().startOf('minute');
    const alarms = await this.alarmConfigRepository.findBy([
      { status: AlarmStatus.PENDING, doneAt: LessThanOrEqual(now) },
      // 발동 도중 프로세스가 죽어 RUNNING으로 굳은 좀비를 회수한다
      {
        status: AlarmStatus.RUNNING,
        updatedAt: LessThanOrEqual(now.subtract(STALE_AFTER_MINUTES, 'minute')),
      },
    ]);
    const ids = alarms.map((alarm) => alarm.id);
    if (!ids.length) return alarms;

    await this.alarmConfigRepository.update(
      { id: In(ids) },
      { status: AlarmStatus.RUNNING },
    );

    return alarms;
  }

  /** 트랜잭션을 걸지 않는다 — 외부 API·Discord 전송 동안 커넥션을 붙잡아 풀이 마른다 */
  async run(alarm: AlarmConfig) {
    try {
      // jsonb라 target↔options 짝은 타입이 못 좁힌다 — 값은 엔티티의 class-validator가 지킨다
      const view = await this.warframeApiService.getAlarmTarget(
        alarm.targetCommand as AlarmRequest,
      );

      await this.deliver(alarm, asPush(view, ...this.pushLines(alarm)));

      return this.afterFire(alarm);
    } catch (error) {
      // 실패해도 다음 주기에 재시도 — 마지막 실패만 기록
      alarm.fail(error);
      await this.afterFire(alarm);
    }
  }

  private remindSubject(
    target: TargetCommand,
    options?: VoidTier | CycleName,
  ): string {
    const label = TargetCommandLabel[target];
    if (target === TargetCommand.Cycles)
      return `${CycleLabel[options as CycleName] ?? label} changes`;
    if (target === TargetCommand.VoidTrader) return `${label} arrives`;
    return `${label} ends`;
  }

  private pushLines(alarm: AlarmConfig): [string, string, string] {
    const { target, options } = alarm.targetCommand;
    const path = TargetCommandAlarm.path(alarm.targetCommand);
    if (!alarm.intervalValue)
      return [
        // ComponentsV2는 content를 못 써서 멘션을 본문에 넣는다
        `🔔 Reminder · <@${alarm.userId}> · ${this.remindSubject(target, options)} ${relative(
          alarm.doneAt.add(this.leadFor(target as RemindTarget), 'minute'),
        )}`,
        'One-time reminder you set with 🔔 — press it again to set a new one',
        path,
      ];

    return [
      `🔔 Alarm · ${alarm.name} · every ${alarm.intervalValue} min`,
      // reschedule은 발송 뒤에 돌아서 doneAt은 아직 이번 발동 시각이다
      `${alarm.id} · next run ${relative(dayjs().add(alarm.intervalValue, 'minute'))}`,
      path,
    ];
  }

  /** 1회용은 DM으로, DM이 막히면(50007) 등록한 채널로 */
  private async deliver(alarm: AlarmConfig, view: ContainerBuilder) {
    if (!alarm.userId) return this.toChannel(alarm, view);

    const user = await this.client.users.fetch(alarm.userId);
    return user
      .send(payload(view))
      .then(() => undefined)
      .catch(() => this.toChannel(alarm, view));
  }

  /** channelId 없는 구버전 알람은 전송 스킵 */
  private async toChannel(alarm: AlarmConfig, view: ContainerBuilder) {
    if (!alarm.channelId) return;
    const channel = await this.client.channels.fetch(alarm.channelId);
    if (channel?.isSendable()) await channel.send(payload(view));
  }

  async afterFire(alarm: AlarmConfig) {
    // 1회용은 실패했어도 지운다 — 남기면 크론이 영원히 훑는다
    if (!alarm.intervalValue) {
      await this.alarmConfigRepository.delete({ id: alarm.id });
      return;
    }
    alarm.reschedule();
    await this.alarmConfigRepository.save(alarm);
  }
}
