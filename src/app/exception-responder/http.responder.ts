import { ArgumentsHost, HttpException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ExceptionResponder } from './types';

/** 헬스체크 같은 HTTP 요청 — 응답을 안 쓰면 요청이 타임아웃까지 매달린다 */
export class HttpResponder implements ExceptionResponder {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  async respond(host: ArgumentsHost, exception: Error, userError: boolean) {
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    // 5xx 내부 메시지(커넥션 주소 등)는 밖으로 내보내지 않는다 — 커맨드 카드와 같은 기준
    const message = userError ? exception.message : 'Internal server error';

    this.adapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      { statusCode: status, message },
      status,
    );
  }
}
