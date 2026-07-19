import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpMethod } from '../shared/enum';
import { HttpJsonService } from '../shared/http-json.service';
import { CacheRepository } from './repositories/cache.repository';

// TDO: 캐싱 필요함 db가 먼저있어야 할듯?
@Injectable()
export class DropTableService {
  constructor(
    private readonly httpJsonService: HttpJsonService,
    private readonly cacheRepository: CacheRepository,
  ) {}

  // @Cron(CronExpression.EVERY_WEEK)
  @Cron(CronExpression.EVERY_10_SECONDS) // dev mode
  async getAllDropTables() {
    const all = await this.httpJsonService.request(
      HttpMethod.Get,
      'data/all.json',
    );
    const entity = this.cacheRepository.create({
      cache: JSON.stringify(all),
    });
    console.log(entity);
    return this.cacheRepository.save(entity);
  }

  /** 성유물 */
  // async relics() {
  //   return this.httpJsonService.request(HttpMethod.Get, 'relics');
  // }
}
