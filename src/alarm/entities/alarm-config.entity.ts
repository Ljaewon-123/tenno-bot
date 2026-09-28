import type { Dayjs } from '@/utils/dayjs';
import dayjs from '@/utils/dayjs';
import {
  CommonWithGuildChannel,
  DateColumn,
  IsDayjs,
} from '@/utils/entity/common.entity';
import { Timezone } from '@/utils/types';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Column, Entity, Index } from 'typeorm';
import { AlarmStatus } from '../vo/enum';
import { TargetCommandAlarm } from '../vo/target-command.vo';

@Entity()
@Index(['guildId', 'userId', 'name'], {
  unique: true,
  where: 'user_id IS NOT NULL',
})
export class AlarmConfig extends CommonWithGuildChannel {
  @IsString()
  @Expose()
  @Column()
  name: string;

  @IsString()
  @Expose()
  @IsOptional()
  @Column({ nullable: true, type: 'text' })
  description?: string;

  /** 반복 주기(분). null이면 🔔 1회용 리마인더 — 발송처·발동 후 처리·목록 노출이 이 값 하나로 갈린다 */
  @IsInt()
  @IsOptional()
  @Expose()
  @Column({ nullable: true, type: 'int' })
  intervalValue?: number | null;

  /** 1회용 리마인더를 건 사람 — DM 대상이자 토글 키. 반복 알람에는 없다 */
  @IsString()
  @IsOptional()
  @Expose()
  @Index()
  @Column({ nullable: true, type: 'text' })
  userId?: string | null;

  @Column()
  @Expose()
  @IsEnum(AlarmStatus)
  status: AlarmStatus = AlarmStatus.PENDING;

  @IsEnum(Timezone)
  @Expose()
  @Column({ default: Timezone.KST })
  timezone: Timezone = Timezone.KST;

  @ValidateNested()
  @Type(() => TargetCommandAlarm)
  @Expose()
  @Column({ type: 'jsonb' })
  targetCommand: TargetCommandAlarm;

  @IsDayjs()
  @DateColumn()
  startedAt: Dayjs = dayjs();

  @IsDayjs()
  @DateColumn()
  doneAt: Dayjs = dayjs();

  @IsOptional()
  @Column({ type: 'text', nullable: true })
  error?: string | null = null;

  @IsOptional()
  @IsDayjs()
  @DateColumn({ nullable: true })
  failedAt?: Dayjs | null = null;

  /** 성공해도 지우지 않는다 — "마지막으로 언제 깨졌나"가 남아야 간헐적 API 실패를 판별할 수 있다 */
  fail(error: unknown) {
    this.error = JSON.stringify(
      error,
      error instanceof Object ? Object.getOwnPropertyNames(error) : undefined,
    );
    this.failedAt = dayjs();
  }

  reschedule() {
    const now = dayjs();
    const interval = this.intervalValue ?? 0;
    const next = this.doneAt.add(interval, 'minute');
    this.status = AlarmStatus.PENDING;
    this.doneAt = next.isAfter(now) ? next : now.add(interval, 'minute');
  }
}
