import { WarframeApiModule } from '@/warframe-api/warframe-api.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlarmService } from './alarm.service';
import { AlarmConfig } from './entities/alarm-config.entity';
import { AlarmConfigRepository } from './repositories/alarm-config.repository';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([AlarmConfig]),
    WarframeApiModule,
  ],
  providers: [AlarmService, AlarmConfigRepository],
  exports: [AlarmService, AlarmConfigRepository],
})
export class AlarmModule {}
