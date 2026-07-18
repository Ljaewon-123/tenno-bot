import { EnumOption } from '@/utils/decorators/enum-option';
import { OmitType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { AlarmConfig } from '../entities/alarm-config.entity';
import { Timezone } from '../vo/enum';

export class CreateAlarmRequest extends OmitType(AlarmConfig, [
  'id',
  'status',
  'createdAt',
  'updatedAt',
] as const) {
  @EnumOption({
    enum: Timezone,
    name: 'timezone',
    description: 'Alarm timezone (default: guessed from your client language)',
    required: false,
  })
  @IsOptional()
  @IsEnum(Timezone)
  timezone: Timezone;
}
