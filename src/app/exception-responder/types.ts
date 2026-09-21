import type { ArgumentsHost } from '@nestjs/common';

/** 요청 종류(host.getType())별로 에러를 요청자에게 돌려주는 방법 — 로깅은 필터가 한 번만 한다 */
export interface ExceptionResponder {
  respond(
    host: ArgumentsHost,
    exception: Error,
    userError: boolean,
  ): Promise<void>;
}
