import { EnumOption } from '@/utils/decorators/enum-option';
import { VoidTier } from '@/warframe-api/world-state/vo/enum';
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

  /** `Steel Path only` 버튼과 같은 필터다 — 커맨드에도 있어야 접힌 줄이 가리키는 경로가 필터를 안 잃는다 */
  @Expose()
  @BooleanOption({
    name: 'steel-path',
    description: 'Only Steel Path fissures',
    required: false,
  })
  steelPath?: boolean;
}
