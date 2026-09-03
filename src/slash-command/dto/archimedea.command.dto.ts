import { EnumOption } from '@/utils/decorators/enum-option';
import { ArchimedeaType } from '@/warframe-api/world-state/vo/enum';
import { Expose } from 'class-transformer';

export class ArchimedeaCommand {
  @Expose()
  @EnumOption({
    name: 'type',
    description: 'Filter by Archimedea type',
    required: false,
    enum: ArchimedeaType,
  })
  type?: ArchimedeaType;
}
