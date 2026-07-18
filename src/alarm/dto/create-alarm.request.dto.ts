import { OmitType } from '@nestjs/mapped-types';
import { AlarmConfig } from '../entities/alarm-config.entity';

export class CreateAlarmRequest extends OmitType(AlarmConfig, [
  'id',
  'status',
  'createdAt',
  'updatedAt',
] as const) {}
