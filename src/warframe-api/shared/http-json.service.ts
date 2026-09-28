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
      })
      .then((res) => res.data);
  }

  private assertAllowedPath(path: string) {
    if (!ALLOWED_PATHS.has(path)) {
      throw new Error(
        `HttpJsonService: path가 화이트리스트에 없습니다 - ${path}`,
      );
    }
  }
}
