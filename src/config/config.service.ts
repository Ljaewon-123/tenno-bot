import { Expose, plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsString, validateSync } from 'class-validator';
import dotenv from 'dotenv';
import { NodeEnv } from './enum';

export class AppConfig {
  @Expose()
  @IsEnum(NodeEnv)
  nodeEnv: NodeEnv = NodeEnv.Development;

  @Expose()
  @IsString()
  DISCORD_APP_ID: string;

  @Expose()
  @IsString()
  DISCORD_TOKEN: string;

  @Expose()
  @IsString()
  DISCORD_PUBLIC_KEY: string;

  @Expose()
  @IsString()
  DISCORD_DEVELOPMENT_GUILD_ID: string;

  @Expose()
  @IsInt()
  PORT: number = 3000;
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
