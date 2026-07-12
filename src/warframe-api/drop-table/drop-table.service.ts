import { Injectable } from '@nestjs/common';
import { HttpJsonService } from '../shared/http-json.service';

// TDO: 캐싱 필요함 db가 먼저있어야 할듯?
@Injectable()
export class DropTableService {
  constructor(private readonly httpJsonService: HttpJsonService) {}

  /** 성유물 */
  // async relics() {
  //   return this.httpJsonService.request(HttpMethod.Get, 'relics');
  // }
}
