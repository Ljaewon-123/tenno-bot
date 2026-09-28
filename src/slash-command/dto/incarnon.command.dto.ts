import { Expose } from 'class-transformer';
import { StringOption } from 'necord';

export class IncarnonCommand {
  @Expose()
  @StringOption({
    name: 'weapon',
    description: 'Show evolutions and install cost for one Incarnon Genesis',
    autocomplete: true,
    required: false,
  })
  weapon?: string;
}
