import { CommonEntity } from '@/utils/entity/common.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Cache extends CommonEntity {
  // pg로 올라가면 jsonb로 변경
  @Column({ type: 'simple-json' })
  cache: string;
}
