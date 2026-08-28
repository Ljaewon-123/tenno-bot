import dayjs from '@/utils/dayjs';
import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Client } from 'discord.js';
import { FindOptionsWhere, In, LessThanOrEqual } from 'typeorm';
import { Propagation, Transactional } from 'typeorm-transactional';
import { CreateAlarm } from './dto/create-alarm.dto';
import { AlarmConfig } from './entities/alarm-config.entity';
import { AlarmConfigRepository } from './repositories/alarm-config.repository';
import { AlarmStatus } from './vo/enum';

/** 이 시간을 넘도록 RUNNING인 알람은 프로세스가 죽은 것으로 본다 */
const STALE_AFTER_MINUTES = 10;

@Injectable()
export class AlarmService {
  constructor(
    private readonly alarmConfigRepository: AlarmConfigRepository,
    private readonly warframeApiService: WarframeApiService,
    private readonly client: Client,
  ) {}

  @Interval(60_000)
  async cron() {
    // 실행
    const alarms = await this.getPendingAlarms();
    alarms.forEach((alarm) => {
      void this.run(alarm);
    });
  }

  /** 업데이트는 어떻게 하지 일단은 지우고 등록 */
  async register(alarm: CreateAlarm) {
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

  async popAlarm(guilidId: string) {
    const alarms = await this.alarmConfigRepository.findBy({
      guildId: guilidId,
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
      // 발동 도중 프로세스가 죽으면 RUNNING으로 굳어 다시는 안 돈다.
      // 한 번 발동이 STALE_AFTER_MINUTES를 넘길 일은 없으므로 그보다 오래 묵은 RUNNING은 좀비로 보고 회수한다.
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

  @Transactional({ propagation: Propagation.REQUIRED })
  async run(alarm: AlarmConfig) {
    try {
      const targetCommand = alarm.targetCommand;
      const embed = await this.warframeApiService.getAlarmTarget({
        target: targetCommand.target,
        options: targetCommand.options,
      });

      // channelId 없는 구버전 알람은 전송 스킵
      if (alarm.channelId) {
        const channel = await this.client.channels.fetch(alarm.channelId);
        if (channel?.isSendable()) {
          await channel.send({ embeds: [embed] });
        }
      }

      return this.afterFire(alarm);
    } catch (error) {
      // 실패해도 다음 주기에 재시도 — 마지막 실패만 기록
      alarm.fail(error);
      await this.afterFire(alarm);
    }
  }

  async afterFire(alarm: AlarmConfig) {
    alarm.reschedule();
    await this.alarmConfigRepository.save(alarm);
  }
}
