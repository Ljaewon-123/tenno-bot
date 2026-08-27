import { CommonWithGuildChannel } from '@/utils/entity/common.entity';
import {
  ArrayMaxSize,
  IsEnum,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Column, Entity, Index } from 'typeorm';
import { PartyStatus } from '../vo/enum';

// user테이블이 따로 없어서 별도로 묶어줘야함
@Entity()
// 1인 1파티 — 앱 체크만 두면 더블클릭에 뚫린다. 마감된 파티는 재모집을 막지 않도록 부분 인덱스
@Index(['guildId', 'hostUserId'], {
  unique: true,
  where: `status = '${PartyStatus.OPEN}'`,
})
export class Party extends CommonWithGuildChannel {
  @IsString()
  @Column()
  hostUserId: string;

  @IsString()
  @Column()
  name: string;

  @Min(2)
  @Max(4)
  @Column({ default: 4 })
  partySize: number = 4;

  @ArrayMaxSize(4)
  @IsString({ each: true })
  @Column('text', { array: true })
  members: string[] = [];

  @IsEnum(PartyStatus)
  @Column({ default: PartyStatus.OPEN })
  status: PartyStatus = PartyStatus.OPEN;

  @IsString()
  @Column()
  mission: string;

  /** 모집 메시지 — 버튼/만료 크론이 이 메시지를 다시 렌더한다 */
  @IsOptional()
  @IsString()
  @Column({ nullable: true, type: 'text' })
  messageId: string | null = null;
}
