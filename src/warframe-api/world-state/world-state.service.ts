import { Injectable } from '@nestjs/common';
import { HttpMethod } from '../shared/enum';
import { HttpJsonService } from '../shared/http-json.service';
import { VoidTier } from './vo/enum';
import {
  ArchonHunt,
  Fissure,
  Sortie,
  VoidTrader,
  WorldEvent,
} from './vo/types';

@Injectable()
export class WorldStateService {
  constructor(private readonly httpJsonService: HttpJsonService) {}

  /** 집정관 */
  async archonHunt(): Promise<ArchonHunt> {
    return this.httpJsonService.request(HttpMethod.Get, 'pc/archonHunt');
  }

  /** 출격 (소티) */
  async sortie(): Promise<Sortie> {
    return this.httpJsonService.request(HttpMethod.Get, 'pc/sortie');
  }

  /** 이벤트 */
  async events(): Promise<WorldEvent[]> {
    return this.httpJsonService.request(HttpMethod.Get, 'pc/events');
  }

  /** 보이드 균열 */
  async voidFissures(options?: VoidTier): Promise<Fissure[]> {
    const fissures = await this.httpJsonService.request<Fissure[]>(
      HttpMethod.Get,
      'pc/fissures',
    );
    if (!options?.length) return fissures;
    return fissures.filter((f) => options.includes(f.tier));
  }

  /** 보이드 상인 (바로 키티어) */
  async voidTrader(): Promise<VoidTrader> {
    return this.httpJsonService.request(HttpMethod.Get, 'pc/voidTrader');
  }
}
