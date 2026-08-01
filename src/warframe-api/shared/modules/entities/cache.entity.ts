import type { Dayjs } from '@/utils/dayjs';
import {
  CommonEntity,
  DateColumn,
  IsDayjs,
} from '@/utils/entity/common.entity';
import { IsEnum, IsOptional } from 'class-validator';
import { Column, Entity, Index } from 'typeorm';
import { CacheKey } from '../../enum';

@Entity()
export class Cache extends CommonEntity {
  // pg로 올라가면 jsonb로 변경
  @Column({ type: 'jsonb' })
  cache: unknown;

  @IsEnum(CacheKey)
  @Index()
  @Column({ type: 'text', unique: true })
  key: CacheKey;

  /** null이면 만료 없음 — 드랍테이블 해시나 커서처럼 직접 갱신하는 값 */
  @IsOptional()
  @IsDayjs()
  @DateColumn({ nullable: true })
  expiresAt: Dayjs | null = null;
}
