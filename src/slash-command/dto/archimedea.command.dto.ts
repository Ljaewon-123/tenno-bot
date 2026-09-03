import {
  ArchimedeaLabel,
  ArchimedeaType,
} from '@/warframe-api/world-state/vo/enum';
import { Expose } from 'class-transformer';
import { StringOption } from 'necord';

export class ArchimedeaCommand {
  @Expose()
  // EnumOption을 안 쓰는 이유: choices 이름이 API 키(CT_LAB)라 유저가 못 알아본다
  @StringOption({
    name: 'type',
    description: 'Filter by Archimedea type',
    required: false,
    choices: Object.entries(ArchimedeaLabel).map(([value, name]) => ({
      name,
      value,
    })),
  })
  type?: ArchimedeaType;
}
