import { CommonEntity } from '@/utils/entity/common.entity';
import { IsEnum } from 'class-validator';
import { Column, Entity, Index } from 'typeorm';
import { CacheKey } from '../../../drop-table/vo/enum';

@Entity()
export class Cache extends CommonEntity {
  // pg로 올라가면 jsonb로 변경
  @Column({ type: 'jsonb' })
  cache: unknown;

  @IsEnum(CacheKey)
  @Index()
  @Column({ type: 'text', unique: true })
  key: CacheKey;
}
