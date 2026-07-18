import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { In, LessThanOrEqual } from 'typeorm';
import { Propagation, Transactional } from 'typeorm-transactional';
import { CreateAlarmRequest } from './dto/create-alarm.request.dto';
import { AlarmConfigRepository } from './repositories/alarm-config.repository';
import { AlarmStatus } from './vo/enum';

@Injectable()
export class AlarmService {
  constructor(
    private readonly alarmConfigRepository: AlarmConfigRepository,
    private readonly warframeApiService: WarframeApiService,
  ) {}

  @Interval(60_000)
  async cron() {
    // 실행
    await this.fireAndForget();
  }

  async register(request: CreateAlarmRequest) {
    return this.alarmConfigRepository.save(request);
  }

  async unRegister(id: string) {
    return this.alarmConfigRepository.delete(id);
  }

  @Transactional({ propagation: Propagation.REQUIRES_NEW })
  async fireAndForget() {
    const now = dayjs().startOf('minute');
    const alarms = await this.alarmConfigRepository.findBy({
      status: AlarmStatus.PENDING,
      doneAt: LessThanOrEqual(now),
    });
    // # TODO: 각 등록자에게 어떻게 보낼지
    await Promise.all(
      alarms.map(async (alarm) => {
        const targetCommand = alarm.targetCommand;
        await this.warframeApiService.alarmTarget({
          target: targetCommand?.target,
          options: targetCommand?.options,
        });
      }),
    );

    return this.afterFire(alarms.map((alarm) => alarm.id));
  }

  async afterFire(alarmIds: string[]) {
    if (alarmIds.length === 0) return;

    const now = dayjs();
    const alarms = await this.alarmConfigRepository.findBy({
      id: In(alarmIds),
    });
    for (const alarm of alarms) {
      const next = alarm.doneAt.add(alarm.intervalValue, 'minute');
      alarm.doneAt = next.isAfter(now)
        ? next
        : now.add(alarm.intervalValue, 'minute');
    }
    await this.alarmConfigRepository.save(alarms);
  }
}
