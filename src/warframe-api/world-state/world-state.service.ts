import dayjs from '@/utils/dayjs';
import { Injectable } from '@nestjs/common';
import { CacheKey, HttpMethod } from '../shared/enum';
import { HttpJsonService } from '../shared/http-json.service';
import { CacheRepository } from '../shared/modules/repositories/cache.repository';
import { CYCLE_CACHE_KEY, TTL_SECONDS } from './constants';
import { CycleName, VoidTier } from './vo/enum';
import {
  Archimedea,
  ArchonHunt,
  Cycle,
  Fissure,
  Nightwave,
  Sortie,
  VoidTrader,
  WorldEvent,
} from './vo/types';

@Injectable()
export class WorldStateService {
  constructor(
    private readonly httpJsonService: HttpJsonService,
    private readonly cacheRepository: CacheRepository,
  ) {}

  /** 집정관 */
  async archonHunt(): Promise<ArchonHunt> {
    return this.get(CacheKey.WorldStateArchonHunt, 'pc/archonHunt');
  }

  /** 출격 (소티) */
  async sortie(): Promise<Sortie> {
    return this.get(CacheKey.WorldStateSortie, 'pc/sortie');
  }

  /** 이벤트 */
  async events(): Promise<WorldEvent[]> {
    return this.get(CacheKey.WorldStateEvents, 'pc/events');
  }

  /** 보이드 균열 */
  async voidFissures(options?: VoidTier): Promise<Fissure[]> {
    const fissures = await this.get<Fissure[]>(
      CacheKey.WorldStateFissures,
      'pc/fissures',
    );
    if (!options?.length) return fissures;
    return fissures.filter((f) => options.includes(f.tier));
  }

  /** 보이드 상인 (바로 키티어) */
  async voidTrader(): Promise<VoidTrader> {
    return this.get(CacheKey.WorldStateVoidTrader, 'pc/voidTrader');
  }

  /** 나이트웨이브 (인게임 명칭은 바뀌었지만 API 경로는 그대로) */
  async nightwave(): Promise<Nightwave> {
    return this.get(CacheKey.WorldStateNightwave, 'pc/nightwave');
  }

  /** 아르키메디아 — 심층/시간이 한 배열로 온다 */
  async archimedeas(): Promise<Archimedea[]> {
    return this.get(CacheKey.WorldStateArchimedeas, 'pc/archimedeas');
  }

  /** 오픈월드 낮/밤 사이클 */
  async cycle(name: CycleName): Promise<Cycle> {
    return this.get(CYCLE_CACHE_KEY[name], `pc/${name}Cycle`);
  }

  /**
   * 요청이 실패하면 아무것도 쓰지 않아 다음 호출이 그대로 재시도한다.
   * 밀리초 단위로 겹친 동시 호출은 각자 API를 때린다 — 필요해지면 in-flight Promise 맵을 얹으면 됨.
   */
  private async get<T>(key: CacheKey, path: string): Promise<T> {
    const now = dayjs();
    const cached = await this.cacheRepository.findOneBy({ key });
    if (cached?.expiresAt?.isAfter(now)) return cached.cache as T;

    const response = await this.httpJsonService.request<T>(
      HttpMethod.Get,
      path,
    );

    const entity = cached ?? this.cacheRepository.create({ key });
    entity.cache = response;
    entity.expiresAt = now.add(TTL_SECONDS, 'second');
    await this.cacheRepository.save(entity);

    return response;
  }
}
