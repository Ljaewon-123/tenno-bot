import { AlarmModule } from '@/alarm/alarm.module.js';
import { AppConfig } from '@/config/config.service.js';
import { DatabaseConfig } from '@/config/database.config.js';
import { NodeEnv } from '@/config/enum.js';
import { NotificationModule } from '@/notification/notification.module.js';
import { PartyModule } from '@/party/party.module.js';
import { SlashCommandModule } from '@/slash-command/slash-command.module.js';
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
import { ConfigModule } from '../config/config.module.js';
import { AppController } from './app.controller.js';
import { BotLifecycleHook } from './bot-lifecycle.hook.js';
import { CommandExceptionFilter } from './command-exception.filter.js';
import { CommandLoggingInterceptor } from './command-logging.interceptor.js';
import { HttpLoggingInterceptor } from './http-logging.interceptor.js';
import { TopggStatsService } from './topgg-stats.service.js';

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
        // 이름·검색어·위키 텍스트가 본문에 그대로 실린다 — 유저 멘션까지 열면 알람 이름의 <@id>로 특정 유저를 무한히 핑할 수 있다.
        // 핑이 본업인 파티 Full·리마인더만 메시지마다 users를 지정해 연다
        allowedMentions: { parse: [] },
        development:
          config.nodeEnv !== NodeEnv.Production &&
          config.DISCORD_DEVELOPMENT_GUILD_ID
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
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    BotLifecycleHook,
    TopggStatsService,
  ],
})
export class AppModule {}
