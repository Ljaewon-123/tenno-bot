import { IsDayjs } from '@/utils/entity/common.entity.js';
import { OmitType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import type { Dayjs } from '@/utils/dayjs.js';
import { AlarmConfig } from '../entities/alarm-config.entity.js';

export class CreateAlarm extends OmitType(AlarmConfig, [
  'id',
  'createdAt',
  'updatedAt',
  'status',
  'reschedule',
  'startedAt',
  'error',
  'fail',
  'failedAt',
  'doneAt',
]) {
  @IsDayjs()
  @IsOptional()
  doneAt?: Dayjs;
}
