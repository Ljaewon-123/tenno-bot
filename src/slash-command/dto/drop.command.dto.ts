import { EnumOption } from '@/utils/decorators/enum-option';
import { DropCategory } from '@/warframe-api/drop-table/vo/enum';
import { Expose } from 'class-transformer';
import { StringOption } from 'necord';

export class DropCommand {
  @Expose()
  @StringOption({
    name: 'item',
    description: 'Get the drop sources of an item',
    required: true,
  })
  itemName: string;

  @Expose()
  @EnumOption({
    name: 'item',
    description: 'Get the drop sources of an item',
    required: false,
    enum: DropCategory,
  })
  category?: DropCategory;
}
