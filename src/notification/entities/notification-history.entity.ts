import { CommonEntity } from '@/utils/entity/common.entity';
import { IsEnum, IsString } from 'class-validator';
import { Column, Entity } from 'typeorm';
import { WatchTarget } from '../types';

/**
 * 발송 "실패"만 남긴다 — 성공까지 쌓으면 매 10분 도는 크론이 테이블을 로그로 만든다.
 * 실패 시각은 createdAt이고, 30일이 지나면 크론이 지운다.
 */
@Entity()
export class NotificationHistory extends CommonEntity {
  @IsEnum(WatchTarget)
  @Column({ type: 'text' })
  eventType: WatchTarget;

  @IsString()
  @Column({ type: 'text' })
  error: string;
}
