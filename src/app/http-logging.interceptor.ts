import {
  CallHandler,
  ExecutionContext,
  GatewayTimeoutException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { NecordContextType } from 'necord';
import { catchError, tap, throwError, timeout, TimeoutError } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType<NecordContextType>() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const { method, originalUrl } = http.getRequest<Request>();
    const startedAt = performance.now();

    // 실패 로그는 CommandExceptionFilter가 남기므로 성공 경로만 기록한다
    return next.handle().pipe(
      tap(() =>
        this.logger.log(
          `${method} ${originalUrl} ${http.getResponse<Response>().statusCode} ${Math.round(performance.now() - startedAt)}ms`,
        ),
      ),
      // 지금 엔드포인트는 메모리만 읽지만, 매달리면 업타임 모니터·랜딩 fetch가 응답 없이 묶인다
      timeout(5_000),
      catchError((err) =>
        throwError(() =>
          err instanceof TimeoutError
            ? new GatewayTimeoutException()
            : (err as unknown),
        ),
      ),
    );
  }
}
