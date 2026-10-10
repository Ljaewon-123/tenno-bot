import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { CommandLoggingInterceptor } from './command-logging.interceptor.js';

describe('CommandLoggingInterceptor', () => {
  it('HTTP 요청(헬스·스탯)은 인터랙션을 건드리지 않고 그대로 통과시킨다', async () => {
    const context = {
      getType: () => 'http',
      // 인터랙션으로 구조분해하면 터지던 모양 그대로
      getArgs: () => ({}),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of({ guilds: 1 }) };

    const result: unknown = await lastValueFrom(
      new CommandLoggingInterceptor().intercept(context, next),
    );

    expect(result).toEqual({ guilds: 1 });
  });
});
