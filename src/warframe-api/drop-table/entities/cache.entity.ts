import { CommonEntity } from '@/utils/entity/common.entity';
import { IsEnum } from 'class-validator';
import { Column, Entity, Index } from 'typeorm';
import { CacheKey } from '../vo/enum';

@Entity()
export class Cache extends CommonEntity {
  // pg로 올라가면 jsonb로 변경
  @Column({ type: 'simple-json' })
  cache: string;

  @IsEnum(CacheKey)
  @Index()
  @Column({ type: 'text', unique: true })
  key: CacheKey;
}
