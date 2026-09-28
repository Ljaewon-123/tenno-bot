import {
  CallHandler,
  ExecutionContext,
  GatewayTimeoutException,
  Injectable,
  Logger,
  NestInterceptor,
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
    // 자동완성은 키 입력마다 와서 로깅·defer하지 않는다
    if (interaction?.isAutocomplete?.()) return next.handle();

    const startedAt = performance.now();

    // 실패 로그는 CommandExceptionFilter가 남기므로 성공 경로만 기록한다
    return from(this.defer(interaction)).pipe(
      switchMap(() => next.handle()),
      tap(() =>
        this.logger.log(
          `${this.commandName(interaction)} ${Math.round(performance.now() - startedAt)}ms`,
        ),
      ),
      // 외부 API 타임아웃(5초)보다 길어야 만료 캐시 폴백(WorldStateService.get)이 돌 기회가 있다
      timeout(10_000),
      catchError((err) => {
        // 408은 4xx라 유저 실수 카드로 나간다 — 우리 쪽 지연이므로 5xx로 던진다
        if (err instanceof TimeoutError) {
          return throwError(() => new GatewayTimeoutException());
        }
        return throwError(() => err as unknown);
      }),
    );
  }

  /**
   * 초기 응답 3초 제한 때문에 슬래시 커맨드는 미리 defer한다(핸들러는 editReply).
   * 버튼은 update()를 쓰므로 defer하면 "already replied"로 터진다.
   */
  private async defer(interaction: SlashCommandContext[0]) {
    if (!interaction?.isChatInputCommand?.() || interaction.deferred) return;
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
