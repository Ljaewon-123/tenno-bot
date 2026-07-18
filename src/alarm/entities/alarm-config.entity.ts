import {
  CommonWithGuild,
  DateColumn,
  IsDayjs,
} from '@/utils/entity/common.entity';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, ValidateNested } from 'class-validator';
import dayjs from 'dayjs';
import { Column, Entity } from 'typeorm';
import { AlarmStatus } from '../vo/enum';
import { TargetCommandAlarm } from '../vo/target-command.vo';

@Entity()
export class AlarmConfig extends CommonWithGuild {
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

  @ValidateNested()
  @Type(() => TargetCommandAlarm)
  @Expose()
  @Column({ type: 'simple-json' })
  targetCommand: TargetCommandAlarm;

  @IsDayjs()
  @Expose()
  @DateColumn()
  startedAt: dayjs.Dayjs = dayjs();

  @IsDayjs()
  @Expose()
  @DateColumn()
  doneAt: dayjs.Dayjs = dayjs();
}
