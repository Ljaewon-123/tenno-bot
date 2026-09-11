import { Expose } from 'class-transformer';
import { StringOption } from 'necord';

export class IncarnonCommand {
  @Expose()
  @StringOption({
    name: 'weapon',
    description: 'Show evolutions and install cost for one Incarnon Genesis',
    autocomplete: true,
    // 비우면 이번 주 서킷 로테이션이 그대로 나온다
    required: false,
  })
  weapon?: string;
}
