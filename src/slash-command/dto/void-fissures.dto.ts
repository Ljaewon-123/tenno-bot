import { EnumOption } from '@/utils/decorators/enum-option';
import { VoidTier } from '@/warframe-api/world-state/vo/enum';
import { Expose } from 'class-transformer';

export class VoidFissures {
  @Expose()
  @EnumOption({
    name: 'tier',
    description: 'Filter by relic tier',
    required: false,
    enum: VoidTier,
  })
  tier?: VoidTier;
}
