import { EnumOption } from '@/utils/decorators/enum-option';
import { Timezone } from '@/utils/types';
import { TargetCommand } from '@/warframe-api/enum';
import { VoidTier } from '@/warframe-api/world-state/vo/enum';
import { IntegerOption, StringOption } from 'necord';

export class CreateAlarmCommand {
  @StringOption({
    name: 'name',
    description: 'Alarm name',
    required: true,
  })
  name: string;

  @StringOption({
    name: 'description',
    description: 'Alarm description',
    required: true,
  })
  description: string;

  @EnumOption({
    enum: TargetCommand,
    name: 'target',
    description: 'Warframe info to send',
    required: true,
  })
  target: TargetCommand;

  /** Yet only minutes */
  @IntegerOption({
    name: 'interval',
    description: 'Repeat interval in minutes',
    required: true,
    min_value: 1,
  })
  intervalValue: number;

  @EnumOption({
    enum: VoidTier,
    name: 'tier',
    description: 'Void fissure tier (void-fissures target only)',
  })
  options?: VoidTier;

  @EnumOption({
    enum: Timezone,
    name: 'timezone',
    description: 'Timezone (defaults to your locale)',
  })
  timezone?: Timezone;
}
