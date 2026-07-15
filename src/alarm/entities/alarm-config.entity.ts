import { CommonEntity } from '@/utils/entity/common.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class AlarmConfig extends CommonEntity {
  @Column()
  name: string;
}
