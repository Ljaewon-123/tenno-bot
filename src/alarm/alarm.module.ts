import { WarframeApiModule } from '@/warframe-api/warframe-api.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlarmService } from './alarm.service';
import { AlarmConfig } from './entities/alarm-config.entity';
import { AlarmConfigRepository } from './repositories/alarm-config.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AlarmConfig]), WarframeApiModule],
  providers: [AlarmService, AlarmConfigRepository],
  exports: [AlarmService],
})
export class AlarmModule {}
