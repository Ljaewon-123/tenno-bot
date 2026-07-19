import { AlarmModule } from '@/alarm/alarm.module';
import { AppConfig } from '@/config/config.service';
import { NodeEnv } from '@/config/enum';
import { SlashCommandModule } from '@/slash-command/slash-command.module';
import { UserContextModule } from '@/user-context/user-context.module';
import {
  Module,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntentsBitField } from 'discord.js';
import { NecordModule } from 'necord';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import {
  addTransactionalDataSource,
  getDataSourceByName,
} from 'typeorm-transactional';
import { ConfigModule } from '../config/config.module';
import { BotLifecycleHook } from './bot-lifecycle.hook';

@Module({
  imports: [
    ConfigModule,
    NecordModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        token: config.DISCORD_TOKEN,
        intents: [IntentsBitField.Flags.Guilds],
        development:
          config.nodeEnv !== NodeEnv.Production
            ? [config.DISCORD_DEVELOPMENT_GUILD_ID]
            : undefined,
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [AppConfig],
      useFactory: () => ({
        type: 'better-sqlite3',
        database: 'db.sqlite',
        synchronize: true,
        autoLoadEntities: true,
        namingStrategy: new SnakeNamingStrategy(),
      }),
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('TypeORM options are required');
        }
        // 연결 실패 재시도 시 factory가 다시 호출되므로 중복 등록을 피한다
        return (
          getDataSourceByName('default') ??
          addTransactionalDataSource(new DataSource(options))
        );
      },
    }),
    SlashCommandModule,
    UserContextModule,
    AlarmModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        validateCustomDecorators: true,
        whitelist: true,
        transform: true,
        transformOptions: {
          exposeDefaultValues: true,
          excludeExtraneousValues: true,
        },
        exceptionFactory(errors) {
          return new UnprocessableEntityException(errors);
        },
      }),
    },
    BotLifecycleHook,
  ],
})
export class AppModule {}
