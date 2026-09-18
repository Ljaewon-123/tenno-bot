import { Expose } from 'class-transformer';
import { StringOption } from 'necord';

export class RelicCommand {
  @Expose()
  @StringOption({
    name: 'name',
    description: 'Show everything that drops from one relic',
    // 성유물이 773개라 손으로 칠 수 있는 목록이 아니다
    autocomplete: true,
    required: true,
  })
  relicName: string;
}
