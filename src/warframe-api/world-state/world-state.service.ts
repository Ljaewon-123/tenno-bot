import dayjs from '@/utils/dayjs.js';
import { Injectable, Logger } from '@nestjs/common';
import { CacheKey, HttpMethod } from '../shared/enum.js';
import { HttpJsonService } from '../shared/http-json.service.js';
import { CacheRepository } from '../shared/modules/repositories/cache.repository.js';
import {
  CYCLE_CACHE_KEY,
  STALE_MAX_MINUTES,
  TTL_SECONDS,
} from './constants.js';
import { markStale, staleAsOf } from './stale.js';
import { CycleName, VoidTier } from './vo/enum.js';
import {
  Archimedea,
  ArchonHunt,
  Cycle,
  DuviriCycle,
  Fissure,
  Nightwave,
  Sortie,
  VoidTrader,
  WorldEvent,
} from './vo/types.js';

@Injectable()
export class WorldStateService {
  private readonly logger = new Logger(WorldStateService.name);

  constructor(
    private readonly httpJsonService: HttpJsonService,
    private readonly cacheRepository: CacheRepository,
  ) {}

  async archonHunt(): Promise<ArchonHunt> {
    return this.get(CacheKey.WorldStateArchonHunt, 'pc/archonHunt');
  }

  async sortie(): Promise<Sortie> {
    return this.get(CacheKey.WorldStateSortie, 'pc/sortie');
  }

  async events(): Promise<WorldEvent[]> {
    return this.get(CacheKey.WorldStateEvents, 'pc/events');
  }

  async voidFissures(options?: VoidTier): Promise<Fissure[]> {
    const fissures = await this.get<Fissure[]>(
      CacheKey.WorldStateFissures,
      'pc/fissures',
    );
    if (!options?.length) return fissures;

    // 거른 배열은 새 객체라 나이 표시가 끊긴다 — 같은 응답이므로 표식을 옮겨 준다
    const filtered = fissures.filter((f) => options.includes(f.tier));
    const asOf = staleAsOf(fissures);
    if (asOf) markStale(filtered, asOf);
    return filtered;
  }

  async voidTrader(): Promise<VoidTrader> {
    return this.get(CacheKey.WorldStateVoidTrader, 'pc/voidTrader');
  }

  /** 인게임 명칭은 바뀌었지만 API 경로는 그대로다 */
  async nightwave(): Promise<Nightwave> {
    return this.get(CacheKey.WorldStateNightwave, 'pc/nightwave');
  }

  async archimedeas(): Promise<Archimedea[]> {
    return this.get(CacheKey.WorldStateArchimedeas, 'pc/archimedeas');
  }

  async duviriCycle(): Promise<DuviriCycle> {
    return this.get(CacheKey.WorldStateDuviriCycle, 'pc/duviriCycle');
  }

  async cycle(name: CycleName): Promise<Cycle> {
    return this.get(CYCLE_CACHE_KEY[name], `pc/${name}Cycle`);
  }

  /** get()은 실패해도 캐시로 성공한 척하므로 헬스체크는 캐시 없이 직접 친다 */
  async ping(): Promise<number> {
    const start = performance.now();
    await this.httpJsonService.request(HttpMethod.Get, 'pc/sortie');
    return performance.now() - start;
  }

  /** 실패하면 아무것도 안 써서 다음 호출이 재시도한다 */
  private async get<T>(key: CacheKey, path: string): Promise<T> {
    const now = dayjs();
    const cached = await this.cacheRepository.findOneBy({ key });
    if (cached?.expiresAt?.isAfter(now)) return cached.cache as T;

    const staleUntil = cached?.expiresAt?.add(STALE_MAX_MINUTES, 'minute');
    let servedStale = false;

    const response = await this.httpJsonService
      .request<T>(HttpMethod.Get, path)
      .catch((error: Error) => {
        // 만료됐어도 STALE_MAX_MINUTES 안이면 에러 카드보다 옛날 값이 낫다
        if (!cached || !staleUntil?.isAfter(now)) throw error;
        servedStale = true;
        this.logger.warn(
          `${path} 실패 — 만료된 캐시로 대체한다: ${error.message}`,
        );
        return cached.cache as T;
      });

    // 스테일은 캐시를 갱신하지 않는다 — TTL을 밀면 API가 살아나도 60초를 더 기다린다
    if (servedStale) {
      // expiresAt - TTL이 마지막 성공 시각이다
      if (cached?.expiresAt)
        markStale(response, cached.expiresAt.subtract(TTL_SECONDS, 'second'));
      return response;
    }

    const entity = cached ?? this.cacheRepository.create({ key });
    entity.cache = response;
    entity.expiresAt = now.add(TTL_SECONDS, 'second');
    await this.cacheRepository
      .save(entity)
      .catch((error: { code?: string }) => {
        // 빈 캐시에 첫 호출이 겹치면 나란히 insert해 unique(key)에 걸린다 — 같은 응답이 이미 들어갔다
        if (error?.code !== '23505') throw error;
      });

    return response;
  }
}
