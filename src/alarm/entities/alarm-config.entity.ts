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
import { Column, Entity } from 'typeorm';
import { AlarmStatus } from '../vo/enum';
import { TargetCommandAlarm } from '../vo/target-command.vo';

@Entity()
export class AlarmConfig extends CommonWithGuildChannel {
  @IsString()
  @Expose()
  @Column()
  name: string;

  @IsString()
  @Expose()
  @Column()
  description: string;

  /** Yet only minutes */
  @IsInt()
  @Expose()
  @Column()
  intervalValue: number;

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
  @Column({ type: 'simple-json' })
  targetCommand: TargetCommandAlarm;

  @IsDayjs()
  @DateColumn()
  startedAt: Dayjs = dayjs();

  @IsDayjs()
  @DateColumn()
  doneAt: Dayjs = dayjs();

  @IsOptional()
  @Column({ nullable: true })
  error: string | null = null;

  /** 다음 발동 시각으로 밀고 다시 대기 상태로 */
  reschedule() {
    const now = dayjs();
    const next = this.doneAt.add(this.intervalValue, 'minute');
    this.status = AlarmStatus.PENDING;
    this.doneAt = next.isAfter(now)
      ? next
      : now.add(this.intervalValue, 'minute');
  }
}
