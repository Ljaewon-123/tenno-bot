import { Expose, plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';
import dotenv from 'dotenv';
import { NodeEnv } from './enum.js';

export class AppConfig {
  @Expose({ name: 'NODE_ENV' })
  @IsEnum(NodeEnv)
  nodeEnv: NodeEnv = NodeEnv.Development;

  @Expose()
  @IsString()
  DISCORD_TOKEN: string;

  /** dev에서 커맨드를 이 길드에만 즉시 등록한다. 프로덕션은 전역 등록이라 안 읽는다 */
  @Expose()
  @IsOptional()
  @IsString()
  DISCORD_DEVELOPMENT_GUILD_ID?: string;

  @Expose()
  @IsInt()
  PORT: number = 3000;

  @Expose()
  @IsString()
  PG_DATABASE_URL: string;

  @Expose()
  @IsOptional()
  @IsString()
  PG_CA_CERT?: string;

  @Expose()
  @IsString()
  @IsOptional()
  DEV_DB?: string;

  @Expose()
  @IsOptional()
  @IsString()
  TOPGG_TOKEN?: string;

  /** 서포트 서버 피드백 채널 웹훅. 비워 두면 /feedback이 서포트 서버로 안내한다 */
  @Expose()
  @IsOptional()
  @IsString()
  FEEDBACK_WEBHOOK_URL?: string;
}

export function loadConfig(): AppConfig {
  dotenv.config();

  const config = plainToInstance(AppConfig, process.env, {
    enableImplicitConversion: true,
    excludeExtraneousValues: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(config, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('\n');
    throw new Error(`Env loaded failed:\n${messages}`);
  }

  return config;
}
