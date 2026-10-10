import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Party } from './entities/party.entity.js';
import { PartyMessageService } from './party-message.service.js';
import { PartyService } from './party.service.js';
import { PartyRepository } from './repositories/party.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Party])],
  providers: [PartyService, PartyMessageService, PartyRepository],
  exports: [PartyService, PartyMessageService],
})
export class PartyModule {}
