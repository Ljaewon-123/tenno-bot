import { EnumOption } from '@/utils/decorators/enum-option';
import { Expose } from 'class-transformer';
import { WatchTarget } from '../types';

export class NotificationCommand {
  @Expose()
  @EnumOption({
    enum: WatchTarget,
    name: 'event',
    description: 'Warframe event to notify about',
    required: true,
  })
  eventType: WatchTarget;
}
