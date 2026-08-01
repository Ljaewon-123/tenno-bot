import { CommonWithGuildChannel } from '@/utils/entity/common.entity';
import { TargetCommand } from '@/warframe-api/enum';
import { IsEnum } from 'class-validator';
import { Column, Entity, Unique } from 'typeorm';

@Entity()
@Unique(['guildId', 'eventType'])
export class Notification extends CommonWithGuildChannel {
  @IsEnum(TargetCommand)
  @Column({ type: 'text' })
  eventType: TargetCommand;
}
