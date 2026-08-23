import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { NecordExecutionContext, type SlashCommandContext } from 'necord';
import {
  catchError,
  from,
  switchMap,
  tap,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';

@Injectable()
export class CommandLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CommandLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const [interaction] =
      NecordExecutionContext.create(context).getContext<SlashCommandContext>();
    const startedAt = performance.now();

    // 실패 로그는 CommandExceptionFilter가 남기므로 성공 경로만 기록한다
    return from(this.defer(interaction)).pipe(
      switchMap(() => next.handle()),
      tap(() =>
        this.logger.log(
          `${this.commandName(interaction)} ${Math.round(performance.now() - startedAt)}ms`,
        ),
      ),
      timeout(5000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err as unknown);
      }),
    );
  }

  /**
   * 커맨드 핸들러가 돌기 전에 응답을 미뤄둔다 — 디스코드 초기 응답 제한은 3초라
   * 외부 API나 드랍테이블 조회가 조금만 늦어도 인터랙션 토큰이 죽는다.
   * 따라서 핸들러는 reply가 아니라 editReply로 응답해야 한다.
   * ready/warn 같은 인터랙션 아닌 이벤트에도 이 인터셉터가 붙으므로 방어한다.
   */
  private async defer(interaction: SlashCommandContext[0]) {
    if (!interaction?.isRepliable?.() || interaction.deferred) return;
    await interaction.deferReply();
  }

  private commandName(interaction: SlashCommandContext[0]) {
    if (!interaction?.isChatInputCommand?.()) {
      return 'unknown';
    }
    const subcommand = interaction.options.getSubcommand(false);
    return subcommand
      ? `/${interaction.commandName} ${subcommand}`
      : `/${interaction.commandName}`;
  }
}
