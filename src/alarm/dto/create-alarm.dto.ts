import { IsDayjs } from '@/utils/entity/common.entity';
import { OmitType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { Dayjs } from 'dayjs';
import { AlarmConfig } from '../entities/alarm-config.entity';

export class CreateAlarm extends OmitType(AlarmConfig, [
  'id',
  'createdAt',
  'updatedAt',
  'status',
  'reschedule',
  'startedAt',
  'error',
  'doneAt',
]) {
  @IsDayjs()
  @IsOptional()
  doneAt?: Dayjs;
}
