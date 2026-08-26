import { Module } from '@nestjs/common';
import { PartyService } from './party.service';
import { PartyRepository } from './repositories/party.repository';

@Module({
  imports: [],
  providers: [PartyService, PartyRepository],
  exports: [PartyService],
})
export class PartyModule {}
