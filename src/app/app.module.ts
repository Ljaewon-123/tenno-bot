import { AppConfig } from '@/config/config.service';
import { Module } from '@nestjs/common';
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
        development: [config.DISCORD_DEVELOPMENT_GUILD_ID],
      }),
    }),
  ],
})
export class AppModule {}
