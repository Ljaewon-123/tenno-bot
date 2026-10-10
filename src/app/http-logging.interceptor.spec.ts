import {
  GatewayTimeoutException,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import { lastValueFrom, NEVER, of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpLoggingInterceptor } from './http-logging.interceptor.js';

const httpContext = {
  getType: () => 'http',
  switchToHttp: () => ({
    getRequest: () => ({ method: 'GET', originalUrl: '/stats' }),
    getResponse: () => ({ statusCode: 200 }),
  }),
} as unknown as ExecutionContext;

afterEach(() => {
  vi.useRealTimers();
});

describe('HttpLoggingInterceptor', () => {
  it('디스코드 인터랙션은 HTTP 요청으로 다루지 않고 그대로 통과시킨다', async () => {
    const context = {
      getType: () => 'necord',
      // HTTP로 착각해 꺼내려 들면 여기서 터진다
      switchToHttp: () => {
        throw new Error('not http');
      },
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of('reply') };

    const result: unknown = await lastValueFrom(
      new HttpLoggingInterceptor().intercept(context, next),
    );

    expect(result).toBe('reply');
  });

  it('응답이 매달리면 504로 끊는다', async () => {
    vi.useFakeTimers();
    const next: CallHandler = { handle: () => NEVER };

    const result = lastValueFrom(
      new HttpLoggingInterceptor().intercept(httpContext, next),
    );
    vi.advanceTimersByTime(5_000);

    await expect(result).rejects.toThrow(GatewayTimeoutException);
  });
});
