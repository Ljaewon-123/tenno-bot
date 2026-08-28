import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Party } from './entities/party.entity';
import { PartyMessageService } from './party-message.service';
import { PartyService } from './party.service';
import { PartyRepository } from './repositories/party.repository';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Party])],
  providers: [PartyService, PartyMessageService, PartyRepository],
  exports: [PartyService, PartyMessageService],
})
export class PartyModule {}
