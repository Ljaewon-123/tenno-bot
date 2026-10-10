import { CommonEntity } from '@/utils/entity/common.entity.js';
import { IsEnum, IsString } from 'class-validator';
import { Column, Entity } from 'typeorm';
import { WatchTarget } from '../types.js';

/** 발송 실패만 남긴다 — 성공까지 쌓으면 10분 크론이 테이블을 로그로 만든다 */
@Entity()
export class NotificationHistory extends CommonEntity {
  @IsEnum(WatchTarget)
  @Column({ type: 'text' })
  eventType: WatchTarget;

  @IsString()
  @Column({ type: 'text' })
  error: string;
}
