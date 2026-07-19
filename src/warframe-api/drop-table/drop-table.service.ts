import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpMethod } from '../shared/enum';
import { HttpJsonService } from '../shared/http-json.service';
import { CacheRepository } from './repositories/cache.repository';
import { DropTableData } from './types';

// relics/missionRewards/modLocations 등 정적 드랍테이블은 Prime Access 단위(분기~수개월)로만 바뀜.
// 변경 주기가 예측 불가하므로 주 1회 all.json 통째로 재수집해 Postgres에 덮어쓰는 방식.
// 효율화하려면 info.json(hash/modified)을 먼저 확인해 변경 시에만 all.json 재수집.
@Injectable()
export class DropTableService {
  constructor(
    private readonly httpJsonService: HttpJsonService,
    private readonly cacheRepository: CacheRepository,
  ) {}

  // @Cron(CronExpression.EVERY_10_SECONDS) // dev mode
  @Cron(CronExpression.EVERY_WEEK)
  async getAllDropTables() {
    const all = await this.httpJsonService.request<DropTableData>(
      HttpMethod.Get,
      'data/all.json',
    );
    const entity = this.cacheRepository.create({
      cache: JSON.stringify(all),
    });
    // console.log(entity);
    return this.cacheRepository.save(entity);
  }

  /** 성유물 */
  // async relics() {
  //   return this.httpJsonService.request(HttpMethod.Get, 'relics');
  // }
}
