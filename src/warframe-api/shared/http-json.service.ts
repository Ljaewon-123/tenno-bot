import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { ALLOWED_PATHS } from './allowed-paths.const';
import { HttpMethod } from './enum';

@Injectable()
export class HttpJsonService {
  constructor(private readonly httpService: HttpService) {}

  async request<T>(
    method: HttpMethod,
    path: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    this.assertAllowedPath(path);

    return this.httpService.axiosRef
      .request<T>({
        ...config,
        method,
        url: path,
        // 기본 axios UA면 Cloudflare 뒤의 wiki.warframe.com이 데이터센터 IP를 502(Retry-After: 60)로 튕긴다.
        // MediaWiki API 정책도 식별 가능한 UA를 요구한다 — 로컬은 되고 Railway에서만 죽던 원인.
        headers: {
          'User-Agent':
            'teno-bot/0.0.1 (https://github.com/Ljaewon-123/teno-bot)',
          ...config?.headers,
        },
      })
      .then((res) => res.data);
  }

  /**
   * axios는 url이 절대 URL이면 baseURL을 무시하므로, 향후 사용자 입력이 path로
   * 흘러들어올 경우 SSRF로 이어질 수 있다. 화이트리스트에 없는 경로는 요청 자체를 막는다.
   */
  private assertAllowedPath(path: string) {
    if (!ALLOWED_PATHS.has(path)) {
      throw new Error(
        `HttpJsonService: path가 화이트리스트에 없습니다 - ${path}`,
      );
    }
  }
}
