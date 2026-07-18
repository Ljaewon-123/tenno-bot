import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { In, LessThanOrEqual } from 'typeorm';
import { Propagation, Transactional } from 'typeorm-transactional';
import { CreateAlarmRequest } from './dto/create-alarm.request.dto';
import { AlarmConfig } from './entities/alarm-config.entity';
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
    const alarms = await this.fireAndForget();
    alarms.forEach((alarm) => {
      void this.run(alarm);
    });
  }

  async register(request: CreateAlarmRequest) {
    return this.alarmConfigRepository.save(request);
  }

  async unRegister(id: string) {
    return this.alarmConfigRepository.delete(id);
  }

  async fireAndForget() {
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
    // # TODO: 각 등록자에게 어떻게 보낼지
    try {
      const targetCommand = alarm.targetCommand;
      await this.warframeApiService.alarmTarget({
        target: targetCommand.target,
        options: targetCommand.options,
      });

      return this.afterFire(alarm);
    } catch (error) {
      alarm.error = JSON.stringify(error, Object.getOwnPropertyNames(error));
      alarm.status = AlarmStatus.FAILED;
      await this.alarmConfigRepository.save(alarm);
    }
  }

  async afterFire(alarm: AlarmConfig) {
    alarm.setAsDone();
    await this.alarmConfigRepository.save(alarm);
  }
}
