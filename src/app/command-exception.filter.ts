import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { CommandResponder } from './exception-responder/command.responder';
import { HttpResponder } from './exception-responder/http.responder';
import { ExceptionResponder } from './exception-responder/types';

@Catch()
export class CommandExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CommandExceptionFilter.name);
  private readonly responders: Record<string, ExceptionResponder>;

  constructor(adapterHost: HttpAdapterHost) {
    this.responders = {
      http: new HttpResponder(adapterHost),
      necord: new CommandResponder(),
    };
  }

  async catch(exception: Error, host: ArgumentsHost) {
    // 4xx는 유저에게 보여줄 안내지 장애가 아니다 — 서비스가 throw new BadRequestException('...') 한 줄로 끝난다
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const userError = status >= 400 && status < 500;

    if (!userError) {
      this.logger.error(exception?.message ?? exception, exception?.stack);
    }

    await this.responders[host.getType()]?.respond(host, exception, userError);
  }
}
