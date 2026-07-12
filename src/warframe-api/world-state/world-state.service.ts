import { Injectable } from '@nestjs/common';
import { HttpMethod } from '../shared/enum';
import { HttpJsonService } from '../shared/http-json.service';

@Injectable()
export class WorldStateService {
  constructor(private readonly httpJsonService: HttpJsonService) {}

  /** 집정관 */
  async archonHunt() {
    return this.httpJsonService.request(HttpMethod.Get, 'pc/archonHunt');
  }

  /** 출격 (소티) */
  async sortie() {
    return this.httpJsonService.request(HttpMethod.Get, 'pc/sortie');
  }

  /** 이벤트 */
  async events() {
    return this.httpJsonService.request(HttpMethod.Get, 'pc/events');
  }

  /** 보이드 균열 */
  async voidFissures() {
    return this.httpJsonService.request(HttpMethod.Get, 'pc/fissures');
  }
}
