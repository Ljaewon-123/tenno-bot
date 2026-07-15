import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AlarmConfig } from '../entities/alarm-config.entity';

@Injectable()
export class PostRepository extends Repository<AlarmConfig> {
  constructor(private readonly dataSource: DataSource) {
    super(AlarmConfig, dataSource.createEntityManager());
  }
}
