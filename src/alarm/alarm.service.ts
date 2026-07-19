import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Client } from 'discord.js';
import { Interval } from '@nestjs/schedule';
import dayjs from '@/utils/dayjs';
import { In, LessThanOrEqual } from 'typeorm';
import { Propagation, Transactional } from 'typeorm-transactional';
import { AlarmConfig } from './entities/alarm-config.entity';
import { AlarmConfigRepository } from './repositories/alarm-config.repository';
import { AlarmStatus } from './vo/enum';

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
  async register(alarm: AlarmConfig) {
    return this.alarmConfigRepository.save(alarm);
  }

  async unRegister(id: string) {
    return this.alarmConfigRepository.delete(id);
  }

  async popAlarm(guilidId: string) {
    const alarms = await this.alarmConfigRepository.findBy({
      guildId: guilidId,
    });
    if (alarms?.length) {
      throw new NotFoundException(`Alarm with id ${guilidId} not found`);
    }

    return alarms.map((alarm) => ({
      id: alarm.id,
      name: alarm.name,
      description: alarm.description,
      intervalValue: alarm.intervalValue,
      targetCommand: alarm.targetCommand,
    }));
  }

  async getPendingAlarms() {
    const now = dayjs().startOf('minute');
    const alarms = await this.alarmConfigRepository.findBy({
      status: AlarmStatus.PENDING,
      doneAt: LessThanOrEqual(now),
    });
    const ids = alarms.map((alarm) => alarm.id);

    // 영원히 pending으로 돌아가지 않은 상태에 대해서 검증필요
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
      const embed = await this.warframeApiService.alarmTarget({
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
      // 실패해도 다음 주기에 재시도 — error에 마지막 실패만 기록
      alarm.error = JSON.stringify(error, Object.getOwnPropertyNames(error));
      await this.afterFire(alarm);
    }
  }

  async afterFire(alarm: AlarmConfig) {
    alarm.reschedule();
    await this.alarmConfigRepository.save(alarm);
  }
}
