import { CommonWithGuildChannel } from '@/utils/entity/common.entity';
import { IsEnum, IsNumber, Max, Min } from 'class-validator';
import { Column, Entity } from 'typeorm';
import { PartyStatus } from '../vo/enum';

// user테이블이 따로 없어서 별도로 묶어줘야함
@Entity()
// @Index(['guildId', 'hostUserId'], { unique: true, where: `status = 'OPEN'` })
export class Party extends CommonWithGuildChannel {
  @Column()
  hostUserId: string;

  @Column()
  name: string;

  @Min(1)
  @Max(4)
  @Column()
  partySize: number;

  @IsNumber()
  @Column()
  members: string[];

  @IsEnum(PartyStatus)
  @Column({ default: PartyStatus.OPEN })
  status: PartyStatus = PartyStatus.OPEN;

  @Column()
  mission: string;
}
