import { Expose } from 'class-transformer';
import { IntegerOption, StringOption } from 'necord';

export class CreatePartyCommand {
  @Expose()
  @StringOption({
    name: 'name',
    description: 'Party name',
    required: true,
  })
  name: string;

  @Expose()
  @StringOption({
    name: 'mission',
    description: 'Mission to run',
    required: true,
  })
  mission: string;

  @Expose()
  @IntegerOption({
    name: 'size',
    description: 'Party size (default 4)',
    min_value: 2,
    max_value: 4,
  })
  size?: number;
}
