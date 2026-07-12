import { Injectable } from '@nestjs/common';
import { WorldStateService } from './world-state/world-state.service';

@Injectable()
export class WarframeApiService {
  constructor(private readonly worldStateService: WorldStateService) {}

  /** 집정관 */
  async archonHunt() {
    return this.worldStateService.archonHunt();
  }
  /** 출격 (소티) */
  async sortie() {
    return this.worldStateService.sortie();
  }
  /** 이벤트 */
  async events() {
    return this.worldStateService.events();
  }
  /** 보이드 균열 */
  async voidFissures() {
    return this.worldStateService.voidFissures();
  }
}
