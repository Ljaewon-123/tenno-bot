import { OmitType } from '@nestjs/mapped-types';
import { AlarmConfig } from '../entities/alarm-config.entity';

export class CreateAlarm extends OmitType(AlarmConfig, [
  'id',
  'createdAt',
  'updatedAt',
  'status',
  'reschedule',
  'startedAt',
  'error',
]) {}
