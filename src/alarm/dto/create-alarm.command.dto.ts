import { EnumOption } from '@/utils/decorators/enum-option';
import { Timezone } from '@/utils/types';
import { TargetCommand } from '@/warframe-api/enum';
import { VoidTier } from '@/warframe-api/world-state/vo/enum';
import { Expose } from 'class-transformer';
import { IntegerOption, StringOption } from 'necord';

export class CreateAlarmCommand {
  @Expose()
  @StringOption({
    name: 'name',
    description: 'Alarm name',
    required: true,
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

  /** Yet only minutes */
  @Expose()
  @IntegerOption({
    name: 'interval',
    description: 'Repeat interval in minutes',
    required: true,
    min_value: 1,
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
  })
  description?: string;
}
