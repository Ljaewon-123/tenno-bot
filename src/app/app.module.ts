import { AlarmModule } from '@/alarm/alarm.module';
import { AppConfig } from '@/config/config.service';
import { DatabaseConfig } from '@/config/database.config';
import { NodeEnv } from '@/config/enum';
import { NotificationModule } from '@/notification/notification.module';
import { PartyModule } from '@/party/party.module';
import { SlashCommandModule } from '@/slash-command/slash-command.module';
import {
  Module,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
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
import { AppController } from './app.controller';
import { BotLifecycleHook } from './bot-lifecycle.hook';
import { CommandExceptionFilter } from './command-exception.filter';
import { CommandLoggingInterceptor } from './command-logging.interceptor';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule,
    // forRoot는 루트에서 한 번만 — 모듈마다 부르면 크론이 중복 등록돼 두 번 발송된다
    ScheduleModule.forRoot(),
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
      inject: [DatabaseConfig],
      useFactory: (config: DatabaseConfig) => ({
        ...config.pgOptions,
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
    AlarmModule,
    NotificationModule,
    PartyModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
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
    {
      provide: APP_FILTER,
      useClass: CommandExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CommandLoggingInterceptor,
    },
    BotLifecycleHook,
  ],
})
export class AppModule {}
