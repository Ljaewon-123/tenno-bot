import { EnumOption } from '@/utils/decorators/enum-option.js';
import { VoidTier } from '@/warframe-api/world-state/vo/enum.js';
import { Expose } from 'class-transformer';
import { BooleanOption } from 'necord';

export class VoidFissuresCommand {
  @Expose()
  @EnumOption({
    name: 'tier',
    description: 'Filter by relic tier',
    required: false,
    enum: VoidTier,
  })
  tier?: VoidTier;

  @Expose()
  @BooleanOption({
    name: 'steel-path',
    description: 'Only Steel Path fissures',
    required: false,
  })
  steelPath?: boolean;
}
