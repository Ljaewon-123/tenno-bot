import dayjs from '@/utils/dayjs';
import { asPush, payload, relative } from '@/utils/discord-embed';
import {
  AlarmRequest,
  RemindTarget,
  TargetCommand,
  TargetCommandLabel,
} from '@/warframe-api/enum';
import {
  CycleLabel,
  CycleName,
  VoidTier,
} from '@/warframe-api/world-state/vo/enum';
import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Client, type ContainerBuilder } from 'discord.js';
import { FindOptionsWhere, In, IsNull, LessThanOrEqual, Not } from 'typeorm';
import { Propagation, Transactional } from 'typeorm-transactional';
import { CreateAlarm } from './dto/create-alarm.dto';
import { AlarmConfig } from './entities/alarm-config.entity';
import { AlarmConfigRepository } from './repositories/alarm-config.repository';
import { AlarmStatus } from './vo/enum';

/** 이 시간을 넘도록 RUNNING인 알람은 프로세스가 죽은 것으로 본다 */
const STALE_AFTER_MINUTES = 10;

/** 🔔 버튼이 거는 1회용 리마인더가 기준 시각 몇 분 전에 오는가 */
export const REMIND_LEAD_MINUTES = 30;

/**
 * 사이클만 리드가 짧다. 오브 협곡은 한 바퀴가 27분(따뜻함 ~7분 + 추움 20분)이라
 * 30분 전으로 잡으면 **모든 등록이 "이미 늦었다"로 거절된다**. 5분은 접속해서 이동할 만한 최소치.
 */
export const CYCLE_REMIND_LEAD_MINUTES = 5;

const leadFor = (target: RemindTarget) =>
  target === TargetCommand.Cycles
    ? CYCLE_REMIND_LEAD_MINUTES
    : REMIND_LEAD_MINUTES;

/**
 * 서버당 반복 알람 상한. 채널 단위로 걸면 채널을 더 파는 것으로 그냥 우회된다 —
 * 1분 크론이 매 분 전부 도는 비용을 지는 주체가 서버이므로 셈도 서버로 한다.
 * 1회용 리마인더는 개인 것이고 대상 enum이 유한해 세지 않는다.
 */
export const ALARM_LIMIT_PER_GUILD = 20;

export type RemindInput = {
  guildId: string;
  /** DM이 막혔을 때 떨굴 자리 */
  channelId: string | null;
  userId: string;
  target: RemindTarget;
  /** 사이클은 지역마다 따로 건다 — 대상 하나로는 무엇을 알릴지가 안 정해진다 */
  option?: CycleName;
};

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

  /**
   * 임베드 🔔 버튼 — 토글. 등록하면 발동 시각을, 이미 있으면 지우고 null을 준다.
   * 버튼은 유저별 상태를 못 보여주므로(같은 메시지의 버튼은 모두에게 같은 라벨이다)
   * 눌린 결과는 호출단이 ephemeral로 알려야 한다.
   */
  async remind({ guildId, channelId, userId, target, option }: RemindInput) {
    // 지역까지 넣어야 토글이 지역별로 갈린다 — 키가 같으면 시투스를 걸고 발리스를 누를 때 시투스가 지워진다
    const key = option ? `${target}:${option}` : target;
    // 사람마다 따로 잡힌다 — 같은 서버·같은 대상이어도 남의 것을 지우면 안 된다
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

    const lead = leadFor(target);
    const at = moment.subtract(lead, 'minute');
    // 등록하자마자 발동하는 리마인더는 알림이 아니라 소음이다
    if (!at.isAfter(dayjs()))
      throw new BadRequestException(
        `${TargetCommandLabel[target]} happens in under ${lead} minutes — too late to remind you.`,
      );

    const entity = this.alarmConfigRepository.create({
      guildId,
      channelId,
      userId,
      // 토글 키를 겸한다 — 화면에 찍히는 이름은 TargetCommandLabel이 만든다
      name: key,
      intervalValue: null,
      targetCommand: { target, options: option },
      doneAt: at,
    });
    await this.alarmConfigRepository.save(entity);
    return at;
  }

  /** 서버 알람만 — 1회용은 개인 리마인더지 서버가 관리할 물건이 아니다 */
  async popAlarm(guilidId: string) {
    const alarms = await this.alarmConfigRepository.findBy({
      guildId: guilidId,
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
      // jsonb에서 올라온 값이라 "이 대상엔 이 좁힘 값"이라는 짝은 타입이 못 좁힌다 —
      // 값 자체는 엔티티의 class-validator가 지킨다
      const view = await this.warframeApiService.getAlarmTarget(
        alarm.targetCommand as AlarmRequest,
      );

      // 사용자가 부른 게 아니다 — 왜 이게 왔는지를 밝히지 않으면 조회 결과와 구분되지 않는다
      await this.deliver(alarm, asPush(view, ...this.pushLines(alarm)));

      return this.afterFire(alarm);
    } catch (error) {
      // 실패해도 다음 주기에 재시도 — 마지막 실패만 기록
      alarm.fail(error);
      await this.afterFire(alarm);
    }
  }

  /** 1회용 리마인더의 주어 — 대상마다 곧 일어나는 일이 다르다(만료 / 전환 / 도착) */
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

  /**
   * 반복 알람은 "언제마다 오는지", 1회용은 "누구 것이고 뭐가 곧 끝나는지"를 밝혀야 한다.
   * 세 번째는 잘렸을 때 전체를 볼 경로 — enum 값이 그대로 슬래시 커맨드 이름이다.
   */
  private pushLines(alarm: AlarmConfig): [string, string, string] {
    const { target, options } = alarm.targetCommand;
    const path = `/${target}`;
    if (!alarm.intervalValue)
      return [
        // DM이 막혀 채널로 떨어져도 누구 것인지 알려면 멘션이 본문에 있어야 한다 —
        // ComponentsV2 메시지는 content를 못 써서 멘션 자리가 여기뿐이다
        `🔔 Reminder · <@${alarm.userId}> · ${this.remindSubject(target, options)} ${relative(
          alarm.doneAt.add(leadFor(target as RemindTarget), 'minute'),
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

  /**
   * 1회용은 누른 사람에게 DM — 개인 리마인더를 공용 채널에 쌓지 않는다.
   * DM 차단(50007)이면 등록한 채널로 떨군다. 조용히 사라지는 게 최악이다.
   */
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
    // 1회용은 다시 쓸 일이 없다 — 남기면 크론이 1분마다 영원히 훑는다(실패했어도 마찬가지다)
    if (!alarm.intervalValue) {
      await this.alarmConfigRepository.delete({ id: alarm.id });
      return;
    }
    alarm.reschedule();
    await this.alarmConfigRepository.save(alarm);
  }
}
