import { WarframeApiModule } from '@/warframe-api/warframe-api.module.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlarmService } from './alarm.service.js';
import { AlarmConfig } from './entities/alarm-config.entity.js';
import { AlarmConfigRepository } from './repositories/alarm-config.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([AlarmConfig]), WarframeApiModule],
  providers: [AlarmService, AlarmConfigRepository],
  exports: [AlarmService],
})
export class AlarmModule {}
