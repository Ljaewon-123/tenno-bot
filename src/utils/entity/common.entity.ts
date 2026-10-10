import type { Dayjs } from '@/utils/dayjs.js';
import dayjs from '@/utils/dayjs.js';
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
  to: (value: Dayjs | null | undefined) => value?.toDate() ?? null,
  from: (value: string | Date | null) => (value ? dayjs(value) : null),
};

export const DateColumn = (options?: ColumnCommonOptions) => {
  return Column({
    ...options,
    type: 'timestamptz',
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
  @CreateDateColumn({ type: 'timestamptz', transformer: dayjsTransformer })
  createdAt: Dayjs = dayjs();

  @IsDayjs()
  @UpdateDateColumn({ type: 'timestamptz', transformer: dayjsTransformer })
  updatedAt: Dayjs = dayjs();
}

export abstract class CommonWithGuildChannel extends CommonEntity {
  @IsString()
  @Column()
  @Index()
  guildId: string;

  @IsOptional()
  @IsString()
  @Expose()
  @Index()
  @Column({ nullable: true, type: 'text' })
  channelId: string | null = null;
}
