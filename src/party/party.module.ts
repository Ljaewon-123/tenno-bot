import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Party } from './entities/party.entity';
import { PartyMessageService } from './party-message.service';
import { PartyService } from './party.service';
import { PartyRepository } from './repositories/party.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Party])],
  providers: [PartyService, PartyMessageService, PartyRepository],
  exports: [PartyService, PartyMessageService],
})
export class PartyModule {}
