import { AppConfig } from '@/config/config.service';
import { NodeEnv } from '@/config/enum';
import { SlashCommandModule } from '@/slash-command/slash-command.module';
import { UserContextModule } from '@/user-context/user-context.module';
import {
  InternalServerErrorException,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { IntentsBitField } from 'discord.js';
import { NecordModule } from 'necord';
import { ConfigModule } from '../config/config.module';

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
    SlashCommandModule,
    UserContextModule,
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
          return new InternalServerErrorException(errors);
        },
      }),
    },
  ],
})
export class AppModule {}
