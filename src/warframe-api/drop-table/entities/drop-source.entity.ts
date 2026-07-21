import { CommonEntity } from '@/utils/entity/common.entity';
import { IsEnum, IsNumber, IsObject, IsString } from 'class-validator';
import { Column, Entity, Index } from 'typeorm';
import { DropCategory } from '../vo/enum';

@Entity()
export class DropSource extends CommonEntity {
  @IsString()
  @Index()
  @Column()
  itemName: string;

  @IsEnum(DropCategory)
  @Column()
  category: DropCategory;

  @IsString()
  @Column()
  sourceName: string;

  /** 드랍 확률 %, 소수점 있음 (예: 11.06) */
  @IsNumber()
  @Column('real')
  chance: number;

  @IsObject()
  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;
}
