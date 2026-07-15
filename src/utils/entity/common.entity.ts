import { IsDate, IsString } from 'class-validator';
import dayjs, { Dayjs } from 'dayjs';
import {
  Column,
  CreateDateColumn,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';
import { ulid } from 'ulid';

const dayjsTransformer: ValueTransformer = {
  to: (value: Dayjs) => value.toISOString(),
  from: (value: string) => dayjs(value),
};

export class CommonEntity {
  @IsString()
  @PrimaryColumn()
  id: string = ulid();

  @IsDate()
  @CreateDateColumn({ type: 'text', transformer: dayjsTransformer })
  createdAt: Dayjs;

  @IsDate()
  @UpdateDateColumn({ type: 'text', transformer: dayjsTransformer })
  updatedAt: Dayjs;
}

export class CommonWithGuild extends CommonEntity {
  @IsString()
  @Column({ unique: true })
  @Index()
  guildId: string;
}
