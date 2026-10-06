import { AlarmModule } from '@/alarm/alarm.module';
import { FeedbackModule } from '@/feedback/feedback.module';
import { NotificationModule } from '@/notification/notification.module';
import { PartyModule } from '@/party/party.module';
import { WarframeApiModule } from '@/warframe-api/warframe-api.module';
import { Module } from '@nestjs/common';
import { AlarmCommandService } from './alarm-command.service';
import { NotificationCommandService } from './notification-command.service';
import { PartyCommandService } from './party-command.service';
import { DropItemAutocompleteInterceptor } from './interceptors/drop-item-autocomplete.interceptor';
import { IncarnonWeaponAutocompleteInterceptor } from './interceptors/incarnon-weapon-autocomplete.interceptor';
import { RelicAutocompleteInterceptor } from './interceptors/relic-autocomplete.interceptor';
import { ItemCommandService } from './item-command.service';
import { SlashCommandService } from './slash-command.service';
import { WorldStateCommandService } from './world-state-command.service';

@Module({
  imports: [
    WarframeApiModule,
    AlarmModule,
    NotificationModule,
    PartyModule,
    FeedbackModule,
  ],
  providers: [
    SlashCommandService,
    WorldStateCommandService,
    ItemCommandService,
    AlarmCommandService,
    NotificationCommandService,
    PartyCommandService,
    DropItemAutocompleteInterceptor,
    IncarnonWeaponAutocompleteInterceptor,
    RelicAutocompleteInterceptor,
  ],
})
export class SlashCommandModule {}
