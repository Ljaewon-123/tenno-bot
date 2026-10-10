import { AlarmModule } from '@/alarm/alarm.module.js';
import { FeedbackModule } from '@/feedback/feedback.module.js';
import { NotificationModule } from '@/notification/notification.module.js';
import { PartyModule } from '@/party/party.module.js';
import { WarframeApiModule } from '@/warframe-api/warframe-api.module.js';
import { Module } from '@nestjs/common';
import { AlarmCommandService } from './alarm-command.service.js';
import { NotificationCommandService } from './notification-command.service.js';
import { PartyCommandService } from './party-command.service.js';
import { DropItemAutocompleteInterceptor } from './interceptors/drop-item-autocomplete.interceptor.js';
import { IncarnonWeaponAutocompleteInterceptor } from './interceptors/incarnon-weapon-autocomplete.interceptor.js';
import { RelicAutocompleteInterceptor } from './interceptors/relic-autocomplete.interceptor.js';
import { ItemCommandService } from './item-command.service.js';
import { SlashCommandService } from './slash-command.service.js';
import { WorldStateCommandService } from './world-state-command.service.js';

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
