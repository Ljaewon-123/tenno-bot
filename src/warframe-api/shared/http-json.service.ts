import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { HttpMethod } from './enum';

@Injectable()
export class HttpJsonService {
  constructor(private readonly httpService: HttpService) {}

  async request<T>(
    method: HttpMethod,
    path: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const { data } = await this.httpService.axiosRef.request<T>({
      ...config,
      method,
      url: path,
    });
    return data;
  }
}
