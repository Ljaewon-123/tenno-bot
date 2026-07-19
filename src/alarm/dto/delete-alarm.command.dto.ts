import { Expose } from 'class-transformer';
import { StringOption } from 'necord';

export class DeleteAlarmCommand {
  @Expose()
  @StringOption({
    name: 'id',
    description: 'Alarm id to delete',
    required: true,
  })
  id: string;
}
