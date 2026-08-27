import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Party } from './entities/party.entity';
import { PartyService } from './party.service';
import { PartyRepository } from './repositories/party.repository';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Party])],
  providers: [PartyService, PartyRepository],
  exports: [PartyService],
})
export class PartyModule {}
