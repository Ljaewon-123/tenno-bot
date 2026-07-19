import type { Dayjs } from '@/utils/dayjs';
import dayjs from '@/utils/dayjs';
import { Expose } from 'class-transformer';
import {
  IsOptional,
  IsString,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';
import { ColumnCommonOptions } from 'typeorm/decorator/options/ColumnCommonOptions.js';
import { ulid } from 'ulid';

const dayjsTransformer: ValueTransformer = {
  to: (value: Dayjs | null | undefined) => value?.toISOString() ?? null,
  from: (value: string | null) => (value ? dayjs(value) : null),
};

export const DateColumn = (options?: ColumnCommonOptions) => {
  return Column({
    ...options,
    type: 'text',
    transformer: dayjsTransformer,
  });
};

export const IsDayjs = (options?: ValidationOptions) =>
  ValidateBy(
    {
      name: 'isDayjs',
      validator: {
        validate: (value) => dayjs.isDayjs(value) && value.isValid(),
        defaultMessage: () => '$property must be a valid Dayjs object',
      },
    },
    options,
  );

export abstract class CommonEntity {
  @IsString()
  @PrimaryColumn()
  id: string = ulid();

  @IsDayjs()
  @CreateDateColumn({ type: 'text', transformer: dayjsTransformer })
  createdAt: Dayjs;

  @IsDayjs()
  @UpdateDateColumn({ type: 'text', transformer: dayjsTransformer })
  updatedAt: Dayjs;
}

export abstract class CommonWithGuildChannel extends CommonEntity {
  @IsString()
  @Column()
  @Index()
  guildId: string;

  /** 알람을 등록한 채널 — 발동 시 이 채널로 전송 */
  @IsOptional()
  @IsString()
  @Expose()
  @Index()
  @Column({ nullable: true, type: 'text' })
  channelId: string | null = null;
}
