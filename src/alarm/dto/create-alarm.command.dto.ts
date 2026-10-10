import { EnumOption } from '@/utils/decorators/enum-option.js';
import { Timezone } from '@/utils/types.js';
import { TargetCommand } from '@/warframe-api/enum.js';
import { VoidTier } from '@/warframe-api/world-state/vo/enum.js';
import { Expose } from 'class-transformer';
import { IntegerOption, StringOption } from 'necord';
import {
  ALARM_MAX_INTERVAL_MINUTES,
  ALARM_MIN_INTERVAL_MINUTES,
} from '../constants.js';

export class CreateAlarmCommand {
  @Expose()
  @StringOption({
    name: 'name',
    description: 'Alarm name',
    required: true,
    max_length: 100,
  })
  name: string;

  @Expose()
  @EnumOption({
    enum: TargetCommand,
    name: 'target',
    description: 'Warframe info to send',
    required: true,
  })
  target: TargetCommand;

  @Expose()
  @IntegerOption({
    name: 'interval-minutes',
    description: 'Repeat interval in minutes',
    required: true,
    min_value: ALARM_MIN_INTERVAL_MINUTES,
    max_value: ALARM_MAX_INTERVAL_MINUTES,
  })
  intervalValue: number;

  @Expose()
  @EnumOption({
    enum: VoidTier,
    name: 'tier',
    description: 'Void fissure tier (void-fissures target only)',
  })
  options?: VoidTier;

  @Expose()
  @EnumOption({
    enum: Timezone,
    name: 'timezone',
    description: 'Timezone (defaults to your locale)',
  })
  timezone?: Timezone;

  @Expose()
  @StringOption({
    name: 'description',
    description: 'Alarm description',
    required: false,
    max_length: 200,
  })
  description?: string;
}
