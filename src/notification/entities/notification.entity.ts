import { CommonWithGuildChannel } from '@/utils/entity/common.entity';
import { IsEnum } from 'class-validator';
import { Column, Entity, Unique } from 'typeorm';
import { WatchTarget } from '../types';

@Entity()
@Unique(['guildId', 'eventType'])
export class Notification extends CommonWithGuildChannel {
  @IsEnum(WatchTarget)
  @Column({ type: 'text' })
  eventType: WatchTarget;
}
