import { CommonWithGuild } from '@/utils/entity/common.entity';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Column, Entity } from 'typeorm';

@Entity()
export class AlarmConfig extends CommonWithGuild {
  @IsString()
  @Column()
  name: string;

  @IsString()
  @Column()
  description: string;

  @IsInt()
  @Column()
  interval: number;

  @IsString()
  @IsOptional()
  @Column({ type: 'text', nullable: true })
  targetCommand?: string;
}
