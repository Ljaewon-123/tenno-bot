import { CommonEntity } from '@/utils/entity/common.entity';
import { IsInt, IsObject, IsString } from 'class-validator';
import { Column, Entity } from 'typeorm';

@Entity()
export class DropSource extends CommonEntity {
  @IsString()
  @Column()
  itemName: string;

  // mission, relic, bounty, enemy, sortie, avatar, etc..
  @IsString()
  @Column()
  category: string;

  @IsString()
  @Column()
  sourceName: string;

  @IsInt()
  @Column()
  chance: number;

  @IsObject()
  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;
}
